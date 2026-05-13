// assets/js/services/auth.service.js

import { ADMIN_LOGIN_URL } from "../config/api.js";

export async function loginRequest(password) {
  const res = await fetch(ADMIN_LOGIN_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      password,
    }),
  });

  const data = await res.json();

  // 👇 AQUÍ
  console.log("TOKEN GUARDADO:", data.token);
  console.log("LOCALSTORAGE (antes):", localStorage.getItem("admin_token"));

  if (!res.ok) {
    throw new Error(data.message || "Credenciales inválidas");
  }

  return data;
}
