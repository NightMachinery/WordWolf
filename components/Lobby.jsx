import {
  Button, HStack, Box,
} from '@chakra-ui/react';
import { FaUserPlus } from 'react-icons/fa';
import Image from 'next/image';
import LobbyTable from './LobbyTable';
import Settings from './Settings';
import Rules from './Rules';
import Chat from './chat/Chat';
import GameLogo from '../assets/GameLogo.svg';
import Timer from './LobbyTimerDisplay';
import PlayerName from './PlayerName';
import ModerationControls from './ModerationControls';

const copyText = async (text) => {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

function InviteButton() {
  const copyInviteLink = async () => {
    if (typeof window === 'undefined') {
      return;
    }
    await copyText(window.location.href);
    alert('Invite link copied');
  };

  return (
    <Button
      className="theme-icon-button top-invite-button"
      aria-label="Copy invite link"
      title="Copy invite link"
      type="button"
      onClick={copyInviteLink}
    >
      <FaUserPlus aria-hidden="true" />
    </Button>
  );
}

function playerStatus(player) {
  const parts = [player.online ? 'Online' : 'Offline'];
  if (player.observer) {
    parts.push('Observer');
  } else if (player.spectator) {
    parts.push('Spectator');
  } else if (player.seat) {
    parts.push('At table');
  }
  if (player.seat) {
    parts.push(`Seat ${String(player.seat).replace('seat', '')}`);
  }
  return parts.join(' · ');
}

function PlayerCard({ lobby, loginData, authId }) {
  const player = lobby.players[authId];
  const self = player.authId === loginData?.authId;
  const className = [
    'player-card',
    player.online ? null : 'offline-player',
    self ? 'self-player-card' : null,
  ].filter(Boolean).join(' ');

  return (
    <Box className={className}>
      <Box className="player-card-main">
        <Box className="player-card-name">
          <PlayerName player={player} loginData={loginData} />
        </Box>
        <Box className="player-card-status">{playerStatus(player)}</Box>
      </Box>
      <Box className="player-card-actions">
        <ModerationControls
          lobby={lobby}
          loginData={loginData}
          targetAuthId={authId}
          compact
        />
      </Box>
    </Box>
  );
}

function Lobby({
  lobby, toggleJoin, onGameStart, loginData, toggleSpectate, joinFirstSeat, rejoinSelf,
  updateTimer, updatePickCount, updateSaveTimer, updateMayorRoleSettings,
}) {
  const me = lobby?.players?.[loginData.authId];
  const canModerate = me?.canModerate;
  const spectatorIds = Object.keys(lobby?.players || {})
    .filter((authId) => lobby.players[authId].spectator);
  const playerIds = Object.keys(lobby?.players || {})
    .filter((authId) => !lobby.players[authId].spectator);

  return (
    <div className="background">
      <HStack
        name="top-row"
        justifyContent="space-evenly"
        w="100vw"
        style={{ paddingTop: '10px' }}
      >
        <Timer lobby={lobby} />
        <Image src={GameLogo} />
        <Box w="200px" />
      </HStack>
      <Box className="lobby-top-actions">
        <InviteButton />
        <Rules />
        {canModerate
          ? (
            <Settings
              updateTimer={updateTimer}
              updateSaveTimer={updateSaveTimer}
              lobby={lobby}
              updatePickCount={updatePickCount}
              updateMayorRoleSettings={updateMayorRoleSettings}
            />
          )
          : null}
      </Box>
      <Box className="chat">
        <Chat
          players={lobby.players}
          username={loginData.authId}
          lobby={loginData.lobby || lobby.name}
        />
      </Box>
      <Box
        style={typeof window !== 'undefined' && window.innerWidth > 1500
          ? { marginTop: '12vh' }
          : { marginTop: '6vh' }}
      >
        <LobbyTable toggleJoin={toggleJoin} loginData={loginData} lobby={lobby} />
      </Box>
      {me?.observer ? (
        <Box
          position="fixed"
          bottom="120px"
          right="20px"
          bg="#fff"
          color="#000"
          padding="10px"
          maxW="340px"
        >
          You are an observer.
          <Button size="sm" marginLeft="8px" onClick={rejoinSelf}>Join back</Button>
        </Box>
      ) : null}
      <Box className="lobby-btn">
        {me?.spectator && !me?.observer ? (
          <Button onClick={(e) => joinFirstSeat(e)} bg="#D19E61" fontSize="24px" borderRadius="0px">
            Join table
          </Button>
        ) : null}
        {!me?.spectator && !me?.observer ? (
          <Button onClick={(e) => toggleSpectate(e)} bg="#D19E61" fontSize="24px" borderRadius="0px">
            Spectate
          </Button>
        ) : null}
        {canModerate
          ? (
            <Button
              onClick={(e) => onGameStart(e)}
              bg="#D19E61"
              fontSize="24px"
              borderRadius="0px"
            >
              Start
            </Button>
          ) : null}
      </Box>
      <Box className="spectators-list">
        <Box className="player-card-section">
          <h1>Players</h1>
          <Box className="player-card-stack">
            {playerIds.map((authId) => (
              <PlayerCard
                key={authId}
                lobby={lobby}
                loginData={loginData}
                authId={authId}
              />
            ))}
          </Box>
        </Box>
        <Box className="player-card-section">
          <h1>Spectators</h1>
          <Box className="player-card-stack">
            {spectatorIds.map((authId) => (
              <PlayerCard
                key={authId}
                lobby={lobby}
                loginData={loginData}
                authId={authId}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </div>
  );
}

export default Lobby;
