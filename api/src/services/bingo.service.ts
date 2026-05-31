import { prisma } from "../utils/prisma";
import { TicketStatus } from "@prisma/client";

function formatTicketNumber(num: number): string {
  return num.toString().padStart(4, "0");
}

export const bingoService = {
  getAll: () => prisma.bingo.findMany(),

  getPayments: async () => {
    return await prisma.bingoPayment.findMany({
      include: {
        user: true,
        bingo: true,
        proofs: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  approvePayment: async (paymentId: number) => {
    return await prisma.$transaction(async (tx) => {
      // =========================
      // BUSCAR PAGO
      // =========================

      const payment = await tx.bingoPayment.findUnique({
        where: {
          id: paymentId,
        },
      });

      if (!payment) {
        throw new Error("Pago no encontrado.");
      }

      // =========================
      // VALIDAR STATUS
      // =========================

      if (payment.status !== "PENDING") {
        throw new Error("Este pago ya fue procesado.");
      }

      // =========================
      // OBTENER BINGO
      // =========================

      const bingo = await tx.bingo.findUnique({
        where: {
          id: payment.bingoId,
        },
      });

      if (!bingo) {
        throw new Error("Bingo no encontrado.");
      }

      // =========================
      // BUSCAR TICKETS DISPONIBLES
      // =========================

      const availableTickets = await tx.bingoTicket.findMany({
        where: {
          bingoId: payment.bingoId,
          status: "AVAILABLE",
        },
      });

      // =========================
      // VALIDAR DISPONIBILIDAD
      // =========================

      if (availableTickets.length < payment.quantity) {
        throw new Error("No hay suficientes tickets disponibles.");
      }

      // =========================
      // ASIGNACIÓN
      // =========================

      let selectedTickets = [];

      // RANDOM
      if (bingo.isRandomized) {
        const shuffled = availableTickets.sort(() => Math.random() - 0.5);

        selectedTickets = shuffled.slice(0, payment.quantity);
      } else {
        // SECUENCIAL

        selectedTickets = availableTickets
          .sort((a, b) => Number(a.number) - Number(b.number))
          .slice(0, payment.quantity);
      }

      // =========================
      // ACTUALIZAR TICKETS -> SOLD
      // =========================

      await tx.bingoTicket.updateMany({
        where: {
          id: {
            in: selectedTickets.map((t) => t.id),
          },
        },
        data: {
          status: "SOLD",
        },
      });

      // =========================
      // CREAR ASIGNACIONES
      // =========================

      await tx.ticketAssignment.createMany({
        data: selectedTickets.map((ticket) => ({
          ticketId: ticket.id,
          userId: payment.userId,
          paymentId: payment.id,
        })),
      });

      // =========================
      // APROBAR PAGO
      // =========================

      const updatedPayment = await tx.bingoPayment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: "APPROVED",
        },
      });

      return updatedPayment;
    });
  },

  rejectPayment: async (paymentId: number) => {
    const payment = await prisma.bingoPayment.findUnique({
      where: {
        id: paymentId,
      },
    });

    if (!payment) {
      throw new Error("Pago no encontrado.");
    }

    if (payment.status !== "PENDING") {
      throw new Error("Este pago ya fue procesado.");
    }

    return await prisma.bingoPayment.update({
      where: {
        id: paymentId,
      },
      data: {
        status: "REJECTED",
      },
    });
  },

  updateTicketImage: async (ticketId: number, imgTicket: string) => {
    const ticket = await prisma.bingoTicket.findUnique({
      where: {
        id: ticketId,
      },
    });

    if (!ticket) {
      throw new Error("Cartón no encontrado.");
    }

    return await prisma.bingoTicket.update({
      where: {
        id: ticketId,
      },
      data: {
        imgTicket,
      },
    });
  },

  /*getTicketsByBingoId: async (bingoId: number) => {
    return await prisma.bingoTicket.findMany({
      where: {
        bingoId,
      },
      orderBy: {
        number: "asc",
      },
    });
  },*/

  getTicketsByBingoId: async (bingoId: number) => {
    return await prisma.bingoTicket.findMany({
      where: {
        bingoId,
      },

      include: {
        assignment: {
          include: {
            user: true,
            payment: true,
          },
        },
      },

      orderBy: {
        number: "asc",
      },
    });
  },

  getById: async (id: number) => {
    const bingoInfo = await prisma.bingo.findUnique({
      where: { id },
      select: { isRandomized: true },
    });

    if (!bingoInfo) return null;

    const bingo = await prisma.bingo.findUnique({
      where: { id },
      include: {
        tickets: !bingoInfo.isRandomized,
      },
    });

    // Si no se incluyeron los tickets, asegurarse de devolver un array vacío
    return {
      ...bingo,
      tickets: bingoInfo.isRandomized ? [] : (bingo?.tickets ?? []),
    };
  },

  getSoldPercentageById: async (id: number) => {
    // Obtener cantidad total de tickets configurados para la rifa
    const bingo = await prisma.bingo.findUnique({
      where: { id: id },
      select: {
        maxTickets: true,
        tickets: {
          select: { status: true },
        },
      },
    });

    if (!bingo) return null;

    // Contar cuántos están en estado SOLD
    const soldTickets = bingo.tickets.filter(
      (ticket) => ticket.status === "SOLD",
    ).length;

    const totalTickets = bingo.maxTickets;
    const percentageAvailable =
      totalTickets > 0
        ? ((totalTickets - soldTickets) / totalTickets) * 100
        : 0;

    return { progress: Number(percentageAvailable.toFixed(2)) };
  },

  create: async (data: {
    name: string;
    description: string;
    maxTickets: number;
    maxTicketsBuy: number;
    bannerUrl: string;
    price: number;
    isActive: boolean;
    isRandomized: boolean;
    isHidden: boolean;
  }) => {
    return await prisma.$transaction(async (tx) => {
      // 1. Crear la rifa
      const bingo = await tx.bingo.create({ data });

      // 2. Determinar cantidad de dígitos (mínimo 4)
      const digits = Math.max(4, (data.maxTickets - 1).toString().length);

      // 3. Generar tickets con ceros a la izquierda
      const tickets = Array.from({ length: data.maxTickets }, (_, i) => ({
        number: i.toString().padStart(digits, "0"),
        bingoId: bingo.id, // <= Nombre correcto
        imgTicket: "", // <= Campo requerido
      }));

      // 4. Insertar en batch
      await tx.bingoTicket.createMany({ data: tickets });

      return bingo;
    });
  },

  update: async (id: number, data: any) => {
    const existingBingo = await prisma.bingo.findUnique({
      where: { id },
    });

    if (!existingBingo) {
      throw new Error("Bingo no encontrado.");
    }

    // TICKETS USADOS (RESERVED o SOLD)
    const usedTicketsCount = await prisma.bingoTicket.count({
      where: {
        bingoId: id,
        status: {
          in: [TicketStatus.RESERVED, TicketStatus.SOLD],
        },
      },
    });

    // =========================
    // maxTickets LOGIC
    // =========================
    if (
      typeof data.maxTickets !== "undefined" &&
      data.maxTickets !== existingBingo.maxTickets
    ) {
      const newMax = data.maxTickets;
      const oldMax = existingBingo.maxTickets;

      // ❌ BLOQUEO si intentan reducir con tickets activos
      if (usedTicketsCount > 0 && newMax < oldMax) {
        throw new Error(
          "No se puede reducir maxTickets porque hay tickets vendidos o reservados.",
        );
      }

      // ➕ AUMENTAR TICKETS
      if (newMax > oldMax) {
        const newTickets = Array.from({
          length: newMax - oldMax,
        }).map((_, i) => {
          const number = oldMax + i + 1;

          return {
            bingoId: id,
            number: formatTicketNumber(number),
            status: TicketStatus.AVAILABLE,
          };
        });

        await prisma.bingoTicket.createMany({
          data: newTickets,
        });
      }

      // ➖ REDUCIR TICKETS (solo AVAILABLE)
      if (newMax < oldMax) {
        const toRemove = oldMax - newMax;

        const availableTickets = await prisma.bingoTicket.findMany({
          where: {
            bingoId: id,
            status: TicketStatus.AVAILABLE,
          },
          orderBy: { id: "desc" },
          take: toRemove,
        });

        await prisma.bingoTicket.deleteMany({
          where: {
            id: {
              in: availableTickets.map((t) => t.id),
            },
          },
        });
      }
    }

    // ❌ NO permitir cambiar random si hay ventas
    /*if (typeof data.isRandomized !== "undefined" && usedTicketsCount > 0) {
      throw new Error(
        "No se puede modificar isRandomized porque hay tickets vendidos o reservados.",
      );
    }*/

    // ❌ NO permitir cambiar random si hay ventas
    if (
      typeof data.isRandomized !== "undefined" &&
      data.isRandomized !== existingBingo.isRandomized &&
      usedTicketsCount > 0
    ) {
      throw new Error(
        "No se puede modificar isRandomized porque hay tickets vendidos o reservados.",
      );
    }

    // ACTUALIZAR BINGO
    return prisma.bingo.update({
      where: { id },
      data,
    });
  },
};
