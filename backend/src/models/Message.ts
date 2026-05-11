// ============================================
// Messages directs (messagerie interne)
// ============================================

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface MessageAttributes {
  id: number;
  senderId: number;
  recipientId: number;
  body: string;
  readAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<MessageAttributes, 'id' | 'readAt' | 'createdAt' | 'updatedAt'>;

class Message extends Model<MessageAttributes, Creation> implements MessageAttributes {
  public id!: number;
  public senderId!: number;
  public recipientId!: number;
  public body!: string;
  public readAt?: Date | null;
}

Message.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    senderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    recipientId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    readAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'messages',
    modelName: 'Message',
    indexes: [
      { fields: ['senderId', 'createdAt'] },
      { fields: ['recipientId', 'createdAt'] },
    ],
  }
);

export default Message;
