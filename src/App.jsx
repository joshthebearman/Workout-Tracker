import { useState, useEffect } from "react";

// ── Persistent storage helpers ──────────────────────────────────────────────
const STORAGE_KEYS = { PROGRAM: "wt_program", HISTORY: "wt_history" };

async function load(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

async function save(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

// ── Default PPL program ─────────────────────────────────────────────────────
const DEFAULT_PROGRAM = [
  {
    id: "mon", label: "MON", name: "Pull 1", type: "pull",
    exercises: [
      { id: "e1", name: "Barbell Row", sets: 4 },
      { id: "e2", name: "Pull-Up", sets: 4 },
      { id: "e3", name: "Seated Cable Row", sets: 3 },
      { id: "e4", name: "Face Pull", sets: 3 },
      { id: "e5", name: "Dumbbell Curl", sets: 3 },
    ],
  },
  {
    id: "tue", label: "TUE", name: "Arms + Bike", type: "arms",
    exercises: [
      { id: "e6", name: "Incline DB Curl", sets: 3 },
      { id: "e7", name: "Hammer Curl", sets: 3 },
      { id: "e8", name: "Cable Curl", sets: 2 },
      { id: "e9", name: "Overhead Cable Extension", sets: 3 },
      { id: "e10", name: "Skull Crusher", sets: 3 },
      { id: "e11", name: "Tricep Pushdown", sets: 2 },
      { id: "e12", name: "Stationary Bike", sets: 1, isBike: true },
    ],
  },
  {
    id: "wed", label: "WED", name: "Rest", type: "rest",
    exercises: [],
  },
  {
    id: "thu", label: "THU", name: "Legs", type: "legs",
    exercises: [
      { id: "e13", name: "Squat", sets: 4 },
      { id: "e14", name: "Romanian Deadlift", sets: 3 },
      { id: "e15", name: "Leg Press", sets: 3 },
      { id: "e16", name: "Leg Curl", sets: 3 },
      { id: "e17", name: "Calf Raise", sets: 4 },
    ],
  },
  {
    id: "fri", label: "FRI", name: "Push 1", type: "push",
    exercises: [
      { id: "e18", name: "Bench Press", sets: 4 },
      { id: "e19", name: "Overhead Press", sets: 3 },
      { id: "e20", name: "Incline DB Press", sets: 3 },
      { id: "e21", name: "Cable Lateral Raise", sets: 3 },
      { id: "e22", name: "Tricep Dip", sets: 3 },
    ],
  },
  { id: "sat", label: "SAT", name: "Rest", type: "rest", exercises: [] },
  { id: "sun", label: "SUN", name: "Rest", type: "rest", exercises: [] },
];

const TYPE_COLORS = {
  pull: "#5b8cff",
  push: "#ff6b35",
  legs: "#e8ff47",
  arms: "#b97cff",
  rest: "#444",
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ── RPE dots ────────────────────────────────────────────────────────────────
function RpeDots({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          onClick={() => onChange(value === n ? 0 : n)}
          style={{
            width: 14, height: 14, borderRadius: "50%", border: "none",
            cursor: "pointer", padding: 0,
            background: n <= value
              ? n <= 4 ? "#5b8cff" : n <= 7 ? "#e8ff47" : "#ff4444"
              : "#2a2a2a",
            transition: "background 0.15s",
          }}
        />
      ))}
    </div>
  );
}

// ── Set row ──────────────────────────────────────────────────────────────────
function SetRow({ set, onChange, onRemove, index }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "24px 80px 80px 1fr 28px",
      gap: 8, alignItems: "center", padding: "6px 0",
      borderBottom: "1px solid #1e1e1e",
    }}>
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#555", fontSize: 13 }}>
        {index + 1}
      </span>
      <input
        type="number" placeholder="lbs" value={set.weight}
        onChange={e => onChange({ ...set, weight: e.target.value })}
        style={inputStyle}
      />
      <input
        type="number" placeholder="reps" value={set.reps}
        onChange={e => onChange({ ...set, reps: e.target.value })}
        style={inputStyle}
      />
      <RpeDots value={set.rpe} onChange={rpe => onChange({ ...set, rpe })} />
      <button
        onClick={onRemove}
        style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
      >×</button>
    </div>
  );
}

