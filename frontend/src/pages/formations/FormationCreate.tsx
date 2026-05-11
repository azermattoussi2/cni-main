// ============================================
// Fichier : pages/formations/FormationCreate.tsx
// ============================================
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function FormationCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(false);
  const [form, setForm] = useState({
    titre: '', description: '', domaine: 'Informatique', type: 'Interne',
    niveau: 'Intermédiaire', dureeJours: '', dureeHeures: '',
    dateDebut: '', dateFin: '', lieu: '', maxParticipants: '',
    cout: '', objectifs: '', programme: '', lienVisio: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const toLocalDateTimeInput = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  useEffect(() => {
    if (!isEditMode || !id) return;
    setLoadingInitialData(true);
    api.get(`/formations/${id}`)
      .then((res) => {
        const data = res.data?.data;
        if (!data) return;
        setForm({
          titre: data.titre ?? '',
          description: data.description ?? '',
          domaine: data.domaine ?? 'Informatique',
          type: data.type ?? 'Interne',
          niveau: data.niveau ?? 'Intermédiaire',
          dureeJours: data.dureeJours != null ? String(data.dureeJours) : '',
          dureeHeures: data.dureeHeures != null ? String(data.dureeHeures) : '',
          dateDebut: toLocalDateTimeInput(data.dateDebut),
          dateFin: toLocalDateTimeInput(data.dateFin),
          lieu: data.lieu ?? '',
          maxParticipants: data.maxParticipants != null ? String(data.maxParticipants) : '',
          cout: data.cout != null ? String(data.cout) : '',
          objectifs: data.objectifs ?? '',
          programme: data.programme ?? '',
          lienVisio: data.lienVisio ?? '',
        });
      })
      .catch(() => {
        toast.error('Impossible de charger les données de la formation');
      })
      .finally(() => setLoadingInitialData(false));
  }, [id, isEditMode]);

  const handleSubmit = async (publish = false) => {
    if (!form.titre) { toast.error('Le titre est requis'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        dureeJours: form.dureeJours ? parseInt(form.dureeJours) : undefined,
        dureeHeures: form.dureeHeures ? parseInt(form.dureeHeures) : undefined,
        maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : undefined,
        cout: form.cout ? parseFloat(form.cout) : 0,
      };

      const res = isEditMode && id
        ? await api.put(`/formations/${id}`, payload)
        : await api.post('/formations', payload);

      const formationId = isEditMode && id ? Number(id) : res.data.data.id;

      if (publish && formationId) {
        await api.post(`/formations/${formationId}/publier`, {});
        toast.success(isEditMode ? 'Formation modifiée et publiée !' : 'Formation créée et publiée !');
      } else {
        toast.success(isEditMode ? 'Formation modifiée avec succès' : 'Formation sauvegardée en brouillon');
      }
      navigate('/app/formations');
    } catch (e: any) {
      toast.error(e.response?.data?.message || (isEditMode ? 'Erreur modification' : 'Erreur création'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl">
      <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <button onClick={() => navigate('/app/formations')} className="btn-secondary text-sm"><ArrowLeft size={14} /> Retour</button>
        <div>
          <h1 className="page-title">{isEditMode ? 'Modifier la formation' : 'Créer une formation'}</h1>
          <p className="page-subtitle">{isEditMode ? 'Mettez à jour les informations existantes' : 'Planification pédagogique, budget et publication'}</p>
        </div>
      </div>

      <div className="card space-y-5 shadow-sm border border-gray-100">
        {loadingInitialData && (
          <div className="text-sm text-gray-500">Chargement des données existantes...</div>
        )}
        <div>
          <label className="label">Titre *</label>
          <input value={form.titre} onChange={e => set('titre', e.target.value)} className="input" placeholder="React 18 & TypeScript Avancé" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="input resize-none" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Domaine *</label>
            <select value={form.domaine} onChange={e => set('domaine', e.target.value)} className="input">
              {['Informatique','Management','Communication','Finance','RH','Securite','Langue','Technique','Autre'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type *</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} className="input">
              {['Interne','Externe','E_learning','Mixte','Certification'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Niveau</label>
            <select value={form.niveau} onChange={e => set('niveau', e.target.value)} className="input">
              {['Débutant','Intermédiaire','Avancé','Expert'].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Durée (jours)</label>
            <input type="number" value={form.dureeJours} onChange={e => set('dureeJours', e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Durée (heures)</label>
            <input type="number" value={form.dureeHeures} onChange={e => set('dureeHeures', e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Date de début</label>
            <input type="datetime-local" value={form.dateDebut} onChange={e => set('dateDebut', e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Date de fin</label>
            <input type="datetime-local" value={form.dateFin} onChange={e => set('dateFin', e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Lieu</label>
            <input value={form.lieu} onChange={e => set('lieu', e.target.value)} className="input" placeholder="Salle A, CNI Tunis" />
          </div>
          <div>
            <label className="label">Places max</label>
            <input type="number" value={form.maxParticipants} onChange={e => set('maxParticipants', e.target.value)} className="input" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Coût total (TND)</label>
            <input type="number" value={form.cout} onChange={e => set('cout', e.target.value)} className="input" placeholder="0 = Gratuit" />
          </div>
          <div>
            <label className="label">Lien visioconférence</label>
            <input value={form.lienVisio} onChange={e => set('lienVisio', e.target.value)} className="input" placeholder="https://zoom.us/..." />
          </div>
        </div>
        <div>
          <label className="label">Objectifs</label>
          <textarea value={form.objectifs} onChange={e => set('objectifs', e.target.value)} rows={3} className="input resize-none" />
        </div>
        <div>
          <label className="label">Programme</label>
          <textarea value={form.programme} onChange={e => set('programme', e.target.value)} rows={4} className="input resize-none" placeholder="Jour 1: ...\nJour 2: ..." />
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button onClick={() => handleSubmit(false)} disabled={loading} className="btn-secondary">
            <Save size={14} /> {isEditMode ? 'Enregistrer les modifications' : 'Sauvegarder brouillon'}
          </button>
          <button onClick={() => handleSubmit(true)} disabled={loading} className="btn-primary">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isEditMode ? '🚀 Enregistrer et publier' : '🚀 Créer et publier')}
          </button>
        </div>
      </div>
    </div>
  );
}
