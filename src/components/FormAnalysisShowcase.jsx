import { useRef, useEffect, useState, useCallback } from 'react';

// Skeleton connections
const CONNECTIONS = [
  ['head', 'neck'],
  ['neck', 'leftShoulder'],
  ['neck', 'rightShoulder'],
  ['leftShoulder', 'leftElbow'],
  ['rightShoulder', 'rightElbow'],
  ['leftElbow', 'leftWrist'],
  ['rightElbow', 'rightWrist'],
  ['leftShoulder', 'leftHip'],
  ['rightShoulder', 'rightHip'],
  ['leftHip', 'rightHip'],
  ['leftHip', 'leftKnee'],
  ['rightHip', 'rightKnee'],
  ['leftKnee', 'leftAnkle'],
  ['rightKnee', 'rightAnkle'],
];

const EXERCISES = [
  {
    name: 'Squat',
    frames: [
      { joints: { head: [.5,.08], neck: [.5,.16], leftShoulder: [.38,.22], rightShoulder: [.62,.22], leftElbow: [.32,.36], rightElbow: [.68,.36], leftWrist: [.3,.5], rightWrist: [.7,.5], leftHip: [.42,.5], rightHip: [.58,.5], leftKnee: [.42,.7], rightKnee: [.58,.7], leftAnkle: [.42,.9], rightAnkle: [.58,.9] }, feedback: { text: 'Good starting position', color: '#22c55e', score: 98, type: 'success' } },
      { joints: { head: [.5,.12], neck: [.5,.2], leftShoulder: [.37,.26], rightShoulder: [.63,.26], leftElbow: [.28,.38], rightElbow: [.72,.38], leftWrist: [.26,.5], rightWrist: [.74,.5], leftHip: [.41,.53], rightHip: [.59,.53], leftKnee: [.4,.72], rightKnee: [.6,.72], leftAnkle: [.41,.9], rightAnkle: [.59,.9] }, feedback: { text: 'Keep chest up', color: '#f59e0b', score: 85, type: 'warning' } },
      { joints: { head: [.5,.2], neck: [.5,.28], leftShoulder: [.36,.34], rightShoulder: [.64,.34], leftElbow: [.26,.44], rightElbow: [.74,.44], leftWrist: [.24,.54], rightWrist: [.76,.54], leftHip: [.4,.58], rightHip: [.6,.58], leftKnee: [.36,.74], rightKnee: [.64,.74], leftAnkle: [.4,.9], rightAnkle: [.6,.9] }, feedback: { text: 'Knees tracking over toes ✓', color: '#22c55e', score: 92, type: 'success' } },
      { joints: { head: [.5,.28], neck: [.5,.36], leftShoulder: [.35,.42], rightShoulder: [.65,.42], leftElbow: [.24,.5], rightElbow: [.76,.5], leftWrist: [.22,.58], rightWrist: [.78,.58], leftHip: [.39,.62], rightHip: [.61,.62], leftKnee: [.33,.76], rightKnee: [.67,.76], leftAnkle: [.39,.9], rightAnkle: [.61,.9] }, feedback: { text: 'Go deeper — thighs parallel to ground', color: '#f59e0b', score: 78, type: 'warning' } },
      { joints: { head: [.5,.2], neck: [.5,.28], leftShoulder: [.36,.34], rightShoulder: [.64,.34], leftElbow: [.26,.44], rightElbow: [.74,.44], leftWrist: [.24,.54], rightWrist: [.76,.54], leftHip: [.4,.58], rightHip: [.6,.58], leftKnee: [.36,.74], rightKnee: [.64,.74], leftAnkle: [.4,.9], rightAnkle: [.6,.9] }, feedback: { text: 'Drive through heels ✓', color: '#22c55e', score: 94, type: 'success' } },
      { joints: { head: [.5,.08], neck: [.5,.16], leftShoulder: [.38,.22], rightShoulder: [.62,.22], leftElbow: [.32,.36], rightElbow: [.68,.36], leftWrist: [.3,.5], rightWrist: [.7,.5], leftHip: [.42,.5], rightHip: [.58,.5], leftKnee: [.42,.7], rightKnee: [.58,.7], leftAnkle: [.42,.9], rightAnkle: [.58,.9] }, feedback: { text: 'Good squat!', color: '#22c55e', score: 96, type: 'success' } },
    ],
    repSummaries: [
      { type: 'warning', message: 'Rep 1 — Go deeper: aim for thighs parallel to ground' },
      { type: 'success', message: 'Rep 2 — Good squat! Keep chest up on descent' },
      { type: 'success', message: 'Rep 3 — Good depth! Knees tracking well' },
      { type: 'warning', message: 'Rep 4 — Knees too far forward — push hips back' },
      { type: 'success', message: 'Rep 5 — Good squat!' },
    ],
  },
  {
    name: 'Push-Up',
    frames: [
      { joints: { head: [.5,.12], neck: [.5,.18], leftShoulder: [.35,.22], rightShoulder: [.65,.22], leftElbow: [.28,.35], rightElbow: [.72,.35], leftWrist: [.22,.45], rightWrist: [.78,.45], leftHip: [.42,.55], rightHip: [.58,.55], leftKnee: [.42,.75], rightKnee: [.58,.75], leftAnkle: [.42,.9], rightAnkle: [.58,.9] }, feedback: { text: 'Good plank position', color: '#22c55e', score: 95, type: 'success' } },
      { joints: { head: [.5,.18], neck: [.5,.24], leftShoulder: [.35,.28], rightShoulder: [.65,.28], leftElbow: [.26,.38], rightElbow: [.74,.38], leftWrist: [.22,.48], rightWrist: [.78,.48], leftHip: [.42,.58], rightHip: [.58,.58], leftKnee: [.42,.75], rightKnee: [.58,.75], leftAnkle: [.42,.9], rightAnkle: [.58,.9] }, feedback: { text: 'Core tight ✓', color: '#22c55e', score: 91, type: 'success' } },
      { joints: { head: [.5,.24], neck: [.5,.3], leftShoulder: [.35,.34], rightShoulder: [.65,.34], leftElbow: [.25,.42], rightElbow: [.75,.42], leftWrist: [.22,.5], rightWrist: [.78,.5], leftHip: [.42,.6], rightHip: [.58,.6], leftKnee: [.42,.75], rightKnee: [.58,.75], leftAnkle: [.42,.9], rightAnkle: [.58,.9] }, feedback: { text: 'Elbows flaring — tuck them in', color: '#f59e0b', score: 72, type: 'warning' } },
      { joints: { head: [.5,.18], neck: [.5,.24], leftShoulder: [.35,.28], rightShoulder: [.65,.28], leftElbow: [.26,.38], rightElbow: [.74,.38], leftWrist: [.22,.48], rightWrist: [.78,.48], leftHip: [.42,.58], rightHip: [.58,.58], leftKnee: [.42,.75], rightKnee: [.58,.75], leftAnkle: [.42,.9], rightAnkle: [.58,.9] }, feedback: { text: 'Push all the way up ✓', color: '#22c55e', score: 93, type: 'success' } },
    ],
    repSummaries: [
      { type: 'success', message: 'Rep 1 — Good form! Core engaged throughout' },
      { type: 'warning', message: 'Rep 2 — Elbows flaring out — keep them at 45°' },
      { type: 'success', message: 'Rep 3 — Full range of motion ✓' },
    ],
  },
  {
    name: 'Plank',
    frames: [
      { joints: { head: [.5,.1], neck: [.5,.16], leftShoulder: [.36,.2], rightShoulder: [.64,.2], leftElbow: [.3,.32], rightElbow: [.7,.32], leftWrist: [.26,.44], rightWrist: [.74,.44], leftHip: [.42,.52], rightHip: [.58,.52], leftKnee: [.42,.7], rightKnee: [.58,.7], leftAnkle: [.42,.88], rightAnkle: [.58,.88] }, feedback: { text: 'Perfect plank position ✓', color: '#22c55e', score: 97, type: 'success' } },
      { joints: { head: [.5,.14], neck: [.5,.2], leftShoulder: [.36,.24], rightShoulder: [.64,.24], leftElbow: [.3,.36], rightElbow: [.7,.36], leftWrist: [.26,.48], rightWrist: [.74,.48], leftHip: [.44,.56], rightHip: [.56,.56], leftKnee: [.44,.72], rightKnee: [.56,.72], leftAnkle: [.44,.88], rightAnkle: [.56,.88] }, feedback: { text: 'Hips dropping — raise them', color: '#ef4444', score: 65, type: 'error' } },
      { joints: { head: [.5,.1], neck: [.5,.16], leftShoulder: [.36,.2], rightShoulder: [.64,.2], leftElbow: [.3,.32], rightElbow: [.7,.32], leftWrist: [.26,.44], rightWrist: [.74,.44], leftHip: [.42,.52], rightHip: [.58,.52], leftKnee: [.42,.7], rightKnee: [.58,.7], leftAnkle: [.42,.88], rightAnkle: [.58,.88] }, feedback: { text: 'Good recovery ✓', color: '#22c55e', score: 94, type: 'success' } },
    ],
    repSummaries: [
      { type: 'success', message: '0:00–0:15 — Perfect alignment' },
      { type: 'error', message: '0:16–0:22 — Hips dropped — brace your core' },
      { type: 'success', message: '0:23–0:45 — Recovered well, solid hold' },
    ],
  },
  {
    name: 'Deadlift',
    frames: [
      { joints: { head: [.5,.08], neck: [.5,.15], leftShoulder: [.38,.2], rightShoulder: [.62,.2], leftElbow: [.32,.34], rightElbow: [.68,.34], leftWrist: [.3,.5], rightWrist: [.7,.5], leftHip: [.42,.5], rightHip: [.58,.5], leftKnee: [.42,.7], rightKnee: [.58,.7], leftAnkle: [.42,.9], rightAnkle: [.58,.9] }, feedback: { text: 'Good starting position', color: '#22c55e', score: 96, type: 'success' } },
      { joints: { head: [.5,.22], neck: [.5,.3], leftShoulder: [.36,.36], rightShoulder: [.64,.36], leftElbow: [.3,.48], rightElbow: [.7,.48], leftWrist: [.3,.62], rightWrist: [.7,.62], leftHip: [.4,.6], rightHip: [.6,.6], leftKnee: [.38,.76], rightKnee: [.62,.76], leftAnkle: [.4,.9], rightAnkle: [.6,.9] }, feedback: { text: 'Back rounding — keep it flat', color: '#ef4444', score: 58, type: 'error' } },
      { joints: { head: [.5,.15], neck: [.5,.22], leftShoulder: [.37,.28], rightShoulder: [.63,.28], leftElbow: [.31,.42], rightElbow: [.69,.42], leftWrist: [.3,.56], rightWrist: [.7,.56], leftHip: [.41,.54], rightHip: [.59,.54], leftKnee: [.4,.72], rightKnee: [.6,.72], leftAnkle: [.41,.9], rightAnkle: [.59,.9] }, feedback: { text: 'Drive hips forward ✓', color: '#22c55e', score: 88, type: 'success' } },
      { joints: { head: [.5,.08], neck: [.5,.15], leftShoulder: [.38,.2], rightShoulder: [.62,.2], leftElbow: [.32,.34], rightElbow: [.68,.34], leftWrist: [.3,.5], rightWrist: [.7,.5], leftHip: [.42,.5], rightHip: [.58,.5], leftKnee: [.42,.7], rightKnee: [.58,.7], leftAnkle: [.42,.9], rightAnkle: [.58,.9] }, feedback: { text: 'Good lockout ✓', color: '#22c55e', score: 95, type: 'success' } },
    ],
    repSummaries: [
      { type: 'error', message: 'Rep 1 — Back rounding at lift-off — brace harder' },
      { type: 'success', message: 'Rep 2 — Good hip hinge, flat back' },
      { type: 'success', message: 'Rep 3 — Strong lockout ✓' },
    ],
  },
];

