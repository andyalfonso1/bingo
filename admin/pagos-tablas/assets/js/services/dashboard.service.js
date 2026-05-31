import { API_URL } from "../config/api.js";

export async function getDashboardStats() {
  console.log("📡 llamando API dashboard");

  const response = await fetch(`${API_URL}/api/dashboard/stats`);

  console.log("status:", response.status);

  const data = await response.json();

  console.log("data:", data);

  if (!response.ok) {
    throw new Error(data.message || "Error obteniendo estadísticas");
  }

  return data;
}
