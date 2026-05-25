// assets/js/components/admin-sidebar.js

export function renderAdminSidebar(activePage = "") {
  return `
    <aside class="sidebar">
      <h2>🎯 Bingo Admin</h2>

      <nav>
        <a 
          href="./admin-dashboard.html"
          class="${activePage === "dashboard" ? "active" : ""}"
        >
          📊 Dashboard
        </a>

        <a 
          href="./admin-bingos.html"
          class="${activePage === "bingos" ? "active" : ""}"
        >
          🎰 Bingos
        </a>

        <a 
          href="./admin-bingo-tickets.html"
          class="${activePage === "tickets" ? "active" : ""}"
        >
          🎟️ Tickets
        </a>

        <a 
          href="./admin-bingos-payments.html"
          class="${activePage === "payments" ? "active" : ""}"
        >
          💳 Pagos
        </a>

        <a 
          href="./admin-prizes.html"
          class="${activePage === "prizes" ? "active" : ""}"
        >
          🏆 Premios
        </a>
      </nav>

      <button class="logout-btn">
        Cerrar sesión
      </button>
    </aside>
  `;
}
