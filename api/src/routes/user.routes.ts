import { FastifyInstance } from "fastify";
import { userController } from "../controllers/user.controller";
import { authMiddleware, authMiddlewareAdmin } from "../middlewares/auth.middleware";

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get("/users", { preHandler: authMiddleware }, userController.getAll);

  fastify.get<{ Params: { id: string } }>(
    "/users/:id",
    { preHandler: authMiddleware },
    userController.getById
  );

  fastify.get<{ Params: { dni: string } }>(
    "/users/dni/:dni",
    { preHandler: authMiddleware },
    userController.getByDni
  );

  fastify.get<{ Params: { dni: string; idRaffle: string } }>(
    "/users/dni/:dni/raffle/:idRaffle",
    { preHandler: authMiddleware },
    userController.getByDniRaffle
  );

  fastify.post<{
    Body: { fullName: string; dni: number; email: string; phone: string };
  }>("/users", { preHandler: authMiddleware }, userController.create);
}
