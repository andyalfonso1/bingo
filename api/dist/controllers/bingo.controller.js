"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bingoController = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const stream_1 = require("stream");
const util_1 = require("util");
const bingo_service_1 = require("../services/bingo.service");
const pump = (0, util_1.promisify)(stream_1.pipeline);
exports.bingoController = {
    getAll: async (_req, reply) => {
        const bingos = await bingo_service_1.bingoService.getAll();
        if (!bingos || bingos.length === 0) {
            return reply.code(404).send({ message: "No se encontraron bingos." });
        }
        reply.send(bingos);
    },
    getById: async (req, reply) => {
        const id = Number(req.params.id);
        const bingo = await bingo_service_1.bingoService.getById(id);
        if (!bingo) {
            return reply.code(404).send({ message: "Bingo no encontrada." });
        }
        // if (bingo.tickets.length === 0) {
        //   return reply
        //     .code(400)
        //     .send({ message: "No hay tickets disponibles para esta bingo." });
        // }
        reply.send(bingo);
    },
    getProgressById: async (req, reply) => {
        const id = Number(req.params.id);
        const bingo = await bingo_service_1.bingoService.getSoldPercentageById(id);
        if (!bingo) {
            return reply.code(404).send({ message: "Bingo no encontrado." });
        }
        reply.send(bingo);
    },
    create: async (req, reply) => {
        const parts = req.parts();
        const data = {};
        let bannerTempPath = null;
        let bannerExtension = null;
        for await (const part of parts) {
            if (part.type === "file" && part.fieldname === "banner") {
                // Guardar archivo temporal
                bannerExtension = path_1.default.extname(part.filename);
                const tempName = `temp-${Date.now()}${bannerExtension}`;
                const tempPath = path_1.default.join(__dirname, "..", "..", "public", "uploads", "banners", tempName);
                await pump(part.file, fs_1.default.createWriteStream(tempPath));
                bannerTempPath = tempPath;
            }
            else if (part.type === "field") {
                data[part.fieldname] = part.value;
            }
        }
        const { name, description, maxTickets, maxTicketsBuy, price, isActive, isRandomized, isHidden, } = data;
        if (!name ||
            !description ||
            !maxTickets ||
            !maxTicketsBuy ||
            !price ||
            !bannerTempPath) {
            return reply.code(400).send({
                message: "Todos los campos son obligatorios, incluido el banner.",
            });
        }
        const maxTicketsNumber = Number(maxTickets);
        const maxTicketsBuyNumber = Number(maxTicketsBuy);
        const priceNumber = parseFloat(price);
        if (isNaN(maxTicketsNumber) ||
            maxTicketsNumber <= 0 ||
            isNaN(maxTicketsBuyNumber) ||
            maxTicketsBuyNumber <= 0 ||
            isNaN(priceNumber) ||
            priceNumber < 0) {
            return reply.code(400).send({ message: "Campos numéricos inválidos." });
        }
        try {
            // Creamos la bingo primero, sin el bannerUrl
            const bingo = await bingo_service_1.bingoService.create({
                name,
                description,
                maxTickets: maxTicketsNumber,
                maxTicketsBuy: maxTicketsBuyNumber,
                bannerUrl: "", // temporal
                price: priceNumber,
                isActive: isActive === "true",
                isRandomized: isRandomized === "true",
                isHidden: isHidden === "true",
            });
            // Renombrar banner con el ID de la bingo
            const finalFileName = `banner-${bingo.id}${bannerExtension}`;
            const finalPath = path_1.default.join(__dirname, "..", "..", "public", "uploads", "banners", finalFileName);
            fs_1.default.renameSync(bannerTempPath, finalPath);
            // Construir URL pública
            const bannerUrl = `/public/uploads/banners/${finalFileName}`;
            // Actualizar la bingo con la URL del banner
            const updatedBingo = await bingo_service_1.bingoService.updateBannerUrl(bingo.id, bannerUrl);
            reply.code(201).send({
                message: "Bingo creado exitosamente.",
                bingo: updatedBingo,
            });
        }
        catch (error) {
            console.error("Error creando bingo:", error);
            return reply
                .code(500)
                .send({ message: "Internal server error", error: error.message });
        }
    },
    update: async (req, reply) => {
        const id = Number(req.params.id);
        // Validar que la bingo exista
        const existingBingo = await bingo_service_1.bingoService.getById(id);
        if (!existingBingo) {
            return reply.code(404).send({ message: "Bingo no encontrada." });
        }
        const parts = req.parts();
        const data = {};
        let bannerTempPath = null;
        let bannerExtension = null;
        for await (const part of parts) {
            if (part.type === "file" && part.fieldname === "banner") {
                bannerExtension = path_1.default.extname(part.filename);
                const tempName = `temp-${Date.now()}${bannerExtension}`;
                const tempPath = path_1.default.join(__dirname, "..", "..", "public", "uploads", "banners", tempName);
                await pump(part.file, fs_1.default.createWriteStream(tempPath));
                bannerTempPath = tempPath;
            }
            else if (part.type === "field") {
                data[part.fieldname] = part.value;
            }
        }
        const { name, description, maxTicketsBuy, price, isActive, isRandomized, isHidden, } = data;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (description)
            updateData.description = description;
        if (maxTicketsBuy) {
            const maxTicketsBuyNumber = Number(maxTicketsBuy);
            if (isNaN(maxTicketsBuyNumber) || maxTicketsBuyNumber <= 0) {
                return reply.code(400).send({
                    message: "El campo 'maxTicketsBuy' debe ser un número positivo.",
                });
            }
            updateData.maxTicketsBuy = maxTicketsBuyNumber;
        }
        if (typeof price !== "undefined") {
            const priceNumber = Number(price);
            if (isNaN(priceNumber) || priceNumber < 0) {
                return reply.code(400).send({
                    message: "El campo 'price' debe ser un número válido.",
                });
            }
            updateData.price = priceNumber;
        }
        if (typeof isActive !== "undefined")
            updateData.isActive = isActive === "true" || isActive === true;
        if (typeof isRandomized !== "undefined")
            updateData.isRandomized =
                isRandomized === "true" || isRandomized === true;
        if (typeof isHidden !== "undefined")
            updateData.isHidden = isHidden === "true" || isHidden === true;
        try {
            if (bannerTempPath && bannerExtension) {
                const finalFileName = `banner-${id}${bannerExtension}`;
                const finalPath = path_1.default.join(__dirname, "..", "..", "public", "uploads", "banners", finalFileName);
                // Eliminar banner antiguo si existe
                if (existingBingo.bannerUrl) {
                    const oldPath = path_1.default.join(__dirname, "..", "..", "public", existingBingo.bannerUrl.replace("/public/", ""));
                    if (fs_1.default.existsSync(oldPath)) {
                        fs_1.default.unlinkSync(oldPath);
                    }
                }
                fs_1.default.renameSync(bannerTempPath, finalPath);
                const bannerUrl = `/public/uploads/banners/${finalFileName}`;
                // Actualizar bingo con datos + bannerUrl
                const updatedBingo = await bingo_service_1.bingoService.update(id, {
                    ...updateData,
                    bannerUrl,
                });
                return reply.send({
                    message: "Bingo actualizada correctamente.",
                    bingo: updatedBingo,
                });
            }
            // Si no hay banner nuevo, solo actualizar datos
            const bingo = await bingo_service_1.bingoService.update(id, updateData);
            return reply.send({
                message: "Bingo actualizada correctamente.",
                bingo,
            });
        }
        catch (error) {
            console.error("Error updating bingo:", error);
            return reply.code(500).send({
                message: "Internal server error",
                error: error.message,
            });
        }
    },
};
