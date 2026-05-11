"use strict";
// ============================================
// Messages directs (messagerie interne)
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Message extends sequelize_1.Model {
}
Message.init({
    id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    senderId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false },
    recipientId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false },
    body: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    readAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
}, {
    sequelize: database_1.sequelize,
    tableName: 'messages',
    modelName: 'Message',
    indexes: [
        { fields: ['senderId', 'createdAt'] },
        { fields: ['recipientId', 'createdAt'] },
    ],
});
exports.default = Message;
//# sourceMappingURL=Message.js.map