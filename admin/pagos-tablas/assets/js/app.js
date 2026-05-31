// assets/js/app.js

import { logout } from "./utils/auth.js";
import { initSidebar } from "./ui/sidebar.js";
import { initModal } from "./ui/modal.js";

window.logout = logout;

export async function initApp(pageModule, initFunctionName) {
  console.log(initFunctionName);

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
  document.addEventListener("click", (e) => {
    if (e.target.closest(".logout-btn")) {
      logout();
    }
  });
}
