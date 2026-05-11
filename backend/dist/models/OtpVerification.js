"use strict";
// ============================================
// Codes OTP à usage unique (inscription, candidature stage, etc.)
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class OtpVerification extends sequelize_1.Model {
}
OtpVerification.init({
    id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    purpose: { type: sequelize_1.DataTypes.ENUM('candidature', 'register'), allowNull: false },
    codeHash: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    expiresAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    attempts: { type: sequelize_1.DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    consumedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
}, {
    sequelize: database_1.sequelize,
    tableName: 'otp_verifications',
    modelName: 'OtpVerification',
    indexes: [{ fields: ['email', 'purpose'] }],
});
exports.default = OtpVerification;
//# sourceMappingURL=OtpVerification.js.map