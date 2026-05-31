import { FastifyReply, FastifyRequest } from "fastify";

import { dashboardService } from "../services/dashboard.service";

export const dashboardController = {
  getStats: async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await dashboardService.getStats();

      return reply.send(stats);
    } catch (error) {
      console.error(error);

      return reply.code(500).send({
        message: "Error obteniendo estadísticas",
      });
    }
  },
};
