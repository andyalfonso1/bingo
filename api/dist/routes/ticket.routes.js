"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketRoutes = ticketRoutes;
const ticket_controller_1 = require("../controllers/ticket.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
async function ticketRoutes(fastify) {
    fastify.get("/tickets/:number/raffles/:raffleId", { preHandler: auth_middleware_1.authMiddlewareAdmin }, ticket_controller_1.ticketController.getByNumberAndRaffleId);
    fastify.put("/tickets/blessed/raffles/:id", { preHandler: auth_middleware_1.authMiddlewareAdmin }, ticket_controller_1.ticketController.updateBlessedTickets);
}
