/**
 * GuestDashboard
 * ──────────────
 * A fully pre-populated demo dashboard shown to guest visitors.
 * Uses demoData — no Supabase calls. Mirrors the real Dashboard layout
 * so visitors see exactly what a real account looks like.
 */
import { demoDashboard, demoProfile } from '../data/demoData'
import { DashboardMockup } from './AppTourMockups'

export default function GuestDashboard({ onSignUp }) {
  const d = demoDashboard
  const p = demoProfile

  const macroPercent = (val, target) => Math.min(100, Math.round((val / target) * 100))

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 16px' }}>
      {/* Phone mockup — matches marketing site */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 8px', background: 'linear-gradient(135deg, #f0f9ff, #ecfdf5)' }}>
        <div style={{ maxWidth: '220px', width: '100%' }}>
          <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>📱 App Preview</p>
          <DashboardMockup />
        </div>
      </div>


      {/* Welcome strip */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: 0 }}>
          Good afternoon, {p.full_name.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#666', fontSize: '14px', margin: '4px 0 0' }}>
          Here&apos;s your fitness snapshot for today — this is demo data.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Calories Today', value: `${d.todayCalories}`, unit: `/ ${p.target_calories} kcal`, color: '#1a7f4b' },
          { label: 'Protein', value: `${d.todayProtein}g`, unit: `/ ${p.target_protein_g}g`, color: '#2563eb' },
          { label: 'Water', value: `${d.todayWater}L`, unit: '/ 2.5L', color: '#0891b2' },
          { label: 'Steps', value: d.todaySteps.toLocaleString(), unit: '/ 10,000', color: '#7c3aed' },
          { label: 'Streak', value: `${d.currentStreak}`, unit: 'days 🔥', color: '#ea580c' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{stat.unit}</div>
            <div style={{ fontSize: '12px', color: '#555', marginTop: '4px', fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Macro progress bars */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: '0 0 16px' }}>Today&apos;s Macros</h3>
        {[
          { label: 'Calories', val: d.todayCalories, target: p.target_calories, unit: 'kcal', color: '#1a7f4b' },
          { label: 'Protein', val: d.todayProtein, target: p.target_protein_g, unit: 'g', color: '#2563eb' },
          { label: 'Carbs', val: d.todayCarbs, target: p.target_carbs_g, unit: 'g', color: '#d97706' },
          { label: 'Fat', val: d.todayFat, target: p.target_fat_g, unit: 'g', color: '#dc2626' },
        ].map((m) => (
          <div key={m.label} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, color: '#333' }}>{m.label}</span>
              <span style={{ color: '#666' }}>{m.val}{m.unit} / {m.target}{m.unit}</span>
            </div>
            <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${macroPercent(m.val, m.target)}%`,
                  background: m.color,
                  borderRadius: '4px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* AI Insight */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>
          🧠 AI Insight — personalised for you
        </div>
        <p style={{ fontSize: '14px', color: '#166534', margin: 0, lineHeight: 1.5 }}>
          {d.aiInsight}
        </p>
      </div>

      {/* Recent activity */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>Recent Activity</h3>
        {d.recentActivity.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 0',
              borderBottom: i < d.recentActivity.length - 1 ? '1px solid #f3f4f6' : 'none',
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#222' }}>{item.label}</div>
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>{item.time}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a7f4b, #0d5c35)',
          borderRadius: '14px',
          padding: '24px',
          textAlign: 'center',
          color: '#fff',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
          Ready to track your real data?
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '18px' }}>
          Free plan + 1 month Premium free — no credit card needed
        </div>
        <button
          onClick={onSignUp}
          style={{
            background: '#fff',
            color: '#1a7f4b',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 28px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Create Free Account →
        </button>
      </div>
    </div>
  )
}
