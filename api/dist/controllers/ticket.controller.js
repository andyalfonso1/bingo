"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketController = void 0;
const ticket_service_1 = require("../services/ticket.service");
exports.ticketController = {
    getByNumberAndRaffleId: async (req, reply) => {
        const number = req.params.number;
        const raffleId = Number(req.params.raffleId);
        const ticket = await ticket_service_1.ticketService.getByNumberAndRaffleId(number, raffleId);
        if (!ticket)
            return reply.code(404).send({ message: "Ticket no encontrado." });
        reply.send(ticket);
    },
    updateBlessedTickets: async (req, reply) => {
        const { numbers, isBlessed } = req.body;
        const raffleId = Number(req.params.id);
        if (!Array.isArray(numbers) || numbers.length === 0) {
            return reply.code(400).send({
                message: "Debe proporcionar un arreglo de números bendecidos.",
            });
        }
        try {
            const ticketsBlessed = await ticket_service_1.ticketService.updateBlessedTickets(raffleId, numbers, isBlessed);
            reply.send({
                ticketsBlessed,
                message: `Tickets actualizados correctamente.`,
            });
        }
        catch (error) {
            if (error.statusCode === 404) {
                return reply.code(404).send({ message: error.message });
            }
            return reply.code(500).send({
                message: error.message || "Error actualizando los tickets.",
            });
        }
    },
};
