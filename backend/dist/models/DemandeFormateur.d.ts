import { Model, Optional } from 'sequelize';
export type StatutDemande = 'En_attente' | 'Acceptee' | 'Refusee' | 'Expiree';
export interface DemandeFormateurAttributes {
    id: number;
    formateurId: number;
    formationId: number;
    statut: StatutDemande;
    dateEnvoi: Date;
    dateLimiteReponse: Date;
    dateReponse?: Date;
    messagePersonnalise?: string;
    commentaireRefus?: string;
    compensationPrime?: number;
    compensationHeures?: number;
    badgeAttribue?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
interface DemandeCreationAttributes extends Optional<DemandeFormateurAttributes, 'id' | 'statut' | 'dateEnvoi'> {
}
declare class DemandeFormateur extends Model<DemandeFormateurAttributes, DemandeCreationAttributes> implements DemandeFormateurAttributes {
    id: number;
    formateurId: number;
    formationId: number;
    statut: StatutDemande;
    dateEnvoi: Date;
    dateLimiteReponse: Date;
    dateReponse?: Date;
    messagePersonnalise?: string;
    commentaireRefus?: string;
    compensationPrime?: number;
    compensationHeures?: number;
    badgeAttribue?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default DemandeFormateur;
//# sourceMappingURL=DemandeFormateur.d.ts.map