const inputStyle = {
  background: "#111", border: "1px solid #2a2a2a", borderRadius: 2,
  color: "#f0f0f0", padding: "4px 8px", fontSize: 13,
  fontFamily: "'DM Sans', sans-serif", width: "100%", outline: "none",
};

// ── Exercise block ───────────────────────────────────────────────────────────
function ExerciseBlock({ exercise, sessionData, onUpdate, onRename, onDelete }) {
  const sets = sessionData?.sets || [];

  function addSet() {
    const last = sets[sets.length - 1];
    onUpdate({
      sets: [...sets, { id: uid(), weight: last?.weight || "", reps: last?.reps || "", rpe: last?.rpe || 0 }],
    });
  }
  function updateSet(id, updated) {
    onUpdate({ sets: sets.map(s => s.id === id ? updated : s) });
  }
  function removeSet(id) {
    onUpdate({ sets: sets.filter(s => s.id !== id) });
  }

  return (
    <div style={{ background: "#141414", border: "1px solid #222", borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e1e1e" }}>
        <input
          value={exercise.name}
          onChange={e => onRename(e.target.value)}
          style={{ ...inputStyle, border: "none", background: "transparent", fontWeight: 500, fontSize: 14, padding: 0, flex: 1 }}
        />
        <button
          onClick={onDelete}
          style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 13, marginLeft: 8 }}
        >remove</button>
      </div>
      <div style={{ padding: "4px 14px 10px" }}>
        {sets.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "24px 80px 80px 1fr 28px", gap: 8, padding: "6px 0 2px", marginBottom: 2 }}>
            <span />
            <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", fontFamily: "'DM Sans', sans-serif" }}>WEIGHT</span>
            <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", fontFamily: "'DM Sans', sans-serif" }}>REPS</span>
            <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", fontFamily: "'DM Sans', sans-serif" }}>RPE</span>
            <span />
          </div>
        )}
        {sets.map((s, i) => (
          <SetRow
            key={s.id} set={s} index={i}
            onChange={u => updateSet(s.id, u)}
            onRemove={() => removeSet(s.id)}
          />
        ))}
        <button
          onClick={addSet}
          style={{
            marginTop: 8, background: "none", border: "1px dashed #2a2a2a",
            color: "#555", cursor: "pointer", padding: "5px 12px", fontSize: 12,
            fontFamily: "'DM Sans', sans-serif", borderRadius: 2, width: "100%",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.target.style.borderColor = "#e8ff47"; e.target.style.color = "#e8ff47"; }}
          onMouseLeave={e => { e.target.style.borderColor = "#2a2a2a"; e.target.style.color = "#555"; }}
        >+ add set</button>
      </div>
    </div>
  );
}

