import { useState } from 'react';

const MEDICATIONS = [
  { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', purpose: 'Type 2 Diabetes', startDate: 'Jan 15, 2024', status: 'active', interaction: null },
  { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily (morning)', purpose: 'Blood Pressure', startDate: 'Mar 3, 2023', status: 'active', interaction: '⚠️ Avoid intense cardio within 2hrs of dose' },
  { name: 'Vitamin D3', dosage: '2000 IU', frequency: 'Once daily', purpose: 'Supplement', startDate: 'Sep 1, 2024', status: 'active', interaction: null },
  { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily (evening)', purpose: 'Cholesterol', startDate: 'Jun 20, 2023', status: 'active', interaction: '⚠️ Muscle soreness may be amplified post-workout' },
];

const INTERACTIONS = [
  { drugs: 'Metformin + Atorvastatin', severity: 'low', label: 'Low Risk', detail: 'Statins may slightly increase blood glucose. Monitor levels if starting Atorvastatin alongside Metformin.' },
  { drugs: 'Lisinopril + Intense Exercise', severity: 'moderate', label: 'Caution', detail: 'ACE inhibitors can cause blood pressure to drop sharply during high-intensity cardio. Avoid HIIT within 2hrs of dose.' },
  { drugs: 'Atorvastatin + High-Intensity Training', severity: 'moderate', label: 'Caution', detail: 'Statins can amplify exercise-induced muscle soreness (myopathy risk). Reduce intensity if unusual soreness occurs.' },
  { drugs: 'Vitamin D3 + Metformin', severity: 'none', label: 'No Interaction', detail: 'No known interaction. Vitamin D3 supplementation is generally safe alongside Metformin.' },
];

const FEATURES = [
  { icon: '💊', title: 'Track Every Medication', desc: 'Prescriptions, supplements, vitamins — all in one place. Set reminders so you never miss a dose.' },
  { icon: '⚠️', title: 'Drug Interaction Alerts', desc: 'YFIT checks your full medication list for known interactions and flags combinations that may affect your health or training.' },
  { icon: '📋', title: 'Provider Reports', desc: 'One tap generates a clean, printable PDF showing your medications, dosages, frequencies, and interaction warnings — ready to hand to your doctor.' },
  { icon: '📊', title: 'Holistic Health View', desc: 'See your fitness data alongside your medication schedule. Spot patterns — like how your energy dips on certain dosing days.' },
];

function severityColor(s) {
  if (s === 'none') return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' };
  if (s === 'low') return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' };
  return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' };
}

export default function MedicationShowcase() {
  const [tab, setTab] = useState('medications');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1800);
    setTimeout(() => setGenerated(false), 5000);
  };

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-pink-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 text-pink-600 text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
            Medication Tracking — Only on YFIT
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            The only fitness app your{' '}
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              doctor will thank you for.
            </span>
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            66% of adults take at least one prescription medication. No other fitness app accounts for how your meds affect your workouts — until now.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left — feature descriptions */}
          <div className="space-y-6 lg:pt-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-pink-500/10 border border-pink-500/20">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}

            <div className="pt-4">
              <a
                href="/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/25"
              >
                Try Medication Tracking Free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <p className="text-xs text-gray-400 mt-3">Included in all Pro plans</p>
            </div>
          </div>

          {/* Right — interactive mockup */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            {/* App header */}
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">Medications</h3>
                  <p className="text-pink-100 text-xs">4 active medications</p>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-white/30 transition-colors disabled:opacity-50"
                >
                  {generating ? '⏳ Generating…' : generated ? '✅ PDF Ready!' : '📄 Generate Report'}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {['medications', 'interactions'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                    tab === t
                      ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50/50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t === 'medications' ? '💊 Medications' : '⚠️ Interactions'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {tab === 'medications' ? (
                MEDICATIONS.map((med) => (
                  <div key={med.name} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">{med.name}</span>
                        <span className="ml-2 text-xs text-gray-400">{med.dosage}</span>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                      <span>🕐 {med.frequency}</span>
                      <span>📌 {med.purpose}</span>
                    </div>
                    {med.interaction && (
                      <div className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-lg px-3 py-2 mt-2">
                        {med.interaction}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                INTERACTIONS.map((item) => {
                  const c = severityColor(item.severity);
                  return (
                    <div key={item.drugs} className={`rounded-xl p-4 border ${c.bg} ${c.border}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800 text-sm">{item.drugs}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                          {item.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{item.detail}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Provider report preview */}
            {generated && (
              <div className="m-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-white border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-pink-500 rounded flex items-center justify-center text-xs">Y</div>
                  <div>
                    <div className="text-xs font-bold">YFIT AI — Provider Report</div>
                    <div className="text-xs text-gray-400">Generated {new Date().toLocaleDateString()}</div>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✓ Ready</span>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-300">
                  <div>• 4 active medications listed</div>
                  <div>• 2 interaction warnings flagged</div>
                  <div>• Dosage schedule included</div>
                  <div>• Ready to share with your doctor</div>
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            <div className="px-4 pb-4">
              <p className="text-xs text-center text-gray-400">
                Demo data — your real medications stay private and encrypted
              </p>
            </div>
          </div>
        </div>

        {/* Stat bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '66%', label: 'of adults take prescription meds' },
            { value: '0', label: 'other fitness apps track medications' },
            { value: '1 tap', label: 'to generate a provider report' },
            { value: '30-day', label: 'money-back guarantee' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
