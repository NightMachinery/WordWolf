import { useEffect, useContext } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { StoreContext, storageKey } from '../api/contextStore';
import { socket } from '../api/service/socket';
import Lobby from '../../components/Lobby';
import Game from '../../components/Game';

function Container() {
  const router = useRouter();
  const {
    lobby, setLobby, loginData, setLoginData,
    setSoClose, setWayOff, setCorrect, setVoted,
  } = useContext(StoreContext);

  const lobbyName = router.query.lobby || loginData.lobby;

  const onInit = async () => {
    if (!lobbyName || !loginData.authId) {
      return;
    }

    let authId = loginData.authId;
    let name = loginData.name;
    const migrate = loginData.pendingMigrationId || router.query.migrate;
    if (migrate) {
      try {
        const res = await axios.get(`/resolveMigration/${lobbyName}/${migrate}`);
        authId = res.data.authId;
        name = res.data.name || name;
        setLoginData({ authId, name, lobby: lobbyName, pendingMigrationId: migrate, create: false });
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(storageKey, JSON.stringify({ authId, name }));
        }
      } catch (_) {
        alert('migration link is invalid or expired');
      }
    }

    const emit = loginData.create ? 'createLobby' : 'joinLobby';
    const payload = { name, lobby: lobbyName, authId };
    if (payload.name && payload.lobby && payload.authId) {
      socket.emit(emit, payload);
    } else {
      router.push('/');
    }
  };

  useEffect(() => {
    onInit();
    socket.on('connectedToLobby', async (data) => {
      await setLobby(data.lobbyData);
    });
    return () => socket.off('connectedToLobby');
  }, [lobbyName, loginData.authId]);

  useEffect(() => {
    if (!lobbyName) {
      return undefined;
    }
    const eventName = `${lobbyName}`;
    const listener = (data) => {
      setLobby(data.lobbyData);
    };
    socket.on(eventName, listener);
    return () => socket.off(eventName, listener);
  }, [socket, lobbyName]);

  useEffect(() => {
    if (lobby?.gameState === 'lobby') {
      setSoClose(false);
      setWayOff(false);
      setCorrect(false);
      setVoted(false);
    }
  }, [lobby?.gameState]);

  const me = lobby?.players?.[loginData.authId];
  const requesterAuthId = loginData.authId;

  const toggleJoin = (e) => {
    e.preventDefault();
    const seat = e.currentTarget.name;
    const color = e.currentTarget.id;
    if (!me || me.observer) {
      alert('Observers keep their seat reserved but cannot rejoin until they are joined back.');
      return;
    }
    if (lobby.seats[seat]) {
      if (lobby.seats[seat].authId === loginData.authId) {
        socket.emit('toggleSpectate', {
          authId: loginData.authId,
          lobby: lobby.name,
        });
      } else {
        alert('seat already taken');
      }
    } else if (me.seat && !lobby.seats[seat]) {
      socket.emit('swapSeats', {
        authId: loginData.authId,
        lobby: lobby.name,
        seat,
        color,
      });
    } else {
      socket.emit('toggleJoin', {
        authId: loginData.authId,
        lobby: lobby.name,
        seat,
        color,
      });
    }
  };

  const toggleSpectate = (e) => {
    e.preventDefault();
    if (!me?.spectator) {
      socket.emit('toggleSpectate', {
        authId: loginData.authId,
        lobby: lobby.name,
      });
    } else {
      alert("You're already a spectator");
    }
  };

  const rejoinSelf = () => {
    socket.emit('rejoinFromObserver', { targetAuthId: loginData.authId, lobby: lobby.name, requesterAuthId });
  };

  const onGameStart = () => {
    const joinedCount = Object.keys(lobby.players).reduce(
      (prev, player) => (!lobby.players[player].spectator && !lobby.players[player].observer ? prev + 1 : prev),
      0,
    );

    if (joinedCount < 4) {
      alert('unable to start with less than 4 active players joined');
      return;
    }
    socket.emit('gameStart', { lobby: lobby.name, requesterAuthId });
  };

  const onMayorPick = (word) => {
    socket.emit('onMayorPick', { lobby: lobby.name, word, requesterAuthId });
  };

  const onTimeout = () => {
    socket.emit('onTimeout', { lobby: lobby.name });
  };

  const afterVotingRound = () => {
    socket.emit('afterVotingRound', { lobby: lobby.name });
  };

  const resetGame = () => {
    socket.emit('resetGame', { lobby: lobby.name, requesterAuthId });
  };

  const updateTimer = (settings) => {
    socket.emit('updateTimer', { settings, lobby: lobby.name, requesterAuthId });
  };

  const updateSaveTimer = (timer) => {
    socket.emit('updateSaveTimer', { timer, lobby: lobby.name, requesterAuthId });
  };

  const updatePickCount = (pickCount) => {
    socket.emit('updatePickCount', { pickCount, lobby: lobby.name, requesterAuthId });
  };

  const updateMayorRoleSettings = (roles) => {
    socket.emit('updateMayorRoleSettings', { roles, lobby: lobby.name, requesterAuthId });
  };

  const display = () => {
    const gameArray = [
      'mayorPick',
      'questionRound',
      'wordGuessed',
      'outOfTokens',
      'outOfTime',
      'endGame',
    ];
    let gameState;
    if (gameArray.includes(lobby.gameState)) {
      gameState = 'game';
    } else {
      gameState = lobby.gameState;
    }

    switch (gameState) {
      case 'lobby':
        return (
          <div>
            <Lobby
              lobby={lobby}
              toggleJoin={toggleJoin}
              toggleSpectate={toggleSpectate}
              rejoinSelf={rejoinSelf}
              onGameStart={onGameStart}
              loginData={loginData}
              updateTimer={updateTimer}
              updateSaveTimer={updateSaveTimer}
              updatePickCount={updatePickCount}
              updateMayorRoleSettings={updateMayorRoleSettings}
            />
          </div>
        );
      case 'game':
        return (
          <div>
            <Game
              lobby={lobby}
              onMayorPick={onMayorPick}
              onTimeout={onTimeout}
              afterVotingRound={afterVotingRound}
              resetGame={resetGame}
              loginData={loginData}
              updateTimer={updateTimer}
              rejoinSelf={rejoinSelf}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {lobby && display()}
    </div>
  );
}

export default Container;
