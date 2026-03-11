import React, { useEffect, useState, createContext, useContext } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const syncToken = () => setToken(localStorage.getItem('token'));

    window.addEventListener('storage', syncToken);
    window.addEventListener('auth-changed', syncToken);

    return () => {
      window.removeEventListener('storage', syncToken);
      window.removeEventListener('auth-changed', syncToken);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setSocket((current) => {
        if (current) {
          current.removeAllListeners();
          current.disconnect();
        }
        return null;
      });
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;

      const nextSocket = io(`${window.location.protocol}//${window.location.hostname}:5000`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000
      });

      setSocket((current) => {
        if (current) {
          current.removeAllListeners();
          current.disconnect();
        }
        return nextSocket;
      });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [token]);

  useEffect(() => {
    if (!socket) return undefined;

    let lastErrorAt = 0;
    const handleConnectError = (error) => {
      const now = Date.now();
      // Prevent console spam while backend is restarting.
      if (now - lastErrorAt > 5000) {
        console.error('Socket connection error:', error.message);
        lastErrorAt = now;
      }
    };

    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect_error', handleConnectError);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};