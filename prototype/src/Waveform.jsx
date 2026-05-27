// Waveform components — animated bars for active recording, static for paused/done.
// Also a "playback" timeline visual.

// Animated bar waveform (when actively recording or playing TTS)
function Waveform({ active = true, color = "var(--primary)", height = 56, bars = 48, dense = false }) {
  // Pre-compute pseudo-random heights so they don't shift on render
  const seeds = React.useMemo(() => {
    return Array.from({length: bars}, (_, i) => {
      // Deterministic-ish wave shape — a few overlaid sines
      const t = i / bars;
      const v = 0.35 + 0.5*Math.abs(Math.sin(t*8+1)) + 0.3*Math.abs(Math.sin(t*23));
      return {
        scale: Math.min(1, v),
        delay: (i*37 % 1200) / 1000,
        dur: 0.7 + ((i*53 % 600)/1000),
      };
    });
  }, [bars]);

  return (
    <div className="wf" style={{height, gap: dense ? 2 : 3}}>
      {seeds.map((s, i) => (
        <span key={i} style={{
          width: dense ? 2 : 3,
          background: color,
          transform: active ? undefined : `scaleY(${0.25 + s.scale*0.45})`,
          opacity: active ? 1 : 0.4,
          animation: active
            ? `wf ${s.dur}s ease-in-out ${s.delay}s infinite`
            : "none",
        }}/>
      ))}
    </div>
  );
}

// "Recorded waveform" — static deterministic bars representing a completed clip
function StaticWaveform({ progress = 0, height = 40, bars = 60, color = "var(--primary)", muted = "var(--line-3)" }) {
  const seeds = React.useMemo(() => {
    return Array.from({length: bars}, (_, i) => {
      const t = i / bars;
      // A speech-like envelope: louder in middle, varied
      const env = Math.sin(t * Math.PI);
      const noise = 0.4 + 0.6*Math.abs(Math.sin(t*17+0.3) + 0.5*Math.cos(t*41));
      return Math.max(0.12, Math.min(1, env*0.5 + noise*0.6));
    });
  }, [bars]);
  return (
    <div className="wf" style={{height, gap: 2}}>
      {seeds.map((h, i) => {
        const reached = (i/bars) <= progress;
        return (
          <span key={i} style={{
            width: 2, transform: `scaleY(${h})`,
            background: reached ? color : muted,
            animation: "none",
          }}/>
        );
      })}
    </div>
  );
}

// Big mic button with pulsing ring when active
function MicButton({ state = "idle", onClick, size = 96 }) {
  // state: idle | recording | done
  const palette = {
    idle:      { bg: "var(--primary)",   fg: "#fff", ring: false, label: "開始錄音" },
    recording: { bg: "var(--danger)",    fg: "#fff", ring: true,  label: "停止錄音" },
    done:      { bg: "var(--primary-soft)", fg: "var(--primary)", ring: false, label: "重新錄音" },
  };
  const p = palette[state];
  return (
    <button onClick={onClick} aria-label={p.label}
      className={state === "recording" ? "pulse" : ""}
      style={{
        width: size, height: size, borderRadius: "50%",
        background: p.bg, color: p.fg,
        display: "grid", placeItems: "center",
        boxShadow: state === "recording"
          ? "0 6px 20px rgba(234,82,82,.35)"
          : "0 6px 20px rgba(73,99,250,.25)",
        cursor: "pointer", transition: "all .2s ease",
      }}>
      {state === "recording"
        ? <I.Stop size={size*0.34} stroke="#fff"/>
        : <I.Mic size={size*0.40} stroke={p.fg} sw={1.8}/>}
    </button>
  );
}

window.Waveform = Waveform;
window.StaticWaveform = StaticWaveform;
window.MicButton = MicButton;
