import io from 'socket.io-client';

const socketUrl = typeof window === 'undefined' ? undefined : window.location.origin;

export const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
});
