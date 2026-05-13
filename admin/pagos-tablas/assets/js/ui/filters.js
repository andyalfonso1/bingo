// assets/js/ui/filters.js

import {
  getAllBingos,
  setFilteredBingos,
  setCurrentPage,
} from "../state/bingo.state.js";

export function initFilters(onFilterChange) {
  const searchInput = document.getElementById("search-input");

  const statusFilter = document.getElementById("status-filter");

  if (!searchInput || !statusFilter) {
    console.error("Filtros no encontrados");
    return;
  }

  searchInput.addEventListener("input", () => {
    handleFilters(onFilterChange);
  });

  statusFilter.addEventListener("change", () => {
    handleFilters(onFilterChange);
  });
}

function handleFilters(onFilterChange) {
  const search = document
    .getElementById("search-input")
    .value.toLowerCase()
    .trim();

  const status = document.getElementById("status-filter").value;

  const filtered = getAllBingos().filter((bingo) => {
    const matchesSearch = bingo.name.toLowerCase().includes(search);

    const matchesStatus =
      status === ""
        ? true
        : status === "active"
          ? bingo.isActive
          : !bingo.isActive;

    return matchesSearch && matchesStatus;
  });

  setFilteredBingos(filtered);

  setCurrentPage(1);

  onFilterChange();
}
