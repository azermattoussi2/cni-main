-- Colonnes workflow automatisé (projet PDF, envoi planning)
-- Exécuter sur MySQL si les colonnes n'existent pas encore.

ALTER TABLE stagiaires
  ADD COLUMN projetPdfPath VARCHAR(500) NULL,
  ADD COLUMN planningEnvoyeAt DATETIME NULL;
