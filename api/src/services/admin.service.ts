import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const adminService = {
  login: async (fastify: any, password: string) => {
    if (!password) {
      throw new Error("PASSWORD_REQUIRED");
    }

    // 🔐 comparar con hash
    const isMatch = await bcrypt.compare(
      password,
      process.env.ADMIN_PASSWORD_HASH as string,
    );

    if (!isMatch) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const token = fastify.jwt.sign(
      {
        id: 1,
        role: "admin",
      },
      {
        expiresIn: "1h", // 👈 clave
      },
    );

    return { token };
  },
};
