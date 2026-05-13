import { prisma } from "../utils/prisma";
import { TicketStatus } from "@prisma/client";
/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function formatTicketNumber(num: number): string {
  return num.toString().padStart(4, "0");
}

export const userService = {
  getAll: () => prisma.user.findMany(),

  getById: async (id: number) => {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        payments: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          include: {
            bingo: true, // 🔥 ahora el bingo viene directo
            assignments: {
              include: {
                ticket: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    const paymentsFormatted = user.payments.map((payment) => ({
      ...payment,
      tickets: payment.assignments.map((a) => a.ticket),
    }));

    return {
      ...user,
      payments: paymentsFormatted,
    };
  },

  getByDniRaffle: async (dni: number, bingoId: number) => {
    const user = await prisma.user.findUnique({
      where: { dni },
      include: {
        payments: {
          where: { status: "APPROVED", bingoId },
          orderBy: { createdAt: "desc" },
          include: {
            bingo: true,
            assignments: {
              include: {
                ticket: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    const paymentsFormatted = user.payments.map((payment) => ({
      ...payment,
      tickets: payment.assignments.map((a) => a.ticket),
    }));

    return {
      ...user,
      payments: paymentsFormatted,
    };
  },

  getByDni: async (dni: number) => {
    const user = await prisma.user.findUnique({
      where: { dni },
      include: {
        payments: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          include: {
            bingo: true,
            assignments: {
              include: {
                ticket: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    const paymentsFormatted = user.payments.map((payment) => ({
      ...payment,
      tickets: payment.assignments.map((a) => a.ticket),
    }));

    return {
      ...user,
      payments: paymentsFormatted,
    };
  },

  create: (data: {
    fullName: string;
    dni: number;
    email: string;
    phone: string;
  }) =>
    prisma.user.create({
      data,
    }),

  /*update: (
    id: number,
    data: {
      fullName?: string;
      dni?: number;
      email?: string;
      phone?: string;
    },
  ) =>
    prisma.user.update({
      where: { id },
      data,
    }),*/

  update: async (id: number, data: any) => {
    const existingBingo = await prisma.bingo.findUnique({
      where: { id },
    });

    if (!existingBingo) {
      throw new Error("Bingo no encontrado.");
    }

    // VALIDAR SI EXISTEN TICKETS NO DISPONIBLES

    const usedTicketsCount = await prisma.ticketBingo.count({
      where: {
        bingoId: id,
        status: {
          not: "AVAILABLE",
        },
      },
    });

    // SI QUIEREN CAMBIAR maxTickets

    if (
      typeof data.maxTickets !== "undefined" &&
      data.maxTickets !== existingBingo.maxTickets
    ) {
      // BLOQUEAR SI HAY TICKETS RESERVADOS/VENDIDOS

      if (usedTicketsCount > 0) {
        throw new Error(
          "No se puede modificar maxTickets porque existen tickets reservados o vendidos.",
        );
      }

      // AUMENTAR TICKETS

      if (data.maxTickets > existingBingo.maxTickets) {
        const newTickets = [];

        for (let i = existingBingo.maxTickets + 1; i <= data.maxTickets; i++) {
          newTickets.push({
            bingoId: id,
            number: formatTicketNumber(i),
            //status: "AVAILABLE",
            status: TicketStatus.AVAILABLE,
          });
        }

        await prisma.ticketBingo.createMany({
          data: newTickets,
        });
      }

      // DISMINUIR TICKETS

      if (data.maxTickets < existingBingo.maxTickets) {
        const limit = formatTicketNumber(data.maxTickets);

        await prisma.ticketBingo.deleteMany({
          where: {
            bingoId: id,
            number: {
              gt: limit,
            },
          },
        });
      }
    }

    // BLOQUEAR CAMBIO DE RANDOM SI HAY VENTAS

    if (typeof data.isRandomized !== "undefined" && usedTicketsCount > 0) {
      throw new Error(
        "No se puede modificar isRandomized porque existen tickets vendidos o reservados.",
      );
    }

    // ACTUALIZAR BINGO

    return prisma.bingo.update({
      where: { id },
      data,
    });
  },
};
