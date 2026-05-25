// assets/js/pages/admin-bingo-tickets.js

import { API_URL } from "../config/api.js";

import {
  getBingos,
  getBingoTickets,
  uploadTicketImage,
} from "../services/bingo.service.js";

import { createEntityState } from "../state/entity.state.js";

import { renderPagination } from "../ui/pagination.js";

import {
  errorAlert,
  successAlert,
  loadingAlert,
  closeAlert,
} from "../utils/alerts.js";

import { openImageModal } from "../components/image-modal.component.js";

import { renderEmptyState } from "../components/empty-state.component.js";

// =========================
// STATE (LOCAL POR PÁGINA)
// =========================

const ticketsState = createEntityState({
  pageSize: 10,
});

// =========================
// DOM
// =========================

const bingoFilter = document.getElementById("bingo-filter");
const searchInput = document.getElementById("search-input");
const tableBody = document.getElementById("table-body");

// =========================
// INIT
// =========================

export async function initTickets() {
  initFilters();
  await loadBingos();
}

// =========================
// FILTERS
// =========================

function initFilters() {
  bingoFilter?.addEventListener("change", async () => {
    const bingoId = Number(bingoFilter.value);

    if (!bingoId) {
      tableBody.innerHTML = "";
      return;
    }

    await fetchTickets(bingoId);
  });

  searchInput?.addEventListener("input", filterTickets);
}

// =========================
// LOAD BINGOS
// =========================

async function loadBingos() {
  try {
    const bingos = await getBingos();

    bingoFilter.innerHTML = `<option value="">Seleccionar bingo</option>`;

    bingoFilter.innerHTML += bingos
      .map(
        (bingo) => `
          <option value="${bingo.id}">
            ${bingo.name}
          </option>
        `,
      )
      .join("");
  } catch (error) {
    console.error(error);
    await errorAlert("Error", "No se pudieron cargar los bingos");
  }
}

// =========================
// FETCH TICKETS
// =========================

async function fetchTickets(bingoId) {
  try {
    const data = await getBingoTickets(bingoId);

    ticketsState.setAll(data);

    refreshTable();
  } catch (error) {
    console.error(error);
    await errorAlert("Error", error.message);
  }
}

// =========================
// REFRESH
// =========================

function refreshTable() {
  renderTable();

  attachUploadEvents();
  attachImageZoomEvents();

  renderPagination({
    currentPage: ticketsState.getCurrentPage(),
    totalItems: ticketsState.getFiltered().length,
    rowsPerPage: ticketsState.getPageSize(),

    onPageChange: (page) => {
      ticketsState.setCurrentPage(page);
      refreshTable();
    },
  });
}

// =========================
// TABLE
// =========================

function renderTable() {
  const data = ticketsState.getPaginated();

  if (!data.length) {
    tableBody.innerHTML = renderEmptyState({
      colspan: 6,
      message: "No hay tickets",
    });

    return;
  }

  tableBody.innerHTML = data
    .map((ticket) => {
      let statusBadge = "";

      if (ticket.status === "AVAILABLE") {
        statusBadge = `<span class="badge badge-success">Disponible</span>`;
      } else if (ticket.status === "RESERVED") {
        statusBadge = `<span class="badge badge-warning">Reservado</span>`;
      } else {
        statusBadge = `<span class="badge badge-danger">Vendido</span>`;
      }

      const imageHtml = ticket.imgTicket
        ? `
          <img
            src="${API_URL}${ticket.imgTicket}"
            class="banner-img zoomable-image"
            data-image="${API_URL}${ticket.imgTicket}"
          />
        `
        : "-";

      return `
        <tr>
          <td>${ticket.id}</td>
          <td>${ticket.number}</td>
          <td>${statusBadge}</td>
          <td>${imageHtml}</td>
          <td>${ticket.assignment?.user?.fullName || "Sin asignar"}</td>
          <td>
            <input
              type="file"
              class="ticket-image-input hidden"
              data-id="${ticket.id}"
              accept="image/*"
            />

            <button
              class="btn btn-primary upload-btn"
              data-id="${ticket.id}"
            >
              Subir imagen
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// =========================
// FILTER
// =========================

function filterTickets() {
  const search = searchInput.value.toLowerCase();

  const filtered = ticketsState
    .getAll()
    .filter((t) => t.number.toLowerCase().includes(search));

  ticketsState.setFiltered(filtered);
  ticketsState.setCurrentPage(1);

  refreshTable();
}

// =========================
// UPLOAD
// =========================

function attachUploadEvents() {
  document.querySelectorAll(".upload-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;

      document.querySelector(`.ticket-image-input[data-id="${id}"]`)?.click();
    });
  });

  document.querySelectorAll(".ticket-image-input").forEach((input) => {
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      await handleUpload(input.dataset.id, file);
    });
  });
}

// =========================
// HANDLE UPLOAD
// =========================

async function handleUpload(id, file) {
  try {
    loadingAlert("Subiendo imagen...");

    const formData = new FormData();
    formData.append("image", file);

    const response = await uploadTicketImage(id, formData);

    closeAlert();

    await successAlert(
      "Imagen subida",
      response.message || "Imagen subida correctamente",
    );

    await fetchTickets(Number(bingoFilter.value));
  } catch (error) {
    console.error(error);
    closeAlert();
    await errorAlert("Error", error.message);
  }
}

// =========================
// ZOOM IMAGE
// =========================

function attachImageZoomEvents() {
  document.querySelectorAll(".zoomable-image").forEach((img) => {
    img.addEventListener("click", () => {
      openImageModal(img.dataset.image);
    });
  });
}
