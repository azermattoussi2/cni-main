// Composant: LoadingState.tsx
// Description: État de chargement réutilisable pour uniformiser les pages.
// Auteur: Codex
// Date: 15/04/2026
import React from 'react';

type LoadingStateProps = {
  message?: string;
};

export default function LoadingState({ message = 'Chargement des données...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-cni-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  );
}
