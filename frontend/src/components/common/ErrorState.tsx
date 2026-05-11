// Composant: ErrorState.tsx
// Description: État d'erreur réutilisable avec action de retry.
// Auteur: Codex
// Date: 15/04/2026
import React from 'react';

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export default function ErrorState({ message = 'Une erreur est survenue.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <p className="text-red-600 font-semibold">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-secondary text-sm">
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
}
