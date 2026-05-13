"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketBingoRoutes = ticketBingoRoutes;
const ticketBingo_controller_1 = require("../controllers/ticketBingo.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
async function ticketBingoRoutes(fastify) {
    fastify.get("/tickets-bingo/:number/bingos/:bingoId", { preHandler: auth_middleware_1.authMiddlewareAdmin }, ticketBingo_controller_1.ticketBingoController.getByNumberAndBingoId);
}
