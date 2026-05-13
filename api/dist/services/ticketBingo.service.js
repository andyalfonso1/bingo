"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketService = void 0;
const prisma_1 = require("../utils/prisma");
exports.ticketService = {
    getByNumberAndBingoId: (number, bingoId) => prisma_1.prisma.ticketBingo.findFirst({
        where: { number, BingoId: bingoId },
        include: {
            bingo: true,
            user: true,
        },
    }),
};
