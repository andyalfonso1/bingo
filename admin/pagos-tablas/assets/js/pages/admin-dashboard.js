console.log("🚀 DASHBOARD JS CARGADO");

import { getDashboardStats } from "../services/dashboard.service.js";

import { errorAlert } from "../utils/alerts.js";

export async function initDashboard() {
  console.log("📊 initDashboard ejecutado");
  await loadStats();
}

async function loadStats() {
  try {
    const stats = await getDashboardStats();

    renderStats(stats);
  } catch (error) {
    console.error(error);

    await errorAlert("Error", "No se pudieron cargar las estadísticas");
  }
}

function renderStats(stats) {
  setText("total-bingos", stats.totalBingos);

  setText("active-bingos", stats.activeBingos);

  setText("total-payments", stats.totalPayments);

  setText("pending-payments", stats.pendingPayments);

  setText("approved-payments", stats.approvedPayments);

  setText("sold-tickets", stats.soldTickets);

  setText("total-revenue", `$${Number(stats.totalRevenue).toFixed(2)}`);
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (!element) return;

  element.textContent = value;
}
