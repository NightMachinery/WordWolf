import {
  Button, UnorderedList, ListItem, HStack, Box,
} from '@chakra-ui/react';
import Image from 'next/image';
import LobbyTable from './LobbyTable';
import Settings from './Settings';
import Rules from './Rules';
import Chat from './chat/Chat';
import GameLogo from '../assets/GameLogo.svg';
import Timer from './LobbyTimerDisplay';
import PlayerName from './PlayerName';
import ModerationControls from './ModerationControls';

function Lobby({
  lobby, toggleJoin, onGameStart, loginData, toggleSpectate, joinFirstSeat, rejoinSelf,
  updateTimer, updatePickCount, updateSaveTimer, updateMayorRoleSettings,
}) {
  const me = lobby?.players?.[loginData.authId];
  const canModerate = me?.canModerate;
  const spectatorIds = Object.keys(lobby?.players || {}).filter((authId) => lobby.players[authId].spectator);
  const playerIds = Object.keys(lobby?.players || {}).filter((authId) => !lobby.players[authId].spectator);

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
        <Chat players={lobby.players} username={loginData.authId} lobby={loginData.lobby || lobby.name} />
      </Box>
      <Box style={typeof window !== 'undefined' && window.innerWidth > 1500 ? { marginTop: '12vh' } : { marginTop: '6vh' }}>
        <LobbyTable toggleJoin={toggleJoin} loginData={loginData} lobby={lobby} />
      </Box>
      {me?.observer ? (
        <Box position="fixed" bottom="120px" right="20px" bg="#fff" color="#000" padding="10px" maxW="340px">
          You are an observer.
          <Button size="sm" marginLeft="8px" onClick={rejoinSelf}>Join back</Button>
        </Box>
      ) : null}
      <Box className="lobby-btn">
        {me?.spectator && !me?.observer ? <Button onClick={(e) => joinFirstSeat(e)} bg="#D19E61" fontSize="24px" borderRadius="0px">Join table</Button> : null}
        {!me?.spectator && !me?.observer ? <Button onClick={(e) => toggleSpectate(e)} bg="#D19E61" fontSize="24px" borderRadius="0px">Spectate</Button> : null}
        {canModerate
          ? (
            <Button onClick={(e) => onGameStart(e)} bg="#D19E61" fontSize="24px" borderRadius="0px">
              Start
            </Button>
          ) : null}
      </Box>
      <Box className="spectators-list">
        <Box>
          <h1>Players</h1>
          <UnorderedList>
            {playerIds.map((authId) => (
              <ListItem key={authId} style={{ listStyle: 'none', marginLeft: '-15px' }}>
                <PlayerName player={lobby.players[authId]} loginData={loginData} />
                {' '}
                <ModerationControls lobby={lobby} loginData={loginData} targetAuthId={authId} compact />
              </ListItem>
            ))}
          </UnorderedList>
        </Box>
        <Box>
          <h1>Spectators</h1>
          <UnorderedList>
            {spectatorIds.map((authId) => (
              <ListItem key={authId} style={{ listStyle: 'none', marginLeft: '-15px' }}>
                <PlayerName player={lobby.players[authId]} loginData={loginData} />
                {' '}
                <ModerationControls lobby={lobby} loginData={loginData} targetAuthId={authId} compact />
              </ListItem>
            ))}
          </UnorderedList>
        </Box>
      </Box>
    </div>
  );
}

export default Lobby;
