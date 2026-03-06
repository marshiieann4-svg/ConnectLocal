import React, { useEffect, useMemo } from 'react';
import io from 'socket.io-client';
import { SocketContext } from './socket-context';

export const SocketProvider = ({ children }) => {
  const token = localStorage.getItem('token');

  const socket = useMemo(() => {
    if (!token) return null;
    return io('http://localhost:5000', {
      auth: { token }
    });
  }, [token]);

  useEffect(() => {
    return () => {
      socket?.close();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};