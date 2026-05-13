"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = exports.getBCVRate = void 0;
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const stream_1 = require("stream");
const util_1 = require("util");
const node_fetch_1 = __importDefault(require("node-fetch"));
const payment_service_1 = require("../services/payment.service");
const pump = (0, util_1.promisify)(stream_1.pipeline);
const getBCVRate = async (_req, reply) => {
    try {
        const rate = await fetchBCVRate();
        reply.send({ rate });
    }
    catch (error) {
        reply.code(500).send({
            message: typeof error === "object" && error !== null && "message" in error
                ? error.message
                : "Error interno del servidor",
        });
    }
};
exports.getBCVRate = getBCVRate;
const fetchBCVRate = async () => {
    try {
        const res = await (0, node_fetch_1.default)("https://ve.dolarapi.com/v1/dolares/oficial");
        if (!res.ok)
            throw new Error(`API caído o fuera de servicio: ${res.status}`);
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('API no responde JSON');
        }
        const json = await res.json();
        if (typeof json.promedio !== "number") {
            throw new Error("No se encuentra la tasa promedio en la respuesta");
        }
        return json.promedio;
    }
    catch (error) {
        console.warn('Fallo al obtener tasa BCV, usando valor por defecto');
        return 169.9761; // Valor por defecto temporal
    }
};
exports.paymentController = {
    getAll: async (_req, reply) => {
        const payments = await payment_service_1.paymentService.getAll();
        if (!payments || payments.length === 0) {
            return reply.code(404).send({ message: "No se encontraron pagos." });
        }
        reply.send(payments);
    },
    getById: async (req, reply) => {
        const id = Number(req.params.id);
        const payment = await payment_service_1.paymentService.getById(id);
        if (!payment)
            return reply.code(404).send({ message: "Pago no encontrado." });
        reply.send(payment);
    },
    getByRaffleId: async (req, reply) => {
        const id = Number(req.params.id);
        const payment = await payment_service_1.paymentService.getByRaffleId(id);
        if (!payment)
            return reply.code(404).send({ message: "Pagos no encontrados." });
        reply.send(payment);
    },
    getTopBuyersByRaffle: async (req, reply) => {
        const id = Number(req.params.id);
        const payment = await payment_service_1.paymentService.getTopBuyersByRaffle(id);
        if (!payment)
            return reply.code(404).send({ message: "Usuarios no encontrados." });
        reply.send(payment);
    },
    createPayment: async (req, reply) => {
        if (!req.isMultipart()) {
            return reply
                .status(400)
                .send({ message: "Debe ser multipart/form-data" });
        }
        const fields = {};
        const savedBuffers = [];
        try {
            const parts = req.parts();
            const uploadDir = path_1.default.join(__dirname, "..", "..", "public", "uploads", "payments");
            if (!fs_1.default.existsSync(uploadDir)) {
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            }
            const allowedMimeTypes = new Set([
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
                "image/webp",
                "image/heic",
                "image/heif",
                "image/bmp",
                "image/tiff",
                "application/pdf",
            ]);
            for await (const part of parts) {
                if (part.type === "file" && part.fieldname === "proofUrls") {
                    if (!allowedMimeTypes.has(part.mimetype)) {
                        await pump(part.file, fs_1.default.createWriteStream("/dev/null"));
                        return reply.status(400).send({ message: "Formato no permitido." });
                    }
                    const chunks = [];
                    for await (const chunk of part.file) {
                        chunks.push(chunk);
                    }
                    const buffer = Buffer.concat(chunks);
                    const maxSize = 5 * 1024 * 1024; // 5MB
                    if (buffer.length > maxSize) {
                        return reply
                            .status(400)
                            .send({ message: "Archivo demasiado grande (máximo 5MB)." });
                    }
                    savedBuffers.push({ buffer, mimetype: part.mimetype });
                }
                else if (part.type === "field") {
                    fields[part.fieldname] = part.value;
                }
                else if (part.type === "file") {
                    await pump(part.file, fs_1.default.createWriteStream("/dev/null"));
                }
            }
            // Validaciones
            const { method, reference, userId, raffleId, ticketIds, quantity } = fields;
            if (!method || !reference || !userId) {
                return reply
                    .status(400)
                    .send({ message: "Faltan campos obligatorios." });
            }
            if (savedBuffers.length < 1 || savedBuffers.length > 2) {
                return reply
                    .status(400)
                    .send({ message: "Debes subir entre 1 y 2 comprobantes." });
            }
            const ticketIdsParsed = ticketIds ? JSON.parse(ticketIds) : undefined;
            const quantityNumber = quantity ? Number(quantity) : undefined;
            if ((!ticketIdsParsed || ticketIdsParsed.length === 0) &&
                (!quantityNumber || quantityNumber <= 0)) {
                return reply
                    .status(400)
                    .send({ message: "Debes enviar tickets o cantidad." });
            }
            const isVES = method.includes("Pago móvil");
            const currency = isVES ? "VES" : "USD";
            const rate = isVES ? 1 : await fetchBCVRate();
            // Crear pago
            const payment = await payment_service_1.paymentService.createPaymentAndReserveTickets({
                proofUrls: [],
                method,
                currency,
                rate,
                reference,
                userId: Number(userId),
                raffleId: raffleId ? Number(raffleId) : undefined,
                ticketIds: ticketIdsParsed,
                quantity: quantityNumber,
            });
            // Guardar archivos
            const finalUrls = [];
            for (const { buffer, mimetype } of savedBuffers) {
                const randomHash = Math.random().toString(36).substring(2, 8);
                let finalFileName;
                let finalPath;
                if (mimetype.startsWith("image/") && mimetype !== "image/gif") {
                    finalFileName = `payment_${payment.id}_${randomHash}.webp`;
                    finalPath = path_1.default.join(uploadDir, finalFileName);
                    await (0, sharp_1.default)(buffer)
                        .resize({ width: 1200 })
                        .toFormat("webp", { quality: 80 })
                        .toFile(finalPath);
                }
                else {
                    // PDF o GIF
                    const ext = mimetype === "application/pdf" ? ".pdf" : ".gif";
                    finalFileName = `payment_${payment.id}_${randomHash}${ext}`;
                    finalPath = path_1.default.join(uploadDir, finalFileName);
                    fs_1.default.writeFileSync(finalPath, buffer);
                }
                finalUrls.push(`/uploads/payments/${finalFileName}`);
            }
            // Actualizar
            const updatedPayment = await payment_service_1.paymentService.updateProofUrls(payment.id, finalUrls);
            reply.status(201).send({
                payment: updatedPayment,
                message: "Pago creado con éxito y comprobantes guardados.",
            });
        }
        catch (error) {
            console.error(error);
            reply
                .status(500)
                .send({ message: error.message || "Error interno del servidor" });
        }
    },
    approvePayment: async (req, reply) => {
        try {
            const paymentId = Number(req.params.id);
            const payment = await payment_service_1.paymentService.approvePaymentAndSellTickets(paymentId);
            reply.send({
                payment,
                message: "Pago aprobado y tickets vendidos.",
            });
        }
        catch (error) {
            reply.status(500).send({ message: error.message || "Error interno" });
        }
    },
    rejectPayment: async (req, reply) => {
        try {
            const paymentId = Number(req.params.id);
            const payment = await payment_service_1.paymentService.rejectPaymentAndReleaseTickets(paymentId);
            reply.send({
                payment,
                message: "Pago rechazado y tickets liberados.",
            });
        }
        catch (error) {
            reply.status(500).send({ message: error.message || "Error interno" });
        }
    },
};
