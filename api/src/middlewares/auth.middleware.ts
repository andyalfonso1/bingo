import { FastifyRequest, FastifyReply } from "fastify";

export const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    await request.jwtVerify();

    // 👇 ya viene tipado si configuraste bien
    const user = request.user;
  } catch (err) {
    return reply.code(401).send({ message: "Token inválido" });
  }
};

export const authMiddlewareAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    // 🔐 valida token automáticamente
    await request.jwtVerify();

    // 👇 ya viene decodificado aquí
    const user = request.user as { id: number; role: string };

    // 🔒 autorización
    if (user.role !== "admin") {
      return reply.code(403).send({ message: "Acceso denegado" });
    }
  } catch (err) {
    return reply.code(401).send({ message: "Token inválido" });
  }
};
