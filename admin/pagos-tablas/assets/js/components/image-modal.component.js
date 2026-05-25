// assets/js/components/image-modal.component.js

export function renderImageModal() {
  return `
    <div 
      id="image-modal"
      class="image-modal hidden"
    >
      <div 
        class="image-modal-content"
      >
        <button 
          class="image-modal-close"
          id="close-image-modal"
        >
          ✕
        </button>

        <img
          id="image-modal-src"
          src=""
          alt="Preview"
        />
      </div>
    </div>
  `;
}

// =========================
// OPEN
// =========================

export function openImageModal(url) {
  const modal = document.getElementById("image-modal");

  const image = document.getElementById("image-modal-src");

  if (!modal || !image) return;

  image.src = url;

  modal.classList.remove("hidden");

  modal.classList.add("active");
}

// =========================
// CLOSE
// =========================

export function closeImageModal() {
  const modal = document.getElementById("image-modal");

  const image = document.getElementById("image-modal-src");

  if (!modal || !image) return;

  modal.classList.remove("active");

  modal.classList.add("hidden");

  image.src = "";
}

// =========================
// INIT EVENTS
// =========================

export function initImageModalEvents() {
  const modal = document.getElementById("image-modal");

  const closeBtn = document.getElementById("close-image-modal");

  modal?.addEventListener("click", () => {
    closeImageModal();
  });

  closeBtn?.addEventListener("click", () => {
    closeImageModal();
  });

  document
    .querySelector(".image-modal-content")
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
    });
}
