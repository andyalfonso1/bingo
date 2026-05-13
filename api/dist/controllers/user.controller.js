"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const user_service_1 = require("../services/user.service");
exports.userController = {
    getAll: async (_req, reply) => {
        const users = await user_service_1.userService.getAll();
        reply.send(users);
    },
    getById: async (req, reply) => {
        const userId = Number(req.params.id);
        const user = await user_service_1.userService.getById(userId);
        if (!user)
            return reply.code(404).send({ message: "User not found" });
        reply.send(user);
    },
    getByDni: async (req, reply) => {
        const dni = Number(req.params.dni);
        const user = await user_service_1.userService.getByDni(dni);
        if (!user)
            return reply.code(404).send({ message: "Cliente no encontrado" });
        reply.send(user);
    },
    getByDniRaffle: async (req, reply) => {
        const dni = Number(req.params.dni);
        const idRaffle = Number(req.params.idRaffle);
        const user = await user_service_1.userService.getByDniRaffle(dni, idRaffle);
        if (!user)
            return reply.code(404).send({ message: "Cliente no encontrado" });
        reply.send(user);
    },
    create: async (req, reply) => {
        const { fullName, dni, email, phone } = req.body;
        // Validación básica
        if (!fullName || !dni || !email || !phone) {
            return reply.code(400).send({
                message: "Todos los campos son obligatorios.",
            });
        }
        try {
            const user = await user_service_1.userService.create({ fullName, dni, email, phone });
            reply.code(201).send({
                user,
                message: "Usuario creado exitosamente",
            });
        }
        catch (error) {
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
