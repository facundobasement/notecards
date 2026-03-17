"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  memo,
  createContext,
  useContext,
} from "react";
import {
  X,
  Check,
  Pencil,
  BookOpen,
  Search,
  Shuffle,
  Plus,
  Sparkles,
  Download,
  Copy,
  Zap,
  FileText,
  FolderPlus,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Star,
  LayoutList,
  Share2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
export type Theme = Record<string, string>;
export interface CardLike {
  id: string;
  quote: string;
  book: string;
  author?: string;
  year?: number | null;
  tags?: string[];
  note?: string;
  location?: string;
  starred?: boolean;
  createdAt?: number;
  lastSeenAt?: number;
}

// ─── Theme ────────────────────────────────────────────────────────────────────
export const LIGHT: Theme = {
  ink: "#0f0f0d",
  secondary: "#3a3a38",
  muted: "#787874",
  faint: "#b0afa9",
  border: "#e2e1de",
  borderHover: "#c8c7c3",
  surface: "#efefec",
  surfaceAlt: "#e8e7e3",
  base: "#f7f6f3",
  danger: "#b91c1c",
  dangerBg: "#fef2f2",
  sage: "#4a5e3a",
  sageBg: "#f0f4ed",
  sageBorder: "#c8d4be",
  userBubble: "#efefec",
  savedPulse: "#eaf0e5",
  coldDot: "#9aadcf",
  warmDot: "#c8a96e",
  inputBg: "#ffffff",
  inputShadow: "0 2px 20px rgba(0,0,0,0.07)",
  inputShadowFocus: "0 4px 28px rgba(0,0,0,0.10)",
};
export const DARK: Theme = {
  ink: "#f0ede8",
  secondary: "#c4c2bc",
  muted: "#787874",
  faint: "#4a4945",
  border: "#2a2925",
  borderHover: "#3a3834",
  surface: "#1e1d1a",
  surfaceAlt: "#252420",
  base: "#161512",
  danger: "#f87171",
  dangerBg: "#2d1515",
  sage: "#8fad7a",
  sageBg: "#141d0f",
  sageBorder: "#2a3d20",
  userBubble: "#252420",
  savedPulse: "#182314",
  coldDot: "#6b84b0",
  warmDot: "#c8a96e",
  inputBg: "#1e1d1a",
  inputShadow: "0 2px 16px rgba(0,0,0,0.35)",
  inputShadowFocus: "0 4px 28px rgba(0,0,0,0.5)",
};

export const ThemeCtx = createContext<Theme>(LIGHT);
export const useC = () => useContext(ThemeCtx);

export const R = { sm: 5, md: 8, lg: 12, xl: 18, pill: 99 };
export const FONT_SERIF =
  "'Playfair Display', 'Libre Baskerville', Georgia, serif";
export const FONT_SANS = "'DM Sans', 'Inter', system-ui, sans-serif";

export const makeT = (C: Theme): Record<string, React.CSSProperties> => ({
  quoteMain: {
    fontSize: 20,
    lineHeight: 1.75,
    color: C.ink,
    fontFamily: FONT_SERIF,
    letterSpacing: "0.01em",
  },
  quoteRandom: {
    fontSize: 32,
    lineHeight: 1.45,
    color: C.ink,
    fontFamily: FONT_SERIF,
    letterSpacing: "-0.02em",
  },
  quoteDisplay: {
    fontSize: 22,
    lineHeight: 1.5,
    color: C.ink,
    fontFamily: FONT_SERIF,
    letterSpacing: "-0.01em",
  },
  book: {
    fontSize: 11,
    fontWeight: 700,
    color: C.secondary,
    fontFamily: FONT_SANS,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  author: {
    fontSize: 13,
    fontWeight: 400,
    color: C.muted,
    fontFamily: FONT_SANS,
  },
  meta: { fontSize: 12, color: C.faint, fontFamily: FONT_SANS },
  label: {
    fontSize: 10,
    color: C.muted,
    fontFamily: FONT_SANS,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 600,
  },
  body: {
    fontSize: 15,
    lineHeight: 1.8,
    color: C.secondary,
    fontFamily: FONT_SANS,
  },
  small: { fontSize: 14, color: C.muted, fontFamily: FONT_SANS },
  caption: {
    fontSize: 12,
    color: C.faint,
    fontFamily: FONT_SANS,
    lineHeight: 1.5,
  },
});

export const cleanTag = (v: string): string =>
  v
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
export const fmtYear = (y: number | null | undefined): string =>
  !y ? "" : y < 0 ? `${Math.abs(y)} BCE` : String(y);
export const uid = (): string =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
const NOW = () => Date.now();
export const isWarm = (c: CardLike): boolean =>
  NOW() - (c.lastSeenAt ?? c.createdAt ?? 0) < 864e5 * 7;

export const cardToCtx = (c: CardLike, i?: number): string =>
  `[${i ?? "-"}] "${c.quote}" — *${c.book}*${c.author ? ` by ${c.author}` : ""}${c.year ? ` (${fmtYear(c.year)})` : ""}${c.location ? ` [${c.location}]` : ""}. Tags: ${(c.tags ?? []).join(", ")}${c.note ? `. Note: ${c.note}` : ""}`;
export const cardToExport = (c: CardLike): string =>
  `"${c.quote}"\n— ${c.book}${c.author ? `, ${c.author}` : ""}${c.year ? ` (${fmtYear(c.year)})` : ""}${c.location ? ` [${c.location}]` : ""}${c.note ? `\n[${c.note}]` : ""}\n`;

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const renderText = (
  t: string,
  C: Theme
): { __html: string } => ({
  __html: escapeHtml(t)
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      `<code style="font-size:0.85em;background:${C.surface};padding:1px 6px;border-radius:${R.sm}px;font-family:monospace;color:${C.secondary}">$1</code>`
    )
    .replace(/\n/g, "<br/>"),
});

export async function copyText(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = Object.assign(document.createElement("textarea"), {
      value: text,
      style: "position:fixed;opacity:0",
    });
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  } catch {
    /* ignore */
  }
}

export const COMMANDS = [
  { cmd: "/add", hint: '"quote"', desc: "Save a new quote", icon: "✦" },
  {
    cmd: "/find",
    hint: "topic, book, author",
    desc: "Smart search your library",
    icon: "◎",
  },
  { cmd: "/library", hint: "", desc: "Browse all your cards", icon: "▤" },
  {
    cmd: "/random",
    hint: "",
    desc: "Pull a card you haven't seen lately",
    icon: "⟳",
  },
  { cmd: "/read", hint: "", desc: "Start a focused reading session", icon: "📖" },
  {
    cmd: "/write",
    hint: "topic (optional)",
    desc: "Writing prompts from your cards",
    icon: "✐",
  },
  {
    cmd: "/import",
    hint: "",
    desc: "Bulk import quotes from text",
    icon: "⬆",
  },
];

export function getPlaceholder(
  cards: CardLike[],
  flowStage: string | null
): string {
  if (flowStage === "book") return "Search for a book…";
  if (flowStage === "author")
    return "Author name (or press Enter to skip)…";
  if (flowStage === "location")
    return "Page, chapter, or location (Enter to skip)…";
  if (flowStage === "import")
    return "Paste quotes, a reading list, or any text with quotes…";
  if (!cards.length) return `/add "a quote that stayed with you"`;
  const examples = [
    "Ask a question, or type / for commands…",
    `/find ${cards[0]?.tags?.[0] ?? "stoicism"}`,
    "/read to start a focused session",
    "/write for writing prompts",
  ];
  return examples[Math.floor(NOW() / 30000) % examples.length];
}

// ─── Primitive components ─────────────────────────────────────────────────────
type BtnVariant = "primary" | "outline" | "ghost" | "danger" | "subtle";
type BtnSize = "xs" | "sm" | "md";

export const Btn = memo(function Btn({
  onClick,
  children,
  variant = "ghost",
  size = "sm",
  disabled = false,
  style: s = {},
  title,
  C: CP,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  disabled?: boolean;
  style?: React.CSSProperties;
  title?: string;
  C?: Theme;
}) {
  const C = CP ?? useC();
  const sz: Record<BtnSize, React.CSSProperties> = {
    xs: { fontSize: 10, padding: "4px 10px" },
    sm: { fontSize: 12, padding: "6px 14px" },
    md: { fontSize: 13, padding: "9px 20px" },
  };
  const base: Record<BtnVariant, React.CSSProperties> = {
    primary: { background: C.ink, color: C.base, border: "none" },
    outline: {
      background: "transparent",
      color: C.muted,
      border: `1px solid ${C.border}`,
    },
    ghost: { background: "transparent", color: C.muted, border: "none" },
    danger: { background: "transparent", color: C.danger, border: "none" },
    subtle: { background: C.surface, color: C.secondary, border: "none" },
  };
  const hover: Record<BtnVariant, Partial<React.CSSProperties>> = {
    primary: { background: C.secondary },
    outline: { color: C.ink, borderColor: C.ink },
    ghost: { background: C.surface, color: C.ink },
    danger: { background: C.dangerBg },
    subtle: { background: C.surfaceAlt },
  };
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      onClick={disabled ? undefined : onClick}
      title={title}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        fontFamily: FONT_SANS,
        fontWeight: 500,
        cursor: disabled ? "default" : "pointer",
        border: "none",
        borderRadius: R.pill,
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        flexShrink: 0,
        opacity: disabled ? 0.35 : 1,
        letterSpacing: "0.01em",
        ...sz[size],
        ...base[variant],
        ...s,
      }}
      onMouseEnter={() => {
        if (!disabled && ref.current)
          Object.assign(ref.current.style, hover[variant]);
      }}
      onMouseLeave={() => {
        if (ref.current) Object.assign(ref.current.style, base[variant], s);
      }}
    >
      {children}
    </button>
  );
});

export const Tag = memo(function Tag({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove?: () => void;
}) {
  const C = useC();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontFamily: FONT_SANS,
        color: C.muted,
        letterSpacing: "0.02em",
      }}
    >
      <span
        style={{
          width: 3,
          height: 3,
          borderRadius: "50%",
          background: C.faint,
          flexShrink: 0,
        }}
      />
      {children}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.faint,
            padding: 0,
            display: "inline-flex",
            lineHeight: 1,
            marginLeft: 1,
          }}
        >
          <X size={8} />
        </button>
      )}
    </span>
  );
});

export const Chip = memo(function Chip({
  children,
  active,
  onRemove,
  onClick,
  color,
}: {
  children: React.ReactNode;
  active?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  color?: string;
}) {
  const C = useC();
  const bg = color
    ? `${color}18`
    : active
      ? C.ink
      : C.surface;
  const col = color ?? (active ? C.base : C.muted);
  const bdr = color
    ? `1px solid ${color}35`
    : `1px solid ${active ? C.ink : C.border}`;
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: onRemove ? "3px 7px 3px 9px" : "3px 9px",
        borderRadius: R.pill,
        fontSize: 11,
        fontFamily: FONT_SANS,
        background: bg,
        color: col,
        border: bdr,
        transition: "all 0.15s",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {color && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
      )}
      {children}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            opacity: 0.5,
            padding: 0,
            display: "inline-flex",
            lineHeight: 1,
          }}
        >
          <X size={9} />
        </button>
      )}
    </span>
  );
});

export const Divider = ({ style: s = {} }: { style?: React.CSSProperties }) => {
  const C = useC();
  return (
    <div
      style={{ height: 1, background: C.border, opacity: 0.6, ...s }}
    />
  );
};

