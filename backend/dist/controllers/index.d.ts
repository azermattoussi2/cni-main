import { Request, Response, NextFunction } from 'express';
export declare class FormateurController {
    static getFormateursInternes(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getByIdInterne(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createInterne(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateInterne(req: Request, res: Response, next: NextFunction): Promise<void>;
    static inscrire(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getDashboard(req: Request, res: Response, next: NextFunction): Promise<void>;
    static notifierOpportunite(req: Request, res: Response, next: NextFunction): Promise<void>;
    static repondreOpportunite(req: Request, res: Response, next: NextFunction): Promise<void>;
    static attribuerBadges(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare class ReportingController {
    static calendar(req: Request, res: Response, next: NextFunction): Promise<void>;
    static dashboardRH(req: Request, res: Response, next: NextFunction): Promise<void>;
    static dashboardManager(req: Request, res: Response, next: NextFunction): Promise<void>;
    static dashboardEmploye(req: Request, res: Response, next: NextFunction): Promise<void>;
    static dashboardTuteur(req: Request, res: Response, next: NextFunction): Promise<void>;
    static rapportHebdo(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare class DepartementController {
    static getPublic(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    static create(req: Request, res: Response, next: NextFunction): Promise<void>;
    static update(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare class EmployeController {
    static getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createRh(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateRh(req: Request, res: Response, next: NextFunction): Promise<void>;
    static setActifRh(req: Request, res: Response, next: NextFunction): Promise<void>;
    static setArchivedRh(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createManager(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateManager(req: Request, res: Response, next: NextFunction): Promise<void>;
    static setActifManager(req: Request, res: Response, next: NextFunction): Promise<void>;
    static setArchivedManager(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare class MessageController {
    static contacts(req: Request, res: Response, next: NextFunction): Promise<void>;
    static thread(req: Request, res: Response, next: NextFunction): Promise<void>;
    static unreadCount(req: Request, res: Response, next: NextFunction): Promise<void>;
    static send(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map