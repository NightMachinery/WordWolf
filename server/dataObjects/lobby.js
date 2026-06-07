const crypto = require('crypto');
const wordList = require('../../wordList.json');

const lobbies = new Map();
const tempModTimers = new Map();
const TEMP_MOD_DELAY_MS = Number(process.env.TEMP_MOD_DELAY_MS || 5 * 60 * 1000);
const MAX_ACTIVE_PLAYERS = 20;
const MAX_INACTIVE_PLAYERS = 200;
const seatIds = Array.from({ length: MAX_ACTIVE_PLAYERS }, (_, index) => `seat${index + 1}`);
const palette = [
  '#E6474E', '#F18E35', '#F5D74C', '#54B877', '#55BFDB',
  '#164186', '#582C71', '#D564D8', '#71362E', '#333333',
  '#B84A62', '#2F7D8C', '#9B7E2D', '#5B8C2F', '#8B5FBF',
  '#C45A2C', '#2C5AC4', '#6A6A6A', '#A33FA3', '#3FA36B',
];

const seatColors = Object.fromEntries(seatIds.map((seat, index) => [seat, palette[index]]));

const activePlayer = (player) => player && !player.spectator && !player.observer;
const onlineRealMod = (lobby) => Object.values(lobby.players).some(
  (player) => player.online && (player.authId === lobby.ownerId || lobby.mods[player.authId]),
);

const refreshEffectiveMods = (lobby) => {
  const realModOnline = onlineRealMod(lobby);
  Object.values(lobby.players).forEach((player) => {
    player.isOwner = player.authId === lobby.ownerId;
    player.isMod = Boolean(lobby.mods[player.authId]);
    player.isTempMod = Boolean(lobby.tempMods[player.authId]);
    player.tempModActive = !realModOnline && lobby.activeTempModId === player.authId;
    player.canModerate = player.isOwner || player.isMod || player.tempModActive;
  });
};

const getLobby = (lobbyName) => {
  const lobby = lobbies.get(lobbyName);
  if (!lobby) {
    return null;
  }
  refreshEffectiveMods(lobby);
  return lobby;
};

const chooseTempMod = (lobbyName) => {
  const lobby = lobbies.get(lobbyName);
  if (!lobby || onlineRealMod(lobby)) {
    if (lobby) {
      lobby.activeTempModId = null;
      refreshEffectiveMods(lobby);
    }
    return null;
  }
  const onlinePlayers = Object.values(lobby.players).filter((player) => player.online);
  if (onlinePlayers.length === 0) {
    return null;
  }
  const previousTemp = onlinePlayers.find((player) => lobby.tempMods[player.authId]);
  const chosen = previousTemp || onlinePlayers[Math.floor(Math.random() * onlinePlayers.length)];
  lobby.tempMods[chosen.authId] = true;
  lobby.activeTempModId = chosen.authId;
  refreshEffectiveMods(lobby);
  return chosen;
};

const touchModeration = (lobbyName) => {
  const lobby = lobbies.get(lobbyName);
  if (!lobby) {
    return null;
  }
  if (tempModTimers.has(lobbyName)) {
    clearTimeout(tempModTimers.get(lobbyName));
    tempModTimers.delete(lobbyName);
  }
  if (onlineRealMod(lobby)) {
    lobby.activeTempModId = null;
    refreshEffectiveMods(lobby);
    return lobby;
  }
  tempModTimers.set(lobbyName, setTimeout(() => {
    tempModTimers.delete(lobbyName);
    chooseTempMod(lobbyName);
  }, TEMP_MOD_DELAY_MS));
  refreshEffectiveMods(lobby);
  return lobby;
};

const canModerate = (lobby, authId) => {
  if (!lobby || !authId) {
    return false;
  }
  refreshEffectiveMods(lobby);
  return Boolean(lobby.players[authId]?.canModerate);
};

class Lobby {
  constructor(ownerId, name) {
    this.name = name;
    this.ownerId = ownerId;
    this.host = ownerId; // legacy alias for immutable owner
    this.mods = {};
    this.tempMods = {};
    this.modPromoters = {};
    this.activeTempModId = null;
    this.nameAssignments = {};
    this.usedNameNumbers = {};
    this.migrationByAuth = {};
    this.authByMigration = {};
    this.mayor = null;
    this.werewolf = [];
    this.seer = null;
    this.settings = {
      minutes: 1,
      seconds: 0,
    };
    this.mayorRoleEligibility = {
      villager: true,
      seer: false,
      werewolf: false,
    };
    this.timer = 1;
    this.pickCount = 2;
    this.gameState = 'lobby';
    this.players = {};
    this.seats = Object.fromEntries(seatIds.map((seat) => [seat, null]));

    this.words = [];
    this.chosenWord = '';
    this.messages = [];
    this.questions = [];
    this.answeredQuestions = [];
    this.soClose = null;
    this.wayOff = null;
    this.correct = null;
    this.tokens = 36;
    this.maybeTokens = 12;
    this.villagerVotes = [];
    this.werewolfVotes = [];
  }
}

