// assets/js/app.js
/*import { logout } from "./utils/auth.js";
import { initSidebar } from "./ui/sidebar.js";
import { initModal } from "./ui/modal.js";

console.log("APP JS CARGADO");

window.logout = logout;

initApp();

async function initApp() {
  console.log("INIT APP");

  initSidebar();

  console.log("SIDEBAR INICIADO");

  initModal();

  console.log("MODAL INICIADO");

  bindLogout();

  try {
    console.log("IMPORTANDO ADMIN BINGOS");

    const module = await import("./pages/admin-bingos.js");

    console.log("MODULE:", module);

    if (module.initBingos) {
      console.log("EJECUTANDO initBingos");

      await module.initBingos();
    } else {
      console.error("initBingos no existe");
    }
  } catch (error) {
    console.error("Error cargando bingo page:", error);
  }
}

function bindLogout() {
  const logoutBtn = document.querySelector(".logout-btn");

  logoutBtn?.addEventListener("click", () => {
    logout();
  });
}*/

import { logout } from "./utils/auth.js";
import { initSidebar } from "./ui/sidebar.js";
import { initModal } from "./ui/modal.js";

window.logout = logout;

/*export async function initApp(pageModule, initFunctionName) {
  initSidebar();

  initModal();

  bindLogout();

  try {
    const module = await import(pageModule);

    if (module[initFunctionName]) {
      await module[initFunctionName]();
    } else {
      console.error(`${initFunctionName} no existe`);
    }
  } catch (error) {
    console.error("Error cargando módulo:", error);
  }
}*/

export async function initApp(pageModule, initFunctionName) {
  initSidebar();

  bindLogout();

  // SOLO SI EXISTE MODAL
  const modal = document.getElementById("modal");

  if (modal) {
    initModal();
  }

  try {
    const module = await import(pageModule);

    if (module[initFunctionName]) {
      await module[initFunctionName]();
    } else {
      console.error(`${initFunctionName} no existe`);
    }
  } catch (error) {
    console.error("Error cargando módulo:", error);
  }
}

function bindLogout() {
  const logoutBtn = document.querySelector(".logout-btn");

  logoutBtn?.addEventListener("click", () => {
    logout();
  });
}
