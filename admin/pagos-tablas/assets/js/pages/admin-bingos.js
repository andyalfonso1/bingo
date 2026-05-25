// assets/js/pages/admin-bingos.js

import { API_URL } from "../config/api.js";

import {
  getBingos,
  createBingo,
  updateBingo,
} from "../services/bingo.service.js";

import { createEntityState } from "../state/entity.state.js";

import { renderPagination } from "../ui/pagination.js";

import { initFilters } from "../ui/filters.js";

import {
  openModal,
  setModalTitle,
  setSubmitText,
  setEditingId,
  isEditing,
  closeModal,
} from "../ui/modal.js";

import { validateBingoForm } from "../utils/validators.js";

import {
  successAlert,
  errorAlert,
  warningAlert,
  confirmAlert,
  loadingAlert,
  closeAlert,
} from "../utils/alerts.js";

import { openImageModal } from "../components/image-modal.component.js";

import { renderEmptyState } from "../components/empty-state.component.js";

// =========================
// STATE
// =========================

const bingosState = createEntityState({
  pageSize: 10,
});

// =========================
// INIT
// =========================

export async function initBingos() {
  //initFilters(refreshTable);
  initFilters({
    state: bingosState,
    onFilter: refreshTable,
  });
  initForm();
  initBannerPreview();

  await fetchBingos();
}

// =========================
// FETCH
// =========================

async function fetchBingos() {
  try {
    const data = await getBingos();

    bingosState.setAll(data);

    refreshTable();
  } catch (err) {
    console.error("FETCH ERROR:", err);
  }
}

// =========================
// FORM
// =========================

function initForm() {
  const form = document.getElementById("bingo-form");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleSubmit();
  });
}

// =========================
// BANNER PREVIEW
// =========================

function initBannerPreview() {
  const bannerInput = document.getElementById("banner");
  const preview = document.getElementById("preview");

  bannerInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];

    if (!file) {
      preview.classList.add("hidden");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      preview.src = event.target.result;
      preview.classList.remove("hidden");
    };

    reader.readAsDataURL(file);
  });
}

// =========================
// SUBMIT
// =========================

async function handleSubmit() {
  const error = validateBingoForm();

  if (error) {
    await warningAlert("Error de Validación", error);
    return;
  }

  try {
    const isEditMode = isEditing();

    const result = await confirmAlert({
      title: isEditMode ? "¿Guardar cambios?" : "¿Crear bingo?",
      text: isEditMode
        ? "Se actualizará la información"
        : "Se creará un nuevo bingo",
      confirmText: isEditMode ? "Sí, guardar" : "Sí, crear",
    });

    if (!result.isConfirmed) return;

    loadingAlert("Guardando...");

    const formData = buildFormData();

    if (isEditMode) {
      await updateBingo(getEditingId(), formData);
    } else {
      await createBingo(formData);
    }

    closeAlert();

    await successAlert(
      isEditMode ? "Actualizado" : "Creado",
      "Operación exitosa",
    );

    closeModal();
    await fetchBingos();
  } catch (err) {
    console.error(err);
    await errorAlert("Error", "Error guardando bingo");
  }
}

// =========================
// FORM DATA
// =========================

function buildFormData() {
  const formData = new FormData();

  formData.append("name", document.getElementById("name").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("price", document.getElementById("price").value);
  formData.append("maxTickets", document.getElementById("maxTickets").value);
  formData.append(
    "maxTicketsBuy",
    document.getElementById("maxTicketsBuy").value,
  );

  formData.append("isActive", document.getElementById("isActive").checked);
  formData.append(
    "isRandomized",
    document.getElementById("isRandomized").checked,
  );
  formData.append("isHidden", document.getElementById("isHidden").checked);

  const banner = document.getElementById("banner").files[0];

  if (banner) formData.append("banner", banner);

  return formData;
}

// =========================
// TABLE REFRESH
// =========================

function refreshTable() {
  renderTable();

  attachEditEvents();
  attachImageZoomEvents();

  renderPagination({
    currentPage: bingosState.getCurrentPage(),
    totalItems: bingosState.getFiltered().length,
    rowsPerPage: bingosState.getPageSize(),

    onPageChange: (page) => {
      bingosState.setCurrentPage(page);
      refreshTable();
    },
  });
}

// =========================
// TABLE
// =========================

function renderTable() {
  const tableBody = document.getElementById("table-body");

  const data = bingosState.getPaginated();

  if (!data.length) {
    tableBody.innerHTML = renderEmptyState({
      colspan: 8,
      message: "No hay bingos",
    });

    return;
  }

  tableBody.innerHTML = data
    .map(
      (bingo) => `
        <tr>
          <td>${bingo.id}</td>

          <td>
            <img 
              src="${API_URL}${bingo.bannerUrl}"              
              class="banner-img zoomable-image"
              data-image="${API_URL}${bingo.bannerUrl}"
            />
          </td>

          <td>${bingo.name}</td>

          <td>$${Number(bingo.price).toFixed(2)}</td>

          <td>${bingo.maxTickets}</td>

          <td>
            ${
              bingo.isActive
                ? '<span class="badge badge-success">Activo</span>'
                : '<span class="badge badge-danger">Inactivo</span>'
            }
          </td>

          <td>
            ${
              bingo.isHidden
                ? '<span class="badge badge-warning">Oculto</span>'
                : '<span class="badge badge-info">Visible</span>'
            }
          </td>

          <td>
            <button class="btn btn-primary edit-btn" data-id="${bingo.id}">
              Editar
            </button>
          </td>
        </tr>
      `,
    )
    .join("");
}

// =========================
// FILTER (si lo necesitas luego)
// =========================

function applyFilter(filtered) {
  bingosState.setFiltered(filtered);
  bingosState.setCurrentPage(1);
  refreshTable();
}

// =========================
// EDIT
// =========================

function attachEditEvents() {
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      editBingo(id);
    });
  });
}

function editBingo(id) {
  const bingo = bingosState.getAll().find((b) => b.id === id);

  if (!bingo) return;

  setEditingId(id);

  document.getElementById("name").value = bingo.name || "";
  document.getElementById("description").value = bingo.description || "";
  document.getElementById("price").value = bingo.price || "";
  document.getElementById("maxTickets").value = bingo.maxTickets || "";
  document.getElementById("maxTicketsBuy").value = bingo.maxTicketsBuy || "";

  document.getElementById("isActive").checked = bingo.isActive;
  document.getElementById("isRandomized").checked = bingo.isRandomized;
  document.getElementById("isHidden").checked = bingo.isHidden;

  const preview = document.getElementById("preview");

  if (preview && bingo.bannerUrl) {
    preview.src = `${API_URL}${bingo.bannerUrl}`;
    preview.classList.remove("hidden");
  }

  setModalTitle("Editar Bingo");
  setSubmitText("Guardar Cambios");
  openModal();
}

// =========================
// ZOOM
// =========================

function attachImageZoomEvents() {
  document.querySelectorAll(".zoomable-image").forEach((img) => {
    img.addEventListener("click", () => {
      openImageModal(img.dataset.image);
    });
  });
}
