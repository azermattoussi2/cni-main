export interface JwtPayload {
    id: number;
    email: string;
    role: string;
    departementId?: number;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
/**
 * Génère une paire de tokens (access + refresh)
 */
export declare const generateTokens: (payload: JwtPayload) => TokenPair;
/**
 * Vérifie et décode un access token
 */
export declare const verifyAccessToken: (token: string) => JwtPayload;
/**
 * Vérifie et décode un refresh token
 */
export declare const verifyRefreshToken: (token: string) => {
    id: number;
};
//# sourceMappingURL=jwt.d.ts.map