// assets/js/ui/filters.js

export function initFilters({ state, onFilter }) {
  const searchInput = document.getElementById("search-input");

  const statusFilter = document.getElementById("status-filter");

  if (!searchInput || !statusFilter) {
    console.error("Filtros no encontrados");
    return;
  }

  function handleFilters() {
    const search = searchInput.value.toLowerCase().trim();

    const status = statusFilter.value;

    let filtered = state.getAll();

    // =========================
    // SEARCH
    // =========================

    if (search) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(search),
      );
    }

    // =========================
    // STATUS
    // =========================

    if (status === "active") {
      filtered = filtered.filter((item) => item.isActive);
    }

    if (status === "inactive") {
      filtered = filtered.filter((item) => !item.isActive);
    }

    // =========================
    // UPDATE STATE
    // =========================

    state.setFiltered(filtered);

    state.setCurrentPage(1);

    onFilter();
  }

  searchInput.addEventListener("input", handleFilters);

  statusFilter.addEventListener("change", handleFilters);
}
