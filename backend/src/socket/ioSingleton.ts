import type { Server as IOServer } from 'socket.io';

let io: IOServer | null = null;

export const setIo = (server: IOServer): void => {
  io = server;
};

export const getIo = (): IOServer | null => io;
