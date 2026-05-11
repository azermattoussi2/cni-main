"use strict";
// ============================================
// Fichier : services/pdf.service.ts
// Description : Génération PDF (convention, attestation, certificat)
// Utilise pdf-lib pour générer des PDFs professionnels
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const pdf_lib_1 = require("pdf-lib");
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../config/logger");
// Assurer que le dossier de sortie existe
const ensureDir = (dir) => {
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
};
class PdfService {
    /** pdf-lib/Helvetica n'accepte pas certains caractères Unicode (ex: flèche). */
    static normalizePdfText(text) {
        return text
            .replace(/→/g, '->')
            .replace(/←/g, '<-')
            .replace(/–|—/g, '-')
            .replace(/\u00A0/g, ' ');
    }
    /**
     * Dessiner l'en-tête CNI commun à tous les PDFs
     */
    static async drawHeader(page, font, boldFont) {
        const { width, height } = page.getSize();
        // Bande bleue en haut
        page.drawRectangle({
            x: 0, y: height - 80,
            width, height: 80,
            color: PdfService.BLEU,
        });
        // Logo/Nom CNI
        page.drawText('CNI', {
            x: 40, y: height - 50,
            size: 36, font: boldFont,
            color: PdfService.BLANC,
        });
        page.drawText('Centre National de l\'Informatique', {
            x: 100, y: height - 40,
            size: 11, font,
            color: PdfService.BLANC,
        });
        page.drawText('Système de Gestion des Stages et Formations', {
            x: 100, y: height - 57,
            size: 9, font,
            color: (0, pdf_lib_1.rgb)(0.8, 0.85, 1),
        });
        // Ligne orange décorative
        page.drawRectangle({
            x: 0, y: height - 85,
            width, height: 5,
            color: PdfService.ORANGE,
        });
        return height - 100;
    }
    /**
     * Générer la convention de stage
     */
    static async genererConvention(stagiaire) {
        ensureDir('uploads/conventions');
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4
        const { height } = page.getSize();
        const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
        let y = await PdfService.drawHeader(page, font, boldFont);
        // Titre
        page.drawText('CONVENTION DE STAGE', {
            x: 150, y: y - 20,
            size: 20, font: boldFont,
            color: PdfService.BLEU,
        });
        y -= 60;
        // Numéro convention
        const numConvention = `CNI-STAGE-${stagiaire.id}-${new Date().getFullYear()}`;
        page.drawText(`N° ${numConvention}`, {
            x: 40, y,
            size: 10, font,
            color: PdfService.GRIS,
        });
        y -= 35;
        // Section parties
        const drawSection = (titre, contenu) => {
            page.drawRectangle({ x: 40, y: y - 5, width: 515, height: 22, color: (0, pdf_lib_1.rgb)(0.94, 0.96, 1) });
            page.drawText(titre, { x: 45, y, size: 11, font: boldFont, color: PdfService.BLEU });
            y -= 25;
            contenu.forEach(({ label, valeur }) => {
                page.drawText(`${label} :`, { x: 50, y, size: 10, font: boldFont, color: PdfService.GRIS });
                page.drawText(valeur || 'N/A', { x: 200, y, size: 10, font, color: (0, pdf_lib_1.rgb)(0.1, 0.1, 0.1) });
                y -= 18;
            });
            y -= 10;
        };
        drawSection('LE STAGIAIRE', [
            { label: 'Nom et Prénom', valeur: `${stagiaire.prenom} ${stagiaire.nom}` },
            { label: 'Email', valeur: stagiaire.email },
            { label: 'Téléphone', valeur: stagiaire.telephone || 'Non renseigné' },
            { label: 'École / Université', valeur: stagiaire.ecoleUniversite || 'Non renseignée' },
            { label: 'Niveau d\'études', valeur: stagiaire.niveauEtudes || 'Non renseigné' },
        ]);
        drawSection('L\'ORGANISME D\'ACCUEIL', [
            { label: 'Entreprise', valeur: 'Centre National de l\'Informatique (CNI)' },
            { label: 'Adresse', valeur: 'Avenue Mohamed V, Tunis, Tunisie' },
            { label: 'Représentant', valeur: 'Direction des Ressources Humaines' },
        ]);
        drawSection('LES MODALITÉS DU STAGE', [
            { label: 'Sujet validé', valeur: stagiaire.sujetStage || 'À définir' },
            { label: 'Demande initiale du stagiaire', valeur: stagiaire.sujetStage || 'Non renseignée' },
            { label: 'Date de début', valeur: stagiaire.dateDebutStage ? new Date(stagiaire.dateDebutStage).toLocaleDateString('fr-FR') : 'À confirmer' },
            { label: 'Date de fin', valeur: stagiaire.dateFinStage ? new Date(stagiaire.dateFinStage).toLocaleDateString('fr-FR') : 'À confirmer' },
            { label: 'Durée', valeur: stagiaire.dureeStage ? `${stagiaire.dureeStage} semaines` : 'À confirmer' },
            { label: 'Type de stage', valeur: stagiaire.typeStage || 'PFE' },
        ]);
        // Zone signatures
        y -= 20;
        page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: (0, pdf_lib_1.rgb)(0.8, 0.8, 0.8) });
        y -= 30;
        page.drawText('Signatures', { x: 40, y, size: 11, font: boldFont, color: PdfService.BLEU });
        y -= 30;
        const colX = [40, 200, 370];
        const signataires = ['Le Stagiaire', 'L\'Entreprise (DRH)', 'Le Tuteur'];
        signataires.forEach((sig, i) => {
            page.drawText(sig, { x: colX[i], y, size: 9, font: boldFont, color: PdfService.GRIS });
            page.drawRectangle({ x: colX[i], y: y - 60, width: 140, height: 50, borderColor: (0, pdf_lib_1.rgb)(0.7, 0.7, 0.7), borderWidth: 1 });
            page.drawText('Signature', { x: colX[i] + 40, y: y - 40, size: 8, font, color: (0, pdf_lib_1.rgb)(0.7, 0.7, 0.7) });
        });
        // Footer
        page.drawRectangle({ x: 0, y: 0, width: 595, height: 25, color: PdfService.BLEU });
        page.drawText(`Document généré le ${new Date().toLocaleDateString('fr-FR')} | CNI - ${numConvention}`, {
            x: 50, y: 8, size: 8, font, color: PdfService.BLANC,
        });
        const pdfBytes = await pdfDoc.save();
        const filePath = `uploads/conventions/convention_${stagiaire.id}_${Date.now()}.pdf`;
        fs_1.default.writeFileSync(filePath, pdfBytes);
        logger_1.logger.info(`📄 Convention générée : ${filePath}`);
        return { path: filePath };
    }
    /**
     * Fiche projet de stage (workflow automatisation RH / formateur)
     */
    static async genererFicheProjet(stagiaire, titreProjet, descriptionProjet) {
        ensureDir('uploads/projets_stage');
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]);
        const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
        let y = await PdfService.drawHeader(page, font, boldFont);
        y -= 24;
        page.drawText('FICHE PROJET DE STAGE', {
            x: 120,
            y,
            size: 18,
            font: boldFont,
            color: PdfService.BLEU,
        });
        y -= 40;
        const drawLine = (text, size, f, col = PdfService.GRIS) => {
            page.drawText(PdfService.normalizePdfText(text), { x: 48, y, size, font: f, color: col });
            y -= size + 6;
        };
        const wrapBlock = (text, size, f, maxW) => {
            const safeText = PdfService.normalizePdfText(text);
            const words = safeText.split(/\s+/).filter(Boolean);
            let line = '';
            for (const w of words) {
                const test = line ? `${line} ${w}` : w;
                if (f.widthOfTextAtSize(test, size) > maxW && line) {
                    drawLine(line, size, f);
                    line = w;
                }
                else {
                    line = test;
                }
            }
            if (line)
                drawLine(line, size, f);
            y -= 4;
        };
        drawLine(`Réf. dossier : STG-${stagiaire.id}-${new Date().getFullYear()}`, 10, font);
        drawLine(`Stagiaire : ${stagiaire.prenom} ${stagiaire.nom}`, 10, font);
        drawLine(`Établissement : ${stagiaire.ecoleUniversite || '—'}`, 10, font);
        drawLine(`Période : ${stagiaire.dateDebutStage
            ? new Date(stagiaire.dateDebutStage).toLocaleDateString('fr-FR')
            : '—'} → ${stagiaire.dateFinStage ? new Date(stagiaire.dateFinStage).toLocaleDateString('fr-FR') : '—'}`, 10, font);
        y -= 10;
        drawLine('Intitulé du projet', 11, boldFont, PdfService.BLEU);
        wrapBlock(titreProjet, 12, boldFont, 500);
        if (descriptionProjet?.trim()) {
            drawLine('Description / périmètre', 11, boldFont, PdfService.BLEU);
            wrapBlock(descriptionProjet.trim(), 10, font, 500);
        }
        page.drawRectangle({ x: 0, y: 0, width: 595, height: 22, color: PdfService.BLEU });
        page.drawText(`Document généré le ${new Date().toLocaleDateString('fr-FR')} — CNI`, {
            x: 48,
            y: 6,
            size: 8,
            font,
            color: PdfService.BLANC,
        });
        const pdfBytes = await pdfDoc.save();
        const filePath = `uploads/projets_stage/projet_${stagiaire.id}_${Date.now()}.pdf`;
        fs_1.default.writeFileSync(filePath, pdfBytes);
        logger_1.logger.info(`📄 Fiche projet générée : ${filePath}`);
        return { path: filePath };
    }
    /**
     * Générer l'attestation de stage
     */
    static async genererAttestation(stagiaire, note, commentaire) {
        ensureDir('uploads/attestations');
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]);
        const { height } = page.getSize();
        const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
        let y = await PdfService.drawHeader(page, font, boldFont);
        y -= 30;
        // Titre centré
        page.drawText('ATTESTATION DE STAGE', { x: 140, y, size: 22, font: boldFont, color: PdfService.BLEU });
        y -= 50;
        // Corps
        const lines = [
            'Le Centre National de l\'Informatique (CNI) atteste que :',
            '',
            `M./Mme ${stagiaire.prenom?.toUpperCase()} ${stagiaire.nom?.toUpperCase()}`,
            `Étudiant(e) à : ${stagiaire.ecoleUniversite || '..........'}`,
            `Niveau : ${stagiaire.niveauEtudes || '..........'}`,
            '',
            'A effectué un stage au sein de notre entreprise :',
            '',
            `Du ${stagiaire.dateDebutStage ? new Date(stagiaire.dateDebutStage).toLocaleDateString('fr-FR') : '........'} au ${stagiaire.dateFinStage ? new Date(stagiaire.dateFinStage).toLocaleDateString('fr-FR') : '........'}`,
            `Sujet : ${stagiaire.sujetStage || '..........'}`,
            '',
            `Note finale obtenue : ${note}/5`,
            '',
            commentaire ? `Appréciation : ${commentaire}` : '',
            '',
            'Ce stage a été réalisé avec sérieux et professionnalisme.',
            'Nous lui souhaitons bonne continuation dans sa carrière.',
        ];
        lines.forEach(line => {
            if (line) {
                page.drawText(line, {
                    x: 70, y,
                    size: line.startsWith('M./Mme') || line.startsWith('Note') ? 13 : 11,
                    font: line.startsWith('M./Mme') ? boldFont : font,
                    color: PdfService.GRIS,
                });
            }
            y -= 20;
        });
        // Date et signature
        y -= 20;
        page.drawText(`Tunis, le ${new Date().toLocaleDateString('fr-FR')}`, { x: 350, y, size: 11, font, color: PdfService.GRIS });
        y -= 40;
        page.drawText('Le Directeur des Ressources Humaines', { x: 310, y, size: 10, font: boldFont, color: PdfService.GRIS });
        page.drawRectangle({ x: 310, y: y - 55, width: 180, height: 45, borderColor: (0, pdf_lib_1.rgb)(0.7, 0.7, 0.7), borderWidth: 1 });
        // Footer
        page.drawRectangle({ x: 0, y: 0, width: 595, height: 25, color: PdfService.BLEU });
        page.drawText(`Document généré le ${new Date().toLocaleDateString('fr-FR')} | CNI Stages & Formations`, {
            x: 50, y: 8, size: 8, font, color: PdfService.BLANC,
        });
        const pdfBytes = await pdfDoc.save();
        const filePath = `uploads/attestations/attestation_${stagiaire.id}_${Date.now()}.pdf`;
        fs_1.default.writeFileSync(filePath, pdfBytes);
        logger_1.logger.info(`📄 Attestation générée : ${filePath}`);
        return { path: filePath };
    }
    /**
     * Générer le certificat de formation
     */
    static async genererCertificat(employe, formation, tauxPresence) {
        ensureDir('uploads/certificats');
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const page = pdfDoc.addPage([842, 595]); // A4 paysage
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
        // Fond décoratif
        page.drawRectangle({ x: 0, y: 0, width, height, color: (0, pdf_lib_1.rgb)(0.97, 0.98, 1) });
        page.drawRectangle({ x: 15, y: 15, width: width - 30, height: height - 30, borderColor: PdfService.BLEU, borderWidth: 3 });
        page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: PdfService.ORANGE, borderWidth: 1 });
        // En-tête
        page.drawText('CNI', { x: 60, y: height - 80, size: 40, font: boldFont, color: PdfService.BLEU });
        page.drawRectangle({ x: 55, y: height - 85, width: 100, height: 3, color: PdfService.ORANGE });
        // Titre
        page.drawText('CERTIFICAT DE FORMATION', {
            x: 230, y: height - 90,
            size: 26, font: boldFont,
            color: PdfService.BLEU,
        });
        // Corps
        page.drawText('Ce certificat est décerné à', {
            x: width / 2 - 110, y: height - 160,
            size: 14, font,
            color: PdfService.GRIS,
        });
        page.drawText(`${employe.prenom} ${employe.nom}`, {
            x: width / 2 - 150, y: height - 195,
            size: 28, font: boldFont,
            color: PdfService.BLEU,
        });
        page.drawText('pour avoir complété avec succès la formation :', {
            x: width / 2 - 175, y: height - 235,
            size: 13, font,
            color: PdfService.GRIS,
        });
        page.drawText(formation.titre, {
            x: width / 2 - Math.min(formation.titre.length * 5, 300), y: height - 270,
            size: 18, font: boldFont,
            color: PdfService.ORANGE,
        });
        // Détails
        page.drawText(`Taux de présence : ${tauxPresence}%  |  Durée : ${formation.dureeHeures || ((formation.dureeJours || 1) * 8)}h`, {
            x: width / 2 - 150, y: height - 320,
            size: 12, font,
            color: PdfService.GRIS,
        });
        page.drawText(`Délivré le ${new Date().toLocaleDateString('fr-FR')}`, {
            x: width / 2 - 80, y: height - 360,
            size: 11, font,
            color: PdfService.GRIS,
        });
        // Signature
        page.drawText('Direction des Ressources Humaines - CNI', {
            x: width / 2 - 170, y: 80,
            size: 12, font: boldFont,
            color: PdfService.BLEU,
        });
        const pdfBytes = await pdfDoc.save();
        const filePath = `uploads/certificats/certificat_${employe.id}_${formation.id}_${Date.now()}.pdf`;
        fs_1.default.writeFileSync(filePath, pdfBytes);
        logger_1.logger.info(`📄 Certificat généré : ${filePath}`);
        return { path: filePath };
    }
}
exports.PdfService = PdfService;
// Couleurs CNI
PdfService.BLEU = (0, pdf_lib_1.rgb)(0.118, 0.251, 0.686); // #1e40af
PdfService.ORANGE = (0, pdf_lib_1.rgb)(0.976, 0.451, 0.086); // #f97316
PdfService.GRIS = (0, pdf_lib_1.rgb)(0.282, 0.337, 0.376); // #475569
PdfService.BLANC = (0, pdf_lib_1.rgb)(1, 1, 1);
//# sourceMappingURL=pdf.service.js.map