const requireMod = (lobbyName, requesterAuthId) => {
  const lobby = getLobby(lobbyName);
  if (!canModerate(lobby, requesterAuthId)) {
    return null;
  }
  return lobby;
};

const updatePickCount = (pickCount, lobby, requesterAuthId) => {
  const currLobby = requireMod(lobby, requesterAuthId);
  if (!currLobby) {
    return null;
  }
  currLobby.pickCount = Number(pickCount);
  return currLobby;
};

const updateTimer = (settings, lobby, requesterAuthId) => {
  const currLobby = requireMod(lobby, requesterAuthId);
  if (!currLobby) {
    return null;
  }
  currLobby.settings = settings;
  return currLobby;
};

const updateSaveTimer = (timer, lobby, requesterAuthId) => {
  const currLobby = requireMod(lobby, requesterAuthId);
  if (!currLobby) {
    return null;
  }
  currLobby.timer = timer;
  return currLobby;
};

const updateMayorRoleSettings = (roles, lobby, requesterAuthId) => {
  const currLobby = requireMod(lobby, requesterAuthId);
  if (!currLobby) {
    return null;
  }
  currLobby.mayorRoleEligibility = {
    villager: Boolean(roles?.villager),
    seer: Boolean(roles?.seer),
    werewolf: Boolean(roles?.werewolf),
  };
  if (!Object.values(currLobby.mayorRoleEligibility).some(Boolean)) {
    currLobby.mayorRoleEligibility.villager = true;
  }
  return currLobby;
};

const addLobby = (ownerId, name) => {
  const existingLobby = lobbies.get(name);
  if (existingLobby) {
    return { error: 'Lobby name already in use' };
  }
  if (!name) {
    return { error: 'Please provide a lobby name' };
  }
  if (!ownerId) {
    return { error: 'Missing user identity' };
  }

  const lobby = new Lobby(ownerId, name);
  lobbies.set(name, lobby);
  return lobby;
};

const deleteLobby = (name) => {
  if (tempModTimers.has(name)) {
    clearTimeout(tempModTimers.get(name));
    tempModTimers.delete(name);
  }
  lobbies.delete(name);
};

const toggleJoin = (authId, lobby, seat, color) => {
  const currentLobby = lobbies.get(lobby);
  if (!currentLobby || !currentLobby.players[authId]) {
    return null;
  }
  const player = currentLobby.players[authId];
  if (player.observer || !seatIds.includes(seat)) {
    return null;
  }
  if (currentLobby.seats[seat] && currentLobby.seats[seat].authId !== authId) {
    return null;
  }
  player.spectator = false;
  player.seat = seat;
  player.color = color || seatColors[seat];
  currentLobby.seats[seat] = player;
  return currentLobby;
};

const swapSeats = (authId, lobby, seat, color) => {
  const currentLobby = lobbies.get(lobby);
  if (!currentLobby || !currentLobby.players[authId]) {
    return null;
  }
  const player = currentLobby.players[authId];
  if (player.observer || !seatIds.includes(seat) || (currentLobby.seats[seat] && currentLobby.seats[seat].authId !== authId)) {
    return null;
  }
  const prevSeat = player.seat;
  player.color = color || seatColors[seat];
  player.seat = seat;
  if (prevSeat) {
    currentLobby.seats[prevSeat] = null;
  }
  currentLobby.seats[seat] = player;
  return currentLobby;
};

const toggleSpectate = (authId, lobby) => {
  const currentLobby = lobbies.get(lobby);
  if (!currentLobby || !currentLobby.players[authId]) {
    return null;
  }
  const player = currentLobby.players[authId];
  const prevSeat = player.seat;
  player.spectator = true;
  player.observer = false;
  player.seat = null;
  if (prevSeat) {
    currentLobby.seats[prevSeat] = null;
  }
  player.color = null;
  return currentLobby;
};

const setObserver = (lobbyName, targetAuthId, observer, requesterAuthId) => {
  const lobby = requireMod(lobbyName, requesterAuthId);
  if (!lobby || !lobby.players[targetAuthId]) {
    return null;
  }
  const player = lobby.players[targetAuthId];
  if (!player.seat) {
    return null;
  }
  player.spectator = false;
  player.observer = Boolean(observer);
  lobby.seats[player.seat] = player;
  return lobby;
};

