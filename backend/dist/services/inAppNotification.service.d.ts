export interface InAppNotificationItem {
    id: string;
    title: string;
    description: string;
    href: string;
    kind: 'info' | 'warning' | 'success';
}
export declare class InAppNotificationService {
    static list(userId: number, role: string): Promise<InAppNotificationItem[]>;
}
//# sourceMappingURL=inAppNotification.service.d.ts.map