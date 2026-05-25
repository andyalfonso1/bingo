// assets/js/ui/pagination.js

export function renderPagination({
  containerId = "pagination",
  currentPage = 1,
  totalItems = 0,
  rowsPerPage = 10,
  onPageChange,
}) {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`pagination container "${containerId}" no encontrado`);
    return;
  }

  container.innerHTML = "";

  const totalPages = Math.ceil(totalItems / rowsPerPage);

  //if (totalPages <= 1) return;

  // botón anterior
  const prev = document.createElement("button");
  prev.textContent = "‹";
  prev.disabled = currentPage === 1;

  prev.addEventListener("click", () => {
    onPageChange(currentPage - 1);
  });

  container.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");

    button.textContent = i;

    if (i === currentPage) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      onPageChange(i);
    });

    container.appendChild(button);
  }

  // botón siguiente
  const next = document.createElement("button");
  next.textContent = "›";
  next.disabled = currentPage === totalPages;

  next.addEventListener("click", () => {
    onPageChange(currentPage + 1);
  });

  container.appendChild(next);
}
