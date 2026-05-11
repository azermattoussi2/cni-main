export declare const buildPublicFileUrl: (localPath?: string) => string | undefined;
export declare const resolveUploadPath: (filename: string, folder: string) => string;
/**
 * Retrouve un fichier uploadé sur le disque (chemin absolu ou relatif, CWD variable, build dist/).
 */
export declare function resolveStoredUploadPath(stored?: string | null): string | null;
//# sourceMappingURL=storage.d.ts.map