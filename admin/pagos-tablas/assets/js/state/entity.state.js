// assets/js/state/entity.state.js

export function createEntityState({ pageSize = 10 } = {}) {
  let ALL = [];
  let FILTERED = [];
  let currentPage = 1;

  return {
    // =====================
    // DATA
    // =====================
    setAll(data) {
      ALL = data;
      FILTERED = data;
      currentPage = 1;
    },

    getAll() {
      return ALL;
    },

    setFiltered(data) {
      FILTERED = data;
      currentPage = 1;
    },

    getFiltered() {
      return FILTERED;
    },

    // =====================
    // PAGINATION
    // =====================
    getCurrentPage() {
      return currentPage;
    },

    setCurrentPage(page) {
      currentPage = page;
    },

    getTotalPages() {
      return Math.ceil(FILTERED.length / pageSize);
    },

    getPaginated() {
      const start = (currentPage - 1) * pageSize;
      return FILTERED.slice(start, start + pageSize);
    },

    getPageSize() {
      return pageSize;
    },

    // =====================
    // RESET
    // =====================
    reset() {
      ALL = [];
      FILTERED = [];
      currentPage = 1;
    },
  };
}
