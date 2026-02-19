import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCheck, FiPlay } from 'react-icons/fi';
import { useT } from '../../utils/i18n';

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function LessonView() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const startTime = useRef(Date.now());
  const navigate = useNavigate();
  const t = useT();

  useEffect(() => {
    api.get(`/student/lessons/${id}`)
      .then(setLesson)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function markComplete() {
    setCompleting(true);
    const seconds = Math.round((Date.now() - startTime.current) / 1000);
    try {
      const res = await api.post('/student/lessons/complete', { lesson_id: parseInt(id), time_spent_seconds: seconds });
      toast.success(t('lessonCompleted'));
      if (res.new_badges?.length) {
        res.new_badges.forEach(() => toast.success(t('badgeUnlocked'), { icon: '🏅', duration: 4000 }));
      }
      navigate('/student/lessons');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCompleting(false);
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!lesson) return <div className="empty-state"><p>{t('notFound')}</p></div>;

  const ytId = getYouTubeId(lesson.video_url);

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/student/lessons')} style={{ marginBottom: 16 }}>
        <FiArrowLeft /> {t('backToLessons')}
      </button>

      <div className="card" style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 16 }}>{lesson.title}</h1>

        {/* Embedded YouTube video */}
        {ytId && (
          <div style={{
            position: 'relative', width: '100%', paddingBottom: '56.25%',
            marginBottom: 24, borderRadius: 12, overflow: 'hidden',
            background: '#000',
          }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?rel=0`}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        )}

        {/* Non-YouTube video link fallback */}
        {lesson.video_url && !ytId && (
          <div style={{ margin: '16px 0' }}>
            <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              <FiPlay /> {t('watchVideo')}
            </a>
          </div>
        )}

        {/* Image */}
        {lesson.image_url && (
          <div style={{ margin: '16px 0' }}>
            <img src={lesson.image_url} alt={lesson.title} style={{ maxWidth: '100%', borderRadius: 8 }} />
          </div>
        )}

        <MarkdownRenderer content={lesson.content} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-success" onClick={markComplete} disabled={completing}>
          <FiCheck /> {completing ? t('saving') : t('markCompleted')}
        </button>
      </div>
    </div>
  );
}
