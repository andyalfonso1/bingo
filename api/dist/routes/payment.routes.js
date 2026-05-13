"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = paymentRoutes;
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
async function paymentRoutes(fastify) {
    fastify.get("/payments", { preHandler: auth_middleware_1.authMiddlewareAdmin }, payment_controller_1.paymentController.getAll);
    fastify.get("/payments/:id", { preHandler: auth_middleware_1.authMiddlewareAdmin }, payment_controller_1.paymentController.getById);
    fastify.get("/payments/top-ranking/:id", { preHandler: auth_middleware_1.authMiddlewareAdmin }, payment_controller_1.paymentController.getTopBuyersByRaffle);
    fastify.get("/payments/raffle/:id", { preHandler: auth_middleware_1.authMiddlewareAdmin }, payment_controller_1.paymentController.getByRaffleId);
    fastify.post("/payments", { preHandler: auth_middleware_1.authMiddleware }, payment_controller_1.paymentController.createPayment);
    fastify.put("/payments/:id/approve", { preHandler: auth_middleware_1.authMiddlewareAdmin }, payment_controller_1.paymentController.approvePayment);
    fastify.put("/payments/:id/reject", { preHandler: auth_middleware_1.authMiddlewareAdmin }, payment_controller_1.paymentController.rejectPayment);
    fastify.get('/api/bcv-rate', { preHandler: auth_middleware_1.authMiddleware }, payment_controller_1.getBCVRate);
}
