// ============================================
// Fichier : layouts/PublicLayout.tsx
// Description : Layout pour les pages publiques (landing, login)
// ============================================

import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}
