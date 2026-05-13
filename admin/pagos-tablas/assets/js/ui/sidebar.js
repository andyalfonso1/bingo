// assets/js/ui/sidebar.js

export function initSidebar() {
  //console.log("Sidebar inicializado");

  const btn = document.querySelector(".menu-toggle");
  const overlay = document.getElementById("sidebar-overlay");

  if (!btn) {
    //console.warn("menu-toggle no encontrado");
    return;
  }

  btn.addEventListener("click", toggleSidebar);

  overlay?.addEventListener("click", closeSidebar);
}

function toggleSidebar() {
  //console.log("TOGGLE SIDEBAR");

  document.querySelector(".sidebar")?.classList.toggle("active");

  document.querySelector(".content").classList.toggle("shifted");

  document.getElementById("sidebar-overlay")?.classList.toggle("active");
}

function closeSidebar() {
  //console.log("CLOSE SIDEBAR");

  document.querySelector(".sidebar")?.classList.remove("active");

  document.querySelector(".content").classList.remove("shifted");

  document.getElementById("sidebar-overlay")?.classList.remove("active");
}
