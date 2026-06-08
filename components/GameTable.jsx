import {
  Box, VStack, Text,
} from '@chakra-ui/react';
import Tokens from './Tokens';
import { seats } from './seatConfig';

function seatStyle(index, count) {
  const safeCount = Math.max(count, 1);
  const angle = (-Math.PI / 2) + ((2 * Math.PI * index) / safeCount);
  const rx = 410;
  const ry = 225;
  return {
    left: `${450 + (rx * Math.cos(angle)) - 35}px`,
    top: `${242 + (ry * Math.sin(angle)) - 35}px`,
  };
}

function tokenStyle(index, count) {
  const safeCount = Math.max(count, 1);
  const angle = (-Math.PI / 2) + ((2 * Math.PI * index) / safeCount);
  const rx = 330;
  const ry = 165;
  return {
    left: `${450 + (rx * Math.cos(angle)) - 45}px`,
    top: `${242 + (ry * Math.sin(angle)) - 20}px`,
  };
}

function SeatButton({
  seat, index, count, player, loginData,
}) {
  if (!player) {
    return null;
  }
  const self = player.authId === loginData.authId;
  const pos = seatStyle(index, count);
  const title = player.online === false
    ? `${player.displayName} is offline; seat is reserved`
    : player.displayName;
  const seatTitle = player.observer
    ? `${player.displayName} is an observer; seat is reserved`
    : title;

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
      opacity={player.online === false ? 0.45 : 1}
      color={seat.text}
      fontWeight="600"
      position="absolute"
      left={pos.left}
      top={pos.top}
      zIndex="999"
      title={seatTitle}
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

  const visibleSeats = seats.filter((seat) => lobby.seats[seat.id]);

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
      position="relative"
    >
      {visibleSeats.map((seat, index) => {
        const player = lobby.seats[seat.id];
        const tpos = tokenStyle(index, visibleSeats.length);
        return (
          <Box key={seat.id}>
            <SeatButton seat={seat} index={index} count={visibleSeats.length} player={player} loginData={loginData} />
            {player ? (
              <Box position="absolute" left={tpos.left} top={tpos.top} zIndex="999">
                <Tokens tokenSetter={tokenSetter} lobby={lobby} seat={seat.id} />
              </Box>
            ) : null}
          </Box>
        );
      })}
      <VStack
        pos="absolute"
        top="170px"
        left="220px"
      >
        {viewWord && lobby?.chosenWord
          ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              color="white"
              fontWeight="bold"
              fontSize="18px"
              h="27px"
            >
              {`The word is ${lobby?.chosenWord}`}
            </Box>
          )
          : <Box height="27px" />}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          width="460px"
          height="60px"
          background="#FFFFFF"
          fontSize="20px"
        >
          {currentPlay}
        </Box>
        <Box
          marginTop="10px"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          textAlign="center"
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
