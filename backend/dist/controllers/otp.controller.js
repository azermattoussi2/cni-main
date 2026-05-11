"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpController = void 0;
const otp_service_1 = require("../services/otp.service");
class OtpController {
    static async requestCandidature(req, res, next) {
        try {
            const { email } = req.body;
            const data = await otp_service_1.OtpService.requestCode(email, 'candidature');
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async verifyCandidature(req, res, next) {
        try {
            const { email, code } = req.body;
            const data = await otp_service_1.OtpService.verifyCode(email, 'candidature', code);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async requestRegister(req, res, next) {
        try {
            const { email } = req.body;
            const data = await otp_service_1.OtpService.requestCode(email, 'register');
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async verifyRegister(req, res, next) {
        try {
            const { email, code } = req.body;
            const data = await otp_service_1.OtpService.verifyCode(email, 'register', code);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async testSend(req, res, next) {
        try {
            const { email } = req.body;
            const data = await otp_service_1.OtpService.sendTestOtpEmail(email);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
}
exports.OtpController = OtpController;
//# sourceMappingURL=otp.controller.js.map