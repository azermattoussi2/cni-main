// ============================================
import { Request, Response, NextFunction } from 'express';
import { OtpService } from '../services/otp.service';

export class OtpController {
  static async requestCandidature(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const data = await OtpService.requestCode(email, 'candidature');
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  static async verifyCandidature(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;
      const data = await OtpService.verifyCode(email, 'candidature', code);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  static async requestRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const data = await OtpService.requestCode(email, 'register');
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  static async verifyRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;
      const data = await OtpService.verifyCode(email, 'register', code);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  static async testSend(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const data = await OtpService.sendTestOtpEmail(email);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }
}