// ── History view ─────────────────────────────────────────────────────────────
function HistoryView({ history, program, onClose }) {
  const [selected, setSelected] = useState(null);

  const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

  function getDayName(dayId) {
    return program.find(d => d.id === dayId)?.name || dayId;
  }

  if (selected) {
    const entry = history.find(h => h.id === selected);
    const dayColor = TYPE_COLORS[program.find(d => d.id === entry.dayId)?.type] || "#888";
    return (
      <div style={overlayStyle}>
        <div style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: "0.25em", color: dayColor, marginBottom: 4 }}>
                {new Date(entry.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#f0f0f0" }}>{getDayName(entry.dayId)}</div>
            </div>
            <button onClick={() => setSelected(null)} style={closeBtnStyle}>← back</button>
          </div>
          {entry.exercises.map(ex => (
            <div key={ex.id} style={{ marginBottom: 16, background: "#141414", border: "1px solid #222", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid #1e1e1e", fontWeight: 500, fontSize: 14 }}>{ex.name}</div>
              <div style={{ padding: "6px 14px 10px" }}>
                {ex.sets?.length > 0 ? ex.sets.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", gap: 16, padding: "4px 0", fontSize: 13, borderBottom: "1px solid #1a1a1a" }}>
                    <span style={{ color: "#555", fontFamily: "'Bebas Neue', sans-serif" }}>{i + 1}</span>
                    <span>{s.weight ? `${s.weight} lbs` : "—"}</span>
                    <span>{s.reps ? `${s.reps} reps` : "—"}</span>
                    {s.rpe > 0 && (
                      <span style={{ color: s.rpe <= 4 ? "#5b8cff" : s.rpe <= 7 ? "#e8ff47" : "#ff4444" }}>RPE {s.rpe}</span>
                    )}
                  </div>
                )) : <span style={{ color: "#444", fontSize: 12 }}>No sets logged</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32 }}>Workout History</div>
          <button onClick={onClose} style={closeBtnStyle}>× close</button>
        </div>
        {sorted.length === 0 ? (
          <div style={{ color: "#444", textAlign: "center", padding: "40px 0" }}>No workouts logged yet.</div>
        ) : sorted.map(entry => {
          const dayColor = TYPE_COLORS[program.find(d => d.id === entry.dayId)?.type] || "#888";
          const totalSets = entry.exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
          return (
            <div
              key={entry.id}
              onClick={() => setSelected(entry.id)}
              style={{
                background: "#141414", border: "1px solid #222", borderRadius: 2,
                padding: "12px 16px", marginBottom: 8, cursor: "pointer",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = dayColor}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#222"}
            >
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: "#f0f0f0" }}>{getDayName(entry.dayId)}</div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                  {new Date(entry.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: dayColor }}>{totalSets}</div>
                <div style={{ fontSize: 11, color: "#555" }}>sets logged</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100,
  display: "flex", justifyContent: "center", overflowY: "auto", padding: "2rem 1rem",
};
const panelStyle = {
  background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 2,
  width: "100%", maxWidth: 600, padding: "2rem", alignSelf: "flex-start",
  fontFamily: "'DM Sans', sans-serif", color: "#f0f0f0",
};
const closeBtnStyle = {
  background: "none", border: "1px solid #2a2a2a", color: "#888",
  cursor: "pointer", padding: "6px 12px", fontSize: 12, borderRadius: 2,
  fontFamily: "'DM Sans', sans-serif",
};

// ── Edit program view ────────────────────────────────────────────────────────
function EditDayModal({ day, onSave, onClose }) {
  const [name, setName] = useState(day.name);
  const [type, setType] = useState(day.type);
  const [exercises, setExercises] = useState(day.exercises.map(e => ({ ...e })));

  function addEx() {
    setExercises(ex => [...ex, { id: uid(), name: "New Exercise", sets: 3 }]);
  }
  function removeEx(id) {
    setExercises(ex => ex.filter(e => e.id !== id));
  }
  function renameEx(id, newName) {
    setExercises(ex => ex.map(e => e.id === id ? { ...e, name: newName } : e));
  }
  function setSetsCount(id, n) {
    setExercises(ex => ex.map(e => e.id === id ? { ...e, sets: Math.max(1, parseInt(n) || 1) } : e));
  }

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28 }}>Edit {day.label}</div>
          <button onClick={onClose} style={closeBtnStyle}>× cancel</button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.15em", marginBottom: 6 }}>WORKOUT NAME</div>
          <input value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.15em", marginBottom: 6 }}>TYPE</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(TYPE_COLORS).map(([t, c]) => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  background: type === t ? c : "transparent",
                  border: `1px solid ${c}`, borderRadius: 2, padding: "4px 12px",
                  color: type === t ? "#000" : c, cursor: "pointer", fontSize: 12,
                  fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em",
                }}
              >{t}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: "0.15em", marginBottom: 8 }}>EXERCISES</div>
          {exercises.map(ex => (
            <div key={ex.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <input
                value={ex.name}
                onChange={e => renameEx(ex.id, e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <input
                type="number" value={ex.sets}
                onChange={e => setSetsCount(ex.id, e.target.value)}
                style={{ ...inputStyle, width: 56 }} min={1}
              />
              <span style={{ fontSize: 11, color: "#555" }}>sets</span>
              <button
                onClick={() => removeEx(ex.id)}
                style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 18 }}
              >×</button>
            </div>
          ))}
          <button
            onClick={addEx}
            style={{
              background: "none", border: "1px dashed #2a2a2a", color: "#555",
              cursor: "pointer", padding: "6px 14px", fontSize: 12,
              fontFamily: "'DM Sans', sans-serif", borderRadius: 2, width: "100%", marginTop: 4,
            }}
          >+ add exercise</button>
        </div>
        <button
          onClick={() => onSave({ ...day, name, type, exercises })}
          style={{
            background: "#e8ff47", border: "none", borderRadius: 2, padding: "10px 24px",
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: "0.1em",
            cursor: "pointer", width: "100%", color: "#0f0f0f",
          }}
        >Save Day</button>
      </div>
    </div>
  );
}

// ── Active session view ──────────────────────────────────────────────────────
function SessionView({ day, onFinish, onCancel, history }) {
  const color = TYPE_COLORS[day.type] || "#888";

  function initSessionData() {
    const last = [...history]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .find(h => h.dayId === day.id);
    const data = {};
    day.exercises.forEach(ex => {
      const lastEx = last?.exercises.find(e => e.name === ex.name);
      const defaultSets = Array.from({ length: ex.sets }, () => ({
        id: uid(),
        weight: lastEx?.sets?.[0]?.weight || "",
        reps: lastEx?.sets?.[0]?.reps || "",
        rpe: 0,
      }));
      data[ex.id] = { sets: defaultSets };
    });
    return data;
  }

  const [sessionData, setSessionData] = useState(initSessionData);
  const [exercises, setExercises] = useState(day.exercises);

  function updateEx(exId, update) {
    setSessionData(d => ({ ...d, [exId]: { ...d[exId], ...update } }));
  }
  function renameEx(exId, name) {
    setExercises(exs => exs.map(e => e.id === exId ? { ...e, name } : e));
  }
  function deleteEx(exId) {
    setExercises(exs => exs.filter(e => e.id !== exId));
    setSessionData(d => { const n = { ...d }; delete n[exId]; return n; });
  }

  function finish() {
    const entry = {
      id: uid(),
      dayId: day.id,
      date: new Date().toISOString(),
      exercises: exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: sessionData[ex.id]?.sets || [],
      })),
    };
    onFinish(entry);
  }

  const totalSets = exercises.reduce((acc, ex) => acc + (sessionData[ex.id]?.sets?.length || 0), 0);
  const filledSets = exercises.reduce((acc, ex) =>
    acc + (sessionData[ex.id]?.sets?.filter(s => s.weight || s.reps).length || 0), 0);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#f0f0f0", maxWidth: 600, margin: "0 auto", padding: "0 0 6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingTop: 8 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: "0.25em", color, marginBottom: 4 }}>NOW ACTIVE</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, lineHeight: 0.9 }}>{day.name}</div>
        </div>
        <button onClick={onCancel} style={closeBtnStyle}>× cancel</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <div style={{ background: "#141414", border: "1px solid #222", borderRadius: 2, padding: "8px 14px", flex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color }}>{filledSets}/{totalSets}</div>
          <div style={{ fontSize: 11, color: "#555" }}>sets logged</div>
        </div>
        <div style={{ background: "#141414", border: "1px solid #222", borderRadius: 2, padding: "8px 14px", flex: 1, textAlign: "center" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "#f0f0f0" }}>{exercises.length}</div>
          <div style={{ fontSize: 11, color: "#555" }}>exercises</div>
        </div>
      </div>

      {exercises.map(ex => (
        <ExerciseBlock
          key={ex.id} exercise={ex}
          sessionData={sessionData[ex.id]}
          onUpdate={u => updateEx(ex.id, u)}
          onRename={name => renameEx(ex.id, name)}
          onDelete={() => deleteEx(ex.id)}
        />
      ))}

      <button
        onClick={finish}
        style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#e8ff47", border: "none", borderRadius: 2,
          padding: "14px 40px", fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 18, letterSpacing: "0.1em", cursor: "pointer", color: "#0f0f0f",
          boxShadow: "0 4px 24px rgba(232,255,71,0.25)",
        }}
      >Finish Workout</button>
    </div>
  );
}

