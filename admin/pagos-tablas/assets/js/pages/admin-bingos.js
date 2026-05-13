// assets/js/pages/admin-bingos.js

import { API_URL } from "../config/api.js";
import {
  getBingos,
  createBingo,
  updateBingo,
  //deleteBingo,
} from "../services/bingo.service.js";
import {
  setBingos,
  getPaginatedBingos,
  getAllBingos,
} from "../state/bingo.state.js";
import { renderPagination } from "../ui/pagination.js";
import { initFilters } from "../ui/filters.js";
import {
  openModal,
  setModalTitle,
  setSubmitText,
  setEditingId,
  getEditingId,
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

export async function initBingos() {
  initFilters(refreshTable);

  initForm();

  initBannerPreview();

  await fetchBingos();
}

async function fetchBingos() {
  try {
    const data = await getBingos();

    console.log("DATA API:", data);

    setBingos(data);

    console.log("STATE OK");

    //renderTable();
    refreshTable();
  } catch (err) {
    //console.error(err);
    console.error("FETCH ERROR:", err);
  }
}

function initForm() {
  const form = document.getElementById("bingo-form");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    await handleSubmit();
  });
}

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
        ? "Se actualizará la información del bingo"
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
      isEditMode
        ? "El bingo fue actualizado correctamente"
        : "El bingo fue creado correctamente",
    );

    closeModal();

    await fetchBingos();
  } catch (err) {
    console.error(err);

    await errorAlert("Error", "Ocurrió un error guardando el bingo");
  }
}

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

  if (banner) {
    formData.append("banner", banner);
  }

  return formData;
}

function refreshTable() {
  renderTable();

  attachEditEvents();

  //attachDeleteEvents();

  attachImageZoomEvents();

  renderPagination(refreshTable);
}

function attachEditEvents() {
  const buttons = document.querySelectorAll(".edit-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.id);

      editBingo(id);
    });
  });
}

function editBingo(id) {
  const bingos = getAllBingos();

  const bingo = bingos.find((b) => b.id === id);

  if (!bingo) return;

  // MODO EDICIÓN
  setEditingId(id);

  // LLENAR FORM
  document.getElementById("name").value = bingo.name || "";

  document.getElementById("description").value = bingo.description || "";

  document.getElementById("price").value = bingo.price || "";

  document.getElementById("maxTickets").value = bingo.maxTickets || "";

  document.getElementById("maxTicketsBuy").value = bingo.maxTicketsBuy || "";

  document.getElementById("isActive").checked = bingo.isActive;

  document.getElementById("isRandomized").checked = bingo.isRandomized;

  document.getElementById("isHidden").checked = bingo.isHidden;

  // PREVIEW IMAGEN
  const preview = document.getElementById("preview");

  if (preview && bingo.bannerUrl) {
    preview.src = `${API_URL}${bingo.bannerUrl}`;

    preview.classList.remove("hidden");
  }

  // CAMBIAR TEXTOS
  setModalTitle("Editar Bingo");

  setSubmitText("Guardar Cambios");

  // ABRIR MODAL
  openModal();
}

function renderTable() {
  console.log("RENDER TABLE");
  const tableBody = document.getElementById("table-body");

  if (!tableBody) {
    console.error("table-body no encontrado");
    return;
  }

  const bingos = getPaginatedBingos();

  console.log("BINGOS:", bingos);

  if (!bingos.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8">No hay datos</td>
      </tr>
    `;

    return;
  }

  tableBody.innerHTML = bingos
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

function attachImageZoomEvents() {
  const images = document.querySelectorAll(".zoomable-image");

  images.forEach((img) => {
    img.addEventListener("click", () => {
      openImageModal(img.dataset.image);
    });
  });
}

function openImageModal(url) {
  const modal = document.getElementById("image-modal");

  const image = document.getElementById("image-modal-src");

  image.src = url;

  modal.classList.add("active");
}

function closeImageModal() {
  const modal = document.getElementById("image-modal");

  const image = document.getElementById("image-modal-src");

  modal.classList.remove("active");

  image.src = "";
}

// GLOBAL
window.closeImageModal = closeImageModal;
