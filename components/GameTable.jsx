import {
  Box, HStack, VStack, Text,
} from '@chakra-ui/react';
import Tokens from './Tokens';

const seats = [
  { id: 'seat1', color: '#E6474E', text: '#333', top: '-10', left: '175', token: { left: '185', bottom: '220' }, emptyToken: { left: '185', bottom: '220' } },
  { id: 'seat6', color: '#164186', text: '#fff', top: '-10', left: '340', token: { left: '392', bottom: '260' }, emptyToken: { left: '392', bottom: '260' } },
  { id: 'seat2', color: '#F18E35', text: '#333', top: '-10', left: '500', token: { left: '605', bottom: '300' }, emptyToken: { left: '605', bottom: '300' } },
  { id: 'seat10', color: '#333333', text: '#fff', top: '5', left: '-2', token: { left: '50', bottom: '265' }, emptyToken: { left: '50', bottom: '265' } },
  { id: 'seat8', color: '#D564D8', text: '#333', top: '5', left: '740', token: { left: '710', bottom: '305' }, emptyToken: { left: '710', bottom: '305' } },
  { id: 'seat7', color: '#582C71', text: '#fff', top: '170', left: '-2', token: { left: '50', bottom: '230' }, emptyToken: { left: '50', bottom: '230' } },
  { id: 'seat9', color: '#71362E', text: '#fff', top: '170', left: '740', token: { left: '710', bottom: '270' }, emptyToken: { left: '710', bottom: '270' } },
  { id: 'seat3', color: '#F5D74C', text: '#333', top: '220', left: '175', token: { left: '185', bottom: '235' }, emptyToken: { left: '185', bottom: '335' } },
  { id: 'seat5', color: '#55BFDB', text: '#333', top: '220', left: '340', token: { left: '392', bottom: '275' }, emptyToken: { left: '392', bottom: '275' } },
  { id: 'seat4', color: '#54B877', text: '#333', top: '220', left: '500', token: { left: '605', bottom: '315' }, emptyToken: { left: '605', bottom: '315' } },
];

const rows = [seats.slice(0, 3), seats.slice(3, 5), seats.slice(5, 7), seats.slice(7, 10)];

function SeatButton({ seat, player, loginData }) {
  if (!player) {
    return <Box name={seat.id} id={seat.color} as="button" w="70px" h="70px" pos="relative" top={seat.top} left={seat.left} />;
  }
  const self = player.authId === loginData.authId;
  return (
    <Box
      name={seat.id}
      id={seat.color}
      as="button"
      w="70px"
      h="70px"
      borderRadius="full"
      background={seat.color}
      borderWidth={self ? '8px' : '5px'}
      borderColor={self ? '#FFFFFF' : seat.color}
      outline={player.observer ? '4px dashed #fff' : undefined}
      color={seat.text}
      fontWeight="600"
      pos="relative"
      top={seat.top}
      left={seat.left}
      zIndex="999"
      title={player.observer ? `${player.displayName} is an observer; seat is reserved` : player.displayName}
    >
      {(player.displayName || player.name || '').substring(0, 2).toUpperCase()}
    </Box>
  );
}

function GameTable({ tokenSetter, lobby, loginData }) {
  let viewWord;

  if (lobby?.players[loginData.authId]?.role !== 'villager') {
    viewWord = true;
  } else if (lobby?.players[loginData.authId]?.role === 'villager') {
    if (loginData.authId === lobby?.mayor.authId) {
      viewWord = true;
    }
  } else if (lobby?.players[loginData.authId]?.authId === lobby?.mayor.authId) {
    viewWord = true;
  }

  let currentPlay;
  if (lobby.gameState === 'mayorPick') {
    currentPlay = 'Mayor is choosing a word...';
  } else if (lobby.gameState === 'questionRound') {
    if (lobby.questions.length === 0) {
      currentPlay = 'Question Round - Ask away!';
    } else {
      currentPlay = lobby.questions[0]?.message;
    }
  } else if (lobby.gameState === 'wordGuessed') {
    currentPlay = 'The word was guessed correctly!';
  } else if (lobby.gameState === 'outOfTime') {
    currentPlay = 'You ran out of time...';
  } else if (lobby.gameState === 'outOfTokens') {
    currentPlay = 'You ran out of tokens...';
  } else if (lobby.gameState === 'endGame') {
    currentPlay = 'Game Over!';
  }

  return (
    <Box
      w="900px"
      h="485px"
      background="#3A4171"
      borderWidth="10px"
      borderColor="#D19E61"
      borderRadius="full"
      bgGradient="linear(to-r, #3A4171, #2d3664)"
      marginRight="200px"
      justify="center"
    >
      {rows.map((row) => (
        <HStack key={row.map((seat) => seat.id).join('-')}>
          {row.map((seat) => <SeatButton key={seat.id} seat={seat} player={lobby.seats[seat.id]} loginData={loginData} />)}
        </HStack>
      ))}
      {seats.map((seat, index) => {
        const player = lobby.seats[seat.id];
        const pos = player ? seat.token : seat.emptyToken;
        return (
          <Box
            key={`tokens-${seat.id}`}
            name={`tokens${index + 1}`}
            pos="relative"
            left={pos.left}
            bottom={pos.bottom}
            zIndex={player ? '999' : undefined}
            w={player ? undefined : '30px'}
            h={player ? undefined : '40px'}
          >
            {player ? <Tokens tokenSetter={tokenSetter} lobby={lobby} seat={seat.id} /> : null}
          </Box>
        );
      })}
      <VStack
        pos="relative"
        bottom="425"
        left="2"
      >
        {viewWord && lobby?.chosenWord
          ? (
            <Box
              pos="relative"
              display="flex"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              color="white"
              fontWeight="bold"
              bottom="90"
              fontSize="18px"
              h="27px"
            >
              {`The word is ${lobby?.chosenWord}`}
            </Box>
          )
          : (
            <Box
              pos="relative"
              display="flex"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              fontWeight="bold"
              bottom="90"
              height="27px"
            />
          )}
        <Box
          pos="relative"
          display="flex"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          bottom="90"
          width="460px"
          height="60px"
          background="#FFFFFF"
          fontSize="20px"
        >
          {currentPlay}
        </Box>
        <Box
          marginTop="10px"
          pos="relative"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          textAlign="center"
          bottom="95"
          left="5px"
          color="white"
          fontWeight="bold"
          w="460px"
          h="25px"
        >
          <Box display="flex" paddingLeft="10px">
            <Text>Yes</Text>
          &nbsp;/&nbsp;
            <Text>No</Text>
          &nbsp;remaining: &nbsp;
            {lobby.tokens}
          &nbsp;
          </Box>
          <Box display="flex" paddingRight="25px" h="fit-content">
            <Text>Maybe</Text>
          &nbsp;remaining:&nbsp;
            {lobby.maybeTokens}
          </Box>
        </Box>
      </VStack>
    </Box>
  );
}

export default GameTable;
