// Inline SVG icons — kept stroke-based to match the simple/flat aesthetic.
// All take optional size + color via props.

const Icon = ({ d, size = 20, stroke = "currentColor", fill = "none", sw = 1.6, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d} /> : children}
  </svg>
);

const I = {
  Mic: (p) => (
    <Icon {...p}>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M9 21h6" />
    </Icon>
  ),
  Play: (p) => (
    <Icon {...p}><path d="M7 5l12 7-12 7V5z" fill={p?.fill || "currentColor"} stroke="none" /></Icon>
  ),
  Pause: (p) => (
    <Icon {...p}><rect x="7" y="5" width="3.5" height="14" rx="1" fill={p?.fill || "currentColor"} stroke="none"/><rect x="13.5" y="5" width="3.5" height="14" rx="1" fill={p?.fill || "currentColor"} stroke="none"/></Icon>
  ),
  Stop: (p) => (
    <Icon {...p}><rect x="6" y="6" width="12" height="12" rx="2" fill={p?.fill || "currentColor"} stroke="none"/></Icon>
  ),
  Skip: (p) => (
    <Icon {...p}><path d="M5 5l9 7-9 7V5z" fill={p?.fill || "currentColor"} stroke="none"/><path d="M19 5v14" stroke={p?.stroke || "currentColor"} strokeWidth="2" /></Icon>
  ),
  Replay: (p) => (
    <Icon {...p}><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" /></Icon>
  ),
  Check: (p) => <Icon {...p} d="M5 12.5l4.5 4.5L19 7" sw={2}/>,
  X: (p) => <Icon {...p} d="M6 6l12 12M18 6l-12 12" sw={2}/>,
  Chevron: (p) => <Icon {...p} d="M9 6l6 6-6 6"/>,
  ChevronD: (p) => <Icon {...p} d="M6 9l6 6 6-6"/>,
  ChevronL: (p) => <Icon {...p} d="M15 6l-6 6 6 6"/>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/></Icon>,
  Doc: (p) => <Icon {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/></Icon>,
  User: (p) => <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></Icon>,
  Folder: (p) => <Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></Icon>,
  Hash: (p) => <Icon {...p}><path d="M5 9h14M5 15h14M10 4l-2 16M16 4l-2 16"/></Icon>,
  Upload: (p) => <Icon {...p}><path d="M12 4v12"/><path d="M7 9l5-5 5 5"/><path d="M4 19h16"/></Icon>,
  Warn: (p) => <Icon {...p}><path d="M12 4l10 17H2L12 4z"/><path d="M12 10v5M12 18v.5"/></Icon>,
  Info: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v.5M12 11v5"/></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 2.9a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 2.9h5l.3-2.9a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1z"/></Icon>,
  Wave: (p) => <Icon {...p}><path d="M3 12h2M7 7v10M11 4v16M15 8v8M19 11v2M21 12h0"/></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 17h12l-1.5-2V11a4.5 4.5 0 0 0-9 0v4L6 17z"/><path d="M10 20a2 2 0 0 0 4 0"/></Icon>,
  Headset: (p) => <Icon {...p}><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></Icon>,
  Volume: (p) => <Icon {...p}><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8a5 5 0 0 1 0 8"/></Icon>,
  Lang: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></Icon>,
  Speed: (p) => <Icon {...p}><path d="M12 14l5-5"/><path d="M3 14a9 9 0 1 1 18 0"/></Icon>,
  Delete: (p) => <Icon {...p}><path d="M5 7h14M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12"/></Icon>,
  Plus: (p) => <Icon {...p} d="M12 5v14M5 12h14" sw={2}/>,
  Tablet: (p) => <Icon {...p}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M11 18h2"/></Icon>,
  Globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></Icon>,
  Script: (p) => <Icon {...p}><path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M16 4v3h3"/><path d="M8 11h8M8 15h5"/></Icon>,
  Card: (p) => <Icon {...p}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 11h18"/><path d="M7 16h3"/></Icon>,
  More: (p) => <Icon {...p}><circle cx="5" cy="12" r="1.6" fill={p?.stroke || "currentColor"}/><circle cx="12" cy="12" r="1.6" fill={p?.stroke || "currentColor"}/><circle cx="19" cy="12" r="1.6" fill={p?.stroke || "currentColor"}/></Icon>,
  Logo: ({ size = 24 } = {}) => (
    // Stylized "audit" mark — bold tick + waveform feel, white on indigo
    <svg width={size * 1.15} height={size} viewBox="0 0 28 24" fill="none" aria-hidden="true">
      <path d="M3 17 L9 22 L13 12 L19 6 L23 14" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="3" cy="4" r="1.6" fill="#fff"/>
      <circle cx="25" cy="4" r="1.2" fill="#fff" opacity=".7"/>
    </svg>
  ),
};

window.I = I;
window.Icon = Icon;
