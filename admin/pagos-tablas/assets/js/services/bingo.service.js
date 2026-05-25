// assets/js/services/bingo.service.js

import { API_URL, BINGOS_URL } from "../config/api.js";

import { apiFetch } from "../utils/fetch.js";

export async function getBingos() {
  const res = await apiFetch(BINGOS_URL);

  return await res.json();
}

export async function createBingo(formData) {
  const response = await apiFetch(`${API_URL}/bingos`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Error creando bingo");
  }

  return response.json();
}

export async function updateBingo(id, formData) {
  const response = await apiFetch(`${API_URL}/bingos/${id}`, {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Error actualizando bingo");
  }

  return response.json();
}

export async function deleteBingo(id) {
  const response = await apiFetch(`${API_URL}/bingos/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Error eliminando bingo");
  }

  return response.json();
}

/*export async function deleteBingoRequest(id) {
  const res = await apiFetch(`${BINGOS_URL}/${id}`, {
    method: "DELETE",
  });

  return await res.json();
}*/

/* =========================
   BINGO PAYMENTS
========================= */

export async function getBingoPayments() {
  const response = await apiFetch(`${API_URL}/bingos/payments`);

  if (!response.ok) {
    throw new Error("Error obteniendo pagos");
  }

  return response.json();
}

export async function approveBingoPayment(id) {
  const response = await apiFetch(`${API_URL}/bingos/payments/${id}/approve`, {
    method: "PATCH",
  });

  /*if (!response.ok) {
    throw new Error("Error aprobando pago");
  }

  return response.json();*/

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error aprobando pago");
  }

  return data;
}

export async function rejectBingoPayment(id) {
  const response = await apiFetch(`${API_URL}/bingos/payments/${id}/reject`, {
    method: "PATCH",
  });

  /*if (!response.ok) {
    throw new Error("Error rechazando pago");
  }

  return response.json();*/

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error rechazando pago");
  }

  return data;
}

/* =========================
   TICKETS
========================= */

export async function getBingoTickets(id) {
  const response = await apiFetch(`${API_URL}/bingos/${id}/tickets`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error obteniendo tickets");
  }

  return data;
}

export async function uploadTicketImage(id, formData) {
  const response = await apiFetch(`${API_URL}/bingos/tickets/${id}/image`, {
    method: "PATCH",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error subiendo imagen");
  }

  return data;
}