const rejoinFromObserver = (lobbyName, authId, requesterAuthId) => {
  const lobby = getLobby(lobbyName);
  if (!lobby || !lobby.players[authId]) {
    return null;
  }
  if (authId !== requesterAuthId && !canModerate(lobby, requesterAuthId)) {
    return null;
  }
  const player = lobby.players[authId];
  if (!player.seat) {
    return null;
  }
  player.observer = false;
  player.spectator = false;
  lobby.seats[player.seat] = player;
  return lobby;
};

const startGame = (lobbyName, requesterAuthId) => {
  const lobby = requireMod(lobbyName, requesterAuthId);
  if (!lobby) {
    return null;
  }
  const joinedCount = Object.keys(lobby.players)
    .reduce((prev, player) => (activePlayer(lobby.players[player]) ? prev + 1 : prev), 0);
  const roles = ['villager', 'villager', 'seer', 'werewolf'];

  const addVillagers = (count) => {
    while (count > 0) {
      roles.push('villager');
      count -= 1;
    }
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  };

  if (joinedCount > 6) {
    roles.push('werewolf');
  }
  addVillagers(joinedCount - roles.length);
  shuffleArray(roles);

  const playerKeys = Object.keys(lobby.players).filter((authId) => activePlayer(lobby.players[authId]));

  lobby.werewolf = [];
  lobby.seer = null;
  Object.values(lobby.players).forEach((player) => {
    player.role = null;
    player.mayor = false;
  });

  let roleIndex = 0;
  playerKeys.forEach((authId) => {
    const player = lobby.players[authId];
    player.role = roles[roleIndex];
    if (roles[roleIndex] === 'werewolf') {
      lobby.werewolf.push(player);
    } else if (roles[roleIndex] === 'seer') {
      lobby.seer = player;
    }
    roleIndex += 1;
  });

  const mayorRoles = lobby.mayorRoleEligibility || { villager: true };
  let eligibleMayors = playerKeys.filter((authId) => mayorRoles[lobby.players[authId].role]);
  if (eligibleMayors.length === 0) {
    eligibleMayors = playerKeys.filter((authId) => lobby.players[authId].role === 'villager');
  }
  if (eligibleMayors.length === 0) {
    eligibleMayors = playerKeys;
  }
  const mayor = lobby.players[eligibleMayors[Math.floor(Math.random() * eligibleMayors.length)]];
  mayor.mayor = true;
  lobby.mayor = mayor;

  for (let i = 0; i < lobby.pickCount; i += 1) {
    lobby.words.push(wordList[Math.floor(Math.random() * wordList.length)]);
  }

  lobby.gameState = 'mayorPick';
  return lobby;
};

const onMayorPick = (lobbyName, word, requesterAuthId) => {
  const lobby = getLobby(lobbyName);
  if (!lobby || lobby.mayor?.authId !== requesterAuthId) {
    return null;
  }
  lobby.chosenWord = word;
  lobby.gameState = 'questionRound';
  return lobby;
};

const answerQuestion = (answer, question, lobbyName, requesterAuthId) => {
  const lobby = getLobby(lobbyName);
  if (!lobby || lobby.mayor?.authId !== requesterAuthId) {
    return null;
  }
  if (answer === 'discard') {
    lobby.questions.shift();
    return lobby;
  }

  const player = lobby.players[question.authId || question.name];
  if (!player) {
    return null;
  }

  if (answer === 'correct') {
    lobby.correct = question;
    lobby.gameState = 'wordGuessed';
  } else if (answer === 'wayOff') {
    lobby.wayOff = question;
  } else if (answer === 'soClose') {
    lobby.soClose = question;
  } else if (answer === 'maybe') {
    lobby.maybeTokens -= 1;
  } else if (answer === 'yes' || answer === 'no') {
    lobby.tokens -= 1;
  } else {
    return lobby;
  }

  player.tokens[answer].push(question);
  lobby.answeredQuestions.push({ ...question, answer });
  lobby.questions.shift();

  if (lobby.tokens === 0) {
    lobby.gameState = 'outOfTokens';
  }
  return lobby;
};

const voteWerewolf = (player, lobbyName, requesterAuthId) => {
  const lobby = getLobby(lobbyName);
  if (!lobby || !activePlayer(lobby.players[requesterAuthId])) {
    return null;
  }
  lobby.villagerVotes.push(player);
  const joinedCount = Object.keys(lobby.players)
    .reduce((prev, name) => (activePlayer(lobby.players[name]) ? prev + 1 : prev), 0);
  if (lobby.villagerVotes.length === (joinedCount - lobby.werewolf.length)) {
    lobby.gameState = 'endGame';
  }
  return lobby;
};

const voteSeer = (player, lobbyName, requesterAuthId) => {
  const lobby = getLobby(lobbyName);
  if (!lobby || lobby.players[requesterAuthId]?.role !== 'werewolf' || !activePlayer(lobby.players[requesterAuthId])) {
    return null;
  }
  lobby.werewolfVotes.push(player);
  if (lobby.werewolfVotes.length === lobby.werewolf.length) {
    lobby.gameState = 'endGame';
  }
  return lobby;
};

