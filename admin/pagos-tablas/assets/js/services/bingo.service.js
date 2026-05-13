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
