import Stagiaire from '../models/Stagiaire';
import Employe from '../models/Employe';
import Formation from '../models/Formation';
export declare class PdfService {
    private static readonly BLEU;
    private static readonly ORANGE;
    private static readonly GRIS;
    private static readonly BLANC;
    /** pdf-lib/Helvetica n'accepte pas certains caractères Unicode (ex: flèche). */
    private static normalizePdfText;
    /**
     * Dessiner l'en-tête CNI commun à tous les PDFs
     */
    private static drawHeader;
    /**
     * Générer la convention de stage
     */
    static genererConvention(stagiaire: Stagiaire): Promise<{
        path: string;
    }>;
    /**
     * Fiche projet de stage (workflow automatisation RH / formateur)
     */
    static genererFicheProjet(stagiaire: Stagiaire, titreProjet: string, descriptionProjet?: string): Promise<{
        path: string;
    }>;
    /**
     * Générer l'attestation de stage
     */
    static genererAttestation(stagiaire: Stagiaire, note: number, commentaire: string): Promise<{
        path: string;
    }>;
    /**
     * Générer le certificat de formation
     */
    static genererCertificat(employe: Employe, formation: Formation, tauxPresence: number): Promise<{
        path: string;
    }>;
}
//# sourceMappingURL=pdf.service.d.ts.map