// ── Main app ─────────────────────────────────────────────────────────────────
export default function App() {
  const [program, setProgram] = useState(DEFAULT_PROGRAM);
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [view, setView] = useState("home");

  useEffect(() => {
    (async () => {
      const p = await load(STORAGE_KEYS.PROGRAM);
      const h = await load(STORAGE_KEYS.HISTORY);
      if (p) setProgram(p);
      if (h) setHistory(h);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) save(STORAGE_KEYS.PROGRAM, program); }, [program, loaded]);
  useEffect(() => { if (loaded) save(STORAGE_KEYS.HISTORY, history); }, [history, loaded]);

  function startSession(day) {
    if (day.type === "rest") return;
    setActiveDay(day);
    setView("session");
  }

  function finishSession(entry) {
    setHistory(h => [entry, ...h]);
    setActiveDay(null);
    setView("home");
  }

  function saveDay(updated) {
    setProgram(p => p.map(d => d.id === updated.id ? updated : d));
    setEditingDay(null);
  }

  function getLastSession(dayId) {
    return [...history].sort((a, b) => new Date(b.date) - new Date(a.date)).find(h => h.dayId === dayId);
  }

  if (!loaded) return (
    <div style={{
      background: "#0f0f0f", minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Bebas Neue', sans-serif", color: "#333", fontSize: 24, letterSpacing: "0.2em",
    }}>
      LOADING
    </div>
  );

  // getDay() returns 0=Sun…6=Sat; program array is Mon=0…Sun=6
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <div style={{ background: "#0f0f0f", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#f0f0f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input:focus { outline: 1px solid #e8ff47 !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f0f0f; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1e1e1e", padding: "1.25rem 1.5rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, background: "#0f0f0f", zIndex: 10,
      }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: "0.3em", color: "#444", marginBottom: 2 }}>RED DIRT</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, lineHeight: 1, letterSpacing: "0.02em" }}>WORKOUT TRACKER</div>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          style={{
            background: "none", border: "1px solid #2a2a2a", color: "#888",
            cursor: "pointer", padding: "6px 14px", fontSize: 12, borderRadius: 2,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >History ({history.length})</button>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "1.5rem 1rem" }}>
        {view === "session" && activeDay ? (
          <SessionView
            day={activeDay}
            history={history}
            onFinish={finishSession}
            onCancel={() => { setView("home"); setActiveDay(null); }}
          />
        ) : (
          <>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: "0.3em", color: "#444", marginBottom: 16 }}>THIS WEEK</div>

            {program.map((day, i) => {
              const color = TYPE_COLORS[day.type];
              const isToday = i === todayIdx;
              const last = getLastSession(day.id);
              const isRest = day.type === "rest";

              return (
                <div
                  key={day.id}
                  style={{
                    background: "#111", border: `1px solid ${isToday ? color : "#1e1e1e"}`,
                    borderRadius: 2, marginBottom: 8, overflow: "hidden",
                    opacity: isRest ? 0.4 : 1,
                    transition: "border-color 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "stretch" }}>
                    <div style={{ width: 4, background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", minWidth: 0 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: "0.2em", color: "#444" }}>{day.label}</span>
                          {isToday && (
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 9, letterSpacing: "0.2em", background: color, color: "#000", padding: "1px 6px", borderRadius: 1 }}>TODAY</span>
                          )}
                        </div>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, lineHeight: 1.1, color: "#f0f0f0" }}>{day.name}</div>
                        {!isRest && (
                          <div style={{ fontSize: 11, color: "#444", marginTop: 3 }}>
                            {day.exercises.length} exercises
                            {last && ` · last: ${new Date(last.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => setEditingDay(day)}
                          style={{
                            background: "none", border: "1px solid #2a2a2a", color: "#555",
                            cursor: "pointer", padding: "5px 10px", fontSize: 11,
                            fontFamily: "'DM Sans', sans-serif", borderRadius: 2,
                          }}
                        >edit</button>
                        {!isRest && (
                          <button
                            onClick={() => startSession(day)}
                            style={{
                              background: color, border: "none", borderRadius: 2,
                              padding: "5px 12px", fontFamily: "'Bebas Neue', sans-serif",
                              fontSize: 13, letterSpacing: "0.05em", cursor: "pointer", color: "#000",
                            }}
                          >Start</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {editingDay && <EditDayModal day={editingDay} onSave={saveDay} onClose={() => setEditingDay(null)} />}
      {showHistory && <HistoryView history={history} program={program} onClose={() => setShowHistory(false)} />}
    </div>
  );
}
