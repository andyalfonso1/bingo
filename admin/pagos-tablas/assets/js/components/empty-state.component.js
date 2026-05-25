// assets/js/components/empty-state.component.js

export function renderEmptyState({ colspan = 1, message = "No hay datos" }) {
  return `
    <tr>
      <td colspan="${colspan}" class="empty-state">
        ${message}
      </td>
    </tr>
  `;
}
