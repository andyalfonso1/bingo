// admin/pagos-tablas/assets/js/guards/admin.guard.js

import { isAuthenticated } from "../utils/auth.js";

export function requireAdminAuth() {
  if (!isAuthenticated()) {
    window.location.href = "./login.html";

    return false;
  }

  return true;
}
