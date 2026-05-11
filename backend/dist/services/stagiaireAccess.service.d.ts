import { Stagiaire } from '../models';
import { JwtPayload } from '../config/jwt';
export type StagRow = InstanceType<typeof Stagiaire>;
export declare function isRh(u: JwtPayload): boolean;
export declare function isManager(u: JwtPayload): boolean;
export declare function isFormateur(u: JwtPayload): boolean;
/** Lecture / actions workflow : RH tout périmètre, Manager = département, Formateur = tuteur assigné */
export declare function assertCanAutomateStagiaire(user: JwtPayload, s: StagRow): Promise<void>;
export declare function assertProjectableStatut(s: StagRow): void;
//# sourceMappingURL=stagiaireAccess.service.d.ts.map