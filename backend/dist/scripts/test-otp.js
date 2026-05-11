"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const otp_service_1 = require("../services/otp.service");
dotenv_1.default.config();
async function main() {
    const argEmail = process.argv[2]?.trim();
    const envEmail = process.env.OTP_TEST_EMAIL?.trim();
    const email = argEmail || envEmail;
    if (!email) {
        console.error('Usage: npm run test:otp -- votre.email@example.com');
        console.error('Ou définir OTP_TEST_EMAIL dans .env');
        process.exit(1);
    }
    await otp_service_1.OtpService.sendTestOtpEmail(email);
    console.log(`OTP test envoyé vers: ${email}`);
}
void main().catch((err) => {
    console.error('Échec test OTP:', err?.message || err);
    process.exit(1);
});
//# sourceMappingURL=test-otp.js.map