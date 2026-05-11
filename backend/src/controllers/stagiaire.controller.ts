import { Request, Response, NextFunction } from 'express';
import { StagiaireService } from '../services/stagiaire.service';
import { StagiaireWorkflowService } from '../services/stagiaireWorkflow.service';

export class StagiaireController {
  // Candidature publique (sans auth)
  static async soumettre(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as any;
      const stagiaire = await StagiaireService.soumettreCandidature(req.body, files);
      res.status(201).json({ success: true, message: 'Candidature soumise avec succès.', data: stagiaire });
    } catch (e) { next(e); }
  }

  static async soumettreInterne(req: Request, res: Response, next: NextFunction) {
    try {
      const stagiaire = await StagiaireService.soumettreCandidature(req.body, undefined, {
        skipOtpVerification: true,
        skipCvRequirement: true,
      });
      res.status(201).json({ success: true, message: 'Candidature interne créée avec succès.', data: stagiaire });
    } catch (e) { next(e); }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await StagiaireService.getAll(req.query, req.user ?? null);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await StagiaireService.getById(parseInt(req.params.id), req.user ?? null);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async workflowAccept(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await StagiaireWorkflowService.accept(req.user!, parseInt(req.params.id, 10), req.body);
      res.json({ success: true, ...out });
    } catch (e) { next(e); }
  }

  static async workflowAssignProject(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await StagiaireWorkflowService.assignProject(req.user!, parseInt(req.params.id, 10), req.body);
      res.json({ success: true, ...out });
    } catch (e) { next(e); }
  }

  static async workflowAssignFormateur(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await StagiaireWorkflowService.assignFormateur(req.user!, parseInt(req.params.id, 10), req.body);
      res.json({ success: true, ...out });
    } catch (e) { next(e); }
  }

  static async workflowSendSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await StagiaireWorkflowService.sendSchedule(req.user!, parseInt(req.params.id, 10), req.body || {});
      res.json({ success: true, ...out });
    } catch (e) { next(e); }
  }

  static async workflowCloseStage(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await StagiaireWorkflowService.closeStage(req.user!, parseInt(req.params.id, 10), req.body || {});
      res.json({ success: true, ...out });
    } catch (e) { next(e); }
  }

  static async workflowSendAttestation(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await StagiaireWorkflowService.sendAttestation(req.user!, parseInt(req.params.id, 10));
      res.json({ success: true, ...out });
    } catch (e) { next(e); }
  }

  static async workflowGenerateAttestation(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await StagiaireWorkflowService.generateAttestation(req.user!, parseInt(req.params.id, 10));
      res.json({ success: true, ...out });
    } catch (e) { next(e); }
  }

  static async workflowUploadAttestation(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await StagiaireWorkflowService.uploadAttestation(
        req.user!,
        parseInt(req.params.id, 10),
        req.file?.path
      );
      res.json({ success: true, ...out });
    } catch (e) { next(e); }
  }

  static async workflowReanalyzeCv(req: Request, res: Response, next: NextFunction) {
    try {
      const out = await StagiaireWorkflowService.reanalyzeCv(req.user!, parseInt(req.params.id, 10));
      res.json({ success: true, ...out });
    } catch (e) { next(e); }
  }

  static async validerRH(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, commentaire } = req.body;
      const result = await StagiaireService.validerRH(parseInt(req.params.id), action, commentaire);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  static async validerManager(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StagiaireService.validerManager(
        parseInt(req.params.id),
        req.user!.id,
        req.body.action,
        req.body
      );
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  static async signerConvention(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StagiaireService.signerConvention(parseInt(req.params.id), req.user!);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await StagiaireService.update(parseInt(req.params.id), req.body);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async envoyerRappels(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StagiaireService.envoyerRappels();
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }
}
