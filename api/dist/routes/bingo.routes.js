"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bingoRoutes = bingoRoutes;
const bingo_controller_1 = require("../controllers/bingo.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
async function bingoRoutes(fastify) {
    fastify.get("/bingos", { preHandler: auth_middleware_1.authMiddleware }, bingo_controller_1.bingoController.getAll);
    fastify.get("/bingos/:id", { preHandler: auth_middleware_1.authMiddleware }, bingo_controller_1.bingoController.getById);
    fastify.get("/bingos-progress/:id", { preHandler: auth_middleware_1.authMiddleware }, bingo_controller_1.bingoController.getProgressById);
    fastify.post("/bingos", { preHandler: auth_middleware_1.authMiddlewareAdmin }, bingo_controller_1.bingoController.create);
    fastify.put("/bingos/:id", { preHandler: auth_middleware_1.authMiddlewareAdmin }, bingo_controller_1.bingoController.update);
}
