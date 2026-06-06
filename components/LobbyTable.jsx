import { Box, HStack } from '@chakra-ui/react';

const seats = [
  [{ id: 'seat1', color: '#E6474E', text: '#333', top: '-10', left: '175' }, { id: 'seat6', color: '#164186', text: '#fff', top: '-10', left: '340' }, { id: 'seat2', color: '#F18E35', text: '#333', top: '-10', left: '500' }],
  [{ id: 'seat10', color: '#333333', text: '#fff', top: '5', left: '-2' }, { id: 'seat8', color: '#D564D8', text: '#333', top: '5', left: '740' }],
  [{ id: 'seat7', color: '#582C71', text: '#fff', top: '170', left: '-2' }, { id: 'seat9', color: '#71362E', text: '#fff', top: '170', left: '740' }],
  [{ id: 'seat3', color: '#F5D74C', text: '#333', top: '220', left: '175' }, { id: 'seat5', color: '#55BFDB', text: '#333', top: '220', left: '340' }, { id: 'seat4', color: '#54B877', text: '#333', top: '220', left: '500' }],
];

function initials(player) {
  return (player?.displayName || player?.name || '').substring(0, 2).toUpperCase();
}

function Seat({ seat, lobby, loginData, toggleJoin }) {
  const player = lobby.seats[seat.id];
  const self = player?.authId === loginData?.authId;
  return (
    <Box
      name={seat.id}
      id={seat.color}
      as="button"
      w="70px"
      h="70px"
      borderRadius="full"
      background={player ? seat.color : '#C4C4C4'}
      borderWidth={self ? '8px' : '5px'}
      borderColor={self ? '#FFFFFF' : seat.color}
      outline={player?.observer ? '4px dashed #fff' : undefined}
      color={seat.text}
      fontWeight="600"
      pos="relative"
      top={seat.top}
      left={seat.left}
      fontSize="24px"
      title={player?.observer ? `${player.displayName} is an observer; seat is reserved` : player?.displayName}
      onClick={(e) => toggleJoin(e)}
    >
      {initials(player)}
    </Box>
  );
}

function LobbyTable({ toggleJoin, lobby, loginData }) {
  return (
    <Box className="lobby-table" w="900px" h="485px" background="#3A4171" borderWidth="10px" borderColor="#D19E61" borderRadius="full" bgGradient="linear(to-r, #3A4171, #2d3664)" marginRight="200px" justify="center" pos="fixed">
      {seats.map((row) => (
        <HStack key={row.map((seat) => seat.id).join('-')}>
          {row.map((seat) => <Seat key={seat.id} seat={seat} lobby={lobby} loginData={loginData} toggleJoin={toggleJoin} />)}
        </HStack>
      ))}
    </Box>
  );
}

export default LobbyTable;
