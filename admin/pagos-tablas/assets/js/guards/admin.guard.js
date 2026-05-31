// admin/pagos-tablas/assets/js/guards/admin.guard.js

import { isAuthenticated, forceLogout } from "../utils/auth.js";

export async function requireAdminAuth() {
  if (!isAuthenticated()) {
    await forceLogout();
    return false;
  }

  return true;
}