export const Thinking = memo(function Thinking({
  label,
}: {
  label?: string;
}) {
  const C = useC();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 36,
      }}
    >
      <div style={{ display: "flex", gap: 5 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: C.faint,
              display: "inline-block",
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      {label && (
        <span
          style={{
            fontSize: 12,
            color: C.faint,
            fontFamily: FONT_SANS,
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
});

export function useKey(
  key: string,
  handler: (e: KeyboardEvent) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === key) handler(e);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, deps);
}


export const TagPickerDrawer = memo(function TagPickerDrawer({
  suggestedTags,
  quote,
  book,
  author,
  onConfirm,
  onDiscard,
  inputContainerRef,
}: {
  suggestedTags: string[];
  quote: string;
  book: string;
  author?: string;
  onConfirm: (tags: string[]) => void;
  onDiscard: () => void;
  inputContainerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const C = useC();
  const T = makeT(C);
  const [selected, setSelected] = useState([...suggestedTags]);
  const [inp, setInp] = useState("");
  const [visible, setVisible] = useState(false);
  const [drawerStyle, setDrawerStyle] = useState({
    left: 0,
    width: undefined as number | undefined,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputContainerRef?.current) {
      const rect = inputContainerRef.current.getBoundingClientRect();
      setDrawerStyle({ left: rect.left, width: rect.width });
    }
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [inputContainerRef]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);
  useKey("Escape", onDiscard, [onDiscard]);

  const toggle = (t: string) =>
    setSelected((p) =>
      p.includes(t) ? p.filter((x) => x !== t) : [...p, t]
    );
  const addExtra = () => {
    const c = cleanTag(inp);
    if (c && !selected.includes(c)) setSelected((p) => [...p, c]);
    setInp("");
    inputRef.current?.focus();
  };

  return (
    <>
      <div
        onClick={onDiscard}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          background: "rgba(0,0,0,0.15)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: drawerStyle.left ?? 0,
          width: drawerStyle.width ?? "100%",
          zIndex: 301,
          background: C.base,
          borderTop: `1px solid ${C.border}`,
          borderLeft: `1px solid ${C.border}`,
          borderRight: `1px solid ${C.border}`,
          borderRadius: `${R.xl}px ${R.xl}px 0 0`,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
          maxHeight: "72vh",
          display: "flex",
          flexDirection: "column",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.28s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "14px 0 8px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 3,
              borderRadius: 2,
              background: C.border,
            }}
          />
        </div>
        <div
          style={{
            padding: "4px 28px 16px",
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <p
            style={{
              ...T.quoteMain,
              fontSize: 13,
              color: C.muted,
              marginBottom: 6,
              lineHeight: 1.7,
            }}
          >
            "{quote.length > 100 ? quote.slice(0, 100) + "…" : quote}"
          </p>
          <span style={T.book}>{book}</span>
          {author && (
            <span style={{ ...T.author, marginLeft: 8 }}>{author}</span>
          )}
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 28px 0",
          }}
        >
          <p style={{ ...T.label, marginBottom: 14 }}>Tags</p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 16,
            }}
          >
            {selected.map((t) => (
              <Chip key={t} active onRemove={() => toggle(t)}>
                {t}
              </Chip>
            ))}
            {selected.length === 0 && (
              <span style={T.caption}>No tags yet</span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
              borderBottom: `1px solid ${C.border}`,
              paddingBottom: 18,
            }}
          >
            <input
              ref={inputRef}
              value={inp}
              onChange={(e) => setInp(e.target.value)}
              onKeyDown={(e) => {
                if (
                  (e.key === "Enter" || e.key === ",") &&
                  inp.trim()
                ) {
                  e.preventDefault();
                  addExtra();
                }
              }}
              placeholder="Type a tag and press Enter…"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 13,
                fontFamily: FONT_SANS,
                color: C.ink,
                padding: "6px 0",
              }}
            />
            {inp.trim() && (
              <Btn variant="subtle" size="xs" onClick={addExtra}>
                <Plus size={10} /> Add
              </Btn>
            )}
          </div>
          {suggestedTags.filter((t) => !selected.includes(t)).length > 0 && (
            <div>
              <p
                style={{
                  ...T.label,
                  marginBottom: 10,
                  opacity: 0.55,
                }}
              >
                Suggestions
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 5,
                  marginBottom: 8,
                }}
              >
                {suggestedTags
                  .filter((t) => !selected.includes(t))
                  .map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelected((p) => [...p, t])}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "3px 10px",
                        borderRadius: R.pill,
                        fontSize: 11,
                        fontFamily: FONT_SANS,
                        background: "transparent",
                        color: C.muted,
                        border: `1px dashed ${C.border}`,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = C.surface;
                        e.currentTarget.style.borderStyle = "solid";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderStyle = "dashed";
                      }}
                    >
                      <Plus size={9} />
                      {t}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
        <div
          style={{
            padding: "14px 28px 28px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span style={T.caption}>
            {selected.length} tag{selected.length !== 1 ? "s" : ""} selected
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" size="sm" onClick={onDiscard}>
              Discard
            </Btn>
            <Btn
              variant="primary"
              size="sm"
              onClick={() => onConfirm(selected)}
            >
              <Check size={11} /> Save card
            </Btn>
          </div>
        </div>
      </div>
    </>
  );
});

export const InlineEditField = memo(function InlineEditField({
  value,
  onChange,
  onCommit,
  placeholder,
  textStyle,
  inputStyle,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  placeholder?: string;
  textStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}) {
  const C = useC();
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (active) ref.current?.focus();
  }, [active]);
  if (!active)
    return (
      <span
        onClick={() => setActive(true)}
        style={{
          ...textStyle,
          cursor: "text",
          borderBottom: "1px dashed transparent",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = C.border)}
        onMouseLeave={(e) =>
          (e.currentTarget.style.borderBottomColor = "transparent")
        }
      >
        {value || (
          <span style={{ color: C.faint }}>{placeholder}</span>
        )}
      </span>
    );
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => {
        setActive(false);
        onCommit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape") {
          setActive(false);
          onCommit();
        }
      }}
      style={{
        ...inputStyle,
        border: "none",
        borderBottom: `1px solid ${C.ink}`,
        outline: "none",
        background: "transparent",
        padding: "0 0 1px",
        fontFamily: FONT_SANS,
      }}
    />
  );
});

export const TagEditor = memo(function TagEditor({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const C = useC();
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(tags);
  const [inp, setInp] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!editing) setLocal(tags);
  }, [tags, editing]);
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);
  const add = (v: string) => {
    const c = cleanTag(v);
    if (c && !local.includes(c)) setLocal((p) => [...p, c]);
    setInp("");
  };
  const commit = () => {
    onChange(local);
    setEditing(false);
    setInp("");
  };
  const discard = () => {
    setLocal(tags);
    setEditing(false);
    setInp("");
  };
  if (!editing)
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
        }}
      >
        {tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
        <button
          onClick={() => {
            setLocal(tags);
            setEditing(true);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.faint,
            padding: "1px 2px",
            display: "inline-flex",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.muted)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
        >
          <Pencil size={10} />
        </button>
      </div>
    );
  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 4,
          padding: "6px 10px",
          borderRadius: R.md,
          border: `1px solid ${C.border}`,
          background: C.base,
          minHeight: 34,
        }}
      >
        {local.map((t) => (
          <Chip
            key={t}
            active
            onRemove={() => setLocal((p) => p.filter((x) => x !== t))}
          >
            {t}
          </Chip>
        ))}
        <input
          ref={ref}
          value={inp}
          onChange={(e) => setInp(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === ",") && inp) {
              e.preventDefault();
              add(inp);
            }
            if (e.key === "Backspace" && !inp && local.length)
              setLocal((p) => p.slice(0, -1));
          }}
          placeholder={local.length ? "" : "add tags…"}
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 11,
            fontFamily: FONT_SANS,
            color: C.ink,
            minWidth: 70,
            flex: 1,
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <Btn variant="primary" size="xs" onClick={commit}>
          <Check size={10} /> Done
        </Btn>
        <Btn variant="ghost" size="xs" onClick={discard}>
          Cancel
        </Btn>
      </div>
    </div>
  );
});

// ─── CardDetailDrawer ────────────────────────────────────────────────────────
type CardDetailDrawerProps = {
  card: CardLike;
  allCards?: CardLike[];
  onUpdate: (id: string, patch: Partial<CardLike>) => void;
  onTagsChange: (id: string, tags: string[]) => void;
  onClose: () => void;
  inputContainerRef?: React.RefObject<HTMLDivElement | null>;
};

