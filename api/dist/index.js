"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_routes_1 = require("./routes/user.routes");
const raffle_routes_1 = require("./routes/raffle.routes");
const bingo_routes_1 = require("./routes/bingo.routes");
const payment_routes_1 = require("./routes/payment.routes");
const ticket_routes_1 = require("./routes/ticket.routes");
const ticketBingo_routes_1 = require("./routes/ticketBingo.routes");
dotenv_1.default.config();
const app = (0, fastify_1.default)();
// 👉 habilitar CORS
app.register(cors_1.default, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT'],
});
// Soporte para multipart/form-data
app.register(multipart_1.default, {
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB max
    },
});
// 👉 servir archivos estáticos desde la carpeta /public
app.register(static_1.default, {
    root: path_1.default.join(__dirname, '..', 'public'),
    prefix: '/public/',
});
// 👉 registrar rutas
app.register(user_routes_1.userRoutes);
app.register(raffle_routes_1.raffleRoutes);
app.register(payment_routes_1.paymentRoutes);
app.register(ticket_routes_1.ticketRoutes);
app.register(bingo_routes_1.bingoRoutes);
app.register(ticketBingo_routes_1.ticketBingoRoutes);
// 👉 iniciar servidor
app.listen({ port: 9081, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`🚀 Server running at ${address}`);
});
