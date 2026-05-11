export declare function suggestEvaluationReport(params: {
    stagiaireNom: string;
    stagiairePrenom: string;
    notesTuteur: string;
    type: 'intermediaire' | 'finale';
}): Promise<{
    text: string;
}>;
/** Suggestions de titres de projet à partir du profil (optionnel, même clé API). */
export declare function suggestProjectTitleFromCv(params: {
    prenom: string;
    nom: string;
    specialite?: string | null;
    ecole?: string | null;
    motivation?: string | null;
    sujetActuel?: string | null;
}): Promise<{
    text: string;
}>;
//# sourceMappingURL=gemini.service.d.ts.map