const onTimeout = (lobbyName) => {
  const lobby = getLobby(lobbyName);
  if (!lobby) {
    return null;
  }
  lobby.gameState = 'outOfTime';
  return lobby;
};

const afterVotingRound = (lobbyName) => {
  const lobby = getLobby(lobbyName);
  if (!lobby) {
    return null;
  }
  lobby.gameState = 'endGame';
  return lobby;
};

const resetGame = (lobbyName, requesterAuthId) => {
  const lobby = getLobby(lobbyName);
  if (!lobby || !(canModerate(lobby, requesterAuthId) || lobby.mayor?.authId === requesterAuthId)) {
    return null;
  }

  Object.keys(lobby.players).forEach((authId) => {
    lobby.players[authId].tokens = {
      yes: [],
      no: [],
      maybe: [],
      wayOff: [],
      soClose: [],
      correct: [],
    };
    lobby.players[authId].role = null;
    lobby.players[authId].mayor = false;
  });

  lobby.mayor = null;
  lobby.werewolf = [];
  lobby.seer = null;
  lobby.settings = { minutes: lobby.timer, seconds: 0 };
  lobby.words = [];
  lobby.chosenWord = '';
  lobby.questions = [];
  lobby.answeredQuestions = [];
  lobby.soClose = null;
  lobby.wayOff = null;
  lobby.correct = null;
  lobby.gameState = 'lobby';
  lobby.tokens = 36;
  lobby.maybeTokens = 12;
  lobby.villagerVotes = [];
  lobby.werewolfVotes = [];
  return lobby;
};

const promoteMod = (lobbyName, targetAuthId, requesterAuthId) => {
  const lobby = getLobby(lobbyName);
  if (!lobby || !lobby.players[targetAuthId] || !canModerate(lobby, requesterAuthId)) {
    return null;
  }
  const requester = lobby.players[requesterAuthId];
  if (requester.isOwner || requester.isMod) {
    lobby.mods[targetAuthId] = true;
    lobby.modPromoters[targetAuthId] = requesterAuthId;
  } else {
    lobby.tempMods[targetAuthId] = true;
  }
  refreshEffectiveMods(lobby);
  return lobby;
};

const demoteMod = (lobbyName, targetAuthId, requesterAuthId) => {
  const lobby = getLobby(lobbyName);
  if (!lobby || targetAuthId === lobby.ownerId) {
    return null;
  }
  const requester = lobby.players[requesterAuthId];
  if (!requester) {
    return null;
  }
  const canDemote = requester.authId === lobby.ownerId || lobby.modPromoters[targetAuthId] === requesterAuthId;
  if (!canDemote) {
    return null;
  }
  delete lobby.mods[targetAuthId];
  delete lobby.tempMods[targetAuthId];
  delete lobby.modPromoters[targetAuthId];
  if (lobby.activeTempModId === targetAuthId) {
    lobby.activeTempModId = null;
  }
  touchModeration(lobbyName);
  return lobby;
};

const resolveMigration = (lobbyName, migrationId) => {
  const lobby = getLobby(lobbyName);
  if (!lobby || !migrationId) {
    return null;
  }
  const authId = lobby.authByMigration[migrationId];
  if (!authId || !lobby.nameAssignments[authId]) {
    return null;
  }
  return authId;
};

const getMigrationId = (lobbyName, targetAuthId, requesterAuthId) => {
  const lobby = getLobby(lobbyName);
  if (!lobby || !lobby.players[targetAuthId]) {
    return null;
  }
  if (targetAuthId !== requesterAuthId && !canModerate(lobby, requesterAuthId)) {
    return null;
  }
  if (!lobby.migrationByAuth[targetAuthId]) {
    const token = crypto.randomBytes(18).toString('base64url');
    lobby.migrationByAuth[targetAuthId] = token;
    lobby.authByMigration[token] = targetAuthId;
  }
  return lobby.migrationByAuth[targetAuthId];
};

module.exports = {
  lobbies,
  addLobby,
  getLobby,
  deleteLobby,
  startGame,
  toggleJoin,
  swapSeats,
  toggleSpectate,
  setObserver,
  rejoinFromObserver,
  onMayorPick,
  onTimeout,
  afterVotingRound,
  resetGame,
  updateTimer,
  updateSaveTimer,
  updateMayorRoleSettings,
  updatePickCount,
  answerQuestion,
  voteWerewolf,
  voteSeer,
  promoteMod,
  demoteMod,
  resolveMigration,
  getMigrationId,
  MAX_ACTIVE_PLAYERS,
  MAX_INACTIVE_PLAYERS,
  touchModeration,
  canModerate,
};
