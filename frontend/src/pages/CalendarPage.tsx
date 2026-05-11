// Page: CalendarPage.tsx
// Description: Calendrier FullCalendar — vue globale ou personnelle
import { useEffect, useState, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { exportPageToPdf } from '../utils/downloadPdf';
import { useAuthStore } from '../stores/authStore';

export default function CalendarPage() {
  const { user } = useAuthStore();
  const pdfRootRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canUseGlobalCalendar = user?.role !== 'Employe' && user?.role !== 'Formateur_Externe';
  const [scope, setScope] = useState<'global' | 'mine'>(canUseGlobalCalendar ? 'global' : 'mine');

  useEffect(() => {
    if (!canUseGlobalCalendar && scope !== 'mine') {
      setScope('mine');
    }
  }, [canUseGlobalCalendar, scope]);

  const loadCalendar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/reporting/calendar?scope=${scope}`);
      setEvents(res.data.data || []);
    } catch {
      setError('Impossible de charger le calendrier.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const handleExportPdf = async () => {
    const el = pdfRootRef.current;
    if (!el) return;
    const tid = toast.loading('Génération du PDF (capture de la page)...');
    try {
      const suffix = scope === 'global' ? 'calendrier-global' : 'mon-calendrier';
      await exportPageToPdf(el, `${suffix}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF téléchargé.', { id: tid });
    } catch {
      toast.error('Échec de la génération du PDF.', { id: tid });
    }
  };

  if (error && !loading && events.length === 0) {
    return <ErrorState message={error} onRetry={loadCalendar} />;
  }

  return (
    <div ref={pdfRootRef} className="space-y-6 animate-fadeIn">
      <div className="page-header flex-wrap gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="page-title">Calendrier</h1>
          <p className="page-subtitle">
            {scope === 'global'
              ? 'Calendrier global — toutes les formations et stages'
              : 'Mon calendrier — formations acceptées (ou liste d’attente), stages, engagements selon votre rôle'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {canUseGlobalCalendar && (
              <button
                type="button"
                onClick={() => setScope('global')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  scope === 'global' ? 'bg-white text-cni-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Calendrier global
              </button>
            )}
            <button
              type="button"
              onClick={() => setScope('mine')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                scope === 'mine' ? 'bg-white text-cni-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Mon calendrier
            </button>
          </div>
          <button type="button" onClick={handleExportPdf} className="btn-primary text-sm">
            <Download size={14} /> Exporter PDF
          </button>
        </div>
      </div>

      <div className="card relative min-h-[420px]">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingState message="Chargement du calendrier..." />
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView="dayGridMonth"
            locale={frLocale}
            events={events}
            height="auto"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek',
            }}
            eventColor={scope === 'global' ? '#1e40af' : '#0d9488'}
          />
        )}
      </div>
    </div>
  );
}
