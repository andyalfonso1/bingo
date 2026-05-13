"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.raffleService = void 0;
const prisma_1 = require("../utils/prisma");
exports.raffleService = {
    getAll: () => prisma_1.prisma.raffle.findMany(),
    getById: async (id) => {
        const raffleInfo = await prisma_1.prisma.raffle.findUnique({
            where: { id },
            select: { isRandomized: true },
        });
        if (!raffleInfo)
            return null;
        const raffle = await prisma_1.prisma.raffle.findUnique({
            where: { id },
            include: {
                tickets: !raffleInfo.isRandomized,
                winners: {
                    include: {
                        ticket: {
                            include: { user: true },
                        },
                    },
                },
            },
        });
        // Si no se incluyeron los tickets, asegurarse de devolver un array vacío
        return {
            ...raffle,
            tickets: raffleInfo.isRandomized ? [] : raffle?.tickets ?? [],
        };
    },
    getSoldPercentageById: async (id) => {
        // Obtener cantidad total de tickets configurados para la rifa
        const raffle = await prisma_1.prisma.raffle.findUnique({
            where: { id: id },
            select: {
                maxTickets: true,
                tickets: {
                    select: { status: true },
                },
            },
        });
        if (!raffle)
            return null;
        // Contar cuántos están en estado SOLD
        const soldTickets = raffle.tickets.filter((ticket) => ticket.status === "SOLD").length;
        const totalTickets = raffle.maxTickets;
        const percentageAvailable = totalTickets > 0
            ? ((totalTickets - soldTickets) / totalTickets) * 100
            : 0;
        return { progress: Number(percentageAvailable.toFixed(2)) };
    },
    create: async (data) => {
        return await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Crear la rifa
            const raffle = await tx.raffle.create({ data });
            // 2. Determinar cantidad de dígitos (mínimo 4)
            const digits = Math.max(4, (data.maxTickets - 1).toString().length);
            // 3. Generar tickets con ceros a la izquierda
            const tickets = Array.from({ length: data.maxTickets }, (_, i) => ({
                number: i.toString().padStart(digits, "0"), // Ej: "0000", "0099", "09999"
                raffleId: raffle.id,
            }));
            // 4. Insertar en batch
            await tx.ticket.createMany({ data: tickets });
            return raffle;
        });
    },
    update: (id, data) => prisma_1.prisma.raffle.update({ where: { id }, data }),
    updateBannerUrl: async (raffleId, bannerUrl) => {
        return prisma_1.prisma.raffle.update({
            where: { id: raffleId },
            data: { bannerUrl },
        });
    },
};
