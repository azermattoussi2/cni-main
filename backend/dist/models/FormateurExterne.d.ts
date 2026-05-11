import { Model, Optional } from 'sequelize';
export interface FormateurExterneAttributes {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    societe?: string;
    specialites?: string;
    cv?: string;
    tarifJournalier?: number;
    tarifHoraire?: number;
    disponible: boolean;
    note?: number;
    nbFormations: number;
    historiqueFormations?: string;
    contratPath?: string;
    rib?: string;
    isActif: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
interface FormateurExterneCreationAttributes extends Optional<FormateurExterneAttributes, 'id' | 'disponible' | 'nbFormations' | 'isActif'> {
}
declare class FormateurExterne extends Model<FormateurExterneAttributes, FormateurExterneCreationAttributes> implements FormateurExterneAttributes {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    societe?: string;
    specialites?: string;
    cv?: string;
    tarifJournalier?: number;
    tarifHoraire?: number;
    disponible: boolean;
    note?: number;
    nbFormations: number;
    historiqueFormations?: string;
    contratPath?: string;
    rib?: string;
    isActif: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default FormateurExterne;
//# sourceMappingURL=FormateurExterne.d.ts.map