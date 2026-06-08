import axios from 'axios';
import { Button, Box } from '@chakra-ui/react';
import {
  FaArrowDown, FaArrowUp, FaEye, FaLink, FaUserPlus, FaUsers,
} from 'react-icons/fa';
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

function ActionButton({
  compact, label, onClick, children,
}) {
  const iconOnlyProps = compact ? {
    className: 'theme-icon-button moderation-icon-button',
    'aria-label': label,
    title: label,
    minW: '24px',
    w: '24px',
    h: '24px',
    padding: '0',
  } : {};

  return (
    <Button size={compact ? 'xs' : 'sm'} onClick={onClick} {...iconOnlyProps}>
      {children}
    </Button>
  );
}

function ModerationControls({
  lobby, loginData, targetAuthId, compact = false,
}) {
  const me = lobby?.players?.[loginData.authId];
  const target = lobby?.players?.[targetAuthId];
  if (!target || !me) {
    return null;
  }

  const requesterAuthId = loginData.authId;
  const canModerateTarget = me.canModerate && targetAuthId !== requesterAuthId;
  const canCopy = targetAuthId === requesterAuthId || me.canModerate;
  const canDemote = target.isMod || target.isTempMod;
  const canForceJoin = canModerateTarget
    && (target.spectator || target.observer || !target.seat);

  const emit = (event, payload = {}) => socket.emit(event, {
    ...payload,
    targetAuthId,
    lobby: lobby.name,
    requesterAuthId,
  });

  const copyMigrationLink = async () => {
    const res = await axios.get(
      `/migration/${lobby.name}/${targetAuthId}`,
      { params: { requesterAuthId } },
    );
    const url = new URL(`/${lobby.name}/lobby`, window.location.origin);
    url.searchParams.set('migrate', res.data.migrationId);
    await copyText(url.toString());
    alert('Migration link copied');
  };

  return (
    <Box display="inline-flex" gap="4px" flexWrap="wrap" alignItems="center">
      {canCopy ? (
        <ActionButton
          compact={compact}
          label="Copy migrate device link"
          onClick={copyMigrationLink}
        >
          {compact ? <FaLink aria-hidden="true" /> : 'Migrate link'}
        </ActionButton>
      ) : null}
      {canModerateTarget && !target.isMod && !target.isOwner ? (
        <ActionButton
          compact={compact}
          label="Promote to moderator"
          onClick={() => emit('promoteMod')}
        >
          {compact ? <FaArrowUp aria-hidden="true" /> : 'Promote'}
        </ActionButton>
      ) : null}
      {canModerateTarget && canDemote && !target.isOwner ? (
        <ActionButton
          compact={compact}
          label="Demote moderator"
          onClick={() => emit('demoteMod')}
        >
          {compact ? <FaArrowDown aria-hidden="true" /> : 'Demote'}
        </ActionButton>
      ) : null}
      {canForceJoin ? (
        <ActionButton
          compact={compact}
          label="Force join table"
          onClick={() => emit('forceJoin')}
        >
          {compact ? <FaUserPlus aria-hidden="true" /> : 'Force join'}
        </ActionButton>
      ) : null}
      {canModerateTarget && target.seat && !target.observer ? (
        <ActionButton
          compact={compact}
          label="Make observer"
          onClick={() => emit('setObserver', { observer: true })}
        >
          {compact ? <FaEye aria-hidden="true" /> : 'Observe'}
        </ActionButton>
      ) : null}
      {((canModerateTarget && target.observer) || (targetAuthId === requesterAuthId && target.observer)) ? (
        <ActionButton
          compact={compact}
          label="Join back from observer"
          onClick={() => emit('rejoinFromObserver')}
        >
          {compact ? <FaUsers aria-hidden="true" /> : 'Join back'}
        </ActionButton>
      ) : null}
    </Box>
  );
}

export default ModerationControls;
