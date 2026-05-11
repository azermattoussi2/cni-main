import { Model, Optional } from 'sequelize';
export type OtpPurpose = 'candidature' | 'register';
interface OtpVerificationAttributes {
    id: number;
    email: string;
    purpose: OtpPurpose;
    codeHash: string;
    expiresAt: Date;
    attempts: number;
    consumedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}
type Creation = Optional<OtpVerificationAttributes, 'id' | 'attempts' | 'consumedAt' | 'createdAt' | 'updatedAt'>;
declare class OtpVerification extends Model<OtpVerificationAttributes, Creation> implements OtpVerificationAttributes {
    id: number;
    email: string;
    purpose: OtpPurpose;
    codeHash: string;
    expiresAt: Date;
    attempts: number;
    consumedAt?: Date | null;
}
export default OtpVerification;
//# sourceMappingURL=OtpVerification.d.ts.map