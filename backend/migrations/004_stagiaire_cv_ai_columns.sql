ALTER TABLE stagiaires
  ADD COLUMN cvExtractedData LONGTEXT NULL,
  ADD COLUMN cvExtractedHtml LONGTEXT NULL,
  ADD COLUMN aiScore FLOAT NULL,
  ADD COLUMN aiMoyenne FLOAT NULL,
  ADD COLUMN aiFeedback LONGTEXT NULL,
  ADD COLUMN aiStrengths LONGTEXT NULL,
  ADD COLUMN aiWeaknesses LONGTEXT NULL,
  ADD COLUMN aiRecommendation ENUM('accept','reject','need_interview') NULL,
  ADD COLUMN aiStatus ENUM('pending','done','failed') NULL,
  ADD COLUMN aiError TEXT NULL,
  ADD COLUMN aiAnalyzedAt DATETIME NULL;
