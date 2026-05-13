import { FastifyInstance } from "fastify";
import { adminController } from "../controllers/admin.controller";

export async function adminRoutes(fastify: FastifyInstance) {
  // 🔐 LOGIN ADMIN (SIN MIDDLEWARE)
  fastify.post("/admin/login", adminController.loginAdmin);
}
