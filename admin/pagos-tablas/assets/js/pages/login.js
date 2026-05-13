// assets/js/pages/login.js

import { loginRequest } from "../services/auth.service.js";
import { setToken } from "../utils/auth.js";

console.log("LOGIN.JS CARGADO");

const btn = document.getElementById("login-btn");

console.log("BOTON:", btn);

btn?.addEventListener("click", handleLogin);

document.getElementById("password")?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleLogin();
  }
});

async function handleLogin() {
  console.log("HANDLE LOGIN");

  const password = document.getElementById("password").value.trim();

  console.log("PASSWORD:", password);

  if (!password) {
    console.log("PASSWORD VACIO");

    Swal.fire({
      icon: "warning",
      title: "Campo requerido",
      text: "Ingrese la contraseña",
    });

    return;
  }

  try {
    console.log("ENVIANDO LOGIN");

    const data = await loginRequest(password);

    console.log("RESPUESTA LOGIN:", data);

    if (!data?.token) {
      throw new Error("Token no recibido");
    }

    setToken(data.token);

    console.log("TOKEN GUARDADO:", localStorage.getItem("admin_token"));

    location.reload();
  } catch (err) {
    console.error("ERROR LOGIN:", err);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message,
    });
  }
}