const CardDetailDrawer = memo(function CardDetailDrawer({
  card,
  allCards,
  onUpdate,
  onTagsChange,
  onClose,
  inputContainerRef,
}: CardDetailDrawerProps) {
  const C = useC();
  const T = makeT(C);
  const [visible, setVisible] = useState(false);
  const [drawerStyle, setDrawerStyle] = useState<{ left: number; width?: number }>({ left: 0, width: undefined });

  // Quote fields
  const [quote, setQuote] = useState(card.quote);
  const [book, setBook] = useState(card.book);
  const [author, setAuthor] = useState(card.author ?? "");
  const [location, setLocation] = useState(card.location ?? "");
  // Annotation
  const [note, setNote] = useState(card.note ?? "");
  // Tags
  const [selectedTags, setSelectedTags] = useState<string[]>(card.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  // Evolving reflections
  const [editingReflection, setEditingReflection] = useState(false);
  const [newReflection, setNewReflection] = useState("");
  // Sections
  const [expandedSection, setExpandedSection] = useState<string>("quote");

  const quoteRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputContainerRef?.current) {
      const rect = inputContainerRef.current.getBoundingClientRect();
      setDrawerStyle({ left: rect.left, width: rect.width });
    }
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [inputContainerRef]);

  useEffect(() => {
    const t = setTimeout(() => quoteRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);


  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;

  const allTags = useMemo(() => {
    const s = new Set<string>();
    allCards?.forEach((c) => c.tags?.forEach((t) => s.add(t)));
    return [...s].filter((t) => !selectedTags.includes(t)).slice(0, 12);
  }, [allCards, selectedTags]);

  const toggleTag = (t: string) =>
    setSelectedTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  const addTag = () => {
    const c = cleanTag(tagInput);
    if (c && !selectedTags.includes(c)) setSelectedTags((p) => [...p, c]);
    setTagInput("");
    tagInputRef.current?.focus();
  };

  const handleSave = () => {
    const patch: Partial<CardLike> = {};
    if (quote.trim() !== card.quote) patch.quote = quote.trim();
    if (book.trim() !== card.book) patch.book = book.trim();
    if ((author.trim() || "") !== (card.author ?? "")) patch.author = author.trim();
    if (note.trim() !== (card.note ?? "")) patch.note = note.trim();
    if ((location.trim() || "") !== (card.location ?? "")) patch.location = location.trim();
    if (!quote.trim() || !book.trim()) { onClose(); return; }
    if (Object.keys(patch).length) onUpdate(card.id, patch);
    const origTags = card.tags ?? [];
    if (JSON.stringify(selectedTags) !== JSON.stringify(origTags)) onTagsChange(card.id, selectedTags);
    onClose();
  };

  useKey("Escape", handleSave, [handleSave]);

  const toggle = (section: string) =>
    setExpandedSection((p) => (p === section ? "" : section));

  const sectionHeader = (id: string, label: string, summary?: string) => (
    <button
      type="button"
      onClick={() => toggle(id)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: FONT_SANS,
      }}
    >
      <span style={{ ...T.label, margin: 0 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {summary && expandedSection !== id && (
          <span style={{ ...T.caption, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary}</span>
        )}
        {expandedSection === id ? <ChevronUp size={12} color={C.faint} /> : <ChevronDown size={12} color={C.faint} />}
      </div>
    </button>
  );

  return (
    <>
      <div
        onClick={handleSave}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          background: "rgba(0,0,0,0.15)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: drawerStyle.left ?? 0,
          width: drawerStyle.width ?? "100%",
          zIndex: 301,
          background: C.base,
          borderTop: `1px solid ${C.border}`,
          borderLeft: drawerStyle.width != null ? `1px solid ${C.border}` : undefined,
          borderRight: drawerStyle.width != null ? `1px solid ${C.border}` : undefined,
          borderRadius: `${R.xl}px ${R.xl}px 0 0`,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.1)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.28s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* Drag handle + star */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 0 8px", position: "relative" }}>
          <div style={{ width: 32, height: 3, borderRadius: 2, background: C.border }} />
          <button
            type="button"
            onClick={() => onUpdate(card.id, { starred: !card.starred })}
            style={{
              position: "absolute",
              right: 20,
              top: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 6px",
              color: card.starred ? C.warmDot : C.faint,
              display: "flex",
              alignItems: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { if (!card.starred) e.currentTarget.style.color = C.warmDot; }}
            onMouseLeave={(e) => { if (!card.starred) e.currentTarget.style.color = C.faint; }}
          >
            <Star size={15} fill={card.starred ? C.warmDot : "none"} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 28px" }}>
          {/* ── Quote section ── */}
          {sectionHeader("quote", "Quote", card.quote.length > 40 ? card.quote.slice(0, 40) + "…" : card.quote)}
          {expandedSection === "quote" && (
            <div style={{ paddingBottom: 16 }}>
              <textarea
                ref={quoteRef}
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Paste or type the quote…"
                rows={4}
                style={{
                  width: "100%",
                  fontSize: 15,
                  fontFamily: FONT_SERIF,
                  lineHeight: 1.85,
                  color: C.ink,
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: R.md,
                  outline: "none",
                  resize: "vertical",
                  padding: "12px 14px",
                  marginBottom: 14,
                }}
              />
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ ...T.label, marginBottom: 6 }}>Book</p>
                  <input
                    value={book}
                    onChange={(e) => setBook(e.target.value)}
                    placeholder="Book title"
                    style={{
                      width: "100%",
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.secondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontFamily: FONT_SANS,
                      border: `1px solid ${C.border}`,
                      borderRadius: R.md,
                      outline: "none",
                      padding: "10px 14px",
                      background: "transparent",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ ...T.label, marginBottom: 6 }}>Author</p>
                  <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Author"
                    style={{
                      width: "100%",
                      fontSize: 13,
                      color: C.muted,
                      fontFamily: FONT_SANS,
                      border: `1px solid ${C.border}`,
                      borderRadius: R.md,
                      outline: "none",
                      padding: "10px 14px",
                      background: "transparent",
                    }}
                  />
                </div>
              </div>
              <div>
                <p style={{ ...T.label, marginBottom: 6 }}>Page / Chapter / Location</p>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. p. 42, Ch. 3, Kindle loc. 1204"
                  style={{
                    width: "100%",
                    fontSize: 13,
                    color: C.muted,
                    fontFamily: FONT_SANS,
                    border: `1px solid ${C.border}`,
                    borderRadius: R.md,
                    outline: "none",
                    padding: "10px 14px",
                    background: "transparent",
                  }}
                />
              </div>
            </div>
          )}
          <div style={{ height: 1, background: C.border, opacity: 0.6 }} />

          {/* ── Annotation section ── */}
          {sectionHeader("annotation", "Annotation", note ? `${wordCount} words` : undefined)}
          {expandedSection === "annotation" && (
            <div style={{ paddingBottom: 16 }}>
              {/* Show existing reflections as read-only blocks */}
              {(() => {
                const parts = note.split(/\n\n\u2014 /);
                const initial = parts[0] ?? "";
                const reflections = parts.slice(1).map((p) => {
                  const nl = p.indexOf("\n");
                  return { date: p.slice(0, nl > 0 ? nl : p.length), text: nl > 0 ? p.slice(nl + 1) : "" };
                }).filter((r) => r.text);
                return (
                  <>
                    <textarea
                      value={editingReflection ? initial : note}
                      onChange={(e) => {
                        if (editingReflection) {
                          const rest = parts.slice(1).map((p) => `\u2014 ${p}`).join("\n\n");
                          setNote(rest ? `${e.target.value}\n\n${rest}` : e.target.value);
                        } else {
                          setNote(e.target.value);
                        }
                      }}
                      placeholder="What does this quote mean to you?"
                      style={{
                        width: "100%",
                        minHeight: reflections.length > 0 ? 60 : 100,
                        fontSize: 15,
                        fontFamily: FONT_SERIF,
                        lineHeight: 1.85,
                        color: C.ink,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        padding: 0,
                        display: editingReflection ? "none" : undefined,
                      }}
                    />
                    {reflections.length > 0 && !editingReflection && (
                      <div style={{ marginTop: 12 }}>
                        {reflections.map((r, i) => (
                          <div key={i} style={{ marginBottom: 12, paddingLeft: 12, borderLeft: `2px solid ${C.border}` }}>
                            <p style={{ fontSize: 10, color: C.faint, fontFamily: FONT_SANS, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{r.date}</p>
                            <p style={{ fontSize: 13, color: C.muted, fontFamily: FONT_SERIF, lineHeight: 1.7, whiteSpace: "pre-line" }}>{r.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
              {editingReflection ? (
                <div style={{ marginTop: 8 }}>
                  <textarea
                    autoFocus
                    value={newReflection}
                    onChange={(e) => setNewReflection(e.target.value)}
                    placeholder="What do you think now?"
                    rows={3}
                    style={{
                      width: "100%",
                      fontSize: 14,
                      fontFamily: FONT_SERIF,
                      lineHeight: 1.7,
                      border: `1px solid ${C.border}`,
                      borderRadius: R.md,
                      background: "transparent",
                      color: C.ink,
                      outline: "none",
                      resize: "vertical",
                      padding: "10px 12px",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                    <Btn variant="ghost" size="xs" onClick={() => { setEditingReflection(false); setNewReflection(""); }}>Cancel</Btn>
                    <Btn variant="outline" size="xs" disabled={!newReflection.trim()} onClick={() => {
                      const monthYear = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
                      const base = note || "";
                      setNote(base ? `${base}\n\n\u2014 ${monthYear}\n${newReflection.trim()}` : newReflection.trim());
                      setNewReflection("");
                      setEditingReflection(false);
                    }}><Check size={10} /> Save</Btn>
                  </div>
                </div>
              ) : note.trim() ? (
                <button
                  onClick={() => setEditingReflection(true)}
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: C.faint,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: FONT_SANS,
                    padding: 0,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.secondary)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
                >
                  + Add a new reflection
                </button>
              ) : null}
              {wordCount > 0 && <span style={{ ...T.caption, marginTop: 6, display: "block" }}>{wordCount} words</span>}
            </div>
          )}
          <div style={{ height: 1, background: C.border, opacity: 0.6 }} />

          {/* ── Tags section ── */}
          {sectionHeader("tags", "Tags", selectedTags.length ? selectedTags.join(", ") : undefined)}
          {expandedSection === "tags" && (
            <div style={{ paddingBottom: 16 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {selectedTags.map((t) => (
                  <Chip key={t} active onRemove={() => toggleTag(t)}>{t}</Chip>
                ))}
                {selectedTags.length === 0 && <span style={T.caption}>No tags yet</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <input
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Type a tag and press Enter…"
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 13,
                    fontFamily: FONT_SANS,
                    color: C.ink,
                    padding: "6px 0",
                  }}
                />
                {tagInput.trim() && (
                  <Btn variant="subtle" size="xs" onClick={addTag}><Plus size={10} /> Add</Btn>
                )}
              </div>
              {allTags.length > 0 && (
                <div>
                  <p style={{ ...T.label, marginBottom: 8, opacity: 0.55 }}>Suggestions</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {allTags.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTags((p) => [...p, t])}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 10px",
                          borderRadius: R.pill,
                          fontSize: 11,
                          fontFamily: FONT_SANS,
                          background: "transparent",
                          color: C.muted,
                          border: `1px dashed ${C.border}`,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = C.surface;
                          e.currentTarget.style.borderStyle = "solid";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderStyle = "dashed";
                        }}
                      >
                        <Plus size={9} />{t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{ height: 1, background: C.border, opacity: 0.6 }} />

        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 28px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            borderTop: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <Btn variant="ghost" size="sm" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" size="sm" onClick={handleSave} disabled={!quote.trim() || !book.trim()}>
            <Check size={11} /> Save
          </Btn>
        </div>
      </div>
    </>
  );
});

// ─── NoteCard ─────────────────────────────────────────────────────────────────
type NoteCardProps = {
  card: CardLike;
  onUpdate: (id: string, patch: Partial<CardLike>) => void;
  onTagsChange: (id: string, tags: string[]) => void;
  onDelete: (id: string) => void;
  allCards?: CardLike[];
  compact?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  justSaved?: boolean;
  inputContainerRef?: React.RefObject<HTMLDivElement | null>;
};

export const NoteCard = memo(function NoteCard({
  card,
  onUpdate,
  onTagsChange,
  onDelete,
  allCards,
  compact = false,
  selectable = false,
  selected = false,
  onSelect,
  justSaved = false,
  inputContainerRef,
}: NoteCardProps) {
  const C = useC();
  const T = makeT(C);
  const [showDetail, setShowDetail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pulse, setPulse] = useState(justSaved);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (justSaved) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 700);
      return () => clearTimeout(t);
    }
  }, [justSaved]);

  useEffect(() => {
    if (!showMenu) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showMenu]);

  const bookCount =
    allCards?.filter(
      (c) =>
        c.id !== card.id &&
        c.book.toLowerCase() === card.book.toLowerCase()
    ).length ?? 0;
  const warm = isWarm(card);
  const py = compact ? 16 : 22;

  const handleCardClick = () => {
    if (selectable) { onSelect?.(card.id); return; }
    if (window.getSelection()?.toString()) return;
    setShowDetail(true);
  };

  return (
    <>
      {showDetail && (
        <CardDetailDrawer
          card={card}
          allCards={allCards}
          onUpdate={onUpdate}
          onTagsChange={onTagsChange}
          onClose={() => setShowDetail(false)}
          inputContainerRef={inputContainerRef}
        />
      )}
      {showShare && (
        <ShareCardModal card={card} onClose={() => setShowShare(false)} />
      )}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setShowMenu(false);
        }}
      >
        <div
          style={{
            padding: `${py}px 16px`,
            margin: "0 -16px",
            borderBottom: `1px solid ${C.border}`,
            borderRadius: R.md,
            position: "relative",
            background: pulse
              ? C.savedPulse
              : hovered
              ? C.surface
              : "transparent",
            transition: "background 0.15s ease",
            cursor: selectable ? "pointer" : "default",
          }}
          className="nc-card"
          onClick={handleCardClick}
        >
        {/* Star toggle + ··· menu (non-selectable mode) */}
        {!selectable && (
          <div
            style={{
              position: "absolute",
              top: py + 2,
              right: 16,
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(card.id, { starred: !card.starred });
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                color: card.starred ? C.warmDot : C.faint,
                display: "flex",
                alignItems: "center",
                opacity: card.starred ? 1 : hovered ? 0.6 : 0,
                transition: "color 0.15s, opacity 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1";
                if (!card.starred) e.currentTarget.style.color = C.warmDot;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = card.starred ? "1" : hovered ? "0.6" : "0";
                if (!card.starred) e.currentTarget.style.color = C.faint;
              }}
            >
              <Star size={13} fill={card.starred ? C.warmDot : "none"} />
            </button>
          <div
            ref={menuRef}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((v) => !v);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 4px",
                color: C.faint,
                display: "flex",
                alignItems: "center",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.ink)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
            >
              <MoreHorizontal size={14} />
            </button>
            {showMenu && (
              <div
                style={{
                  position: "absolute",
                  top: 22,
                  right: 0,
                  background: C.base,
                  border: `1px solid ${C.border}`,
                  borderRadius: R.lg,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                  minWidth: 160,
                  zIndex: 10,
                  overflow: "hidden",
                  animation: "fadeIn 0.12s ease",
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    setShowShare(true);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: FONT_SANS,
                    color: C.secondary,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.surface)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Share2 size={12} /> Share card
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    setConfirmDelete(true);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: FONT_SANS,
                    color: C.danger,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.surface)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <X size={12} /> Delete card
                </button>
              </div>
            )}
          </div>
          </div>
        )}

        {!selectable && (
          <div
            title={warm ? "Seen recently" : "Haven't visited in a while"}
            style={{
              position: "absolute",
              top: py + 8,
              left: -14,
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: warm ? C.warmDot : C.coldDot,
              opacity: 0.4,
            }}
          />
        )}
        {selectable && (
          <div
            style={{
              position: "absolute",
              top: py + 2,
              right: 0,
              width: 18,
              height: 18,
              borderRadius: R.sm,
              border: `1.5px solid ${selected ? C.ink : C.border}`,
              background: selected ? C.ink : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            {selected && <Check size={10} color={C.base} />}
          </div>
        )}

        <p style={{ ...T.quoteMain, marginBottom: 10, paddingRight: selectable ? 28 : 24 }}>
          "{card.quote}"
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={T.book}>{card.book || "Book"}</span>
          <span style={T.author}>{card.author || "Author"}</span>
          {card.year && <span style={T.meta}>{fmtYear(card.year)}</span>}
          {card.location && <span style={{ ...T.meta, opacity: 0.6 }}>{card.location}</span>}
          {!selectable && bookCount > 0 && (
            <span style={{ ...T.meta, marginLeft: "auto", fontSize: 10 }}>
              +{bookCount} from this book
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(card.tags ?? []).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>

        {!selectable && card.note && (
          <div style={{ marginTop: 12 }}>
            <p
              style={{
                fontSize: 14,
                fontFamily: FONT_SERIF,
                color: C.muted,
                lineHeight: 1.7,
                margin: 0,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              } as React.CSSProperties}
            >
              {card.note}
            </p>
          </div>
        )}


        {confirmDelete && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: R.md,
              background: C.dangerBg,
              border: "1px solid #fca5a5",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 13, color: C.danger, flex: 1 }}>
              Delete this card permanently?
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.danger,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
              style={{
                fontSize: 13,
                color: C.muted,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
});



// ─── Shared card list ────────────────────────────────────────────────────────
type CardListProps = Omit<NoteCardProps, "card"> & { cards: CardLike[] };
export const CardList = ({ cards, ...rest }: CardListProps) => {
  const C = useC();
  return (
    <div
      style={{
        borderLeft: `1px solid ${C.border}`,
        paddingLeft: 16,
        marginTop: 12,
        opacity: 0.9,
      }}
    >
      {cards.map((c) => (
        <NoteCard key={c.id} card={c} {...rest} compact />
      ))}
    </div>
  );
};

// ─── Content blocks ───────────────────────────────────────────────────────────
type WritePrompt = {
  label: string;
  prompt: string;
};
export const WritePrompts = memo(function WritePrompts({
  prompts,
  cards,
  ...rest
}: {
  prompts?: WritePrompt[];
  cards?: CardLike[];
} & Omit<NoteCardProps, "card" | "compact">) {
  const C = useC();
  const T = makeT(C);
  const [show, setShow] = useState(false);
  if (!prompts?.length) return null;
  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {prompts.map((p, i) => (
          <div
            key={i}
            style={{
              borderRadius: R.lg,
              border: `1px solid ${C.border}`,
              background: C.surface,
              padding: "14px 16px",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "block",
                marginBottom: 7,
              }}
            >
              {p.label}
            </span>
            <p
              style={{
                ...T.body,
                margin: 0,
                color: C.ink,
                fontSize: 14,
              }}
              dangerouslySetInnerHTML={renderText(p.prompt, C)}
            />
          </div>
        ))}
      </div>
      {cards && cards.length > 0 && (
        <>
          <Btn
            variant="outline"
            size="xs"
            onClick={() => setShow((v) => !v)}
          >
            {show ? "Hide" : "Show"} {cards.length} source card
            {cards.length !== 1 ? "s" : ""}
          </Btn>
          {show && <CardList cards={cards} {...rest} />}
        </>
      )}
    </div>
  );
});

export const SynthesisBlock = memo(function SynthesisBlock({
  text,
  cards,
  ...rest
}: {
  text: string;
  cards: CardLike[];
} & Omit<NoteCardProps, "card" | "compact">) {
  const C = useC();
  const T = makeT(C);
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <Sparkles
          size={12}
          style={{ color: C.faint, marginTop: 3, flexShrink: 0 }}
        />
        <p
          style={{ ...T.body, margin: 0 }}
          dangerouslySetInnerHTML={renderText(text, C)}
        />
      </div>
      {cards.length > 0 && (
        <>
          <Btn
            variant="outline"
            size="xs"
            onClick={() => setExpanded((v) => !v)}
            style={{ marginTop: 4 }}
          >
            {expanded ? "Hide" : "Show"} {cards.length} source card
            {cards.length !== 1 ? "s" : ""}
          </Btn>
          {expanded && <CardList cards={cards} {...rest} />}
        </>
      )}
    </div>
  );
});

type ImportQuote = {
  quote: string;
  book: string;
  author?: string;
  year?: number | null;
  tags?: string[];
};
export const ImportBlock = memo(function ImportBlock({
  quotes,
  onImport,
  onDiscard,
}: {
  quotes: ImportQuote[];
  onImport: (quotes: ImportQuote[]) => void;
  onDiscard: () => void;
}) {
  const C = useC();
  const T = makeT(C);
  const [selected, setSelected] = useState(
    () => new Set(quotes.map((_, i) => i))
  );
  const toggle = (i: number) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  if (!quotes.length)
    return (
      <p style={T.body}>
        No quotes could be extracted from that text.
      </p>
    );
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: 13 }}>⬆</span>
        <span style={T.label}>
          Found {quotes.length} quote{quotes.length !== 1 ? "s" : ""}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <Btn
            variant="ghost"
            size="xs"
            onClick={() =>
              setSelected(new Set(quotes.map((_, i) => i)))
            }
          >
            All
          </Btn>
          <Btn
            variant="ghost"
            size="xs"
            onClick={() => setSelected(new Set())}
          >
            None
          </Btn>
        </div>
      </div>
      <div
        style={{
          borderRadius: R.lg,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
          marginBottom: 14,
        }}
      >
        {quotes.map((q, i) => {
          const on = selected.has(i);
          return (
            <div
              key={i}
              onClick={() => toggle(i)}
              style={{
                padding: "14px 16px",
                borderBottom:
                  i < quotes.length - 1
                    ? `1px solid ${C.border}`
                    : "none",
                cursor: "pointer",
                background: on ? C.base : C.surface,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                transition: "background 0.1s",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: R.sm,
                  border: `1.5px solid ${on ? C.ink : C.border}`,
                  background: on ? C.ink : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                  transition: "all 0.15s",
                }}
              >
                {on && <Check size={9} color={C.base} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    ...T.quoteMain,
                    fontSize: 14,
                    marginBottom: 5,
                  }}
                >
                  "{q.quote}"
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={T.book}>{q.book}</span>
                  {q.author && (
                    <span style={T.author}>{q.author}</span>
                  )}
                  {q.year != null && (
                    <span style={T.meta}>{fmtYear(q.year)}</span>
                  )}
                </div>
                {q.tags && q.tags.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginTop: 6,
                    }}
                  >
                    {q.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn
          variant="primary"
          size="sm"
          disabled={!selected.size}
          onClick={() =>
            onImport(quotes.filter((_, i) => selected.has(i)))
          }
        >
          <Check size={12} /> Import {selected.size} card
          {selected.size !== 1 ? "s" : ""}
        </Btn>
        <Btn variant="outline" size="sm" onClick={onDiscard}>
          Cancel
        </Btn>
      </div>
    </div>
  );
});

type ReadingSessionItem = { card: CardLike; reflection: string };
type ReadingSession = { title: string; items: ReadingSessionItem[] };
export const ReadingSessionBlock = memo(function ReadingSessionBlock({
  session,
  onMark,
}: {
  session?: ReadingSession;
  onMark?: (cardId: string, note: string) => void;
}) {
  const C = useC();
  const T = makeT(C);
  const [idx, setIdx] = useState(0);
  const [reflected, setReflected] = useState(false);
  const [done, setDone] = useState(false);
  const [noteText, setNoteText] = useState("");

  if (!session?.items?.length)
    return (
      <p style={T.body}>
        Not enough cards for a reading session.
      </p>
    );
  const total = session.items.length;
  const item = session.items[idx];

  if (done)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "28px 0",
          animation: "fadeIn 0.3s ease",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 14 }}>✦</div>
        <p
          style={{
            fontSize: 17,
            color: C.ink,
            fontFamily: FONT_SERIF,
            marginBottom: 8,
          }}
        >
          Session complete.
        </p>
        <p style={T.caption}>
          {total} cards · {total} reflections
        </p>
      </div>
    );

  const advance = () => {
    if (noteText.trim() && onMark) onMark(item.card.id, noteText.trim());
    if (idx < total - 1) {
      setIdx((i) => i + 1);
      setReflected(false);
      setNoteText("");
    } else setDone(true);
  };

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
        }}
      >
        <span style={{ fontSize: 13 }}>📖</span>
        <span style={T.label}>{session.title}</span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: C.border,
            marginLeft: 8,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(idx / total) * 100}%`,
              background: C.ink,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <span style={{ ...T.meta, flexShrink: 0 }}>
          {idx + 1}/{total}
        </span>
      </div>
      <div
        style={{
          background: C.surface,
          borderRadius: R.xl,
          padding: "26px 22px",
          marginBottom: 18,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 2,
            background: C.border,
          }}
        />
        <p
          style={{
            ...T.quoteMain,
            fontSize: 20,
            marginBottom: 18,
            paddingLeft: 10,
          }}
        >
          {item.card.quote}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            paddingLeft: 10,
          }}
        >
          <span style={T.book}>{item.card.book}</span>
          {item.card.author && (
            <span style={T.author}>{item.card.author}</span>
          )}
          {item.card.year != null && (
            <span style={T.meta}>{fmtYear(item.card.year)}</span>
          )}
        </div>
        {item.card.tags && item.card.tags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 12,
              paddingLeft: 10,
            }}
          >
            {item.card.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}
      </div>
      {!reflected ? (
        <div style={{ animation: "fadeIn 0.2s ease" }}>
          <div
            style={{
              padding: "14px 18px",
              borderRadius: R.lg,
              background: C.sageBg,
              border: `1px solid ${C.sageBorder}`,
              marginBottom: 14,
            }}
          >
            <p
              style={{
                fontSize: 14,
                color: C.sage,
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              {item.reflection}
            </p>
          </div>
          <Btn
            variant="outline"
            size="sm"
            onClick={() => setReflected(true)}
          >
            I've sat with this →
          </Btn>
        </div>
      ) : (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <p style={{ ...T.label, marginBottom: 10 }}>
            Your note{" "}
            <span
              style={{
                opacity: 0.5,
                textTransform: "none",
                fontWeight: 400,
              }}
            >
              (optional)
            </span>
          </p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="A thought, a connection, a question…"
            rows={2}
            style={{
              width: "100%",
              fontSize: 15,
              fontFamily: FONT_SERIF,
              lineHeight: 1.85,
              color: C.ink,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: R.md,
              outline: "none",
              resize: "none",
              padding: "12px 14px",
              marginBottom: 12,
              transition: "border-color 0.15s",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = C.ink)
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = C.border)
            }
          />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="primary" size="sm" onClick={advance}>
              {idx < total - 1 ? "Next card →" : "Finish session"}
            </Btn>
            <Btn variant="ghost" size="sm" onClick={advance}>
              Skip note
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
});


type BookSuggestion = {
  title: string;
  author: string;
  year?: number | null;
};
export const Palette = memo(function Palette({
  title,
  icon,
  items,
  activeIdx,
  onSelect,
  loading,
  renderItem,
}: {
  title: string;
  icon: React.ReactNode;
  items: unknown[];
  activeIdx: number;
  onSelect: (item: unknown) => void;
  loading: boolean;
  renderItem: (item: unknown) => React.ReactNode;
}) {
  const C = useC();
  const activeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);
  if (!items.length && !loading) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 10px)",
        left: 0,
        right: 0,
        zIndex: 50,
        background: C.base,
        border: `1px solid ${C.border}`,
        borderRadius: R.xl,
        boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "9px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {icon}
        <span style={makeT(C).label}>
          {loading ? "Searching…" : title}
        </span>
      </div>
      {loading && !items.length && (
        <div style={{ padding: 16, display: "flex", gap: 5 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: C.faint,
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      )}
      {items.map((item, i) => (
        <button
          key={i}
          ref={i === activeIdx ? activeRef : null}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "11px 16px",
            background: i === activeIdx ? C.surface : "transparent",
            border: "none",
            borderBottom: `1px solid ${C.border}`,
            cursor: "pointer",
            fontFamily: FONT_SANS,
            transition: "background 0.1s",
          }}
          onMouseEnter={(e) => {
            if (i !== activeIdx) e.currentTarget.style.background = C.surface;
          }}
          onMouseLeave={(e) => {
            if (i !== activeIdx)
              e.currentTarget.style.background = "transparent";
          }}
        >
          {renderItem(item)}
        </button>
      ))}
    </div>
  );
});

export function BookPalette({
  suggestions,
  activeIdx,
  onSelect,
  loading,
}: {
  suggestions: BookSuggestion[];
  activeIdx: number;
  onSelect: (b: BookSuggestion) => void;
  loading: boolean;
}) {
  const C = useC();
  const T = makeT(C);
  return (
    <Palette
      title="Books"
      icon={<BookOpen size={11} style={{ color: C.faint }} />}
      items={suggestions}
      activeIdx={activeIdx}
      onSelect={(item) => onSelect(item as BookSuggestion)}
      loading={loading}
      renderItem={(b) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 14, color: C.ink }}>
            {(b as BookSuggestion).title}
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 1,
              marginLeft: 12,
              flexShrink: 0,
            }}
          >
            <span style={T.author}>
              {(b as BookSuggestion).author}
            </span>
            {(b as BookSuggestion).year != null && (
              <span style={T.meta}>
                {fmtYear((b as BookSuggestion).year)}
              </span>
            )}
          </div>
        </div>
      )}
    />
  );
}

export function CommandPalette({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (cmd: string) => void;
}) {
  const C = useC();
  const T = makeT(C);
  const filtered = useMemo(
    () =>
      COMMANDS.filter(
        (c) =>
          c.cmd.includes(query.toLowerCase()) ||
          c.desc.toLowerCase().includes(query.slice(1).toLowerCase())
      ),
    [query]
  );
  if (!filtered.length) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 10px)",
        left: 0,
        right: 0,
        zIndex: 50,
        background: C.base,
        border: `1px solid ${C.border}`,
        borderRadius: R.xl,
        boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "9px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Search size={11} style={{ color: C.faint }} />
        <span style={T.label}>Commands</span>
      </div>
      <div style={{ maxHeight: 268, overflowY: "auto" }}>
        {filtered.map((c, i) => (
          <button
            key={c.cmd}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(c.cmd);
            }}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom:
                i < filtered.length - 1
                  ? `1px solid ${C.border}`
                  : "none",
              cursor: "pointer",
              fontFamily: FONT_SANS,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = C.surface)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontSize: 14,
                  width: 20,
                  textAlign: "center",
                  color: C.faint,
                  flexShrink: 0,
                }}
              >
                {c.icon}
              </span>
              <div>
                <span
                  style={{
                    fontSize: 13,
                    color: C.ink,
                    fontWeight: 500,
                  }}
                >
                  {c.cmd}{" "}
                </span>
                <span style={{ fontSize: 13, color: C.muted }}>
                  {c.hint}
                </span>
                <div style={{ ...T.caption, marginTop: 1 }}>{c.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

type Filter = { id: string; type: string; value: string };
export const FilterBar = memo(function FilterBar({
  filters,
  tags,
  onAdd,
  onRemove,
  onClearAll,
}: {
  filters: Filter[];
  tags: { tag: string; count: number }[];
  onAdd: (f: Filter) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}) {
  const C = useC();
  const T = makeT(C);
  const [step, setStep] = useState<{ type: string; label: string } | "type" | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!step) return;
    const h = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      )
        setStep(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [step]);

  const typeOptions = [
    tags.length && { type: "tag", label: "Tag" },
    { type: "starred", label: "Starred" },
  ].filter(Boolean) as { type: string; label: string }[];

  const valueOptions = useMemo(() => {
    if (!step || step === "type") return [] as { value: string; label: string; meta?: number; dot?: string }[];
    const active = new Set(
      filters.filter((f) => f.type === step.type).map((f) => f.value)
    );
    if (step.type === "tag")
      return tags
        .map(({ tag, count }) => ({
          value: tag,
          label: tag,
          meta: count,
          dot: undefined,
        }))
        .filter((o) => !active.has(o.value));
    return [];
  }, [step, filters, tags]);

  const resolveLabel = (f: Filter) => {
    if (f.type === "tag") return { label: f.value, dot: undefined, typeLabel: "Tag" };
    if (f.type === "starred") return { label: "Yes", dot: undefined, typeLabel: "Starred" };
    return { label: f.value, dot: undefined, typeLabel: "" };
  };

  const MenuRow = ({
    onClick,
    children,
  }: {
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "9px 14px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: FONT_SANS,
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.surface)}
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "transparent")
      }
    >
      {children}
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
        minHeight: 28,
        position: "relative",
      }}
    >
      {filters.map((f) => {
        const { label, dot, typeLabel } = resolveLabel(f);
        return (
          <div
            key={f.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: R.sm,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
              fontSize: 11,
              fontFamily: FONT_SANS,
              background: C.base,
            }}
          >
            <span
              style={{
                padding: "3px 7px",
                background: C.surface,
                color: C.muted,
                borderRight: `1px solid ${C.border}`,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {typeLabel}
            </span>
            <span
              style={{
                padding: "3px 6px",
                color: C.ink,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {dot && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: dot,
                    flexShrink: 0,
                  }}
                />
              )}
              {label}
            </span>
            <button
              onClick={() => onRemove(f.id)}
              style={{
                padding: "3px 6px",
                background: "transparent",
                border: "none",
                borderLeft: `1px solid ${C.border}`,
                cursor: "pointer",
                color: C.faint,
                display: "inline-flex",
                alignItems: "center",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.surface;
                e.currentTarget.style.color = C.ink;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = C.faint;
              }}
            >
              <X size={10} />
            </button>
          </div>
        );
      })}
      <div style={{ position: "relative" }}>
        <button
          ref={btnRef}
          onClick={() => setStep((s) => (s ? null : "type"))}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 9px",
            fontSize: 11,
            fontFamily: FONT_SANS,
            border: `1px solid ${step ? C.ink : C.border}`,
            borderRadius: R.sm,
            background: step ? C.surface : "transparent",
            color: step ? C.ink : C.faint,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!step) {
              e.currentTarget.style.color = C.muted;
              e.currentTarget.style.borderColor = C.borderHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!step) {
              e.currentTarget.style.color = C.faint;
              e.currentTarget.style.borderColor = C.border;
            }
          }}
        >
          <Plus size={10} />
          <span>Filter</span>
        </button>
        {step === "type" && typeOptions.length > 0 && (
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              zIndex: 90,
              background: C.base,
              border: `1px solid ${C.border}`,
              borderRadius: R.lg,
              boxShadow: "0 8px 28px rgba(0,0,0,0.09)",
              minWidth: 160,
              paddingTop: 4,
              paddingBottom: 4,
              animation: "fadeIn 0.12s ease",
            }}
          >
            {typeOptions.map((opt) => (
              <MenuRow
                key={opt.type}
                onClick={() => {
                  if (opt.type === "starred") {
                    const alreadyHas = filters.some((f) => f.type === "starred");
                    if (!alreadyHas) onAdd({ id: uid(), type: "starred", value: "true" });
                    setStep(null);
                  } else {
                    setStep(opt);
                  }
                }}
              >
                <span style={{ fontSize: 13, color: C.secondary, display: "flex", alignItems: "center", gap: 6 }}>
                  {opt.type === "starred" && <Star size={11} />}
                  {opt.label}
                </span>
              </MenuRow>
            ))}
          </div>
        )}
        {step && step !== "type" && (
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              zIndex: 90,
              background: C.base,
              border: `1px solid ${C.border}`,
              borderRadius: R.lg,
              boxShadow: "0 8px 28px rgba(0,0,0,0.09)",
              minWidth: 200,
              maxHeight: 280,
              overflowY: "auto",
              animation: "fadeIn 0.12s ease",
            }}
          >
            <button
              onClick={() => setStep("type")}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 14px 6px",
                fontSize: 10,
                fontFamily: FONT_SANS,
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${C.border}`,
                cursor: "pointer",
                color: C.faint,
                display: "flex",
                alignItems: "center",
                gap: 5,
                letterSpacing: "0.05em",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = C.muted)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = C.faint)
              }
            >
              ← {step.label}
            </button>
            {valueOptions.length === 0 ? (
              <p
                style={{
                  padding: "12px 14px",
                  fontSize: 13,
                  color: C.faint,
                  fontFamily: FONT_SANS,
                }}
              >
                All values already filtered.
              </p>
            ) : (
              valueOptions.map((opt) => (
                <MenuRow
                  key={opt.value}
                  onClick={() => {
                    onAdd({
                      id: uid(),
                      type: step.type,
                      value: opt.value,
                    });
                    setStep(null);
                  }}
                >
                  {opt.dot && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: opt.dot,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 13,
                      color: C.secondary,
                      flex: 1,
                    }}
                  >
                    {opt.label}
                  </span>
                  {opt.meta != null && (
                    <span style={{ fontSize: 12, color: C.faint }}>
                      {opt.meta}
                    </span>
                  )}
                </MenuRow>
              ))
            )}
          </div>
        )}
      </div>
      {filters.length > 0 && (
        <button
          onClick={onClearAll}
          style={{
            fontSize: 11,
            fontFamily: FONT_SANS,
            color: C.faint,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "3px 4px",
            letterSpacing: "0.05em",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.muted)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
        >
          Clear
        </button>
      )}
    </div>
  );
});

export const ContextDivider = memo(function ContextDivider({
  label,
}: {
  label: string;
}) {
  const C = useC();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "10px 0 24px",
        opacity: 0.35,
      }}
    >
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span
        style={{
          fontSize: 9,
          fontFamily: FONT_SANS,
          color: C.faint,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
});

// ─── ShareCardModal ──────────────────────────────────────────────────────────
function renderCardToCanvas(
  card: CardLike,
  C: Theme,
  scale = 2
): HTMLCanvasElement {
  const W = 600;
  const H = 800;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = C === DARK ? "#1a1917" : "#faf8f4";
  ctx.fillRect(0, 0, W, H);

  // Subtle border
  ctx.strokeStyle = C === DARK ? "#2a2925" : "#e8e5df";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  const pad = 60;
  const textW = W - pad * 2;

  // Top decorative rule
  ctx.fillStyle = C === DARK ? "#3a3834" : "#d4d1cb";
  ctx.fillRect(W / 2 - 16, 80, 32, 1);

  // Open-quote glyph
  ctx.fillStyle = C === DARK ? "#3a3834" : "#d4d1cb";
  ctx.font = `60px "Playfair Display", Georgia, serif`;
  ctx.textAlign = "center";
  ctx.fillText("\u201C", W / 2, 130);

  // Quote text — word-wrap
  const quoteSize = card.quote.length > 300 ? 20 : card.quote.length > 150 ? 24 : 28;
  ctx.font = `400 ${quoteSize}px "Playfair Display", Georgia, serif`;
  ctx.fillStyle = C === DARK ? "#f0ede8" : "#1a1917";
  ctx.textAlign = "center";

  const words = card.quote.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > textW) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = quoteSize * 1.65;
  const quoteBlockH = lines.length * lineHeight;
  const quoteStartY = Math.max(160, (H - quoteBlockH) / 2 - 60);

  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, quoteStartY + i * lineHeight);
  });

  const afterQuote = quoteStartY + quoteBlockH + 30;

  // Divider rule
  ctx.fillStyle = C === DARK ? "#3a3834" : "#d4d1cb";
  ctx.fillRect(W / 2 - 12, afterQuote, 24, 1);

  // Book title
  const metaY = afterQuote + 36;
  ctx.font = `700 11px "DM Sans", "Inter", system-ui, sans-serif`;
  ctx.fillStyle = C === DARK ? "#c4c2bc" : "#3a3a38";
  ctx.textAlign = "center";
  ctx.fillText(card.book.toUpperCase(), W / 2, metaY);

  // Author
  if (card.author) {
    ctx.font = `400 13px "DM Sans", "Inter", system-ui, sans-serif`;
    ctx.fillStyle = C === DARK ? "#787874" : "#787874";
    const authorText =
      card.author + (card.year != null ? ` \u00B7 ${fmtYear(card.year)}` : "");
    ctx.fillText(authorText, W / 2, metaY + 22);
  }

  // Watermark
  ctx.font = `500 9px "DM Sans", "Inter", system-ui, sans-serif`;
  ctx.fillStyle = C === DARK ? "#2a2925" : "#d4d1cb";
  ctx.textAlign = "center";
  ctx.fillText("notecards", W / 2, H - 30);

  return canvas;
}

