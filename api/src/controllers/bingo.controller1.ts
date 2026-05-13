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

    for await (const part of parts) {
      if (part.type === "file" && part.fieldname === "banner") {
        console.log("📁 Archivo recibido:");
        console.log("fieldname:", part.fieldname);
        console.log("filename:", part.filename);
        console.log("mimetype:", part.mimetype);

        // Guardar archivo temporal
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

    if (
      !name ||
      !description ||
      !maxTickets ||
      !maxTicketsBuy ||
      !price ||
      !bannerTempPath
    ) {
      return reply.code(400).send({
        message: "Todos los campos son obligatorios, incluido el banner.",
      });
    }

    const maxTicketsNumber = Number(maxTickets);
    const maxTicketsBuyNumber = Number(maxTicketsBuy);
    const priceNumber = parseFloat(price);

    if (
      isNaN(maxTicketsNumber) ||
      maxTicketsNumber <= 0 ||
      isNaN(maxTicketsBuyNumber) ||
      maxTicketsBuyNumber <= 0 ||
      isNaN(priceNumber) ||
      priceNumber < 0
    ) {
      return reply.code(400).send({ message: "Campos numéricos inválidos." });
    }

    try {
      // Creamos la bingo primero, sin el bannerUrl
      const bingo = await bingoService.create({
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

      // Construir URL pública
      const bannerUrl = `/public/uploads/banners/${finalFileName}`;

      // Actualizar la bingo con la URL del banner
      const updatedBingo = await bingoService.updateBannerUrl(
        bingo.id,
        bannerUrl,
      );

      reply.code(201).send({
        message: "Bingo creado exitosamente.",
        bingo: updatedBingo,
      });
    } catch (error: any) {
      console.error("Error creando bingo:", error);
      return reply
        .code(500)
        .send({ message: "Internal server error", error: error.message });
    }
  },

  /*update: async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    const id = Number(req.params.id);

    // Validar que la bingo exista
    const existingBingo = await bingoService.getById(id);
    if (!existingBingo) {
      return reply.code(404).send({ message: "Bingo no encontrada." });
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

    const {
      name,
      description,
      maxTicketsBuy,
      price,
      isActive,
      isRandomized,
      isHidden,
    } = data;

    const updateData: any = {};

    if (name) updateData.name = name;
    if (description) updateData.description = description;

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
        const finalPath = path.join(
          __dirname,
          "..",
          "..",
          "public",
          "uploads",
          "banners",
          finalFileName,
        );

        // Eliminar banner antiguo si existe
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
        const bannerUrl = `/public/uploads/banners/${finalFileName}`;

        // Actualizar bingo con datos + bannerUrl
        const updatedBingo = await bingoService.update(id, {
          ...updateData,
          bannerUrl,
        });

        return reply.send({
          message: "Bingo actualizada correctamente.",
          bingo: updatedBingo,
        });
      }

      // Si no hay banner nuevo, solo actualizar datos
      const bingo = await bingoService.update(id, updateData);
      return reply.send({
        message: "Bingo actualizada correctamente.",
        bingo,
      });
    } catch (error: any) {
      console.error("Error updating bingo:", error);
      return reply.code(500).send({
        message: "Internal server error",
        error: error.message,
      });
    }
  },*/

  /*update: async (
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

    if (data.name) {
      updateData.name = data.name.trim();
    }

    if (data.description) {
      updateData.description = data.description.trim();
    }

    // NUMBERS

    if (typeof data.price !== "undefined") {
      const price = Number(data.price);

      if (isNaN(price) || price < 0) {
        return reply.code(400).send({
          message: "Precio inválido.",
        });
      }

      updateData.price = price;
    }

    if (typeof data.maxTickets !== "undefined") {
      const maxTickets = Number(data.maxTickets);

      if (isNaN(maxTickets) || maxTickets <= 0) {
        return reply.code(400).send({
          message: "maxTickets inválido.",
        });
      }

      updateData.maxTickets = maxTickets;
    }

    if (typeof data.maxTicketsBuy !== "undefined") {
      const maxTicketsBuy = Number(data.maxTicketsBuy);

      if (isNaN(maxTicketsBuy) || maxTicketsBuy <= 0) {
        return reply.code(400).send({
          message: "maxTicketsBuy inválido.",
        });
      }

      updateData.maxTicketsBuy = maxTicketsBuy;
    }

    // BOOLEANS

    if (typeof data.isActive !== "undefined") {
      updateData.isActive = data.isActive === "true" || data.isActive === true;
    }

    if (typeof data.isRandomized !== "undefined") {
      updateData.isRandomized =
        data.isRandomized === "true" || data.isRandomized === true;
    }

    if (typeof data.isHidden !== "undefined") {
      updateData.isHidden = data.isHidden === "true" || data.isHidden === true;
    }

    try {
      // MANEJO DEL BANNER

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

        // ELIMINAR ANTERIOR

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

      // SERVICE

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
  },*/

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
