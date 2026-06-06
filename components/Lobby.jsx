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
  lobby, toggleJoin, onGameStart, loginData, toggleSpectate, rejoinSelf,
  updateTimer, updatePickCount, updateSaveTimer,
}) {
  const me = lobby?.players?.[loginData.authId];
  const canModerate = me?.canModerate;
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
        <Rules />
      </HStack>
      <Box className="chat" style={{ transform: 'scale(0.9)', marginRight: '90px' }}>
        <Chat players={lobby.players} username={loginData.authId} lobby={loginData.lobby || lobby.name} />
      </Box>
      <Box style={typeof window !== 'undefined' && window.innerWidth > 1500 ? { marginTop: '12vh' } : { marginTop: '6vh' }}>
        <LobbyTable toggleJoin={toggleJoin} loginData={loginData} lobby={lobby} />
      </Box>
      {me?.observer ? (
        <Box position="fixed" bottom="120px" right="20px" bg="#fff" color="#000" padding="10px" maxW="340px">
          You are an observer: your table seat is reserved, but you are inactive until joined back.
          <Button size="sm" marginLeft="8px" onClick={rejoinSelf}>Join back</Button>
        </Box>
      ) : null}
      <Box className="lobby-btn">
        {me?.spectator || me?.observer ? null : <Button onClick={(e) => toggleSpectate(e)} width="11vw" height="9vh" bg="#D19E61" fontSize="32px" borderRadius="0px">Spectate</Button>}
        {canModerate
          ? (
            <Button width="11vw" height="9vh" onClick={(e) => onGameStart(e)} bg="#D19E61" fontSize="32px" borderRadius="0px">
              Start
            </Button>
          ) : null}
      </Box>
      <Box className="spectators-list">
        <h1>Spectators</h1>
        <Box fontSize="12px" maxW="260px" lineHeight="1.2" marginBottom="8px">
          Spectators have no reserved seat. Observers keep a reserved seat but are inactive.
        </Box>
        <UnorderedList>
          {lobby
            ? Object.keys(lobby?.players).map((authId) => (!lobby.players[authId].spectator
              ? null
              : (
                <ListItem key={authId} style={{ listStyle: 'none', marginLeft: '-15px' }}>
                  <PlayerName player={lobby.players[authId]} loginData={loginData} />
                  {' '}
                  <ModerationControls lobby={lobby} loginData={loginData} targetAuthId={authId} compact />
                </ListItem>
              )))
            : null}
        </UnorderedList>
        <h1 style={{ marginTop: '12px' }}>Players</h1>
        <UnorderedList>
          {Object.keys(lobby?.players || {}).map((authId) => (lobby.players[authId].spectator ? null : (
            <ListItem key={authId} style={{ listStyle: 'none', marginLeft: '-15px' }}>
              <PlayerName player={lobby.players[authId]} loginData={loginData} />
              {' '}
              <ModerationControls lobby={lobby} loginData={loginData} targetAuthId={authId} compact />
            </ListItem>
          )))}
        </UnorderedList>
      </Box>
      <Box className="settings">
        {canModerate
          ? (
            <Settings
              updateTimer={updateTimer}
              updateSaveTimer={updateSaveTimer}
              lobby={lobby}
              updatePickCount={updatePickCount}
            />
          )
          : null}
      </Box>
    </div>
  );
}

export default Lobby;
