"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketBingoController = void 0;
const ticketBingo_service_1 = require("../services/ticketBingo.service");
exports.ticketBingoController = {
    getByNumberAndBingoId: async (req, reply) => {
        const number = req.params.number;
        const bingoId = Number(req.params.bingoId);
        const ticket = await ticketBingo_service_1.ticketService.getByNumberAndBingoId(number, bingoId);
        if (!ticket)
            return reply.code(404).send({ message: "Ticket no encontrado." });
        reply.send(ticket);
    },
};
