import { useLang } from '../utils/i18n';

const flags = { en: '🇬🇧', ru: '🇷🇺', kz: '🇰🇿' };
const labels = { en: 'EN', ru: 'RU', kz: 'KZ' };

export default function LangSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div style={{ display: 'flex', gap: 2, background: 'var(--bg)', borderRadius: 8, padding: 2, flex: 1 }}>
      {Object.keys(flags).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: '5px 8px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            flex: 1,
            background: lang === l ? 'var(--primary)' : 'transparent',
            color: lang === l ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}
        >
          {flags[l]} {labels[l]}
        </button>
      ))}
    </div>
  );
}
