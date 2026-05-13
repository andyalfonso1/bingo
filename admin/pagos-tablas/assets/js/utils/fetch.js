// assets/js/utils/fetch.js

import { getToken, logout, forceLogout } from "./auth.js";

export async function apiFetch(url, options = {}) {
  const token = getToken();

  const response = await fetch(url, {
    ...options,

    headers: {
      ...(options.headers || {}),
      Authorization: token ? "Bearer " + token : "",
    },
  });

  if (response.status === 401) {
    await forceLogout();
    //await errorAlert("Sesión expirada", "Debes iniciar sesión nuevamente");
    return;
    //throw new Error("Sesión expirada");
  }

  return response;
}
