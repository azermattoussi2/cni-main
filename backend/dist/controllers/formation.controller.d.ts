import { Request, Response, NextFunction } from 'express';
export declare class FormationController {
    static getPublicCatalog(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /formations/inscriptions/en-attente */
    static listInscriptionsEnAttente(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    static create(req: Request, res: Response, next: NextFunction): Promise<void>;
    static update(req: Request, res: Response, next: NextFunction): Promise<void>;
    static publier(req: Request, res: Response, next: NextFunction): Promise<void>;
    static demanderInscription(req: Request, res: Response, next: NextFunction): Promise<void>;
    static validerInscriptionManager(req: Request, res: Response, next: NextFunction): Promise<void>;
    static validerInscriptionRH(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** POST …/inscriptions/:id/accept — corps optionnel : { commentaire? } */
    static acceptInscription(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** POST …/inscriptions/:id/reject */
    static rejectInscription(req: Request, res: Response, next: NextFunction): Promise<void>;
    static genererCertificat(req: Request, res: Response, next: NextFunction): Promise<void>;
    static verifierBudgets(req: Request, res: Response, next: NextFunction): Promise<void>;
    static envoyerRappels(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=formation.controller.d.ts.map