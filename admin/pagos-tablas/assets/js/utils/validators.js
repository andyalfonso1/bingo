// assets/js/utils/validators.js

export function validateBingoForm() {
  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description").value.trim();
  const price = Number(document.getElementById("price").value);
  const maxTickets = Number(document.getElementById("maxTickets").value);
  const maxTicketsBuy = Number(document.getElementById("maxTicketsBuy").value);

  if (!name) return "El nombre es obligatorio";
  if (name.length < 3) return "El nombre debe tener al menos 3 caracteres";

  if (!description) return "La descripción es obligatoria";
  if (description.length < 5)
    return "La descripción debe tener al menos 5 caracteres";

  if (isNaN(price) || price <= 0) return "El precio debe ser mayor a 0";

  if (!Number.isInteger(maxTickets) || maxTickets <= 0)
    return "El total de tickets debe ser un número válido mayor a 0";

  if (!Number.isInteger(maxTicketsBuy) || maxTicketsBuy <= 0)
    return "El máximo por usuario debe ser mayor a 0";

  if (maxTicketsBuy > maxTickets)
    return "El máximo por usuario no puede ser mayor que el total de tickets";

  return null;
}
