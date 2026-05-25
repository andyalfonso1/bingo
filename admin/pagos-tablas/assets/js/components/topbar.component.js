// assets/js/components/topbar.component.js

export function renderTopbar(title = "") {
  return `
    <div class="topbar">
      <button class="menu-toggle">☰</button>

      <h1>${title}</h1>
    </div>
  `;
}
