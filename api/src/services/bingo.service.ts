import { prisma } from "../utils/prisma";
import { TicketStatus } from "@prisma/client";

function formatTicketNumber(num: number): string {
  return num.toString().padStart(4, "0");
}

export const bingoService = {
  getAll: () => prisma.bingo.findMany(),

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
    if (typeof data.isRandomized !== "undefined" && usedTicketsCount > 0) {
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
