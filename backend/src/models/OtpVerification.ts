// ============================================
// Codes OTP à usage unique (inscription, candidature stage, etc.)
// ============================================

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

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

class OtpVerification extends Model<OtpVerificationAttributes, Creation> implements OtpVerificationAttributes {
  public id!: number;
  public email!: string;
  public purpose!: OtpPurpose;
  public codeHash!: string;
  public expiresAt!: Date;
  public attempts!: number;
  public consumedAt?: Date | null;
}

OtpVerification.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false },
    purpose: { type: DataTypes.ENUM('candidature', 'register'), allowNull: false },
    codeHash: { type: DataTypes.STRING(255), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    attempts: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    consumedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'otp_verifications',
    modelName: 'OtpVerification',
    indexes: [{ fields: ['email', 'purpose'] }],
  }
);

export default OtpVerification;
