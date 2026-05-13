// assets/js/utils/alerts.js

export async function successAlert(title, text = "") {
  return Swal.fire({
    title,
    text,
    icon: "success",
    timer: 1800,
    showConfirmButton: false,
  });
}

export async function errorAlert(title, text = "") {
  return Swal.fire({
    title,
    text,
    icon: "error",
  });
}

export async function warningAlert(title, text = "") {
  return Swal.fire({
    title,
    text,
    icon: "warning",
  });
}

export async function confirmAlert({
  title,
  text,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  icon = "question",
  confirmColor = "#2563eb",
}) {
  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: confirmColor,
  });
}

export function loadingAlert(title = "Procesando...") {
  Swal.fire({
    title,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

export function closeAlert() {
  Swal.close();
}
