import { Request, Response, NextFunction } from 'express';
export declare class StagiaireController {
    static soumettre(req: Request, res: Response, next: NextFunction): Promise<void>;
    static soumettreInterne(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    static workflowAccept(req: Request, res: Response, next: NextFunction): Promise<void>;
    static workflowAssignProject(req: Request, res: Response, next: NextFunction): Promise<void>;
    static workflowAssignFormateur(req: Request, res: Response, next: NextFunction): Promise<void>;
    static workflowSendSchedule(req: Request, res: Response, next: NextFunction): Promise<void>;
    static workflowCloseStage(req: Request, res: Response, next: NextFunction): Promise<void>;
    static workflowSendAttestation(req: Request, res: Response, next: NextFunction): Promise<void>;
    static workflowGenerateAttestation(req: Request, res: Response, next: NextFunction): Promise<void>;
    static workflowUploadAttestation(req: Request, res: Response, next: NextFunction): Promise<void>;
    static workflowReanalyzeCv(req: Request, res: Response, next: NextFunction): Promise<void>;
    static validerRH(req: Request, res: Response, next: NextFunction): Promise<void>;
    static validerManager(req: Request, res: Response, next: NextFunction): Promise<void>;
    static signerConvention(req: Request, res: Response, next: NextFunction): Promise<void>;
    static update(req: Request, res: Response, next: NextFunction): Promise<void>;
    static envoyerRappels(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=stagiaire.controller.d.ts.map