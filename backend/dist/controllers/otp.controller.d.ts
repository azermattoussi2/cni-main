import { Request, Response, NextFunction } from 'express';
export declare class OtpController {
    static requestCandidature(req: Request, res: Response, next: NextFunction): Promise<void>;
    static verifyCandidature(req: Request, res: Response, next: NextFunction): Promise<void>;
    static requestRegister(req: Request, res: Response, next: NextFunction): Promise<void>;
    static verifyRegister(req: Request, res: Response, next: NextFunction): Promise<void>;
    static testSend(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=otp.controller.d.ts.map