require('dotenv').config();
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const next = require('next');
const {
  lobbies, addLobby, getLobby, startGame, toggleJoin, swapSeats,
  toggleSpectate, setObserver, rejoinFromObserver, forceJoin, onMayorPick, onTimeout,
  afterVotingRound, resetGame, updateTimer, updateSaveTimer, updatePickCount,
  updateMayorRoleSettings, answerQuestion, voteWerewolf, voteSeer, deleteLobby,
  promoteMod, demoteMod, resolveMigration, getMigrationId, MAX_INACTIVE_PLAYERS,
} = require('./dataObjects/lobby');
const { players, assignPlayerToLobby, removePlayerFromLobby } = require('./dataObjects/player');
const {
  addMessage, getLobbyMessages, getGameMessages, deleteLobbyMessages, deleteGameMessages,
} = require('./dataObjects/chat');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handler = nextApp.getRequestHandler();
const port = process.env.PORT || 3000;

const parseLoginData = (queryValue, query) => {
  if (typeof queryValue === 'string') {
    try {
      return JSON.parse(queryValue);
    } catch (_) {
      return query;
    }
  }
  return queryValue || query;
};

const emitLobbyData = async (lobby) => {
  const lobbyData = await getLobby(lobby);
  if (lobbyData) {
    io.to(lobby).emit(`${lobby}`, { lobbyData });
  }
};

io.on('connect', (socket) => {
  const emitConnectedToLobby = async (lobbyData) => {
    socket.emit('connectedToLobby', { lobbyData });
  };

  const connectToLobby = async ({ name, lobby, authId }) => {
    socket.join(lobby);
    await assignPlayerToLobby(name, lobby, socket.id, authId);
    const lobbyData = await getLobby(lobby);
    if (!lobbyData) {
      return;
    }
    await emitConnectedToLobby(lobbyData);
    emitLobbyData(lobby);
  };

  socket.on('createLobby', async ({ name, lobby, authId }) => connectToLobby({ name, lobby, authId }));
  socket.on('joinLobby', async ({ name, lobby, authId }) => connectToLobby({ name, lobby, authId }));

  socket.on('toggleJoin', async ({ authId, lobby, seat, color }) => {
    await toggleJoin(authId, lobby, seat, color);
    emitLobbyData(lobby);
  });
  socket.on('swapSeats', async ({ authId, lobby, seat, color }) => {
    await swapSeats(authId, lobby, seat, color);
    emitLobbyData(lobby);
  });
  socket.on('toggleSpectate', async ({ authId, lobby }) => {
    await toggleSpectate(authId, lobby);
    emitLobbyData(lobby);
  });
  socket.on('setObserver', async ({ targetAuthId, observer, lobby, requesterAuthId }) => {
    await setObserver(lobby, targetAuthId, observer, requesterAuthId);
    emitLobbyData(lobby);
  });
  socket.on('rejoinFromObserver', async ({ targetAuthId, lobby, requesterAuthId }) => {
    await rejoinFromObserver(lobby, targetAuthId, requesterAuthId);
    emitLobbyData(lobby);
  });
  socket.on('forceJoin', async ({ targetAuthId, lobby, requesterAuthId }) => {
    await forceJoin(lobby, targetAuthId, requesterAuthId);
    emitLobbyData(lobby);
  });
  socket.on('promoteMod', async ({ targetAuthId, lobby, requesterAuthId }) => {
    await promoteMod(lobby, targetAuthId, requesterAuthId);
    emitLobbyData(lobby);
  });
  socket.on('demoteMod', async ({ targetAuthId, lobby, requesterAuthId }) => {
    await demoteMod(lobby, targetAuthId, requesterAuthId);
    emitLobbyData(lobby);
  });
  socket.on('gameStart', async ({ lobby, requesterAuthId }) => {
    await startGame(lobby, requesterAuthId);
    emitLobbyData(lobby);
  });
  socket.on('onMayorPick', async ({ lobby, word, requesterAuthId }) => {
    await onMayorPick(lobby, word, requesterAuthId);
    emitLobbyData(lobby);
  });
  socket.on('onTimeout', async ({ lobby }) => {
    await onTimeout(lobby);
    emitLobbyData(lobby);
  });
  socket.on('afterVotingRound', async ({ lobby }) => {
    await afterVotingRound(lobby);
    emitLobbyData(lobby);
  });
  socket.on('resetGame', async ({ lobby, requesterAuthId }) => {
    await resetGame(lobby, requesterAuthId);
    emitLobbyData(lobby);
    deleteGameMessages(lobby);
  });
  socket.on('updateTimer', async ({ settings, lobby, requesterAuthId }) => {
    await updateTimer(settings, lobby, requesterAuthId);
    emitLobbyData(lobby);
  });
  socket.on('updateSaveTimer', async ({ timer, lobby, requesterAuthId }) => {
    await updateSaveTimer(timer, lobby, requesterAuthId);
    emitLobbyData(lobby);
  });
  socket.on('updatePickCount', async ({ pickCount, lobby, requesterAuthId }) => {
    await updatePickCount(pickCount, lobby, requesterAuthId);
    emitLobbyData(lobby);
  });
  socket.on('updateMayorRoleSettings', async ({ roles, lobby, requesterAuthId }) => {
    await updateMayorRoleSettings(roles, lobby, requesterAuthId);
    emitLobbyData(lobby);
  });

  socket.on('newMessage', async (data, lobby) => {
    addMessage(data, false);
    const allmessages = getLobbyMessages(lobby);
    io.to(lobby).emit('allMessages', allmessages);
    emitLobbyData(lobby);
  });

  socket.on('newGameMessage', async (data, lobby) => {
    addMessage(data, true);
    const allmessages = getGameMessages(lobby);
    io.to(lobby).emit('allGameMessages', allmessages);
    emitLobbyData(lobby);
  });

  socket.on('AnsweredQuestion', async ({ answer, question, lobbyName, requesterAuthId }) => {
    await answerQuestion(answer, question, lobbyName, requesterAuthId);
    emitLobbyData(lobbyName);
  });

  socket.on('VoteWerewolf', async ({ player, lobbyName, requesterAuthId }) => {
    await voteWerewolf(player, lobbyName, requesterAuthId);
    emitLobbyData(lobbyName);
  });

  socket.on('VoteSeer', async ({ player, lobbyName, requesterAuthId }) => {
    await voteSeer(player, lobbyName, requesterAuthId);
    emitLobbyData(lobbyName);
  });

  socket.on('disconnect', async () => {
    console.log(`${new Date()}: closed socket ${socket.id}`);
    const playerRef = players.get(socket.id);
    if (playerRef) {
      const lobbyData = await getLobby(playerRef.lobby);
      const player = lobbyData?.players[playerRef.authId];
      await removePlayerFromLobby({ ...playerRef, socketId: socket.id });
      socket.leave(playerRef.lobby);
      const currentLobby = await getLobby(playerRef.lobby);
      if (!currentLobby) {
        return;
      }
      if (player && (player.mayor || player.role === 'seer' || (player.role === 'werewolf' && currentLobby.werewolf.length === 1))) {
        deleteGameMessages(playerRef.lobby);
        resetGame(playerRef.lobby, currentLobby.ownerId);
      }
      emitLobbyData(playerRef.lobby);
    }
  });
});

