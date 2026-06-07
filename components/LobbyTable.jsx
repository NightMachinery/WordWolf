import { Box } from '@chakra-ui/react';
import { seats } from './seatConfig';

function initials(player) {
  return (player?.displayName || player?.name || '').substring(0, 2).toUpperCase();
}

function seatStyle(index) {
  const count = seats.length;
  const angle = (-Math.PI / 2) + ((2 * Math.PI * index) / count);
  const rx = 410;
  const ry = 225;
  return {
    left: `${450 + (rx * Math.cos(angle)) - 35}px`,
    top: `${242 + (ry * Math.sin(angle)) - 35}px`,
  };
}

function Seat({ seat, index, lobby, loginData, toggleJoin }) {
  const player = lobby.seats[seat.id];
  const self = player?.authId === loginData?.authId;
  const pos = seatStyle(index);
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
      position="absolute"
      left={pos.left}
      top={pos.top}
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
      {seats.map((seat, index) => (
        <Seat key={seat.id} index={index} seat={seat} lobby={lobby} loginData={loginData} toggleJoin={toggleJoin} />
      ))}
    </Box>
  );
}

export default LobbyTable;
