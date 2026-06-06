import { Box } from '@chakra-ui/react';

function PlayerName({ player, loginData, suffix = true }) {
  if (!player) {
    return null;
  }
  const self = player.authId === loginData?.authId;
  const badges = [];
  if (player.isOwner) badges.push('owner');
  else if (player.isMod) badges.push('mod');
  else if (player.tempModActive) badges.push('temp mod');
  if (player.observer) badges.push('observer');
  if (!player.online) badges.push('offline');

  return (
    <Box as="span" className={self ? 'self-user' : undefined} title={badges.join(', ')}>
      {player.displayName || player.name}
      {self ? ' (you)' : ''}
      {suffix && badges.length ? ` · ${badges.join(', ')}` : ''}
    </Box>
  );
}

export default PlayerName;
