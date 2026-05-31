import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import staticPlugin from "@fastify/static";
import path from "path";
import dotenv from "dotenv";
import jwt from "@fastify/jwt";

import { userRoutes } from "./routes/user.routes";
import { adminRoutes } from "./routes/admin.routes";
import { bingoRoutes } from "./routes/bingo.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
//import { paymentRoutes } from "./routes/payment.routes";
//import { ticketRoutes } from "./routes/ticket.routes";
//import { ticketBingoRoutes } from "./routes/ticketBingo.routes";

dotenv.config();

const app = Fastify();

// 👉 habilitar CORS
app.register(cors, {
  origin: "*",

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],
});

// Soporte para multipart/form-data
app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
});

// 👉 servir archivos estáticos desde la carpeta /public
app.register(staticPlugin, {
  root: path.join(__dirname, "..", "public"),
  prefix: "/public/",
});

app.register(jwt, {
  secret: process.env.JWT_SECRET_HASH as string,
});

// 👉 registrar rutas
app.register(userRoutes);
app.register(adminRoutes);
//app.register(paymentRoutes);
//app.register(ticketRoutes);
app.register(bingoRoutes);
// ✅ DASHBOARD
app.register(dashboardRoutes, {
  prefix: "/api/dashboard",
});
//app.register(ticketBingoRoutes);

// 👉 iniciar servidor
app.listen({ port: 9082, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Server running at ${address}`);
});
