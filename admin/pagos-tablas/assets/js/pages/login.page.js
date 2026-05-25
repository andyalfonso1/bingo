// assets/js/pages/login.page.js

import { API_URL } from "../config/api.js";
import { setToken, isAuthenticated } from "../utils/auth.js";

if (isAuthenticated()) {
  window.location.href = "./admin-bingos.html";
}

const form = document.getElementById("login-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = document.getElementById("password").value.trim();

  if (!password) {
    Swal.fire({
      icon: "warning",
      title: "Campo requerido",
      text: "Ingrese la contraseña",
    });

    return;
  }

  try {
    Swal.fire({
      title: "Iniciando sesión...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const response = await fetch(`${API_URL}/admin/login`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error iniciando sesión");
    }

    if (!data.token) {
      throw new Error("Token no recibido");
    }

    setToken(data.token);

    await Swal.fire({
      icon: "success",
      title: "Bienvenido",
      timer: 1200,
      showConfirmButton: false,
    });

    window.location.href = "./admin-bingos.html";
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "Error iniciando sesión",
    });
  }
});
