import { FastifyReply, FastifyRequest } from "fastify";
import { userService } from "../services/user.service";

export const userController = {
  getAll: async (_req: FastifyRequest, reply: FastifyReply) => {
    const users = await userService.getAll();
    reply.send(users);
  },

  getById: async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const userId = Number(req.params.id);
    const user = await userService.getById(userId);
    if (!user) return reply.code(404).send({ message: "User not found" });
    reply.send(user);
  },

  getByDni: async (
    req: FastifyRequest<{ Params: { dni: string } }>,
    reply: FastifyReply
  ) => {
    const dni = Number(req.params.dni);
    const user = await userService.getByDni(dni);
    if (!user)
      return reply.code(404).send({ message: "Cliente no encontrado" });
    reply.send(user);
  },

  getByDniRaffle: async (
    req: FastifyRequest<{ Params: { dni: string, idRaffle: string } }>,
    reply: FastifyReply
  ) => {
    const dni = Number(req.params.dni);
    const idRaffle = Number(req.params.idRaffle);
    const user = await userService.getByDniRaffle(dni, idRaffle);
    
    if (!user)
      return reply.code(404).send({ message: "Cliente no encontrado" });
    reply.send(user);
  },

  create: async (
    req: FastifyRequest<{
      Body: { fullName: string; dni: number; email: string; phone: string };
    }>,
    reply: FastifyReply
  ) => {
    const { fullName, dni, email, phone } = req.body;

    // Validación básica
    if (!fullName || !dni || !email || !phone) {
      return reply.code(400).send({
        message: "Todos los campos son obligatorios.",
      });
    }

    try {
      const user = await userService.create({ fullName, dni, email, phone });
      reply.code(201).send({
        user,
        message: "Usuario creado exitosamente",
      });
      
    } catch (error: any) {
      // Error de Prisma (por ejemplo, campo único duplicado)
      if (error.code === "P2002") {
        return reply.code(409).send({
          message: `El campo ${error.meta?.target} ya está en uso.`,
        });
      }

      reply.code(500).send({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  },
};
