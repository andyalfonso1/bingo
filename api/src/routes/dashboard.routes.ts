import { FastifyInstance } from "fastify";

import { dashboardController } from "../controllers/dashboard.controller";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/stats", dashboardController.getStats);
}
