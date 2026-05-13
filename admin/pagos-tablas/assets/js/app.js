// assets/js/app.js

import { getToken, logout } from "./utils/auth.js";
import { initSidebar } from "./ui/sidebar.js";
import { initModal } from "./ui/modal.js";

//console.log("APP.JS CARGADO");

window.logout = logout;

window.addEventListener("DOMContentLoaded", () => {
  //console.log("DOMContentLoaded APP");

  initApp();
});

async function initApp() {
  //console.log("INIT APP");

  const token = getToken();

  //console.log("TOKEN:", token);

  if (!token) {
    //console.log("MOSTRANDO LOGIN");

    showLogin();

    //console.log("IMPORTANDO LOGIN");

    await import("./pages/login.js");

    //console.log("LOGIN IMPORTADO");

    return;
  }

  //console.log("MOSTRANDO PANEL");

  showPanel();

  try {
    const m = await import("./pages/admin-bingos.js");

    //console.log("MODULO BINGOS:", m);

    if (m.initBingos) {
      await m.initBingos();
    }
  } catch (err) {
    console.error("ERROR IMPORTANDO BINGOS:", err);
  }
}

function showLogin() {
  //console.log("SHOW LOGIN");

  document.getElementById("login-screen").classList.remove("hidden");

  document.getElementById("admin-panel").classList.add("hidden");
}

function showPanel() {
  //console.log("SHOW PANEL");

  document.getElementById("login-screen").classList.add("hidden");

  document.getElementById("admin-panel").classList.remove("hidden");

  document.getElementById("fab-button").classList.remove("hidden");

  initSidebar();

  initModal();

  bindLogout(); //
}

function bindLogout() {
  const logoutBtn = document.querySelector(".logout-btn");

  logoutBtn?.addEventListener("click", () => {
    logout();
  });
}
