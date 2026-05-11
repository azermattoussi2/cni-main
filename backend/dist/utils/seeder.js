"use strict";
// ============================================
// Fichier : utils/seeder.ts
// Description : Données de test pour démo PFE
// Exécuter : npm run seed
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const models_1 = require("../models");
const logger_1 = require("../config/logger");
const seed = async () => {
    await (0, database_1.connectDB)();
    logger_1.logger.info('🌱 Début du seeding...');
    // 1. Départements
    const depts = await models_1.Departement.bulkCreate([
        { nom: 'Développement Logiciel', code: 'DEV', budgetFormationAnnuel: 50000, budgetUtilise: 12000, budgetRestant: 38000, effectif: 25 },
        { nom: 'Infrastructure & Réseaux', code: 'INF', budgetFormationAnnuel: 40000, budgetUtilise: 32000, budgetRestant: 8000, effectif: 15 },
        { nom: 'Ressources Humaines', code: 'RH', budgetFormationAnnuel: 30000, budgetUtilise: 5000, budgetRestant: 25000, effectif: 10 },
        { nom: 'Direction Générale', code: 'DG', budgetFormationAnnuel: 20000, budgetUtilise: 3000, budgetRestant: 17000, effectif: 5 },
        { nom: 'Cybersécurité', code: 'SEC', budgetFormationAnnuel: 45000, budgetUtilise: 41000, budgetRestant: 4000, effectif: 12 },
    ], { updateOnDuplicate: ['nom'] });
    logger_1.logger.info(`✅ ${depts.length} départements créés`);
    // 2. Employés (6 rôles différents)
    const employesData = [
        // Direction RH
        { nom: 'Mansouri', prenom: 'mansouri', email: 'rh@cni.tn', motDePasse: 'password123', role: 'Direction_RH', departementId: 3, poste: 'Directrice RH', matricule: 'CNI-001' },
        // Manager DEV
        { nom: 'Ben Salem', prenom: 'Karim', email: 'manager.dev@cni.tn', motDePasse: 'password123', role: 'Manager', departementId: 1, poste: 'Chef de Département Dev', matricule: 'CNI-002' },
        // Manager INF
        { nom: 'Trabelsi', prenom: 'Sonia', email: 'manager.inf@cni.tn', motDePasse: 'password123', role: 'Manager', departementId: 2, poste: 'Chef Infrastructure', matricule: 'CNI-003' },
        // Employés
        { nom: 'Chaabane', prenom: 'Ahmed', email: 'ahmed@cni.tn', motDePasse: 'password123', role: 'Employe', departementId: 1, poste: 'Développeur Full Stack', matricule: 'CNI-010',
            estFormateur: true, domainesCompetences: '["JavaScript","React","Node.js"]', disponibiliteHeures: 8, totalHeuresFormation: 24, noteFormateur: 4.5 },
        { nom: 'Zouari', prenom: 'Leila', email: 'leila@cni.tn', motDePasse: 'password123', role: 'Employe', departementId: 2, poste: 'Administratrice Systèmes', matricule: 'CNI-011' },
        { nom: 'Hamdi', prenom: 'Youssef', email: 'youssef@cni.tn', motDePasse: 'password123', role: 'Employe', departementId: 5, poste: 'Expert Cybersécurité', matricule: 'CNI-012',
            estFormateur: true, domainesCompetences: '["Cybersécurité","Linux","Pentest"]', disponibiliteHeures: 12 },
        // Formateur Externe
        { nom: 'Dupont', prenom: 'Jean', email: 'formateur@example.com', motDePasse: 'password123', role: 'Formateur_Externe', poste: 'Consultant Agile', matricule: 'EXT-001' },
    ];
    // bulkCreate ne déclenche pas les hooks beforeCreate par défaut.
    // On hash donc explicitement pour garantir un login valide.
    const employesHashed = await Promise.all(employesData.map(async (e) => ({
        ...e,
        motDePasse: await bcryptjs_1.default.hash(e.motDePasse, 12),
    })));
    const employes = await models_1.Employe.bulkCreate(employesHashed, {
        updateOnDuplicate: ['nom', 'prenom', 'motDePasse', 'role', 'departementId', 'poste', 'matricule'],
    });
    logger_1.logger.info(`✅ ${employes.length} employés créés`);
    // Récupérer les IDs fiables après upsert
    const employesDb = await models_1.Employe.findAll({
        where: {
            email: [
                'rh@cni.tn',
                'manager.dev@cni.tn',
                'manager.inf@cni.tn',
                'ahmed@cni.tn',
                'leila@cni.tn',
                'youssef@cni.tn',
                'formateur@example.com',
            ],
        },
    });
    const employeByEmail = new Map(employesDb.map((e) => [e.email, e]));
    const mustId = (email) => {
        const id = employeByEmail.get(email)?.id;
        if (!id)
            throw new Error(`Employé introuvable après seeding: ${email}`);
        return id;
    };
    // Mettre à jour responsables départements
    await models_1.Departement.update({ responsableId: mustId('manager.dev@cni.tn') }, { where: { code: 'DEV' } });
    await models_1.Departement.update({ responsableId: mustId('manager.inf@cni.tn') }, { where: { code: 'INF' } });
    await models_1.Departement.update({ responsableId: mustId('rh@cni.tn') }, { where: { code: 'RH' } });
    // 3. Formations
    const formations = await models_1.Formation.bulkCreate([
        {
            titre: 'React 18 & TypeScript - Développement Frontend Avancé',
            description: 'Maîtriser React 18 avec hooks, context, et TypeScript pour des applications robustes.',
            domaine: 'Informatique', type: 'Interne', niveau: 'Avancé',
            dureeJours: 3, dureeHeures: 21, cout: 0, coutParParticipant: 0,
            dateDebut: new Date(Date.now() + 7 * 24 * 3600000),
            dateFin: new Date(Date.now() + 10 * 24 * 3600000),
            lieu: 'Salle de Formation A, CNI Tunis',
            maxParticipants: 12, nbInscrits: 4,
            statut: 'Publiee', formateurId: mustId('ahmed@cni.tn'),
            objectifs: 'Créer des applications React 18 professionnelles avec TypeScript',
            programme: 'Jour 1: Hooks avancés\nJour 2: State management\nJour 3: Tests et déploiement',
        },
        {
            titre: 'Cybersécurité - Pentest & Ethical Hacking',
            description: 'Techniques de tests d\'intrusion et sécurité des systèmes.',
            domaine: 'Securite', type: 'Interne', niveau: 'Expert',
            dureeJours: 5, dureeHeures: 35, cout: 0,
            dateDebut: new Date(Date.now() + 14 * 24 * 3600000),
            dateFin: new Date(Date.now() + 19 * 24 * 3600000),
            lieu: 'Lab Sécurité, CNI Tunis',
            maxParticipants: 8, nbInscrits: 2,
            statut: 'Publiee', formateurId: mustId('youssef@cni.tn'),
        },
        {
            titre: 'Management & Leadership - Gestion d\'Équipe',
            description: 'Développer ses compétences managériales et de leadership.',
            domaine: 'Management', type: 'Externe', niveau: 'Intermédiaire',
            dureeJours: 2, dureeHeures: 14, cout: 2500, coutParParticipant: 350,
            dateDebut: new Date(Date.now() + 21 * 24 * 3600000),
            dateFin: new Date(Date.now() + 23 * 24 * 3600000),
            lieu: 'Hôtel Laico, Tunis',
            maxParticipants: 20, nbInscrits: 7,
            statut: 'Publiee', formateurNom: 'Jean Dupont - Consultant Senior',
        },
        {
            titre: 'DevOps - Docker, Kubernetes & CI/CD',
            description: 'Automatisation du déploiement avec les outils DevOps modernes.',
            domaine: 'Informatique', type: 'E_learning', niveau: 'Avancé',
            dureeJours: 4, dureeHeures: 28, cout: 1200,
            dateDebut: new Date(Date.now() + 30 * 24 * 3600000),
            dateFin: new Date(Date.now() + 34 * 24 * 3600000),
            lieu: 'En ligne (Zoom)',
            maxParticipants: 30, nbInscrits: 12,
            statut: 'Publiee',
            lienVisio: 'https://zoom.us/j/demo',
        },
        {
            titre: 'Communication Professionnelle en Anglais',
            description: 'Améliorer sa communication orale et écrite en contexte professionnel.',
            domaine: 'Langue', type: 'Externe', niveau: 'Intermédiaire',
            dureeJours: 10, dureeHeures: 30, cout: 3000, coutParParticipant: 300,
            statut: 'Brouillon',
        },
    ], { updateOnDuplicate: ['titre'] });
    logger_1.logger.info(`✅ ${formations.length} formations créées`);
    // 4. Stagiaires
    const stagiaires = await models_1.Stagiaire.bulkCreate([
        {
            nom: 'Ben Amor', prenom: 'Sara', email: 'sara.benamor@esprit.tn',
            telephone: '+216 55 123 456',
            ecoleUniversite: 'ESPRIT - École Supérieure Privée d\'Ingénierie',
            niveauEtudes: 'Master_2', specialite: 'Génie Logiciel',
            departementId: depts[0].id, tuteurId: mustId('ahmed@cni.tn'),
            dateDebutStage: new Date('2026-03-01'), dateFinStage: new Date('2026-08-31'),
            dureeStage: 26, typeStage: 'PFE',
            sujetStage: 'Développement d\'une plateforme de gestion RH avec React et Node.js',
            statut: 'En_cours', conventionSignee: true,
            rgpdConsenti: true, motivation: 'Je souhaite acquérir une expérience professionnelle solide.',
        },
        {
            nom: 'Mejri', prenom: 'Amine', email: 'amine.mejri@insat.tn',
            telephone: '+216 22 987 654',
            ecoleUniversite: 'INSAT - Institut National des Sciences Appliquées',
            niveauEtudes: 'Ingenieur', specialite: 'Réseaux & Télécommunications',
            departementId: depts[1].id, tuteurId: mustId('leila@cni.tn'),
            dateDebutStage: new Date('2026-04-01'), dateFinStage: new Date('2026-09-30'),
            dureeStage: 26, typeStage: 'PFE',
            sujetStage: 'Mise en place d\'une infrastructure Zero Trust Security',
            statut: 'Accepte', conventionSignee: false,
            rgpdConsenti: true,
        },
        {
            nom: 'Haddad', prenom: 'Nour', email: 'nour.haddad@fst.tn',
            telephone: '+216 99 456 789',
            ecoleUniversite: 'FST - Faculté des Sciences de Tunis',
            niveauEtudes: 'Licence_3', specialite: 'Informatique',
            departementId: depts[0].id,
            dateDebutStage: new Date('2026-07-01'), dateFinStage: new Date('2026-08-31'),
            dureeStage: 8, typeStage: 'PFA',
            sujetStage: 'Analyse de données avec Python et Pandas',
            statut: 'En_attente',
            rgpdConsenti: true,
        },
        {
            nom: 'Khelifi', prenom: 'Hamza', email: 'hamza.khelifi@isamm.tn',
            ecoleUniversite: 'ISAMM - Institut Supérieur des Arts Multimédias',
            niveauEtudes: 'Master_1', specialite: 'UX/UI Design',
            departementId: depts[0].id,
            statut: 'Refuse',
            rgpdConsenti: true,
            commentaireRefus: 'Poste non disponible pour cette période',
        },
    ], { updateOnDuplicate: ['email'] });
    logger_1.logger.info(`✅ ${stagiaires.length} stagiaires créés`);
    // 5. Inscriptions formations
    await models_1.InscriptionFormation.bulkCreate([
        { employeId: mustId('ahmed@cni.tn'), formationId: formations[1].id, statut: 'Validee', dateDemandeEmploye: new Date(), dateValidationManager: new Date(), dateValidationRH: new Date(), managerId: mustId('manager.dev@cni.tn') },
        { employeId: mustId('leila@cni.tn'), formationId: formations[0].id, statut: 'En_attente_manager', dateDemandeEmploye: new Date() },
        { employeId: mustId('youssef@cni.tn'), formationId: formations[2].id, statut: 'En_attente_RH', dateDemandeEmploye: new Date(), dateValidationManager: new Date(), managerId: mustId('manager.dev@cni.tn') },
    ], { updateOnDuplicate: ['employeId', 'formationId'] });
    logger_1.logger.info('✅ Inscriptions créées');
    logger_1.logger.info(`
╔══════════════════════════════════════════════════════╗
║          🌱 SEEDING TERMINÉ AVEC SUCCÈS !            ║
╠══════════════════════════════════════════════════════╣
║  Comptes de démonstration :                          ║
║                                                      ║
║  👩‍💼 Direction RH :                                   ║
║     Email    : rh@cni.tn                            ║
║     Password : password123                           ║
║                                                      ║
║  👨‍💼 Manager :                                        ║
║     Email    : manager.dev@cni.tn                   ║
║     Password : password123                           ║
║                                                      ║
║  👨‍💻 Employé :                                        ║
║     Email    : ahmed@cni.tn                         ║
║     Password : password123                           ║
╚══════════════════════════════════════════════════════╝
  `);
    process.exit(0);
};
seed().catch(err => {
    logger_1.logger.error('❌ Erreur seeding:', err);
    process.exit(1);
});
//# sourceMappingURL=seeder.js.map