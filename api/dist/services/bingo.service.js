"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bingoService = void 0;
const prisma_1 = require("../utils/prisma");
exports.bingoService = {
    getAll: () => prisma_1.prisma.bingo.findMany(),
    getById: async (id) => {
        const bingoInfo = await prisma_1.prisma.bingo.findUnique({
            where: { id },
            select: { isRandomized: true },
        });
        if (!bingoInfo)
            return null;
        const bingo = await prisma_1.prisma.bingo.findUnique({
            where: { id },
            include: {
                ticketsBingo: !bingoInfo.isRandomized,
            },
        });
        // Si no se incluyeron los tickets, asegurarse de devolver un array vacío
        return {
            ...bingo,
            ticketsBingo: bingoInfo.isRandomized ? [] : bingo?.ticketsBingo ?? [],
        };
    },
    getSoldPercentageById: async (id) => {
        // Obtener cantidad total de tickets configurados para la rifa
        const bingo = await prisma_1.prisma.bingo.findUnique({
            where: { id: id },
            select: {
                maxTickets: true,
                ticketsBingo: {
                    select: { status: true },
                },
            },
        });
        if (!bingo)
            return null;
        // Contar cuántos están en estado SOLD
        const soldTickets = bingo.ticketsBingo.filter((ticket) => ticket.status === "SOLD").length;
        const totalTickets = bingo.maxTickets;
        const percentageAvailable = totalTickets > 0
            ? ((totalTickets - soldTickets) / totalTickets) * 100
            : 0;
        return { progress: Number(percentageAvailable.toFixed(2)) };
    },
    create: async (data) => {
        return await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Crear la rifa
            const bingo = await tx.bingo.create({ data });
            // 2. Determinar cantidad de dígitos (mínimo 4)
            const digits = Math.max(4, (data.maxTickets - 1).toString().length);
            // 3. Generar tickets con ceros a la izquierda
            const tickets = Array.from({ length: data.maxTickets }, (_, i) => ({
                number: i.toString().padStart(digits, "0"),
                BingoId: bingo.id, // <= Nombre correcto
                imgTicket: "", // <= Campo requerido
            }));
            // 4. Insertar en batch
            await tx.ticketBingo.createMany({ data: tickets });
            return bingo;
        });
    },
    update: (id, data) => prisma_1.prisma.bingo.update({ where: { id }, data }),
    updateBannerUrl: async (bingoId, bannerUrl) => {
        return prisma_1.prisma.bingo.update({
            where: { id: bingoId },
            data: { bannerUrl },
        });
    },
};