export const ShareCardModal = memo(function ShareCardModal({
  card,
  onClose,
}: {
  card: CardLike;
  onClose: () => void;
}) {
  const C = useC();
  const T = makeT(C);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<"image" | "text" | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useKey("Escape", onClose, [onClose]);

  useEffect(() => {
    const canvas = renderCardToCanvas(card, C);
    canvasRef.current = canvas;
    if (previewRef.current) {
      previewRef.current.innerHTML = "";
      const display = canvas.cloneNode(true) as HTMLCanvasElement;
      const dCtx = display.getContext("2d")!;
      dCtx.drawImage(canvas, 0, 0);
      display.style.width = "100%";
      display.style.height = "auto";
      display.style.borderRadius = "8px";
      display.style.boxShadow = "0 8px 40px rgba(0,0,0,0.12)";
      previewRef.current.appendChild(display);
    }
  }, [card, C]);

  const copyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("no blob"))), "image/png")
      );
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied("image");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback: copy text instead
      copyText();
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `notecard-${card.book.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const copyText = async () => {
    const text = `"${card.quote}"\n\n\u2014 ${card.book}${card.author ? `, ${card.author}` : ""}`;
    await navigator.clipboard.writeText(text);
    setCopied("text");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        fontFamily: FONT_SANS,
        background: C.base,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "8px 16px",
          borderRadius: 99,
          border: `1px solid ${C.border}`,
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontSize: 13,
          fontFamily: FONT_SANS,
          fontWeight: 500,
          color: C.faint,
          transition: "all 0.15s",
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = C.ink;
          e.currentTarget.style.borderColor = C.borderHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = C.faint;
          e.currentTarget.style.borderColor = C.border;
        }}
      >
        <X size={13} />
        Close
      </button>

      <div
        style={{
          maxWidth: 380,
          width: "100%",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(14px)",
          transition: "opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Label */}
        <p
          style={{
            ...T.label,
            marginBottom: 20,
          }}
        >
          Share a Card
        </p>

        {/* Canvas preview */}
        <div
          ref={previewRef}
          style={{
            width: "100%",
            marginBottom: 28,
          }}
        />

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={copyImage}
            style={{
              background: C.ink,
              color: C.base,
              border: "none",
              borderRadius: R.pill,
              cursor: "pointer",
              padding: "9px 20px",
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 13,
              fontFamily: FONT_SANS,
              fontWeight: 500,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.secondary)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.ink)}
          >
            {copied === "image" ? (
              <>
                <Check size={13} /> Copied!
              </>
            ) : (
              <>
                <Copy size={13} /> Copy image
              </>
            )}
          </button>
          <button
            type="button"
            onClick={downloadImage}
            style={{
              background: "transparent",
              color: C.secondary,
              border: `1px solid ${C.border}`,
              borderRadius: R.pill,
              cursor: "pointer",
              padding: "8px 18px",
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 13,
              fontFamily: FONT_SANS,
              fontWeight: 500,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.borderHover;
              e.currentTarget.style.color = C.ink;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.secondary;
            }}
          >
            <Download size={13} /> Download
          </button>
          <button
            type="button"
            onClick={copyText}
            style={{
              background: "transparent",
              color: C.muted,
              border: `1px solid ${C.border}`,
              borderRadius: R.pill,
              cursor: "pointer",
              padding: "8px 18px",
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 13,
              fontFamily: FONT_SANS,
              fontWeight: 500,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.borderHover;
              e.currentTarget.style.color = C.ink;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.muted;
            }}
          >
            {copied === "text" ? (
              <>
                <Check size={13} /> Copied!
              </>
            ) : (
              <>
                <FileText size={13} /> Copy text
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export const RandomCard = memo(function RandomCard({
  card,
  onNext,
  onClose,
  onUpdate,
}: {
  card: CardLike;
  onNext: () => void;
  onClose: () => void;
  onUpdate?: (id: string, patch: Partial<CardLike>) => void;
}) {
  const C = useC();
  const T = makeT(C);
  const [visible, setVisible] = useState(false);
  const [showReflect, setShowReflect] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [newThought, setNewThought] = useState("");
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [card.id]);
  useEffect(() => {
    setShowReflect(false);
    setNewThought("");
  }, [card.id]);
  useKey("Escape", onClose, [onClose]);

  const submitReflection = () => {
    if (!newThought.trim() || !onUpdate) return;
    const now = new Date();
    const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const combined = card.note
      ? `${card.note}\n\n\u2014 ${monthYear}\n${newThought.trim()}`
      : newThought.trim();
    onUpdate(card.id, { note: combined });
    setNewThought("");
    setShowReflect(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
        fontFamily: FONT_SANS,
        background: C.base,
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "8px 16px",
          borderRadius: 99,
          border: `1px solid ${C.border}`,
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontSize: 13,
          fontFamily: FONT_SANS,
          fontWeight: 500,
          color: C.faint,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = C.ink;
          e.currentTarget.style.borderColor = C.borderHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = C.faint;
          e.currentTarget.style.borderColor = C.border;
        }}
      >
        <X size={13} />
        Close
      </button>
      <div
        style={{
          maxWidth: 540,
          width: "100%",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(14px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        <div
          style={{
            width: 24,
            height: 1,
            background: C.border,
            margin: "0 auto 40px",
          }}
        />
        <p
          style={{
            ...T.quoteRandom,
            textAlign: "center",
            marginBottom: 36,
          }}
        >
          {card.quote}
        </p>
        <div
          style={{
            width: 24,
            height: 1,
            background: C.border,
            margin: "0 auto 28px",
          }}
        />
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ ...T.book, fontSize: 12, marginBottom: 5 }}>
            {card.book}
          </p>
          {card.author && (
            <p style={{ ...T.author, fontSize: 13 }}>
              {card.author}
              {card.year != null ? ` · ${fmtYear(card.year)}` : ""}
            </p>
          )}
          {card.note && (
            <div style={{ marginTop: 20, maxWidth: 420, margin: "20px auto 0" }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: C.faint,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                Your earlier reflection:
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: C.muted,
                  lineHeight: 1.8,
                  fontFamily: FONT_SERIF,
                  whiteSpace: "pre-line",
                }}
              >
                {card.note}
              </p>
            </div>
          )}
          {card.note && !showReflect && onUpdate && (
            <button
              onClick={() => setShowReflect(true)}
              style={{
                marginTop: 12,
                fontSize: 13,
                color: C.faint,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: FONT_SANS,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.secondary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
            >
              Add a new thought
            </button>
          )}
          {showReflect && onUpdate && (
            <div style={{ marginTop: 16, maxWidth: 420, margin: "16px auto 0" }}>
              <textarea
                autoFocus
                value={newThought}
                onChange={(e) => setNewThought(e.target.value)}
                placeholder="What do you think now?"
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 13,
                  fontFamily: FONT_SERIF,
                  lineHeight: 1.7,
                  border: `1px solid ${C.border}`,
                  borderRadius: R.md,
                  background: "transparent",
                  color: C.ink,
                  outline: "none",
                  resize: "vertical",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.ink)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowReflect(false); setNewThought(""); }}
                >
                  Cancel
                </Btn>
                <Btn
                  variant="outline"
                  size="sm"
                  onClick={submitReflection}
                  disabled={!newThought.trim()}
                >
                  <Check size={12} /> Save
                </Btn>
              </div>
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center",
              marginTop: 14,
            }}
          >
            {(card.tags ?? []).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          <Btn variant="outline" size="sm" onClick={onNext}>
            <Shuffle size={12} /> Another one
          </Btn>
          <Btn variant="outline" size="sm" onClick={() => setShowShare(true)}>
            <Share2 size={12} /> Share
          </Btn>
        </div>
      </div>
      {showShare && (
        <ShareCardModal card={card} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
});

// ─── MorningCard ──────────────────────────────────────────────────────────────
export const MorningCard = memo(function MorningCard({
  cards,
  onUpdate,
}: {
  cards: CardLike[];
  onUpdate: (id: string, patch: Partial<CardLike>) => void;
}) {
  const C = useC();
  const T = makeT(C);
  const [visible, setVisible] = useState(false);
  const [showReflectM, setShowReflectM] = useState(false);
  const [showShareM, setShowShareM] = useState(false);
  const [newThoughtM, setNewThoughtM] = useState("");

  const card = useMemo(() => {
    if (!cards.length) return null;
    const now = Date.now();
    const sevenDays = 864e5 * 7;
    // Score cards: prefer not-recently-seen, weight starred cards higher
    const scored = cards.map((c) => {
      const age = now - (c.lastSeenAt ?? c.createdAt ?? 0);
      const stale = age > sevenDays ? 3 : age > 864e5 * 3 ? 2 : 1;
      const starBonus = c.starred ? 2 : 1;
      return { card: c, score: stale * starBonus + Math.random() * 0.5 };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.card ?? null;
  }, [cards]);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const submitMorningReflection = () => {
    if (!newThoughtM.trim() || !card) return;
    const now = new Date();
    const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const combined = card.note
      ? `${card.note}\n\n\u2014 ${monthYear}\n${newThoughtM.trim()}`
      : newThoughtM.trim();
    onUpdate(card.id, { note: combined });
    setNewThoughtM("");
    setShowReflectM(false);
  };

  if (!card) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 0 32px",
        fontFamily: FONT_SANS,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.97) translateY(12px)",
          transition: "opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Thin rule */}
        <div style={{ width: 32, height: 1, background: C.border, marginBottom: 48 }} />

        {/* Quote */}
        <p
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 24,
            lineHeight: 1.65,
            color: C.ink,
            textAlign: "center",
            fontWeight: 400,
            letterSpacing: "-0.01em",
            marginBottom: 40,
            maxWidth: 500,
          }}
        >
          {card.quote}
        </p>

        {/* Rule */}
        <div style={{ width: 24, height: 1, background: C.border, marginBottom: 28 }} />

        {/* Book + author */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <p style={{ ...T.book, fontSize: 12, marginBottom: 5 }}>{card.book}</p>
          {card.author && (
            <p style={{ ...T.author, fontSize: 13 }}>
              {card.author}
              {card.year != null ? ` · ${fmtYear(card.year)}` : ""}
            </p>
          )}
        </div>

        {/* Annotation with evolving reflections */}
        {card.note && (
          <div style={{ maxWidth: 420, width: "100%", marginBottom: 12 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: C.faint,
                textTransform: "uppercase" as const,
                letterSpacing: "0.05em",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Your earlier reflection:
            </p>
            <p
              style={{
                fontSize: 14,
                color: C.muted,
                textAlign: "center",
                lineHeight: 1.8,
                fontFamily: FONT_SERIF,
                fontStyle: "italic",
                padding: "16px 20px",
                borderLeft: `2px solid ${C.border}`,
                borderRight: `2px solid ${C.border}`,
                whiteSpace: "pre-line",
              }}
            >
              {card.note}
            </p>
          </div>
        )}
        {card.note && !showReflectM && (
          <button
            onClick={() => setShowReflectM(true)}
            style={{
              marginBottom: 20,
              fontSize: 13,
              color: C.faint,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: FONT_SANS,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.secondary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
          >
            Add a new thought
          </button>
        )}
        {showReflectM && (
          <div style={{ maxWidth: 420, width: "100%", marginBottom: 20 }}>
            <textarea
              autoFocus
              value={newThoughtM}
              onChange={(e) => setNewThoughtM(e.target.value)}
              placeholder="What do you think now?"
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 13,
                fontFamily: FONT_SERIF,
                lineHeight: 1.7,
                border: `1px solid ${C.border}`,
                borderRadius: R.md,
                background: "transparent",
                color: C.ink,
                outline: "none",
                resize: "vertical",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.ink)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Btn
                variant="ghost"
                size="sm"
                onClick={() => { setShowReflectM(false); setNewThoughtM(""); }}
              >
                Cancel
              </Btn>
              <Btn
                variant="outline"
                size="sm"
                onClick={submitMorningReflection}
                disabled={!newThoughtM.trim()}
              >
                <Check size={12} /> Save
              </Btn>
            </div>
          </div>
        )}

        {/* Tags */}
        {(card.tags ?? []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 32 }}>
            {(card.tags ?? []).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <button
            type="button"
            onClick={() => onUpdate(card.id, { starred: !card.starred })}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: R.pill,
              cursor: "pointer",
              padding: "8px 16px",
              color: card.starred ? C.warmDot : C.faint,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontFamily: FONT_SANS,
              fontWeight: 500,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.borderHover;
              if (!card.starred) e.currentTarget.style.color = C.warmDot;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              if (!card.starred) e.currentTarget.style.color = C.faint;
            }}
          >
            <Star size={14} fill={card.starred ? C.warmDot : "none"} />
            {card.starred ? "Starred" : "Star"}
          </button>
          <button
            type="button"
            onClick={() => setShowShareM(true)}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: R.pill,
              cursor: "pointer",
              padding: "8px 16px",
              color: C.faint,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontFamily: FONT_SANS,
              fontWeight: 500,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.borderHover;
              e.currentTarget.style.color = C.ink;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.faint;
            }}
          >
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>
      {showShareM && (
        <ShareCardModal card={card} onClose={() => setShowShareM(false)} />
      )}
    </div>
  );
});

export const LibraryPanel = memo(function LibraryPanel({
  cards,
  onUpdate,
  onTagsChange,
  onDelete,
  onClose,
  onRandom,
  onExport,
  onSmartSearch,
  allCards,
  inputContainerRef,
}: Omit<NoteCardProps, "card"> & {
  cards: CardLike[];
  onClose: () => void;
  onRandom: () => void;
  onExport: () => void;
  onSmartSearch?: (query: string, signal: AbortSignal) => Promise<{ type: string; text: string; cards: CardLike[] }>;
  allCards?: CardLike[];
}) {
  const C = useC();
  const T = makeT(C);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [search, setSearch] = useState("");
  const [smartMode, setSmartMode] = useState(false);
  const [smartResults, setSmartResults] = useState<CardLike[] | null>(null);
  const [smartSearching, setSmartSearching] = useState(false);
  const smartAbortRef = useRef<AbortController | null>(null);
  const [viewMode, setViewMode] = useState<"book" | "all">("book");
  const [showOverflow, setShowOverflow] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);
  useEffect(() => {
    if (!showOverflow) return;
    const h = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node))
        setShowOverflow(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showOverflow]);

  // Smart search effect
  useEffect(() => {
    if (!smartMode || !search.trim() || !onSmartSearch) {
      setSmartResults(null);
      setSmartSearching(false);
      return;
    }
    smartAbortRef.current?.abort();
    const ctrl = new AbortController();
    smartAbortRef.current = ctrl;
    setSmartSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await onSmartSearch(search.trim(), ctrl.signal);
        if (!ctrl.signal.aborted) {
          setSmartResults(res.cards);
          setSmartSearching(false);
        }
      } catch {
        if (!ctrl.signal.aborted) {
          setSmartResults(null);
          setSmartSearching(false);
        }
      }
    }, 500);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [smartMode, search, onSmartSearch]);

  const tags = useMemo(
    () =>
      [...new Set(cards.flatMap((c) => c.tags ?? []))].map((tag) => ({
        tag,
        count: cards.filter((c) => (c.tags ?? []).includes(tag)).length,
      })),
    [cards]
  );
  const visible = useMemo(() => {
    if (smartMode && smartResults) return smartResults;
    let r = cards;
    for (const f of filters) {
      if (f.type === "tag")
        r = r.filter((c) => (c.tags ?? []).includes(f.value));
      if (f.type === "starred")
        r = r.filter((c) => c.starred === true);
    }
    if (search.trim() && !smartMode) {
      const q = search.trim().toLowerCase();
      r = r.filter(
        (c) =>
          c.quote.toLowerCase().includes(q) ||
          c.book.toLowerCase().includes(q) ||
          (c.author ?? "").toLowerCase().includes(q) ||
          (c.tags ?? []).some((t) => t.includes(q)) ||
          (c.note ?? "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [cards, filters, search, smartMode, smartResults]);

  const bookGroups = useMemo(
    () =>
      Object.entries(
        [...visible].sort((a, b) => a.book.localeCompare(b.book)).reduce(
          (acc, c) => {
            (acc[c.book] = acc[c.book] ?? []).push(c);
            return acc;
          },
          {} as Record<string, CardLike[]>
        )
      ),
    [visible]
  );
  const starredCount = useMemo(() => cards.filter((c) => c.starred).length, [cards]);
  const bookCount = useMemo(() => new Set(cards.map((c) => c.book.toLowerCase())).size, [cards]);
  const hasFilters = filters.length > 0 || search.trim().length > 0;
  const cardProps = {
    onUpdate,
    onTagsChange,
    onDelete,
    allCards: allCards ?? cards,
    inputContainerRef,
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT_SANS,
        minHeight: 0,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          borderBottom: `1px solid ${C.border}`,
          background: C.base,
        }}
      >
        <div>
          <div
            style={{
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.ink,
                  letterSpacing: "-0.01em",
                  fontFamily: FONT_SANS,
                }}
              >
                Library
              </span>
              <span style={{ ...T.caption, color: C.faint, marginLeft: 2 }}>
                {visible.length}
                {hasFilters ? ` of ${cards.length}` : ""} card{visible.length !== 1 ? "s" : ""}
                {" "}· {bookCount} book{bookCount !== 1 ? "s" : ""}
                {starredCount > 0 && (
                  <span style={{ color: C.warmDot }}>
                    {" "}· {starredCount} starred
                  </span>
                )}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <div style={{ position: "relative" }} ref={overflowRef}>
                <button
                  onClick={() => setShowOverflow((v) => !v)}
                  title="More actions"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 6,
                    color: C.faint,
                    display: "flex",
                    alignItems: "center",
                    borderRadius: R.sm,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.ink)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
                >
                  <MoreHorizontal size={16} />
                </button>
                {showOverflow && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      right: 0,
                      background: C.base,
                      border: `1px solid ${C.border}`,
                      borderRadius: R.lg,
                      boxShadow: "0 8px 28px rgba(0,0,0,0.09)",
                      minWidth: 150,
                      zIndex: 10,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => { setShowOverflow(false); onRandom(); }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 14px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: FONT_SANS,
                        fontSize: 13,
                        color: C.ink,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Shuffle size={13} /> Random card
                    </button>
                    <button
                      onClick={() => { setShowOverflow(false); onExport(); }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 14px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: FONT_SANS,
                        fontSize: 13,
                        color: C.ink,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Download size={13} /> Export
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "10px 0",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", borderRadius: R.md, border: `1px solid ${C.border}`, overflow: "hidden", flexShrink: 0 }}>
            {(["all", "book"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: "5px 10px",
                  fontSize: 11,
                  fontFamily: FONT_SANS,
                  fontWeight: viewMode === mode ? 500 : 400,
                  background: viewMode === mode ? C.ink : "transparent",
                  color: viewMode === mode ? C.base : C.faint,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {mode === "all" ? "All" : "By Book"}
              </button>
            ))}
          </div>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={12}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: C.faint,
                pointerEvents: "none",
              }}
            />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={smartMode ? "Smart search…" : "Search…"}
              style={{
                width: "100%",
                padding: "7px 28px 7px 30px",
                fontSize: 13,
                fontFamily: FONT_SANS,
                border: `1px solid ${C.border}`,
                borderRadius: R.md,
                outline: "none",
                background: "transparent",
                color: C.ink,
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.ink)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: C.faint,
                  display: "inline-flex",
                }}
              >
                <X size={11} />
              </button>
            )}
          </div>
          {onSmartSearch && (
            <button
              onClick={() => { setSmartMode((v) => !v); setSmartResults(null); }}
              title={smartMode ? "Switch to text search" : "Switch to AI search"}
              style={{
                background: smartMode ? C.surfaceAlt : "transparent",
                border: `1px solid ${smartMode ? C.ink : C.border}`,
                borderRadius: R.md,
                padding: "5px 10px",
                cursor: "pointer",
                fontFamily: FONT_SANS,
                fontSize: 11,
                color: smartMode ? C.ink : C.muted,
                flexShrink: 0,
                fontWeight: smartMode ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              {smartSearching ? "…" : "AI"}
            </button>
          )}
          <div
            style={{
              width: 1,
              height: 20,
              background: C.border,
              flexShrink: 0,
            }}
          />
          <FilterBar
            filters={filters}
            tags={tags}
            onAdd={(f) => {
              setFilters((p) => [...p, f]);
              scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onRemove={(id) => setFilters((p) => p.filter((f) => f.id !== id))}
            onClearAll={() => setFilters([])}
          />
        </div>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            padding: "4px 0 100px",
          }}
        >
          {visible.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <p style={T.small}>
                {search
                  ? `No results for "${search}".`
                  : filters.length
                    ? "No cards match these filters."
                    : "No cards here."}
              </p>
              {hasFilters && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilters([]);
                  }}
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: C.muted,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : viewMode === "book" ? (
            bookGroups.map(([heading, groupCards]) => (
              <div
                key={heading}
                style={{ paddingTop: 28, marginBottom: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <span style={{ ...T.book, fontSize: 11 }}>{heading}</span>
                  {groupCards[0].author && (
                    <span style={T.author}>{groupCards[0].author}</span>
                  )}
                  {groupCards[0].year != null && (
                    <span style={T.meta}>
                      {fmtYear(groupCards[0].year)}
                    </span>
                  )}
                  <span style={{ ...T.meta, marginLeft: "auto" }}>
                    {groupCards.length}
                  </span>
                </div>
                <Divider />
                {groupCards.map((c) => (
                  <NoteCard key={c.id} card={c} compact {...cardProps} />
                ))}
              </div>
            ))
          ) : (
            <div style={{ paddingTop: 12 }}>
              {[...visible].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)).map((c) => (
                <NoteCard key={c.id} card={c} {...cardProps} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export const ExportPanel = memo(function ExportPanel({
  cards,
  onClose,
}: {
  cards: CardLike[];
  onClose: () => void;
}) {
  const C = useC();
  const T = makeT(C);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const exportText = useMemo(() => cards.map(cardToExport).join("\n"), [cards]);

  useKey("Escape", onClose, [onClose]);

  const doCopy = async () => {
    await copyText(exportText);
    setCopied(true);
    setTimeout(() => { setCopied(false); onClose(); }, 1400);
  };

  const doDownload = () => {
    const json = JSON.stringify(cards.map((c) => ({
      quote: c.quote,
      book: c.book,
      author: c.author || undefined,
      year: c.year ?? undefined,
      tags: c.tags?.length ? c.tags : undefined,
      note: c.note || undefined,
    })), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notecards-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(true);
    setTimeout(() => { setDownloading(false); onClose(); }, 1400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.15)",
        zIndex: 150,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_SANS,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.base,
          border: `1px solid ${C.border}`,
          borderRadius: R.xl,
          padding: "32px 36px",
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 16px 60px rgba(0,0,0,0.12)",
        }}
      >
        <p style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 6, letterSpacing: "-0.01em" }}>
          Export your library
        </p>
        <p style={{ ...T.caption, marginBottom: 24 }}>
          {cards.length} card{cards.length !== 1 ? "s" : ""}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={doCopy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 18px",
              border: `1px solid ${C.border}`,
              borderRadius: R.lg,
              background: copied ? C.sage : "transparent",
              cursor: "pointer",
              transition: "all 0.15s",
              textAlign: "left",
            }}
            onMouseEnter={(e) => { if (!copied) e.currentTarget.style.borderColor = C.borderHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
          >
            <div style={{ width: 32, height: 32, borderRadius: R.md, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {copied ? <Check size={14} color={C.ink} /> : <Copy size={14} color={C.muted} />}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 2 }}>
                {copied ? "Copied!" : "Copy as text"}
              </p>
              <p style={{ fontSize: 11, color: C.faint }}>Formatted quotes, ready to paste</p>
            </div>
          </button>

          <button
            onClick={doDownload}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 18px",
              border: `1px solid ${C.border}`,
              borderRadius: R.lg,
              background: downloading ? C.sage : "transparent",
              cursor: "pointer",
              transition: "all 0.15s",
              textAlign: "left",
            }}
            onMouseEnter={(e) => { if (!downloading) e.currentTarget.style.borderColor = C.borderHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
          >
            <div style={{ width: 32, height: 32, borderRadius: R.md, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {downloading ? <Check size={14} color={C.ink} /> : <Download size={14} color={C.muted} />}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 2 }}>
                {downloading ? "Downloaded!" : "Download JSON"}
              </p>
              <p style={{ fontSize: 11, color: C.faint }}>Full backup with tags & notes</p>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "8px 0",
            fontSize: 13,
            color: C.faint,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: FONT_SANS,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
});

export const EmptyState = memo(function EmptyState({
  onSave,
  onDemo,
}: {
  onSave: () => void;
  onDemo: () => void;
}) {
  const C = useC();
  const T = makeT(C);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "82vh",
        textAlign: "center",
        padding: "0 32px",
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: 20,
          height: 1,
          background: C.border,
          margin: "0 auto 44px",
        }}
      />
      <p
        style={{
          fontSize: 22,
          lineHeight: 1.6,
          color: C.ink,
          maxWidth: 400,
          marginBottom: 6,
          fontFamily: FONT_SERIF,
          letterSpacing: "-0.01em",
        }}
      >
        "The reader who marks is building a mine. The writer who reads it is
        building the world."
      </p>
      <p style={{ ...T.caption, marginBottom: 40, marginTop: 10 }}>
        Your library of ideas, ready to think with.
      </p>
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Btn variant="primary" size="md" onClick={onSave}>
          <Plus size={12} /> Save your first quote
        </Btn>
        <Btn variant="outline" size="md" onClick={onDemo}>
          <Sparkles size={12} /> See it in action
        </Btn>
      </div>
      <p style={{ ...T.caption, marginTop: 16 }}>
        or type{" "}
        <code
          style={{
            background: C.surface,
            padding: "1px 8px",
            borderRadius: R.sm,
            color: C.secondary,
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          /add "quote"
        </code>
      </p>
    </div>
  );
});

export type Message = {
  id: string;
  role: "user" | "assistant";
  type?: string;
  text?: string;
  card?: CardLike;
  liveCard?: CardLike | null;
  prompts?: WritePrompt[];
  cards?: CardLike[];
  session?: ReadingSession;
  quotes?: ImportQuote[];
  label?: string;
};

export const MsgBubble = function MsgBubble({
  m,
  allCards,
  onUpdate,
  onTagsChange,
  onDelete,
  onImportConfirm,
  onImportDiscard,
  onReadingNote,
  savedCardId,
  inputContainerRef,
}: {
  m: Message;
  allCards: CardLike[];
  onUpdate: (id: string, patch: Partial<CardLike>) => void;
  onTagsChange: (id: string, tags: string[]) => void;
  onDelete: (id: string) => void;
  onImportConfirm: (id: string, quotes: ImportQuote[]) => void;
  onImportDiscard: (id: string) => void;
  onReadingNote?: (cardId: string, note: string) => void;
  savedCardId: string | null;
  inputContainerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const C = useC();
  const T = makeT(C);
  if (m.role === "user")
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span
          style={{
            background: C.userBubble,
            color: C.ink,
            borderRadius: `${R.xl}px ${R.xl}px ${R.sm}px ${R.xl}px`,
            padding: "10px 18px",
            fontSize: 14,
            fontFamily: FONT_SANS,
            maxWidth: "78%",
            lineHeight: 1.65,
            border: `1px solid ${C.border}`,
          }}
        >
          {m.text}
        </span>
      </div>
    );
  // Resolve snapshot cards to live versions from the reducer
  const liveCard = (c: CardLike) => allCards.find((a) => a.id === c.id) ?? c;
  const liveCards = (cs: CardLike[] | undefined) =>
    (cs ?? []).map(liveCard).filter((c) => allCards.some((a) => a.id === c.id));
  const cardProps = {
    onUpdate,
    onTagsChange,
    onDelete,
    allCards,
    savedCardId,
    inputContainerRef,
  };
  const savedLive = m.type === "saved" && (m as any).card
    ? allCards.find((c) => c.id === (m as any).card.id)
    : null;
  return (
    <div>
      {m.type === "saved" && savedLive && (
        <div>
          <div
            style={{
              borderLeft: `1px solid ${C.border}`,
              paddingLeft: 20,
            }}
          >
            <NoteCard
              card={savedLive}
              {...cardProps}
              justSaved={savedLive?.id === savedCardId}
            />
          </div>
        </div>
      )}
      {m.type === "synthesis" && (
        <SynthesisBlock
          text={m.text ?? ""}
          cards={liveCards(m.cards)}
          {...cardProps}
        />
      )}
      {m.type === "write" && (
        <WritePrompts
          prompts={m.prompts}
          cards={liveCards(m.cards)}
          {...cardProps}
        />
      )}
      {m.type === "reading" && m.session && (
        <ReadingSessionBlock
          session={m.session}
          onMark={onReadingNote}
        />
      )}
      {m.type === "import_preview" && m.quotes && (
        <ImportBlock
          quotes={m.quotes}
          onImport={(quotes) => onImportConfirm(m.id, quotes)}
          onDiscard={() => onImportDiscard(m.id)}
        />
      )}
      {m.type === "divider" && m.label && (
        <ContextDivider label={m.label} />
      )}
      {m.type === "text" && m.text && (
        <p
          style={{
            ...T.body,
            marginBottom: 12,
            lineHeight: 1.85,
          }}
          dangerouslySetInnerHTML={renderText(m.text, C)}
        />
      )}
      {m.type === "text" && m.cards && m.cards.length > 0 && (
        <div
          style={{
            borderLeft: `1px solid ${C.border}`,
            paddingLeft: 20,
            marginTop: 6,
          }}
        >
          {liveCards(m.cards).map((c) => (
            <NoteCard key={c.id} card={c} {...cardProps} />
          ))}
        </div>
      )}
    </div>
  );
};
