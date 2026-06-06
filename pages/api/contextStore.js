import React, { useState, useEffect } from 'react';

const StoreContext = React.createContext();

const randomToken = () => {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(24);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const storageKey = 'wordwolf.identity.v1';

function StoreProvider({ children }) {
  const [lobby, setLobby] = useState();
  const [loginData, setLoginDataState] = useState({
    name: null,
    lobby: null,
    authId: null,
  });
  const [soClose, setSoClose] = useState(false);
  const [wayOff, setWayOff] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    let identity;
    try {
      identity = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
    } catch (_) {
      identity = {};
    }
    const params = new URLSearchParams(window.location.search);
    const migrate = params.get('migrate');
    const authId = identity.authId || randomToken();
    setLoginDataState((prev) => ({
      ...prev,
      name: identity.name || prev.name,
      authId,
      pendingMigrationId: migrate || null,
    }));
    window.localStorage.setItem(storageKey, JSON.stringify({ ...identity, authId }));
  }, []);

  const setLoginData = (next) => {
    setLoginDataState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      const merged = { ...prev, ...value };
      if (typeof window !== 'undefined') {
        try {
          const identity = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
          window.localStorage.setItem(storageKey, JSON.stringify({
            ...identity,
            authId: merged.authId || identity.authId || randomToken(),
            name: merged.name || identity.name || null,
          }));
        } catch (_) {
          // localStorage is best-effort; the session can still proceed in memory.
        }
      }
      return merged;
    });
  };

  const store = {
    lobby,
    setLobby,
    loginData,
    setLoginData,
    soClose,
    setSoClose,
    wayOff,
    setWayOff,
    correct,
    setCorrect,
    voted,
    setVoted,
  };

  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
}

export { StoreContext, StoreProvider, storageKey };
