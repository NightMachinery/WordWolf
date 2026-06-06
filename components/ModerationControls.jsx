import axios from 'axios';
import { Button, Box } from '@chakra-ui/react';
import { socket } from '../pages/api/service/socket';

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

function MigrationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z" />
    </svg>
  );
}

function ModerationControls({ lobby, loginData, targetAuthId, compact = false }) {
  const me = lobby?.players?.[loginData.authId];
  const target = lobby?.players?.[targetAuthId];
  if (!target || !me) {
    return null;
  }

  const requesterAuthId = loginData.authId;
  const canModerateTarget = me.canModerate && targetAuthId !== requesterAuthId;
  const canCopy = targetAuthId === requesterAuthId || me.canModerate;
  const canDemote = target.isMod || target.isTempMod;
  const buttonSize = compact ? 'xs' : 'sm';

  const emit = (event, payload = {}) => socket.emit(event, {
    ...payload,
    targetAuthId,
    lobby: lobby.name,
    requesterAuthId,
  });

  const copyMigrationLink = async () => {
    const res = await axios.get(`/migration/${lobby.name}/${targetAuthId}`, { params: { requesterAuthId } });
    const url = new URL(`/${lobby.name}/lobby`, window.location.origin);
    url.searchParams.set('migrate', res.data.migrationId);
    await copyText(url.toString());
    alert('Migration link copied');
  };

  return (
    <Box display="inline-flex" gap="4px" flexWrap="wrap" alignItems="center">
      {canCopy ? (
        <Button size={buttonSize} padding={compact ? '0 6px' : undefined} title="Copy migrate device link" onClick={copyMigrationLink}>
          {compact ? <MigrationIcon /> : 'Migrate link'}
        </Button>
      ) : null}
      {canModerateTarget && !target.isMod && !target.isOwner ? (
        <Button size={buttonSize} onClick={() => emit('promoteMod')}>Promote</Button>
      ) : null}
      {canModerateTarget && canDemote && !target.isOwner ? (
        <Button size={buttonSize} onClick={() => emit('demoteMod')}>Demote</Button>
      ) : null}
      {canModerateTarget && target.seat && !target.observer ? (
        <Button size={buttonSize} onClick={() => emit('setObserver', { observer: true })}>Observe</Button>
      ) : null}
      {((canModerateTarget && target.observer) || (targetAuthId === requesterAuthId && target.observer)) ? (
        <Button size={buttonSize} onClick={() => emit('rejoinFromObserver')}>Join back</Button>
      ) : null}
    </Box>
  );
}

export default ModerationControls;
