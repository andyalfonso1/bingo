import { prisma } from "../utils/prisma";

export const dashboardService = {
  getStats: async () => {
    const totalBingos = await prisma.bingo.count();

    const activeBingos = await prisma.bingo.count({
      where: {
        isActive: true,
      },
    });

    const totalPayments = await prisma.bingoPayment.count();

    const pendingPayments = await prisma.bingoPayment.count({
      where: {
        status: "PENDING",
      },
    });

    const approvedPayments = await prisma.bingoPayment.count({
      where: {
        status: "APPROVED",
      },
    });

    const totalRevenue = await prisma.bingoPayment.aggregate({
      _sum: {
        totalAmount: true,
      },

      where: {
        status: "APPROVED",
      },
    });

    const soldTickets = await prisma.bingoTicket.count({
      where: {
        status: "SOLD",
      },
    });

    return {
      totalBingos,
      activeBingos,
      totalPayments,
      pendingPayments,
      approvedPayments,
      soldTickets,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    };
  },
};
