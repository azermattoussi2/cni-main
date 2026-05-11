import { Employe, Message } from '../models';
import type { Server as IOServer } from 'socket.io';
export declare class MessageService {
    static unreadCount(userId: number): Promise<number>;
    static markThreadRead(actorId: number, otherUserId: number): Promise<void>;
    /** Vérifie que l’expéditeur peut écrire au destinataire */
    static assertCanMessage(sender: Employe, recipient: Employe): Promise<void>;
    static listContacts(actorId: number, role: string): Promise<Employe[]>;
    static listThread(actorId: number, otherUserId: number, limit?: number): Promise<Message[]>;
    static send(actorId: number, recipientId: number, body: string, io?: IOServer): Promise<Message | null>;
}
//# sourceMappingURL=message.service.d.ts.map