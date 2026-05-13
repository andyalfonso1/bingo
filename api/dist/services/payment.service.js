"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
const prisma_1 = require("../utils/prisma");
const client_1 = require("@prisma/client");
function fisherYatesShuffle(array) {
    const arr = [...array]; // copiar para no mutar original
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
exports.paymentService = {
    getAll: () => prisma_1.prisma.payment.findMany({
        include: { user: true },
    }),
    getById: (id) => prisma_1.prisma.payment.findUnique({
        where: { id },
        include: { user: true, tickets: true },
    }),
    getByRaffleId: (id) => prisma_1.prisma.payment.findMany({
        where: {
            tickets: {
                some: {
                    raffleId: id,
                },
            },
        },
        include: {
            user: true,
            tickets: true,
        },
    }),
    getTopBuyersByRaffle: async (raffleId, limit = 10) => {
        // 1. Filtra los pagos aprobados que tengan tickets de la rifa indicada
        const payments = await prisma_1.prisma.payment.findMany({
            where: {
                status: client_1.PaymentStatus.APPROVED,
                tickets: {
                    some: { raffleId },
                },
            },
            select: {
                userId: true,
                quantity: true,
                totalAmount: true,
            },
        });
        // 2. Agrupa los pagos por usuario manualmente
        const buyerMap = new Map();
        payments.forEach((p) => {
            if (!buyerMap.has(p.userId)) {
                buyerMap.set(p.userId, { ticketsBought: 0, totalSpent: 0 });
            }
            const buyer = buyerMap.get(p.userId);
            buyer.ticketsBought += p.quantity ?? 0;
            buyer.totalSpent += p.totalAmount ?? 0;
        });
        // 3. Ordena y toma el top N
        const topBuyersArr = Array.from(buyerMap.entries())
            .sort((a, b) => b[1].ticketsBought - a[1].ticketsBought)
            .slice(0, limit);
        // 4. Trae los datos de usuario
        const userIds = topBuyersArr.map(([userId]) => userId);
        const users = await prisma_1.prisma.user.findMany({
            where: { id: { in: userIds } },
        });
        // 5. Devuelve el resultado combinado
        return topBuyersArr.map(([userId, stats]) => ({
            user: users.find((u) => u.id === userId),
            ticketsBought: stats.ticketsBought,
            totalSpent: stats.totalSpent,
        }));
    },
    createPaymentAndReserveTickets: async (data) => {
        return await prisma_1.prisma.$transaction(async (tx) => {
            const { proofUrls, method, currency, rate, reference, userId, raffleId, ticketIds, quantity, } = data;
            if (!raffleId)
                throw new Error("RaffleId es requerido");
            // Obtener la rifa para precio
            const raffle = await tx.raffle.findUnique({
                where: { id: raffleId },
            });
            if (!raffle)
                throw new Error("Rifa no encontrada");
            // Validación para rifas con precio 0
            if (raffle.price === 0) {
                // Buscar pagos con status reservado o aprobado para ese usuario y raffle
                const existingPayments = await tx.payment.findMany({
                    where: {
                        userId,
                        status: {
                            in: [client_1.PaymentStatus.PENDING, client_1.PaymentStatus.APPROVED], // ajustá los enums si tienen otro nombre
                        },
                        tickets: {
                            some: {
                                raffleId: raffleId,
                            },
                        },
                    },
                });
                // Contar la cantidad total de tickets reservados o aprobados
                const ticketsCount = existingPayments.reduce((acc, payment) => acc + (payment.quantity ?? 0), 0);
                if (ticketsCount >= 1) {
                    throw new Error("Tienes un pago registrado, solo puedes comprar 1 ticket en esta rifa.");
                }
                // Evitar que compre más de 1 ticket en la misma operación
                if ((quantity ?? 0) > 1 || (ticketIds?.length ?? 0) > 1) {
                    throw new Error("Solo puedes comprar 1 ticket en esta rifa.");
                }
            }
            let selectedTicketIds = [];
            if (ticketIds?.length) {
                // Si tickets manuales
                selectedTicketIds = ticketIds;
            }
            else if (quantity && quantity > 0) {
                // 1. Traer todos los tickets disponibles para esa rifa
                const availableTickets = await tx.ticket.findMany({
                    where: { status: client_1.TicketStatus.AVAILABLE, raffleId },
                    // take: Math.max(quantity, 1000),
                    select: { id: true },
                });
                if (availableTickets.length === 0) {
                    throw new Error("No hay tickets disponibles para reservar.");
                }
                if (availableTickets.length < quantity) {
                    throw new Error(
                    // `Solo hay ${availableTickets.length} tickets disponibles.`
                    `No hay suficientes tickets para reservar.`);
                }
                // 2. Barajar con Fisher-Yates
                const shuffled = fisherYatesShuffle(availableTickets);
                // 3. Tomar los primeros N
                selectedTicketIds = shuffled.slice(0, quantity).map((t) => t.id);
            }
            else {
                throw new Error("Debes enviar tickets selecionados o la cantidad.");
            }
            // 4. Obtener precio del ticket para calcular total
            const sampleTicket = await tx.ticket.findFirst({
                where: { id: selectedTicketIds[0] },
                include: { raffle: true },
            });
            if (!sampleTicket) {
                throw new Error("No se pudo determinar el precio del ticket.");
            }
            let totalAmount = sampleTicket.raffle.price * selectedTicketIds.length;
            if (currency === "USD") {
                totalAmount = totalAmount / (rate ?? 1);
                totalAmount = Math.round((totalAmount + Number.EPSILON) * 100) / 100;
            }
            // 5. Crear el pago
            const payment = await tx.payment.create({
                data: {
                    proofUrls,
                    method,
                    currency: currency,
                    reference,
                    status: client_1.PaymentStatus.PENDING,
                    totalAmount,
                    quantity: selectedTicketIds.length,
                    user: { connect: { id: userId } },
                },
            });
            // 6. Reservar tickets
            const updatedTickets = await tx.ticket.updateMany({
                where: {
                    id: { in: selectedTicketIds },
                    status: client_1.TicketStatus.AVAILABLE,
                },
                data: {
                    status: client_1.TicketStatus.RESERVED,
                    paymentId: payment.id,
                    userId,
                    reservedAt: new Date(),
                },
            });
            if (updatedTickets.count !== selectedTicketIds.length) {
                throw new Error("Algunos tickets no estaban disponibles para reservar.");
            }
            return payment;
        });
    },
    updateProofUrls: (paymentId, urls) => {
        return prisma_1.prisma.payment.update({
            where: { id: paymentId },
            data: { proofUrls: urls },
            include: {
                tickets: {
                    select: {
                        id: true,
                        number: true,
                        status: true,
                        isBlessed: true,
                    },
                },
            },
        });
    },
    approvePaymentAndSellTickets: async (paymentId) => {
        return await prisma_1.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({
                where: { id: paymentId },
                include: {
                    tickets: true,
                },
            });
            if (!payment) {
                throw new Error("Pago no encontrado");
            }
            if (payment.status === client_1.PaymentStatus.REJECTED) {
                throw new Error("No se puede aprobar un pago que ya fue rechazado");
            }
            const updatedPayment = await tx.payment.update({
                where: { id: paymentId },
                data: { status: client_1.PaymentStatus.APPROVED },
            });
            // Marcar todos los tickets como vendidos
            await tx.ticket.updateMany({
                where: {
                    paymentId: paymentId,
                    status: client_1.TicketStatus.RESERVED,
                },
                data: {
                    status: client_1.TicketStatus.SOLD,
                },
            });
            // Crear entrada en Winners para los tickets bendecidos
            for (const ticket of payment.tickets) {
                if (ticket.isBlessed) {
                    // Asegúrate de no duplicar si ya existe
                    const existingWinner = await tx.winner.findUnique({
                        where: {
                            ticketId: ticket.id,
                        },
                    });
                    if (!existingWinner) {
                        await tx.winner.create({
                            data: {
                                prize: "Ganador por ticket bendecido", // O puedes hacer esto configurable
                                ticket: { connect: { id: ticket.id } },
                                raffle: { connect: { id: ticket.raffleId } },
                            },
                        });
                    }
                }
            }
            return updatedPayment;
        });
    },
    rejectPaymentAndReleaseTickets: async (paymentId) => {
        return await prisma_1.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({
                where: { id: paymentId },
                include: {
                    tickets: true,
                },
            });
            if (!payment) {
                throw new Error("Pago no encontrado");
            }
            if (payment.status === client_1.PaymentStatus.REJECTED) {
                throw new Error("Este pago ya fue rechazado previamente");
            }
            const updatedPayment = await tx.payment.update({
                where: { id: paymentId },
                data: { status: client_1.PaymentStatus.REJECTED },
            });
            // Eliminar ganadores si hay tickets bendecidos
            const ticketIds = payment.tickets.map((t) => t.id);
            await tx.winner.deleteMany({
                where: {
                    ticketId: {
                        in: ticketIds,
                    },
                },
            });
            // Liberar los tickets
            await tx.ticket.updateMany({
                where: {
                    paymentId: paymentId,
                },
                data: {
                    status: client_1.TicketStatus.AVAILABLE,
                    paymentId: null,
                    userId: null,
                    reservedAt: null,
                },
            });
            return updatedPayment;
        });
    },
};
