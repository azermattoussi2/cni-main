import { Model, Optional } from 'sequelize';
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
declare class Message extends Model<MessageAttributes, Creation> implements MessageAttributes {
    id: number;
    senderId: number;
    recipientId: number;
    body: string;
    readAt?: Date | null;
}
export default Message;
//# sourceMappingURL=Message.d.ts.map