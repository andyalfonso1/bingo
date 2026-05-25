// assets/js/pages/admin-bingos-payments.js

import { createEntityState } from "../state/entity.state.js";

import { API_URL } from "../config/api.js";

import {
  getBingoPayments,
  approveBingoPayment,
  rejectBingoPayment,
} from "../services/bingo.service.js";

import { renderPagination } from "../ui/pagination.js";

import {
  successAlert,
  errorAlert,
  confirmAlert,
  loadingAlert,
  closeAlert,
} from "../utils/alerts.js";

import { openImageModal } from "../components/image-modal.component.js";

import { renderEmptyState } from "../components/empty-state.component.js";

// =========================
// STATE
// =========================

const paymentsState = createEntityState({
  pageSize: 10,
});

// =========================
// ELEMENTS
// =========================

const tableBody = document.getElementById("table-body");

const searchInput = document.getElementById("search-input");

const statusFilter = document.getElementById("status-filter");

// =========================
// INIT
// =========================

export async function initBingoPayments() {
  initFilters();

  await fetchPayments();
}

// =========================
// FILTERS
// =========================

function initFilters() {
  searchInput?.addEventListener("input", filterPayments);

  statusFilter?.addEventListener("change", filterPayments);
}

// =========================
// FETCH
// =========================

async function fetchPayments() {
  try {
    const data = await getBingoPayments();

    paymentsState.setAll(data);

    refreshTable();
  } catch (error) {
    console.error(error);

    await errorAlert("Error", "No se pudieron cargar los pagos");
  }
}

// =========================
// REFRESH TABLE
// =========================

function refreshTable() {
  renderTable();

  attachApproveEvents();

  attachRejectEvents();

  attachImageZoomEvents();

  renderPagination({
    currentPage: paymentsState.getCurrentPage(),

    totalItems: paymentsState.getFiltered().length,

    rowsPerPage: paymentsState.getPageSize(),

    onPageChange: (page) => {
      paymentsState.setCurrentPage(page);

      refreshTable();
    },
  });
}

// =========================
// RENDER TABLE
// =========================

function renderTable() {
  if (!tableBody) return;

  const data = paymentsState.getPaginated();

  if (!data.length) {
    tableBody.innerHTML = renderEmptyState({
      colspan: 9,
      message: "No hay pagos registrados",
    });

    return;
  }

  tableBody.innerHTML = data
    .map((payment) => {
      const proofsHtml =
        payment.proofs
          ?.map(
            (proof) => `
              <img
                src="${API_URL}${proof.url}"
                class="proof-image zoomable-image"
                data-image="${API_URL}${proof.url}"
              />
            `,
          )
          .join("") || "-";

      let statusBadge = "";

      if (payment.status === "PENDING") {
        statusBadge = '<span class="badge badge-warning">Pendiente</span>';
      }

      if (payment.status === "APPROVED") {
        statusBadge = '<span class="badge badge-success">Aprobado</span>';
      }

      if (payment.status === "REJECTED") {
        statusBadge = '<span class="badge badge-danger">Rechazado</span>';
      }

      return `
        <tr>
          <td>${payment.id}</td>

          <td>
            ${payment.user?.fullName || "Sin usuario"}
          </td>

          <td>
            ${payment.bingo?.name || "Sin bingo"}
          </td>

          <td>${payment.quantity}</td>

          <td>
            $${Number(payment.totalAmount).toFixed(2)}
          </td>

          <td>
            <div class="proofs-container">
              ${proofsHtml}
            </div>
          </td>

          <td>
            ${statusBadge}
          </td>

          <td>
            ${new Date(payment.createdAt).toLocaleDateString()}
          </td>

          <td>
            ${
              payment.status === "PENDING"
                ? `
                  <button
                    class="btn btn-success approve-btn"
                    data-id="${payment.id}"
                  >
                    Aprobar
                  </button>

                  <button
                    class="btn btn-danger reject-btn"
                    data-id="${payment.id}"
                  >
                    Rechazar
                  </button>
                `
                : "-"
            }
          </td>
        </tr>
      `;
    })
    .join("");
}

// =========================
// FILTER
// =========================

function filterPayments() {
  const search = searchInput.value.toLowerCase().trim();

  const status = statusFilter.value;

  let filtered = paymentsState.getAll();

  // =========================
  // SEARCH
  // =========================

  if (search) {
    filtered = filtered.filter((payment) => {
      const username = payment.user?.username?.toLowerCase() || "";

      const bingo = payment.bingo?.name?.toLowerCase() || "";

      return username.includes(search) || bingo.includes(search);
    });
  }

  // =========================
  // STATUS
  // =========================

  if (status) {
    filtered = filtered.filter((payment) => payment.status === status);
  }

  // =========================
  // UPDATE STATE
  // =========================

  paymentsState.setFiltered(filtered);

  paymentsState.setCurrentPage(1);

  refreshTable();
}

// =========================
// APPROVE EVENTS
// =========================

function attachApproveEvents() {
  document.querySelectorAll(".approve-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.id);

      await handleApprove(id);
    });
  });
}

// =========================
// REJECT EVENTS
// =========================

function attachRejectEvents() {
  document.querySelectorAll(".reject-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.id);

      await handleReject(id);
    });
  });
}

// =========================
// APPROVE
// =========================

async function handleApprove(id) {
  try {
    const result = await confirmAlert({
      title: "¿Aprobar pago?",
      text: "Esta acción venderá los tickets.",
      confirmText: "Sí, aprobar",
    });

    if (!result.isConfirmed) return;

    loadingAlert("Aprobando pago...");

    const response = await approveBingoPayment(id);

    closeAlert();

    await successAlert(
      "Pago aprobado",
      response.message || "Pago aprobado correctamente",
    );

    await fetchPayments();
  } catch (error) {
    console.error(error);

    closeAlert();

    await errorAlert("Error", error.message || "Error aprobando pago");
  }
}

// =========================
// REJECT
// =========================

async function handleReject(id) {
  try {
    const result = await confirmAlert({
      title: "¿Rechazar pago?",
      text: "Esta acción rechazará el pago.",
      confirmText: "Sí, rechazar",
    });

    if (!result.isConfirmed) return;

    loadingAlert("Rechazando pago...");

    const response = await rejectBingoPayment(id);

    closeAlert();

    await successAlert(
      "Pago rechazado",
      response.message || "Pago rechazado correctamente",
    );

    await fetchPayments();
  } catch (error) {
    console.error(error);

    closeAlert();

    await errorAlert("Error", error.message || "Error rechazando pago");
  }
}

// =========================
// IMAGE ZOOM
// =========================

function attachImageZoomEvents() {
  document.querySelectorAll(".zoomable-image").forEach((img) => {
    img.addEventListener("click", () => {
      openImageModal(img.dataset.image);
    });
  });
}
