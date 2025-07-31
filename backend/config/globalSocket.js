// This module will hold the global io instance for use in controllers
let io = null;
export const setSocketIO = (ioInstance) => {
    io = ioInstance;
};
export const getSocketIO = () => io;
