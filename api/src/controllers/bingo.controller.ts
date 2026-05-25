import { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";
import { bingoService } from "../services/bingo.service";

const pump = promisify(pipeline);

export const bingoController = {
  getAll: async (_req: FastifyRequest, reply: FastifyReply) => {
    const bingos = await bingoService.getAll();

    if (!bingos || bingos.length === 0) {
      return reply.code(404).send({ message: "No se encontraron bingos." });
    }

    reply.send(bingos);
  },

  getPayments: async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const payments = await bingoService.getPayments();

      return reply.send(payments);
    } catch (error) {
      console.error(error);

      return reply.code(500).send({
        message: "Error obteniendo pagos de bingo",
      });
    }
  },

  approvePayment: async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      const paymentId = Number(req.params.id);

      const payment = await bingoService.approvePayment(paymentId);

      return reply.send({
        message: "Pago aprobado correctamente.",
        payment,
      });
    } catch (error: any) {
      //console.error(error);
      console.log("ERROR:", error.message);

      return reply.code(400).send({
        message: error.message,
      });
    }
  },

  rejectPayment: async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      const paymentId = Number(req.params.id);

      const payment = await bingoService.rejectPayment(paymentId);

      return reply.send({
        message: "Pago rechazado correctamente.",
        payment,
      });
    } catch (error: any) {
      console.error(error);

      return reply.code(400).send({
        message: error.message,
      });
    }
  },

  /*uploadTicketImage: async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const ticketId = Number(req.params.id);

    const data = await req.file();

    if (!data) {
      return reply.code(400).send({
        message: "Imagen requerida.",
      });
    }

    // =========================
    // VALIDAR EXTENSIÓN
    // =========================

    const extension = path.extname(data.filename);

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    if (!allowedExtensions.includes(extension)) {
      return reply.code(400).send({
        message: "Formato inválido.",
      });
    }

    // =========================
    // NOMBRE FINAL
    // =========================

    const finalFileName = `ticket-${ticketId}${extension}`;

    const finalPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "uploads",
      "tickets",
      finalFileName,
    );

    // =========================
    // GUARDAR
    // =========================

    await pump(data.file, fs.createWriteStream(finalPath));

    const imgTicket = `/public/uploads/tickets/${finalFileName}`;

    // =========================
    // ACTUALIZAR DB
    // =========================

    const ticket = await bingoService.updateTicketImage(ticketId, imgTicket);

    return reply.send({
      message: "Imagen subida correctamente.",
      ticket,
    });
  },*/

  uploadTicketImage: async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const ticketId = Number(req.params.id);

    console.log("UPLOAD TICKET IMAGE");
    console.log("ticketId:", ticketId);

    const data = await req.file();

    console.log("DATA:", data);

    if (!data) {
      return reply.code(400).send({
        message: "Imagen requerida.",
      });
    }

    console.log("FILENAME:", data.filename);
    console.log("MIMETYPE:", data.mimetype);

    // =========================
    // VALIDAR EXTENSIÓN
    // =========================

    const extension = path.extname(data.filename);

    console.log("EXTENSION:", extension);

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    if (!allowedExtensions.includes(extension)) {
      return reply.code(400).send({
        message: "Formato inválido.",
      });
    }

    // =========================
    // NOMBRE FINAL
    // =========================

    const finalFileName = `ticket-${ticketId}${extension}`;

    const finalPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "uploads",
      "tickets",
      finalFileName,
    );

    console.log("FINAL PATH:", finalPath);

    // =========================
    // GUARDAR
    // =========================

    if (!fs.existsSync(path.dirname(finalPath))) {
      fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    }

    await pump(data.file, fs.createWriteStream(finalPath));

    const imgTicket = `/public/uploads/tickets/${finalFileName}`;

    console.log("IMG URL:", imgTicket);

    // =========================
    // ACTUALIZAR DB
    // =========================

    const ticket = await bingoService.updateTicketImage(ticketId, imgTicket);

    return reply.send({
      message: "Imagen subida correctamente.",
      ticket,
    });
  },

  getTicketsByBingoId: async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      const bingoId = Number(req.params.id);

      const tickets = await bingoService.getTicketsByBingoId(bingoId);

      return reply.send(tickets);
    } catch (error: any) {
      console.error(error);

      return reply.code(500).send({
        message: error.message,
      });
    }
  },

  getById: async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const id = Number(req.params.id);
    const bingo = await bingoService.getById(id);

    if (!bingo) {
      return reply.code(404).send({ message: "Bingo no encontrado." });
    }

    // if (bingo.tickets.length === 0) {
    //   return reply
    //     .code(400)
    //     .send({ message: "No hay tickets disponibles para esta bingo." });
    // }

    reply.send(bingo);
  },

  getProgressById: async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const id = Number(req.params.id);
    const bingo = await bingoService.getSoldPercentageById(id);

    if (!bingo) {
      return reply.code(404).send({ message: "Bingo no encontrado." });
    }

    reply.send(bingo);
  },

  create: async (req: FastifyRequest, reply: FastifyReply) => {
    const parts = req.parts();

    const data: any = {};

    let bannerTempPath: string | null = null;
    let bannerExtension: string | null = null;

    try {
      for await (const part of parts) {
        // =========================
        // FILE
        // =========================

        if (part.type === "file" && part.fieldname === "banner") {
          console.log("📁 Archivo recibido:");

          console.log("fieldname:", part.fieldname);
          console.log("filename:", part.filename);
          console.log("mimetype:", part.mimetype);

          // VALIDAR MIME TYPE

          const allowedMimeTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
          ];

          if (!allowedMimeTypes.includes(part.mimetype)) {
            return reply.code(400).send({
              message: "Formato de imagen inválido. Solo JPG, PNG o WEBP.",
            });
          }

          // VALIDAR EXTENSIÓN

          bannerExtension = path.extname(part.filename).toLowerCase();

          const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

          if (!allowedExtensions.includes(bannerExtension)) {
            return reply.code(400).send({
              message: "Extensión de archivo inválida.",
            });
          }

          // VALIDAR TAMAÑO (5MB)

          const MAX_SIZE = 5 * 1024 * 1024;

          let totalSize = 0;

          const tempName = `temp-${Date.now()}${bannerExtension}`;

          const tempPath = path.join(
            __dirname,
            "..",
            "..",
            "public",
            "uploads",
            "banners",
            tempName,
          );

          const writeStream = fs.createWriteStream(tempPath);

          for await (const chunk of part.file) {
            totalSize += chunk.length;

            if (totalSize > MAX_SIZE) {
              writeStream.destroy();

              fs.unlink(tempPath, () => {});

              return reply.code(400).send({
                message: "La imagen excede el tamaño permitido (5MB).",
              });
            }

            writeStream.write(chunk);
          }

          writeStream.end();

          bannerTempPath = tempPath;
        }

        // =========================
        // FIELDS
        // =========================
        else if (part.type === "field") {
          data[part.fieldname] =
            typeof part.value === "string" ? part.value.trim() : part.value;
        }
      }

      console.log("📦 DATA FINAL:");
      console.log(data);

      const {
        name,
        description,
        maxTickets,
        maxTicketsBuy,
        price,
        isActive,
        isRandomized,
        isHidden,
      } = data;

      // =========================
      // REQUIRED
      // =========================

      if (!name || !description || !maxTickets || !maxTicketsBuy || !price) {
        if (bannerTempPath && fs.existsSync(bannerTempPath)) {
          fs.unlinkSync(bannerTempPath);
        }

        return reply.code(400).send({
          message: "Todos los campos son obligatorios.",
        });
      }

      // =========================
      // STRING VALIDATIONS
      // =========================

      if (name.length < 3 || name.length > 120) {
        return reply.code(400).send({
          message: "El nombre debe tener entre 3 y 120 caracteres.",
        });
      }

      if (description.length < 5 || description.length > 500) {
        return reply.code(400).send({
          message: "La descripción debe tener entre 5 y 500 caracteres.",
        });
      }

      // =========================
      // NUMBERS
      // =========================

      const maxTicketsNumber = Number(maxTickets);

      const maxTicketsBuyNumber = Number(maxTicketsBuy);

      const priceNumber = Number(price);

      if (Number.isNaN(maxTicketsNumber) || maxTicketsNumber <= 0) {
        return reply.code(400).send({
          message: "Total de tickets inválido.",
        });
      }

      if (Number.isNaN(maxTicketsBuyNumber) || maxTicketsBuyNumber <= 0) {
        return reply.code(400).send({
          message: "Máximo por usuario inválido.",
        });
      }

      if (Number.isNaN(priceNumber) || priceNumber <= 0) {
        return reply.code(400).send({
          message: "Precio inválido.",
        });
      }

      // =========================
      // VALIDACIÓN LÓGICA
      // =========================

      if (maxTicketsBuyNumber > maxTicketsNumber) {
        return reply.code(400).send({
          message:
            "El máximo por usuario no puede ser mayor al total de tickets.",
        });
      }

      // =========================
      // BANNER REQUIRED
      // =========================

      if (!bannerTempPath) {
        return reply.code(400).send({
          message: "El banner es obligatorio.",
        });
      }

      // =========================
      // CREATE
      // =========================

      const bingo = await bingoService.create({
        name,
        description,
        maxTickets: maxTicketsNumber,
        maxTicketsBuy: maxTicketsBuyNumber,
        bannerUrl: "",
        price: priceNumber,
        isActive: isActive === "true",
        isRandomized: isRandomized === "true",
        isHidden: isHidden === "true",
      });

      // =========================
      // RENAME IMAGE
      // =========================

      const finalFileName = `banner-${bingo.id}${bannerExtension}`;

      const finalPath = path.join(
        __dirname,
        "..",
        "..",
        "public",
        "uploads",
        "banners",
        finalFileName,
      );

      fs.renameSync(bannerTempPath, finalPath);

      const bannerUrl = `/public/uploads/banners/${finalFileName}`;

      // =========================
      // UPDATE
      // =========================

      const updatedBingo = await bingoService.update(bingo.id, {
        bannerUrl,
      });

      return reply.code(201).send({
        message: "Bingo creado exitosamente.",
        bingo: updatedBingo,
      });
    } catch (error: any) {
      console.error("Error creando bingo:", error);

      // ELIMINAR TEMPORAL SI FALLA

      if (bannerTempPath && fs.existsSync(bannerTempPath)) {
        fs.unlinkSync(bannerTempPath);
      }

      return reply.code(500).send({
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  update: async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const id = Number(req.params.id);

    const existingBingo = await bingoService.getById(id);

    if (!existingBingo) {
      return reply.code(404).send({
        message: "Bingo no encontrado.",
      });
    }

    const parts = req.parts();

    const data: any = {};
    let bannerTempPath: string | null = null;
    let bannerExtension: string | null = null;

    for await (const part of parts) {
      if (part.type === "file" && part.fieldname === "banner") {
        bannerExtension = path.extname(part.filename);

        const tempName = `temp-${Date.now()}${bannerExtension}`;

        const tempPath = path.join(
          __dirname,
          "..",
          "..",
          "public",
          "uploads",
          "banners",
          tempName,
        );

        await pump(part.file, fs.createWriteStream(tempPath));

        bannerTempPath = tempPath;
      } else if (part.type === "field") {
        data[part.fieldname] = part.value;
      }
    }

    const updateData: any = {};

    // STRINGS
    if (data.name) updateData.name = data.name.trim();
    if (data.description) updateData.description = data.description.trim();

    // NUMBERS
    if (typeof data.price !== "undefined") {
      const price = Number(data.price);
      if (isNaN(price) || price < 0) {
        return reply.code(400).send({ message: "Precio inválido." });
      }
      updateData.price = price;
    }

    if (typeof data.maxTickets !== "undefined") {
      const maxTickets = Number(data.maxTickets);
      if (isNaN(maxTickets) || maxTickets <= 0) {
        return reply.code(400).send({ message: "maxTickets inválido." });
      }
      updateData.maxTickets = maxTickets;
    }

    if (typeof data.maxTicketsBuy !== "undefined") {
      const maxTicketsBuy = Number(data.maxTicketsBuy);
      if (isNaN(maxTicketsBuy) || maxTicketsBuy <= 0) {
        return reply.code(400).send({ message: "maxTicketsBuy inválido." });
      }
      updateData.maxTicketsBuy = maxTicketsBuy;
    }

    // BOOLEANS
    if (typeof data.isActive !== "undefined") {
      updateData.isActive = data.isActive === "true";
    }

    if (typeof data.isRandomized !== "undefined") {
      updateData.isRandomized = data.isRandomized === "true";
    }

    if (typeof data.isHidden !== "undefined") {
      updateData.isHidden = data.isHidden === "true";
    }

    try {
      // BANNER
      if (bannerTempPath && bannerExtension) {
        const finalFileName = `banner-${id}${bannerExtension}`;

        const finalPath = path.join(
          __dirname,
          "..",
          "..",
          "public",
          "uploads",
          "banners",
          finalFileName,
        );

        if (existingBingo.bannerUrl) {
          const oldPath = path.join(
            __dirname,
            "..",
            "..",
            "public",
            existingBingo.bannerUrl.replace("/public/", ""),
          );

          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        fs.renameSync(bannerTempPath, finalPath);

        updateData.bannerUrl = `/public/uploads/banners/${finalFileName}`;
      }

      const updatedBingo = await bingoService.update(id, updateData);

      return reply.send({
        message: "Bingo actualizado correctamente.",
        bingo: updatedBingo,
      });
    } catch (error: any) {
      console.error(error);

      return reply.code(500).send({
        message: error.message || "Internal server error",
      });
    }
  },
};
