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

export function isAuthenticated() {
  return !!getToken();
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

  location.reload();
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

  location.reload();
}
