/**
 * ProficiencyCard.jsx — redesigned to match the planned layout:
 *
 *  📚 WordShelf                          April 2026
 *  [Avatar]  username / Member since …
 *  ─── Reading Intelligence ─── Score 🧠 342   🔥 Streak: 7 days
 *  ─── Vocabulary Ledger ───   Total | Mastered | Learning | New
 *  ─── Mastery Breakdown ───   ████░ 25% Mastered …
 *  ─── Bookshelf Stats ─────   📖 Books  ✅ Completed  📄 Pages
 *  ─────────  wordshelf.app  ·  Your Reading Journey  ─────────
 *
 * All styles are inline (no Tailwind classes) → html-to-image safe.
 */
import React from 'react';

const W = 1200;
const H = 660;

/* ── tiny helpers ── */
const Section = ({ label, children, isDark }) => (
  <div style={{ marginBottom: 22 }}>
    {/* Divider row with section label */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)' }} />
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.35)',
        fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'nowrap',
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)' }} />
    </div>
    {children}
  </div>
);

const MasteryBar = ({ label, count, total, color, textColor }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
      <span style={{
        width: 72, fontSize: 12, fontWeight: 600,
        color: textColor, textTransform: 'uppercase',
        letterSpacing: '0.06em', fontFamily: 'Inter, system-ui, sans-serif', flexShrink: 0,
      }}>{label}</span>
      <div style={{
        flex: 1, height: 12, borderRadius: 6,
        background: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 6,
          background: color,
        }} />
      </div>
      <span style={{
        width: 38, textAlign: 'right',
        fontSize: 13, fontWeight: 700,
        color, fontFamily: 'Inter, system-ui, sans-serif', flexShrink: 0,
      }}>{pct}%</span>
    </div>
  );
};

export default function ProficiencyCard({ data, theme = 'dark', cardRef }) {
  const isDark = theme === 'dark';

  /* colours */
  const bg = isDark
    ? 'linear-gradient(140deg, #0d1117 0%, #161b27 55%, #0d1117 100%)'
    : 'linear-gradient(140deg, #f8fafc 0%, #ffffff 55%, #f1f5f9 100%)';
  const surface   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const border    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textMain  = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.40)';

  const blue   = '#60a5fa';
  const green  = '#34d399';
  const amber  = '#fbbf24';
  const red    = '#f87171';

  const initials  = (data?.username ?? '?').slice(0, 2).toUpperCase();
  const monthYear = data?.generated_at
    ? new Date(data.generated_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';
  const joinDate  = data?.member_since
    ? new Date(data.member_since).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const total = data?.total_words ?? 1;

  return (
    <div
      ref={cardRef}
      style={{
        width: W, height: H,
        background: bg,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        padding: '38px 52px 28px',
        boxSizing: 'border-box',
      }}
    >


      {/* ── TOP ROW: avatar+user (left) · brand block (right) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>

        {/* Left: avatar + username + member since */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 58, height: 58, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, #60a5fa, #34d399)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#fff',
          }}>{initials}</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: textMain, lineHeight: 1.1 }}>{data?.username ?? '—'}</div>
            <div style={{ fontSize: 12, color: textMuted, marginTop: 3 }}>Member since {joinDate}</div>
          </div>
        </div>

        {/* Right: WordShelf brand block */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>📚</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: textMain, letterSpacing: '-0.02em', lineHeight: 1.1 }}>WordShelf</span>
            <span style={{ fontSize: 11, color: textMuted, fontWeight: 500, marginTop: 2 }}>Vocabulary Proficiency Card</span>
            <span style={{ fontSize: 11, color: textMuted, fontWeight: 500, marginTop: 1 }}>{monthYear}</span>
          </div>
        </div>

      </div>

      {/* ── READING INTELLIGENCE ── */}
      <Section label="Reading Intelligence" isDark={isDark}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          {/* RI Score box */}
          <div style={{
            background: surface, border: `1px solid ${border}`,
            borderRadius: 14, padding: '14px 28px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 13, color: textMuted, fontWeight: 600 }}>Score</span>
            <span style={{ fontSize: 13, marginRight: -4 }}>🧠</span>
            <span style={{ fontSize: 32, fontWeight: 800, color: blue, lineHeight: 1 }}>
              {(data?.reading_intelligence_score ?? 0).toLocaleString()}
            </span>
          </div>
          {/* Streak box */}
          <div style={{
            background: surface, border: `1px solid ${border}`,
            borderRadius: 14, padding: '14px 28px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>🔥</span>
            <span style={{ fontSize: 32, fontWeight: 800, color: amber, lineHeight: 1 }}>
              {data?.streak ?? 0}
            </span>
            <span style={{ fontSize: 13, color: textMuted, fontWeight: 600 }}>day streak</span>
          </div>
        </div>
      </Section>

      {/* ── VOCABULARY LEDGER ── */}
      <Section label="Vocabulary Ledger" isDark={isDark}>
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Total Words', value: data?.total_words ?? 0, color: blue },
            { label: 'Mastered',    value: data?.mastered    ?? 0, color: green },
            { label: 'Learning',    value: data?.learning    ?? 0, color: amber },
            { label: 'New',         value: data?.new_words   ?? 0, color: textMuted },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              flex: 1, background: surface, border: `1px solid ${border}`,
              borderRadius: 12, padding: '12px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: textMuted, marginTop: 5 }}>{label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── MASTERY BREAKDOWN ── */}
      <Section label="Mastery Breakdown" isDark={isDark}>
        <MasteryBar label="Mastered" count={data?.mastered  ?? 0} total={total} color={green} textColor={textMuted} />
        <MasteryBar label="Learning" count={data?.learning  ?? 0} total={total} color={amber} textColor={textMuted} />
        <MasteryBar label="New"      count={data?.new_words ?? 0} total={total} color={red}   textColor={textMuted} />
      </Section>

      {/* ── BOOKSHELF STATS ── */}
      <Section label="Bookshelf Stats" isDark={isDark}>
        <div style={{ display: 'flex', gap: 32 }}>
          {[
            { icon: '📖', label: 'Books',     value: data?.total_books     ?? 0 },
            { icon: '✅', label: 'Completed', value: data?.books_completed ?? 0 },
            { icon: '📄', label: 'Pages',     value: (data?.total_pages_read ?? 0).toLocaleString() },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: textMuted }}>{label}:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: textMain }}>{value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <div style={{
        marginTop: 'auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        paddingTop: 12,
        borderTop: `1px solid ${border}`,
      }}>
        <div style={{ flex: 1, height: 1, background: border }} />
        <span style={{ fontSize: 12, color: textMuted, fontWeight: 500 }}>wordshelf.app  ·  Your Reading Journey</span>
        <div style={{ flex: 1, height: 1, background: border }} />
      </div>
    </div>
  );
}
