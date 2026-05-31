// assets/js/utils/auth.js

export function getToken() {
  return localStorage.getItem("admin_token");
}

export function setToken(token) {
  localStorage.setItem("admin_token", token);
}

export function clearToken() {
  localStorage.removeItem("admin_token");
}

/*export function isAuthenticated() {
  return !!getToken();
}*/

export function isAuthenticated() {
  const token = getToken();

  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    const now = Math.floor(Date.now() / 1000);

    // TOKEN EXPIRADO
    if (payload.exp <= now) {
      clearToken();
      return false;
    }

    return true;
  } catch (error) {
    clearToken();
    return false;
  }
}

// LOGOUT AUTOMÁTICO
export async function forceLogout() {
  clearToken();

  await Swal.fire({
    title: "Sesión expirada",
    text: "Debes iniciar sesión nuevamente",
    icon: "warning",
    confirmButtonText: "Aceptar",
  });

  window.location.href = "./login.html";
}

// LOGOUT MANUAL
export async function logout() {
  const result = await Swal.fire({
    title: "¿Cerrar sesión?",
    text: "Tendrás que iniciar sesión nuevamente",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, salir",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#e53935",
  });

  if (!result.isConfirmed) return;

  clearToken();

  await Swal.fire({
    title: "Sesión cerrada",
    icon: "success",
    timer: 1200,
    showConfirmButton: false,
  });

  //location.reload();
  window.location.href = "./login.html";
}
