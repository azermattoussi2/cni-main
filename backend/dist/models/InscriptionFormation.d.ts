import { Model, Optional } from 'sequelize';
export type StatutInscription = 'En_attente_manager' | 'En_attente_RH' | 'Validee' | 'Refusee' | 'Liste_attente' | 'Annulee' | 'Terminee';
export interface InscriptionFormationAttributes {
    id: number;
    employeId: number;
    formationId: number;
    statut: StatutInscription;
    dateDemandeEmploye: Date;
    dateValidationManager?: Date;
    dateValidationRH?: Date;
    managerId?: number;
    commentaireManager?: string;
    commentaireRH?: string;
    commentaireRefus?: string;
    tauxPresence?: number;
    noteSatisfaction?: number;
    commentaireSatisfaction?: string;
    certificationObtenue: boolean;
    certificatPath?: string;
    dateEnvoiCertificat?: Date;
    coutReel?: number;
    budgetDepartementImpacte: boolean;
    rappelJ7Envoye: boolean;
    rappelJ2Envoye: boolean;
    rappelJ1Envoye: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
interface InscriptionCreationAttributes extends Optional<InscriptionFormationAttributes, 'id' | 'statut' | 'dateDemandeEmploye' | 'certificationObtenue' | 'budgetDepartementImpacte' | 'rappelJ7Envoye' | 'rappelJ2Envoye' | 'rappelJ1Envoye'> {
}
declare class InscriptionFormation extends Model<InscriptionFormationAttributes, InscriptionCreationAttributes> implements InscriptionFormationAttributes {
    id: number;
    employeId: number;
    formationId: number;
    statut: StatutInscription;
    dateDemandeEmploye: Date;
    dateValidationManager?: Date;
    dateValidationRH?: Date;
    managerId?: number;
    commentaireManager?: string;
    commentaireRH?: string;
    commentaireRefus?: string;
    tauxPresence?: number;
    noteSatisfaction?: number;
    commentaireSatisfaction?: string;
    certificationObtenue: boolean;
    certificatPath?: string;
    dateEnvoiCertificat?: Date;
    coutReel?: number;
    budgetDepartementImpacte: boolean;
    rappelJ7Envoye: boolean;
    rappelJ2Envoye: boolean;
    rappelJ1Envoye: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default InscriptionFormation;
//# sourceMappingURL=InscriptionFormation.d.ts.map