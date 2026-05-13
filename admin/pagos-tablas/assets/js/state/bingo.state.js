// assets/js/state/bingo.state.js

let ALL_BINGOS = [];

let FILTERED_BINGOS = [];

let currentPage = 1;

const rowsPerPage = 10;

let editingBingoId = null;

export function setBingos(data) {
  ALL_BINGOS = data;
  FILTERED_BINGOS = data;
}

export function getAllBingos() {
  return ALL_BINGOS;
}

export function getFilteredBingos() {
  return FILTERED_BINGOS;
}

export function setFilteredBingos(data) {
  FILTERED_BINGOS = data;
}

export function getCurrentPage() {
  return currentPage;
}

export function setCurrentPage(page) {
  currentPage = page;
}

export function getRowsPerPage() {
  return rowsPerPage;
}

export function getPaginatedBingos() {
  const start = (currentPage - 1) * rowsPerPage;

  return FILTERED_BINGOS.slice(start, start + rowsPerPage);
}

export function setEditingBingoId(id) {
  editingBingoId = id;
}

export function getEditingBingoId() {
  return editingBingoId;
}
