"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddlewareAdmin = exports.authMiddleware = void 0;
const authMiddleware = async (request, reply) => {
    const token = request.headers['authorization'];
    if (!token || token !== `Bearer ${process.env.API_USER}`) {
        return reply.status(401).send({ message: "Unauthorized: Invalid token" });
    }
};
exports.authMiddleware = authMiddleware;
const authMiddlewareAdmin = async (request, reply) => {
    const token = request.headers['authorization'];
    if (!token || token !== `Bearer ${process.env.API_ADMIN}`) {
        return reply.status(401).send({ message: "Unauthorized: Invalid token" });
    }
};
exports.authMiddlewareAdmin = authMiddlewareAdmin;
