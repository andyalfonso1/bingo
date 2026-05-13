"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketService = void 0;
const prisma_1 = require("../utils/prisma");
exports.ticketService = {
    getByNumberAndRaffleId: (number, raffleId) => prisma_1.prisma.ticket.findFirst({
        where: { number, raffleId },
        include: {
            raffle: true,
            user: true,
        },
    }),
    updateBlessedTickets: async (raffleId, numbers, isBlessed) => {
        // Buscar los tickets que pertenecen a la rifa con esos números exactos
        const foundTickets = await prisma_1.prisma.ticket.findMany({
            where: {
                number: { in: numbers },
                raffleId,
            },
            select: { number: true },
        });
        const foundNumbers = foundTickets.map((t) => t.number);
        const missingNumbers = numbers.filter((n) => !foundNumbers.includes(n));
        if (missingNumbers.length > 0) {
            const error = new Error(`Los siguientes tickets no existen en la rifa: ${missingNumbers.join(", ")}.`);
            // Agregás una propiedad custom para identificar el error
            error.statusCode = 404;
            throw error;
        }
        // Si todos los tickets son válidos, actualizar
        const updated = await prisma_1.prisma.ticket.updateMany({
            where: {
                number: { in: numbers },
                raffleId,
            },
            data: { isBlessed },
        });
        return updated;
    },
};
