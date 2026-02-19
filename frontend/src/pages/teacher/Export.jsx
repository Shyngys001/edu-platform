import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';
import { FiDownload, FiEye, FiX } from 'react-icons/fi';

export default function Export() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const t = useT();

  useEffect(() => {
    api.get('/teacher/students')
      .then(setStudents)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function downloadCSV() {
    try {
      const blob = await api.getBlob('/teacher/export/csv');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students_report.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch (e) {
      toast.error('Failed to download CSV');
    }
  }

  async function downloadPDF() {
    try {
      const blob = await api.getBlob('/teacher/export/pdf');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students_report.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (e) {
      toast.error('Failed to download PDF');
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{t('exportReports')}</h1>

      {/* Download cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📊</div>
          <h2 style={{ marginBottom: 8 }}>{t('csvReport')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
            {t('csvDesc')}
          </p>
          <button className="btn btn-primary" onClick={downloadCSV}><FiDownload /> {t('downloadCSV')}</button>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📄</div>
          <h2 style={{ marginBottom: 8 }}>{t('pdfReport')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
            {t('pdfDesc')}
          </p>
          <button className="btn btn-primary" onClick={downloadPDF}><FiDownload /> {t('downloadPDF')}</button>
        </div>
      </div>

      {/* Preview button */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <button
          className="btn btn-secondary"
          onClick={() => setShowPreview(!showPreview)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {showPreview ? <FiX /> : <FiEye />}
          {showPreview ? t('hidePreview') : t('showPreview')}
        </button>
      </div>

      {/* Preview table */}
      {showPreview && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('reportPreview')} ({students.length} {t('studentsCount')})</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr style={{ background: '#4F46E5', color: 'white' }}>
                  <th style={{ color: 'white' }}>#</th>
                  <th style={{ color: 'white' }}>{t('name')}</th>
                  <th style={{ color: 'white' }}>{t('username')}</th>
                  <th style={{ color: 'white' }}>{t('grade')}</th>
                  <th style={{ color: 'white' }}>{t('points')}</th>
                  <th style={{ color: 'white' }}>{t('level')}</th>
                  <th style={{ color: 'white' }}>{t('lessons')}</th>
                  <th style={{ color: 'white' }}>{t('progress')}</th>
                  <th style={{ color: 'white' }}>{t('avgScore')}</th>
                  <th style={{ color: 'white' }}>{t('streak')}</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? '#F9FAFB' : 'white' }}>
                    <td style={{ color: 'var(--text-secondary)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.username}</td>
                    <td><span className="badge badge-secondary">{s.grade || '—'}</span></td>
                    <td>{s.points}</td>
                    <td>{s.level}</td>
                    <td>{s.completed_lessons}/{s.total_lessons}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 6, background: '#E5E7EB', borderRadius: 3 }}>
                          <div style={{
                            width: `${s.progress_percent}%`, height: '100%', borderRadius: 3,
                            background: s.progress_percent >= 70 ? '#10B981' : s.progress_percent >= 40 ? '#F59E0B' : '#EF4444',
                          }} />
                        </div>
                        <span style={{ fontSize: '0.75rem' }}>{s.progress_percent}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${s.avg_test_score >= 70 ? 'success' : s.avg_test_score >= 40 ? 'warning' : 'danger'}`}>
                        {s.avg_test_score}%
                      </span>
                    </td>
                    <td>{s.streak_days}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {students.length === 0 && <div className="empty-state"><p>{t('noData')}</p></div>}
        </div>
      )}
    </div>
  );
}
