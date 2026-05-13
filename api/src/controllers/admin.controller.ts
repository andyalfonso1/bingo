import { FastifyReply, FastifyRequest } from "fastify";
import { adminService } from "../services/admin.service";

export const adminController = {
  // 🔐 LOGIN ADMIN
  loginAdmin: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { password } = req.body as { password: string };

      // 👇 PASAR req.server (FASTIFY)
      const result = await adminService.login(req.server, password);

      return reply.send(result);
    } catch (error: any) {
      if (error.message === "PASSWORD_REQUIRED") {
        return reply.code(400).send({ message: "Password requerido" });
      }

      if (error.message === "INVALID_CREDENTIALS") {
        return reply.code(401).send({ message: "Credenciales inválidas" });
      }

      console.error(error); // 👈 IMPORTANTE para debug
      return reply.code(500).send({ message: "Error interno" });
    }
  },
};