nextApp.prepare()
  .then(() => {
    app.get('/createLobby', (req, res) => {
      const { name, lobby, authId } = parseLoginData(req.query.loginData, req.query);
      if (!authId) {
        res.send('missing identity');
      } else if (!lobbies.get(lobby)) {
        addLobby(authId, lobby);
        res.send('ok');
      } else {
        res.send('error');
      }
    });

    app.get('/joinLobby', (req, res) => {
      const { lobby, authId } = parseLoginData(req.query.loginData, req.query);
      const currentLobby = lobbies.get(lobby);
      if (!authId) {
        res.send('missing identity');
      } else if (!currentLobby) {
        res.send('lobby name not found');
      } else if (!currentLobby.players[authId] && Object.values(currentLobby.players)
        .filter((player) => player.spectator || player.observer || !player.seat).length >= MAX_INACTIVE_PLAYERS) {
        res.send('inactive room capacity is full');
      } else {
        res.send('ok');
      }
    });

    app.get('/resolveMigration/:lobby/:migrationId', (req, res) => {
      const authId = resolveMigration(req.params.lobby, req.params.migrationId);
      if (!authId) {
        res.status(404).send({ error: 'migration id not found' });
        return;
      }
      const lobby = getLobby(req.params.lobby);
      res.send({ authId, name: lobby?.players[authId]?.baseName || lobby?.players[authId]?.displayName || null });
    });

    app.get('/migration/:lobby/:targetAuthId', (req, res) => {
      const migrationId = getMigrationId(req.params.lobby, req.params.targetAuthId, req.query.requesterAuthId);
      if (!migrationId) {
        res.status(403).send({ error: 'not allowed' });
        return;
      }
      res.send({ migrationId });
    });

    app.get('/messages/:lobby', (req, res) => {
      const allmessages = getLobbyMessages(req.params.lobby);
      if (allmessages) {
        res.send(allmessages);
        return;
      }
      res.send([]);
    });

    app.get('/gameMessages/:lobby', (req, res) => {
      const allGameMessages = getGameMessages(req.params.lobby);
      if (allGameMessages) {
        res.send(allGameMessages);
        return;
      }
      res.send([]);
    });

    app.get('*', async (req, res) => handler(req, res));

    server.listen(port, (err) => {
      if (err) { throw err; }
      console.log(`listening on port ${port}`);
    });
  })
  .catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
  });
