"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIo = exports.setIo = void 0;
let io = null;
const setIo = (server) => {
    io = server;
};
exports.setIo = setIo;
const getIo = () => io;
exports.getIo = getIo;
//# sourceMappingURL=ioSingleton.js.map