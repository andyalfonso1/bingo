// assets/js/ui/modal.js

let editingId = null;

export function initModal() {
  console.log("INIT MODAL");

  const modal = document.getElementById("modal");

  const fabButton = document.getElementById("fab-button");

  const closeButton = document.querySelector(".close-btn");

  const cancelButton = document.querySelector(
    '.modal-footer button[type="button"]',
  );

  console.log({
    modal,
    fabButton,
    closeButton,
    cancelButton,
  });

  // OPEN

  fabButton?.addEventListener("click", openModal);

  // CLOSE X

  closeButton?.addEventListener("click", closeModal);

  // CLOSE CANCEL

  cancelButton?.addEventListener("click", closeModal);

  // CLOSE OUTSIDE

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

export function openModal() {
  console.log("OPEN MODAL");

  document.getElementById("modal")?.classList.add("active");
}

export function closeModal() {
  document.getElementById("modal")?.classList.remove("active");

  resetModal();
}

export function resetModal() {
  const form = document.getElementById("bingo-form");

  form?.reset();

  document.getElementById("preview")?.classList.add("hidden");

  editingId = null;

  setModalTitle("Crear Bingo");

  setSubmitText("Crear Bingo");
}

export function setModalTitle(title) {
  const titleElement = document.querySelector(".modal-header h2");

  if (titleElement) {
    titleElement.textContent = title;
  }
}

export function setSubmitText(text) {
  const submitButton = document.querySelector(
    '.modal-footer button[type="submit"]',
  );

  if (submitButton) {
    submitButton.textContent = text;
  }
}

export function setEditingId(id) {
  editingId = id;
}

export function getEditingId() {
  return editingId;
}

export function isEditing() {
  return editingId !== null;
}