// All 10 exercises (remaining ones simplified)
const ALL_EXERCISES = [
  ...EXERCISES,
  { name: 'Sit-Up', frames: EXERCISES[1].frames, repSummaries: EXERCISES[1].repSummaries },
  { name: 'Bench Press', frames: EXERCISES[1].frames, repSummaries: EXERCISES[1].repSummaries },
  { name: 'Lateral Raise', frames: EXERCISES[0].frames, repSummaries: EXERCISES[0].repSummaries },
  { name: 'Preacher Curl', frames: EXERCISES[1].frames, repSummaries: EXERCISES[1].repSummaries },
  { name: 'Bicep Curl', frames: EXERCISES[1].frames, repSummaries: EXERCISES[1].repSummaries },
  { name: 'Bent-Over Row', frames: EXERCISES[3].frames, repSummaries: EXERCISES[3].repSummaries },
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function interpolateJoints(frameA, frameB, t) {
  const result = {};
  for (const key of Object.keys(frameA)) {
    result[key] = [
      lerp(frameA[key][0], frameB[key][0], t),
      lerp(frameA[key][1], frameB[key][1], t),
    ];
  }
  return result;
}

export default function FormAnalysisShowcase() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [repCount, setRepCount] = useState(0);
  const [feedback, setFeedback] = useState({ text: 'Good starting position', color: '#22c55e', score: 98, type: 'success' });
  const [repHistory, setRepHistory] = useState([]);
  const [paused, setPaused] = useState(false);
  const stateRef = useRef({ frameIdx: 0, t: 0, repCount: 0, repHistory: [], paused: false });

  const exercise = ALL_EXERCISES[exerciseIdx];

  // Fixed skeleton colors — never change based on score
  const BONE_COLOR = '#4ade80';   // green-400 — always for limbs
  const JOINT_COLOR = '#ef4444';  // red-500 — always for joints
  const HEAD_COLOR = '#ffffff';   // white head marker
  const LARGE_JOINTS = new Set(['leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftShoulder', 'rightShoulder']);

  const drawFrame = useCallback((canvas, joints) => {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
    }
    for (let i = 0; i < h; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }

    // Draw connections — always green with glow
    for (const [a, b] of CONNECTIONS) {
      if (!joints[a] || !joints[b]) continue;
      const ax = joints[a][0] * w;
      const ay = joints[a][1] * h;
      const bx = joints[b][0] * w;
      const by = joints[b][1] * h;
      ctx.save();
      ctx.shadowColor = BONE_COLOR;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = BONE_COLOR + 'cc';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.restore();
    }

    // Draw joints — always red with glow, except head which is white
    for (const [name, pos] of Object.entries(joints)) {
      const x = pos[0] * w;
      const y = pos[1] * h;
      const isHead = name === 'head';
      const isLarge = LARGE_JOINTS.has(name);
      const r = isHead ? 11 : isLarge ? 8 : 6;
      ctx.save();
      if (isHead) {
        // Distinctive head: white circle with green ring
        ctx.shadowColor = HEAD_COLOR;
        ctx.shadowBlur = 18;
        ctx.fillStyle = HEAD_COLOR;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = BONE_COLOR;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // All other joints: red with glow
        ctx.shadowColor = JOINT_COLOR;
        ctx.shadowBlur = 18;
        ctx.fillStyle = JOINT_COLOR;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, r + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ex = ALL_EXERCISES[exerciseIdx];
    stateRef.current = { frameIdx: 0, t: 0, repCount: 0, repHistory: [], paused: false };
    setRepCount(0);
    setRepHistory([]);
    setFeedback(ex.frames[0].feedback);

    const FRAMES_PER_STEP = 40;

    const tick = () => {
      if (stateRef.current.paused) {
        animRef.current = requestAnimationFrame(tick);
        return;
      }
      const state = stateRef.current;
      const frames = ex.frames;
      const nextIdx = (state.frameIdx + 1) % frames.length;

      state.t += 1 / FRAMES_PER_STEP;

      const joints = interpolateJoints(frames[state.frameIdx].joints, frames[nextIdx].joints, state.t);
      const fb = frames[state.frameIdx].feedback;
      drawFrame(canvas, joints);  // bones always green, joints always red

      setFeedback(fb);

      if (state.t >= 1) {
        state.t = 0;
        state.frameIdx = nextIdx;

        // Count reps when we return to frame 0
        if (nextIdx === 0) {
          state.repCount += 1;
          setRepCount(state.repCount);
          const summary = ex.repSummaries[(state.repCount - 1) % ex.repSummaries.length];
          state.repHistory = [summary, ...state.repHistory].slice(0, 5);
          setRepHistory([...state.repHistory]);
        }
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [exerciseIdx, drawFrame]);

  const handlePause = () => {
    stateRef.current.paused = !stateRef.current.paused;
    setPaused(!paused);
  };

  const handleClear = () => {
    stateRef.current.repCount = 0;
    stateRef.current.repHistory = [];
    setRepCount(0);
    setRepHistory([]);
  };

  const scoreColor = feedback.score >= 90 ? '#22c55e' : feedback.score >= 75 ? '#f59e0b' : '#ef4444';

  return (
    <section className="py-24 bg-gradient-to-br from-gray-950 via-blue-950 to-gray-900 overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AI Form Analysis — Live Demo
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Your AI spotter{' '}
            <span className="bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">never blinks.</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Real-time pose tracking catches form errors before they cause injury. Most apps count reps. YFIT coaches every single one.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Canvas + controls */}
          <div className="space-y-4">
            <div className="bg-gray-900/80 border border-green-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-green-500/10">
              {/* Title bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-green-500/10 bg-gray-900/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-xs text-gray-500 font-mono">YFIT AI — {exercise.name}</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400">LIVE</span>
                </div>
              </div>

              <canvas ref={canvasRef} width={400} height={420} className="w-full block" />

              {/* Stats bar */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-green-500/10 bg-gray-900/50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{repCount}</div>
                  <div className="text-xs text-gray-500">Reps</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: scoreColor }}>{feedback.score}</div>
                  <div className="text-xs text-gray-500">Form Score</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium" style={{ color: feedback.color }}>{feedback.text}</div>
                  <div className="text-xs text-gray-500">Live Feedback</div>
                </div>
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex gap-2">
              <button
                onClick={handlePause}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg border border-gray-700 transition-colors"
              >
                {paused ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg border border-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Exercise selector */}
            <div className="flex flex-wrap gap-2">
              {ALL_EXERCISES.map((ex, i) => (
                <button
                  key={ex.name}
                  onClick={() => setExerciseIdx(i)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    i === exerciseIdx
                      ? 'bg-green-500/20 border-green-500/50 text-green-400'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-green-500/30 hover:text-green-400'
                  }`}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>

          {/* Right side — features + rep history */}
          <div className="space-y-6">
            {/* Feature cards */}
            {[
              {
                title: 'Real-Time Form Corrections',
                desc: "Feedback fires every frame — 'Go deeper', 'Keep chest up', 'Knees too far forward'. You correct the issue before the rep is even finished.",
                icon: '⚡',
                color: 'green',
              },
              {
                title: 'Per-Rep Feedback History',
                desc: "Every rep gets a summary — the worst issue or a 'Good squat!' if your form was clean. Scroll back through your session to see exactly where you improved.",
                icon: '📋',
                color: 'teal',
              },
              {
                title: 'Injury Prevention',
                desc: 'Patterns that lead to injury — knee cave, forward lean, hip drop — are flagged before they become chronic problems. Your joints will thank you.',
                icon: '🛡️',
                color: 'blue',
              },
            ].map((f) => (
              <div key={f.title} className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 hover:border-green-500/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{f.icon}</div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{f.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Rep history */}
            {repHistory.length > 0 && (
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-3 text-sm">Rep History</h3>
                <div className="space-y-2">
                  {repHistory.map((r, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                        r.type === 'success' ? 'bg-green-500/10 text-green-400' :
                        r.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}
                    >
                      <span>{r.type === 'success' ? '✓' : r.type === 'warning' ? '⚠' : '✗'}</span>
                      <span>{r.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <a
                href="/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                Try Form Analysis Free
              </a>
            </div>
          </div>
        </div>

        {/* 10 exercises note */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            <span className="text-green-400 font-semibold">10 Exercises Supported</span> — Squat, push-up, plank, sit-up, deadlift, bench press, lateral raise, preacher curl, bicep curl, and bent-over row — all analysed in real time using your device camera.
          </p>
        </div>
      </div>
    </section>
  );
}
