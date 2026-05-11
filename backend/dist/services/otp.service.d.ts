import type { OtpPurpose } from '../models/OtpVerification';
export interface OtpProofPayload {
    sub: 'otp-proof';
    email: string;
    purpose: OtpPurpose;
    iss: string;
}
export declare function verifyOtpProofToken(token: string, expectedEmail: string, expectedPurpose: OtpPurpose): void;
export declare class OtpService {
    static requestCode(email: string, purpose: OtpPurpose): Promise<{
        sent: boolean;
    }>;
    /** Endpoint/script de test manuel SMTP/OTP (sans persistance en base). */
    static sendTestOtpEmail(email: string): Promise<{
        sent: boolean;
    }>;
    static verifyCode(email: string, purpose: OtpPurpose, code: string): Promise<{
        otpVerificationToken: string;
    }>;
}
//# sourceMappingURL=otp.service.d.ts.map