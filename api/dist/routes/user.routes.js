"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = userRoutes;
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
async function userRoutes(fastify) {
    fastify.get("/users", { preHandler: auth_middleware_1.authMiddleware }, user_controller_1.userController.getAll);
    fastify.get("/users/:id", { preHandler: auth_middleware_1.authMiddleware }, user_controller_1.userController.getById);
    fastify.get("/users/dni/:dni", { preHandler: auth_middleware_1.authMiddleware }, user_controller_1.userController.getByDni);
    fastify.get("/users/dni/:dni/raffle/:idRaffle", { preHandler: auth_middleware_1.authMiddleware }, user_controller_1.userController.getByDniRaffle);
    fastify.post("/users", { preHandler: auth_middleware_1.authMiddleware }, user_controller_1.userController.create);
}
