import { FastifyInstance } from "fastify";
import { bingoController } from "../controllers/bingo.controller";
import {
  authMiddleware,
  authMiddlewareAdmin,
} from "../middlewares/auth.middleware";

export async function bingoRoutes(fastify: FastifyInstance) {
  /*fastify.post(
    "/bingo",
    { preHandler: authMiddlewareAdmin },
    bingoController.createBingo,
  );*/

  fastify.get(
    "/bingos",
    { preHandler: authMiddleware },
    bingoController.getAll,
  );

  fastify.get<{ Params: { id: string } }>(
    "/bingos/:id",
    { preHandler: authMiddleware },
    bingoController.getById,
  );

  fastify.get<{ Params: { id: string } }>(
    "/bingos-progress/:id",
    { preHandler: authMiddleware },
    bingoController.getProgressById,
  );

  fastify.post(
    "/bingos",
    { preHandler: authMiddlewareAdmin },
    bingoController.create,
  );

  fastify.put<{
    Params: { id: string };
  }>(
    "/bingos/:id",
    { preHandler: authMiddlewareAdmin },
    bingoController.update,
  );
}
