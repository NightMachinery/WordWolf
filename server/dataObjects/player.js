const {
  lobbies, deleteLobby, touchModeration, MAX_INACTIVE_PLAYERS,
} = require('./lobby');
const { deleteLobbyMessages, deleteGameMessages } = require('./chat');

const players = new Map(); // socket.id -> { authId, lobby }

class Player {
  constructor({ authId, baseName, displayName, displayNumber, lobby, socketId }) {
    this.authId = authId;
    this.socketId = socketId;
    this.baseName = baseName;
    this.displayName = displayName;
    this.displayNumber = displayNumber;
    this.name = displayName;
    this.lobby = lobby;
    this.online = true;
    this.spectator = true;
    this.observer = false;
    this.seat = null;
    this.role = null;
    this.mayor = false;
    this.color = null;
    this.tokens = {
      yes: [],
      no: [],
      maybe: [],
      wayOff: [],
      soClose: [],
      correct: [],
    };
  }
}

const normalizeName = (name) => String(name || 'Player').trim().replace(/\s+/g, ' ') || 'Player';

const nextDisplayName = (currentLobby, authId, baseName) => {
  const normalized = normalizeName(baseName);
  if (currentLobby.nameAssignments[authId]) {
    return currentLobby.nameAssignments[authId];
  }

  const used = currentLobby.usedNameNumbers[normalized] || [];
  let number = 1;
  while (used.includes(number)) {
    number += 1;
  }
  currentLobby.usedNameNumbers[normalized] = [...used, number];
  const displayName = number === 1 ? normalized : `${normalized} ${number}`;
  const assignment = { baseName: normalized, displayName, displayNumber: number };
  currentLobby.nameAssignments[authId] = assignment;
  return assignment;
};

const assignPlayerToLobby = (baseName, lobby, socketId, authId) => {
  const currentLobby = lobbies.get(lobby);
  if (!currentLobby || !authId) {
    return null;
  }

  const existingPlayer = currentLobby.players[authId];
  const inactiveCount = Object.values(currentLobby.players)
    .filter((player) => player.spectator || player.observer || !player.seat).length;
  if (!existingPlayer && inactiveCount >= MAX_INACTIVE_PLAYERS) {
    return { error: 'Inactive room capacity is full' };
  }

  const assignment = nextDisplayName(currentLobby, authId, baseName);
  let player = existingPlayer;
  if (player) {
    player.socketId = socketId;
    player.online = true;
    player.baseName = assignment.baseName;
    player.displayName = assignment.displayName;
    player.displayNumber = assignment.displayNumber;
    player.name = assignment.displayName;
  } else {
    player = new Player({
      authId,
      baseName: assignment.baseName,
      displayName: assignment.displayName,
      displayNumber: assignment.displayNumber,
      lobby,
      socketId,
    });
    currentLobby.players[authId] = player;
  }

  if (!currentLobby.migrationByAuth[authId]) {
    const token = require('crypto').randomBytes(18).toString('base64url');
    currentLobby.migrationByAuth[authId] = token;
    currentLobby.authByMigration[token] = authId;
  }

  players.set(socketId, { authId, lobby });
  touchModeration(lobby);
  return player;
};

const removePlayerFromLobby = (playerRef) => {
  const currentLobby = lobbies.get(playerRef.lobby);
  if (!currentLobby) {
    return null;
  }
  const player = currentLobby.players[playerRef.authId];
  if (player) {
    if (player.seat) {
      currentLobby.seats[player.seat] = null;
    }
    delete currentLobby.players[playerRef.authId];
  }

  players.delete(playerRef.socketId);

  const hasOnlinePlayers = Object.values(currentLobby.players).some((p) => p.online);
  if (!hasOnlinePlayers) {
    deleteLobbyMessages(playerRef.lobby);
    deleteGameMessages(playerRef.lobby);
    deleteLobby(playerRef.lobby);
    return null;
  }

  touchModeration(playerRef.lobby);
  return currentLobby;
};

module.exports = {
  players,
  assignPlayerToLobby,
  removePlayerFromLobby,
};
