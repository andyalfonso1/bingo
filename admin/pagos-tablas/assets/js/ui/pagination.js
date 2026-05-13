// assets/js/ui/pagination.js

import {
  getFilteredBingos,
  getCurrentPage,
  setCurrentPage,
  getRowsPerPage,
} from "../state/bingo.state.js";

export function renderPagination(onPageChange) {
  const container = document.getElementById("pagination");

  console.log("RENDER PAGINATION");

  if (!container) {
    console.error("pagination no encontrado");
    return;
  }

  container.innerHTML = "";

  const totalRows = getFilteredBingos().length;

  const rowsPerPage = getRowsPerPage();

  const totalPages = Math.ceil(totalRows / rowsPerPage);

  console.log("FILTERED:", getFilteredBingos());

  console.log("TOTAL PAGES:", totalPages);

  /*if (totalPages <= 1) {
    return;
  }*/

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");

    button.textContent = i;

    if (i === getCurrentPage()) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      setCurrentPage(i);

      onPageChange();
    });

    container.appendChild(button);
  }
}
