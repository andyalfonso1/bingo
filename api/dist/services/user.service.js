"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const prisma_1 = require("../utils/prisma");
exports.userService = {
    getAll: () => prisma_1.prisma.user.findMany(),
    getById: async (id) => {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id },
            include: {
                payments: {
                    where: { status: "APPROVED" },
                    orderBy: { createdAt: "desc" },
                    include: {
                        tickets: true,
                    },
                },
            },
        });
        if (!user)
            return null;
        const paymentsWithRaffles = await Promise.all(user.payments.map(async (payment) => {
            const raffle = payment.tickets[0]
                ? await prisma_1.prisma.raffle.findUnique({
                    where: { id: payment.tickets[0].raffleId },
                })
                : null;
            return {
                ...payment,
                raffle,
            };
        }));
        return {
            ...user,
            payments: paymentsWithRaffles,
        };
    },
    getByDniRaffle: async (dni, idRaffle) => {
        const user = await prisma_1.prisma.user.findUnique({
            where: { dni },
            include: {
                payments: {
                    where: {
                        status: "APPROVED",
                    },
                    orderBy: { createdAt: "desc" },
                    include: {
                        tickets: true,
                    },
                },
            },
        });
        if (!user)
            return null;
        const paymentsWithRaffles = await Promise.all(user.payments
            .filter((payment) => payment.tickets.some((ticket) => ticket.raffleId === idRaffle))
            .map(async (payment) => {
            const raffle = payment.tickets[0]
                ? await prisma_1.prisma.raffle.findUnique({
                    where: { id: payment.tickets[0].raffleId },
                })
                : null;
            return {
                ...payment,
                raffle,
                tickets: payment.tickets.filter((ticket) => ticket.raffleId === idRaffle),
            };
        }));
        return {
            ...user,
            payments: paymentsWithRaffles,
        };
    },
    getByDni: async (dni) => {
        const user = await prisma_1.prisma.user.findUnique({
            where: { dni },
            include: {
                payments: {
                    where: { status: "APPROVED" },
                    orderBy: { createdAt: "desc" },
                    include: {
                        tickets: true,
                    },
                },
            },
        });
        if (!user)
            return null;
        const paymentsWithRaffles = await Promise.all(user.payments.map(async (payment) => {
            const raffle = payment.tickets[0]
                ? await prisma_1.prisma.raffle.findUnique({
                    where: { id: payment.tickets[0].raffleId },
                })
                : null;
            return {
                ...payment,
                raffle,
            };
        }));
        return {
            ...user,
            payments: paymentsWithRaffles,
        };
    },
    create: (data) => prisma_1.prisma.user.create({
        data,
    }),
    update: (id, data) => prisma_1.prisma.user.update({
        where: { id },
        data,
    }),
};
