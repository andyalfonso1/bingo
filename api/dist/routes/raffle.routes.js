"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.raffleRoutes = raffleRoutes;
const raffle_controller_1 = require("../controllers/raffle.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
async function raffleRoutes(fastify) {
    fastify.get("/raffles", { preHandler: auth_middleware_1.authMiddleware }, raffle_controller_1.raffleController.getAll);
    fastify.get("/raffles/:id", { preHandler: auth_middleware_1.authMiddleware }, raffle_controller_1.raffleController.getById);
    fastify.get("/raffles-progress/:id", { preHandler: auth_middleware_1.authMiddleware }, raffle_controller_1.raffleController.getProgressById);
    fastify.post("/raffles", { preHandler: auth_middleware_1.authMiddlewareAdmin }, raffle_controller_1.raffleController.create);
    fastify.put("/raffles/:id", { preHandler: auth_middleware_1.authMiddlewareAdmin }, raffle_controller_1.raffleController.update);
}
