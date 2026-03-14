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
  collectionIds?: string[];
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

export const COLLECTION_COLORS = [
  "#4a5e3a",
  "#2563eb",
  "#7c5c3a",
  "#8b3a3a",
  "#3a5c7c",
  "#5a3a7c",
  "#3a7c6a",
  "#0f0f0d",
];
export const R = { sm: 5, md: 8, lg: 12, xl: 18, pill: 99 };
export const FONT_SERIF =
  "'Playfair Display', 'Libre Baskerville', Georgia, serif";
export const FONT_SANS = "'DM Sans', 'Inter', system-ui, sans-serif";

export const makeT = (C: Theme): Record<string, React.CSSProperties> => ({
  quoteMain: {
    fontSize: 18,
    lineHeight: 1.8,
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
  `[${i ?? "-"}] "${c.quote}" — *${c.book}*${c.author ? ` by ${c.author}` : ""}${c.year ? ` (${fmtYear(c.year)})` : ""}. Tags: ${(c.tags ?? []).join(", ")}${c.note ? `. Note: ${c.note}` : ""}`;
export const cardToExport = (c: CardLike): string =>
  `"${c.quote}"\n— ${c.book}${c.author ? `, ${c.author}` : ""}${c.year ? ` (${fmtYear(c.year)})` : ""}${c.note ? `\n[${c.note}]` : ""}\n`;

export const renderText = (
  t: string,
  C: Theme
): { __html: string } => ({
  __html: t
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
  { cmd: "/digest", hint: "", desc: "Today's themed cards", icon: "☀" },
  {
    cmd: "/tension",
    hint: "topic (optional)",
    desc: "Find contradictions between quotes",
    icon: "⚡",
  },
  {
    cmd: "/write",
    hint: "topic (optional)",
    desc: "3 writing prompts from your cards",
    icon: "✐",
  },
  { cmd: "/draft", hint: "topic", desc: "Generate an essay fragment", icon: "✍" },
  {
    cmd: "/quiz",
    hint: "",
    desc: "Test your memory of your library",
    icon: "🎯",
  },
  {
    cmd: "/compare",
    hint: "Book A vs Book B",
    desc: "Compare two books",
    icon: "⚖",
  },
  {
    cmd: "/recommend",
    hint: "",
    desc: "AI book recommendations",
    icon: "📚",
  },
  {
    cmd: "/import",
    hint: "",
    desc: "Bulk import quotes from text",
    icon: "⬆",
  },
  {
    cmd: "/stats",
    hint: "",
    desc: "Library statistics & insights",
    icon: "◉",
  },
];

export function getPlaceholder(
  cards: CardLike[],
  flowStage: string | null
): string {
  if (flowStage === "book") return "Search for a book…";
  if (flowStage === "author")
    return "Author name (or press Enter to skip)…";
  if (flowStage === "import")
    return "Paste quotes, a reading list, or any text with quotes…";
  if (!cards.length) return `/add "a quote that stayed with you"`;
  const examples = [
    "Ask a question, or type / for commands…",
    `/find ${cards[0]?.tags?.[0] ?? "stoicism"}`,
    "/quiz · /compare · /tension",
    "/write or /draft to think with your cards",
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

export const AnnotationDrawer = memo(function AnnotationDrawer({
  card,
  onSave,
  onClose,
}: {
  card: CardLike;
  onSave: (note: string) => void;
  onClose: () => void;
}) {
  const C = useC();
  const T = makeT(C);
  const [text, setText] = useState(card.note ?? "");
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const t = setTimeout(() => taRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);
  useKey(
    "Escape",
    () => {
      onSave(text.trim());
      onClose();
    },
    [text, onSave, onClose]
  );
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const handleClose = () => {
    onSave(text.trim());
    onClose();
  };
  return (
    <>
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          background: "rgba(0,0,0,0.15)",
          animation: "backdropIn 0.2s ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 301,
          background: C.base,
          borderTop: `1px solid ${C.border}`,
          borderRadius: `${R.xl}px ${R.xl}px 0 0`,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.1)",
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          animation: "drawerUp 0.28s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "14px 0 8px",
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
            padding: "4px 28px 18px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <p
            style={{
              ...T.quoteMain,
              fontSize: 13,
              color: C.muted,
              marginBottom: 6,
            }}
          >
            "{card.quote.length > 120 ? card.quote.slice(0, 120) + "…" : card.quote}"
          </p>
          <span style={T.book}>{card.book}</span>
          {card.author && (
            <span style={{ ...T.author, marginLeft: 8 }}>{card.author}</span>
          )}
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 28px 0",
          }}
        >
          <p style={{ ...T.label, marginBottom: 12 }}>Your annotation</p>
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What does this quote mean to you? Where does it push back against something you believe?"
            style={{
              width: "100%",
              minHeight: 120,
              fontSize: 15,
              fontFamily: FONT_SERIF,
              lineHeight: 1.85,
              color: C.ink,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              padding: 0,
            }}
          />
        </div>
        <div
          style={{
            padding: "14px 28px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={T.caption}>
            {wordCount > 0
              ? `${wordCount} words`
              : "ESC or tap outside to save & close"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {card.note && (
              <Btn
                variant="danger"
                size="sm"
                onClick={() => {
                  onSave("");
                  onClose();
                }}
              >
                Remove
              </Btn>
            )}
            <Btn variant="primary" size="sm" onClick={handleClose}>
              <Check size={11} /> Done
            </Btn>
          </div>
        </div>
      </div>
    </>
  );
});

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

type Collection = { id: string; name: string; color: string; createdAt?: number };

export const CollectionPopover = memo(function CollectionPopover({
  card,
  collections,
  onSave,
  onClose,
  onCreateNew,
}: {
  card: CardLike;
  collections: Collection[];
  onSave: (ids: string[]) => void;
  onClose: () => void;
  onCreateNew: (col: Collection) => void;
}) {
  const C = useC();
  const T = makeT(C);
  const [local, setLocal] = useState(new Set(card.collectionIds ?? []));
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);
  const toggle = (id: string) =>
    setLocal((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const submit = () => {
    const n = newName.trim();
    if (!n) return;
    const col: Collection = {
      id: uid(),
      name: n,
      color:
        COLLECTION_COLORS[
          Math.floor(Math.random() * COLLECTION_COLORS.length)
        ] ?? COLLECTION_COLORS[0],
      createdAt: NOW(),
    };
    onCreateNew(col);
    setLocal((s) => new Set([...s, col.id]));
    setNewName("");
    setCreating(false);
  };
  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        zIndex: 90,
        background: C.base,
        border: `1px solid ${C.border}`,
        borderRadius: R.lg,
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        minWidth: 220,
        overflow: "hidden",
        animation: "fadeIn 0.12s ease",
      }}
    >
      <div
        style={{
          padding: "8px 14px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <span style={T.label}>Add to collection</span>
      </div>
      {collections.length === 0 && !creating && (
        <p style={{ ...T.caption, padding: "12px 14px" }}>
          No collections yet.
        </p>
      )}
      {collections.map((col) => {
        const on = local.has(col.id);
        return (
          <button
            key={col.id}
            onClick={() => toggle(col.id)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 14px",
              background: on ? C.surface : "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: FONT_SANS,
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => {
              if (!on) e.currentTarget.style.background = C.surface;
            }}
            onMouseLeave={(e) => {
              if (!on) e.currentTarget.style.background = "transparent";
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: col.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: C.ink, flex: 1 }}>
              {col.name}
            </span>
            {on && <Check size={12} color={C.ink} />}
          </button>
        );
      })}
      {creating ? (
        <div
          style={{
            padding: "8px 14px",
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") {
                setCreating(false);
                setNewName("");
              }
            }}
            placeholder="Collection name…"
            style={{
              width: "100%",
              fontSize: 12,
              fontFamily: FONT_SANS,
              border: "none",
              borderBottom: `1px solid ${C.border}`,
              outline: "none",
              background: "transparent",
              color: C.ink,
              paddingBottom: 4,
              marginBottom: 8,
            }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <Btn variant="primary" size="xs" onClick={submit}>
              <Check size={10} /> Create
            </Btn>
            <Btn
              variant="ghost"
              size="xs"
              onClick={() => {
                setCreating(false);
                setNewName("");
              }}
            >
              Cancel
            </Btn>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "10px 14px",
            background: "transparent",
            border: "none",
            borderTop: `1px solid ${C.border}`,
            cursor: "pointer",
            fontFamily: FONT_SANS,
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: C.faint,
            fontSize: 12,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.muted)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
        >
          <Plus size={11} /> New collection…
        </button>
      )}
      <div
        style={{
          padding: "8px 14px",
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "flex-end",
          gap: 6,
        }}
      >
        <Btn variant="ghost" size="xs" onClick={onClose}>
          Cancel
        </Btn>
        <Btn
          variant="primary"
          size="xs"
          onClick={() => {
            onSave([...local]);
            onClose();
          }}
        >
          <Check size={10} /> Done
        </Btn>
      </div>
    </div>
  );
});

// ─── NoteCard ─────────────────────────────────────────────────────────────────
type NoteCardProps = {
  card: CardLike;
  collections: Collection[];
  onUpdate: (id: string, patch: Partial<CardLike>) => void;
  onTagsChange: (id: string, tags: string[]) => void;
  onDelete: (id: string) => void;
  onSetCollections: (id: string, ids: string[]) => void;
  onCreateCollection: (col: Collection) => void;
  onElaborate?: (card: CardLike) => void;
  allCards?: CardLike[];
  compact?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  justSaved?: boolean;
};

export const NoteCard = memo(function NoteCard({
  card,
  collections,
  onUpdate,
  onTagsChange,
  onDelete,
  onSetCollections,
  onCreateCollection,
  onElaborate,
  allCards,
  compact = false,
  selectable = false,
  selected = false,
  onSelect,
  justSaved = false,
}: NoteCardProps) {
  const C = useC();
  const T = makeT(C);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCollPicker, setShowCollPicker] = useState(false);
  const [editQuote, setEditQuote] = useState(card.quote);
  const [editBook, setEditBook] = useState(card.book);
  const [editAuthor, setEditAuthor] = useState(card.author ?? "");
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [pulse, setPulse] = useState(justSaved);
  const quoteRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditQuote(card.quote);
    setEditBook(card.book);
    setEditAuthor(card.author ?? "");
  }, [card.quote, card.book, card.author]);
  useEffect(() => {
    if (justSaved) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 700);
      return () => clearTimeout(t);
    }
  }, [justSaved]);
  useEffect(() => {
    if (isEditingQuote) quoteRef.current?.focus();
  }, [isEditingQuote]);
  useEffect(() => {
    if (!showCollPicker) return;
    const h = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setShowCollPicker(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showCollPicker]);

  const cardColls = useMemo(
    () =>
      (card.collectionIds ?? [])
        .map((id) => collections.find((c) => c.id === id))
        .filter(Boolean) as Collection[],
    [card.collectionIds, collections]
  );
  const bookCount =
    allCards?.filter(
      (c) =>
        c.id !== card.id &&
        c.book.toLowerCase() === card.book.toLowerCase()
    ).length ?? 0;
  const warm = isWarm(card);
  const py = compact ? 16 : 22;

  const commitField = () => {
    if (!editQuote.trim() || !editBook.trim()) return;
    onUpdate(card.id, {
      quote: editQuote,
      book: editBook,
      author: editAuthor,
    });
  };

  return (
    <>
      {showAnnotation && (
        <AnnotationDrawer
          card={card}
          onSave={(note) => onUpdate(card.id, { note })}
          onClose={() => setShowAnnotation(false)}
        />
      )}
      <div
        style={{
          padding: `${py}px 0`,
          borderBottom: `1px solid ${C.border}`,
          position: "relative",
          background: pulse ? C.savedPulse : "transparent",
          transition: "background 0.6s ease",
        }}
        className="nc-card"
        onClick={selectable ? () => onSelect?.(card.id) : undefined}
      >
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
              opacity: 0.5,
            }}
          />
        )}
        {!selectable && (
          <div
            style={{
              position: "absolute",
              top: py,
              right: 0,
              display: "flex",
              gap: 2,
            }}
            className="nc-actions"
          >
            {onElaborate && (
              <button
                onClick={() => onElaborate(card)}
                className="nc-action-btn"
                title="Elaborate"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: C.faint,
                  padding: 4,
                  borderRadius: R.sm,
                  opacity: 0,
                  transition: "opacity 0.15s",
                }}
              >
                <Sparkles size={11} />
              </button>
            )}
            <button
              onClick={() => setConfirmDelete((v) => !v)}
              className="nc-action-btn"
              title="Delete"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: C.faint,
                padding: 4,
                borderRadius: R.sm,
                opacity: 0,
                transition: "opacity 0.15s",
              }}
            >
              <X size={11} />
            </button>
          </div>
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

        {!selectable ? (
          isEditingQuote ? (
            <textarea
              ref={quoteRef}
              value={editQuote}
              onChange={(e) => setEditQuote(e.target.value)}
              onBlur={() => {
                setIsEditingQuote(false);
                commitField();
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsEditingQuote(false);
                  setEditQuote(card.quote);
                }
              }}
              rows={3}
              style={{
                ...T.quoteMain,
                width: "100%",
                resize: "none",
                outline: "none",
                border: "none",
                borderBottom: `1px solid ${C.ink}`,
                background: "transparent",
                marginBottom: 10,
                paddingBottom: 4,
              }}
            />
          ) : (
            <p
              onClick={() => setIsEditingQuote(true)}
              style={{
                ...T.quoteMain,
                marginBottom: 10,
                cursor: "text",
                borderBottom: "1px dashed transparent",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderBottomColor = C.border)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderBottomColor = "transparent")
              }
            >
              "{card.quote}"
            </p>
          )
        ) : (
          <p style={{ ...T.quoteMain, marginBottom: 10, paddingRight: 28 }}>
            "{card.quote}"
          </p>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          {!selectable ? (
            <>
              <InlineEditField
                value={editBook}
                onChange={setEditBook}
                onCommit={commitField}
                placeholder="Book"
                textStyle={T.book}
                inputStyle={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.secondary,
                  width: 160,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              />
              <InlineEditField
                value={editAuthor}
                onChange={setEditAuthor}
                onCommit={commitField}
                placeholder="Author"
                textStyle={T.author}
                inputStyle={{ fontSize: 13, color: C.muted, width: 140 }}
              />
              {card.year && <span style={T.meta}>{fmtYear(card.year)}</span>}
              {bookCount > 0 && (
                <span
                  style={{ ...T.meta, marginLeft: "auto", fontSize: 10 }}
                >
                  +{bookCount} from this book
                </span>
              )}
            </>
          ) : (
            <>
              <span style={T.book}>{card.book}</span>
              {card.author && (
                <span style={T.author}>{card.author}</span>
              )}
              {card.year && (
                <span style={T.meta}>{fmtYear(card.year)}</span>
              )}
            </>
          )}
        </div>

        {selectable ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {card.tags?.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        ) : (
          <TagEditor
            tags={card.tags ?? []}
            onChange={(tags) => onTagsChange(card.id, tags)}
          />
        )}

        {!selectable && (
          <div style={{ marginTop: 12 }}>
            {card.note ? (
              <button
                onClick={() => setShowAnnotation(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 0",
                  width: "100%",
                  textAlign: "left",
                }}
              >
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
              </button>
            ) : (
              <button
                onClick={() => setShowAnnotation(true)}
                style={{
                  fontSize: 12,
                  color: C.faint,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: FONT_SANS,
                  padding: "2px 0",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "color 0.15s",
                  letterSpacing: "0.02em",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = C.muted)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = C.faint)
                }
              >
                <Pencil size={9} />
                <span>annotate…</span>
              </button>
            )}
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
            <span
              style={{ fontSize: 13, color: C.danger, flex: 1 }}
            >
              Delete this card permanently?
            </span>
            <button
              onClick={() => onDelete(card.id)}
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
              onClick={() => setConfirmDelete(false)}
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

        {!selectable && (
          <div
            style={{ marginTop: 10, position: "relative" }}
            ref={pickerRef}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 5,
              }}
            >
              {cardColls.map((col) => (
                <Chip
                  key={col.id}
                  color={col.color}
                  onRemove={() =>
                    onSetCollections(
                      card.id,
                      (card.collectionIds ?? []).filter((id) => id !== col.id)
                    )
                  }
                >
                  {col.name}
                </Chip>
              ))}
              <button
                onClick={() => setShowCollPicker((v) => !v)}
                style={{
                  fontSize: 11,
                  fontFamily: FONT_SANS,
                  color: C.faint,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "1px 3px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  transition: "color 0.15s",
                  letterSpacing: "0.02em",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = C.muted)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = C.faint)
                }
              >
                <FolderPlus size={9} />
                {cardColls.length === 0 ? "add to collection" : "edit"}
              </button>
            </div>
            {showCollPicker && (
              <CollectionPopover
                card={card}
                collections={collections}
                onSave={(ids) => onSetCollections(card.id, ids)}
                onCreateNew={(col) => onCreateCollection(col)}
                onClose={() => setShowCollPicker(false)}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
});

// ─── Connection notice ────────────────────────────────────────────────────────
type Connection = { card: CardLike; observation: string };
export const ConnectionNotice = memo(function ConnectionNotice({
  connections,
  onDismiss,
}: {
  connections?: Connection[] | null;
  onDismiss: () => void;
}) {
  const C = useC();
  const T = makeT(C);
  const [expanded, setExpanded] = useState(false);
  if (!connections?.length) return null;
  return (
    <div
      style={{
        marginTop: 14,
        borderRadius: R.lg,
        background: C.sageBg,
        border: `1px solid ${C.sageBorder}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={11} style={{ color: C.sage }} />
          <span
            style={{
              fontSize: 12,
              color: C.sage,
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            Echoes something in your library
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <Btn
            variant="ghost"
            size="xs"
            onClick={() => setExpanded((v) => !v)}
            style={{ color: C.sage }}
          >
            {expanded ? "Less" : "See"}
          </Btn>
          <button
            onClick={onDismiss}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.sage,
              display: "inline-flex",
              padding: 2,
            }}
          >
            <X size={12} />
          </button>
        </div>
      </div>
      {expanded &&
        connections.map((cn, i) => (
          <div
            key={i}
            style={{
              padding: "12px 16px",
              borderTop: `1px solid ${C.sageBorder}`,
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: C.sage,
                marginBottom: 10,
                lineHeight: 1.65,
              }}
            >
              {cn.observation}
            </p>
            <div
              style={{
                background: "rgba(0,0,0,0.03)",
                borderRadius: R.md,
                padding: "10px 14px",
              }}
            >
              <p
                style={{
                  ...T.quoteMain,
                  fontSize: 14,
                  marginBottom: 5,
                }}
              >
                "{cn.card.quote}"
              </p>
              <span style={T.book}>{cn.card.book}</span>
              {cn.card.author && (
                <span style={{ ...T.author, marginLeft: 6 }}>
                  {cn.card.author}
                </span>
              )}
            </div>
          </div>
        ))}
    </div>
  );
});

// ─── Write mode colours ───────────────────────────────────────────────────────
export const WRITE_MODES: Record<
  string,
  { border: string; bg: string; dbg: string; label: string; dlabel: string; dot: string }
> = {
  Argue: {
    border: "#d4a5a5",
    bg: "#fdf5f5",
    dbg: "#2d1515",
    label: "#7a3a3a",
    dlabel: "#d4a5a5",
    dot: "#c07070",
  },
  Open: {
    border: "#a5c4a5",
    bg: "#f5fdf5",
    dbg: "#0f2d0f",
    label: "#3a6a3a",
    dlabel: "#a5c4a5",
    dot: "#70a070",
  },
  Tension: {
    border: "#a5afc4",
    bg: "#f5f6fd",
    dbg: "#0f102d",
    label: "#3a4a6a",
    dlabel: "#a5afc4",
    dot: "#7080b0",
  },
};

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
  mode: string;
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
  const isDark = C === DARK;
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
        {prompts.map((p, i) => {
          const m =
            WRITE_MODES[p.mode] ?? {
              border: C.border,
              bg: C.surface,
              label: C.muted,
              dot: C.faint,
              dbg: C.surface,
              dlabel: C.faint,
            };
          return (
            <div
              key={i}
              style={{
                borderRadius: R.lg,
                border: `1px solid ${m.border}`,
                background: isDark ? m.dbg : m.bg,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 7,
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: m.dot,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: isDark ? m.dlabel : m.label,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {p.mode}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: isDark ? m.dlabel : m.label,
                    opacity: 0.6,
                  }}
                >
                  — {p.label}
                </span>
              </div>
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
          );
        })}
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

export const DraftBlock = memo(function DraftBlock({
  draft,
  cards,
  ...rest
}: {
  draft: string;
  cards?: CardLike[];
} & Omit<NoteCardProps, "card" | "compact">) {
  const C = useC();
  const T = makeT(C);
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    await copyText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 14,
        }}
      >
        <FileText size={12} style={{ color: C.faint }} />
        <span style={T.label}>Draft fragment</span>
        <Btn
          variant="ghost"
          size="xs"
          onClick={doCopy}
          style={{ marginLeft: "auto" }}
        >
          {copied ? (
            <>
              <Check size={10} /> Copied
            </>
          ) : (
            <>
              <Copy size={10} /> Copy
            </>
          )}
        </Btn>
      </div>
      <div
        style={{
          borderLeft: `2px solid ${C.border}`,
          paddingLeft: 18,
          marginBottom: 16,
        }}
      >
        <p
          style={{
            ...T.body,
            color: C.ink,
            whiteSpace: "pre-wrap",
            lineHeight: 1.9,
          }}
          dangerouslySetInnerHTML={renderText(draft, C)}
        />
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

type Tension = {
  cards: CardLike[];
  fault_line: string;
  provocation: string;
};
export const TensionBlock = memo(function TensionBlock({
  text,
  tensions,
  ...rest
}: {
  text: string;
  tensions?: Tension[];
} & Omit<NoteCardProps, "card" | "compact">) {
  const C = useC();
  const T = makeT(C);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div>
      <p
        style={{ ...T.body, marginBottom: 14 }}
        dangerouslySetInnerHTML={renderText(text, C)}
      />
      {(tensions ?? []).map((t, i) => (
        <div
          key={i}
          style={{
            borderRadius: R.lg,
            border: `1px solid ${C.border}`,
            marginBottom: 8,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setOpen((v) => (v === i ? null : i))}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "12px 16px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: FONT_SANS,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = C.surface)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <Zap
                size={11}
                style={{
                  color: C.faint,
                  marginTop: 3,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: 14,
                    color: C.ink,
                    fontWeight: 500,
                    margin: "0 0 3px",
                    lineHeight: 1.5,
                    fontFamily: FONT_SANS,
                  }}
                >
                  {t.fault_line}
                </p>
                <p style={{ ...T.caption, margin: 0 }}>{t.provocation}</p>
              </div>
              <span
                style={{
                  color: C.faint,
                  fontSize: 9,
                  flexShrink: 0,
                  marginTop: 4,
                  letterSpacing: "0.05em",
                }}
              >
                {open === i ? "▲" : "▼"}
              </span>
            </div>
          </button>
          {open === i && (
            <div
              style={{
                borderTop: `1px solid ${C.border}`,
                padding: "0 16px",
              }}
            >
              {t.cards.map((c) => (
                <NoteCard key={c.id} card={c} compact {...rest} />
              ))}
            </div>
          )}
        </div>
      ))}
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

export const DigestBlock = memo(function DigestBlock({
  framing,
  cards,
  ...rest
}: {
  framing: string;
  cards: CardLike[];
} & Omit<NoteCardProps, "card" | "compact">) {
  const C = useC();
  const T = makeT(C);
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>☀</span>
        <p style={{ ...T.quoteDisplay, fontSize: 17, margin: 0 }}>
          {framing}
        </p>
      </div>
      <div
        style={{
          borderLeft: `1px solid ${C.border}`,
          paddingLeft: 20,
        }}
      >
        {cards.map((c) => (
          <NoteCard key={c.id} card={c} {...rest} />
        ))}
      </div>
    </div>
  );
});

type Suggestion = {
  title: string;
  author: string;
  year?: number | null;
  why: string;
};
export const RecommendBlock = memo(function RecommendBlock({
  suggestions,
}: {
  suggestions?: Suggestion[];
}) {
  const C = useC();
  const T = makeT(C);
  if (!suggestions?.length)
    return <p style={T.body}>Couldn't generate recommendations.</p>;
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 18,
        }}
      >
        <span style={{ fontSize: 15 }}>📚</span>
        <p style={{ ...T.body, margin: 0 }}>
          Books your library is pointing toward:
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {suggestions.map((s, i) => (
          <div
            key={i}
            style={{
              padding: "16px 0",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  ...T.quoteDisplay,
                  fontSize: 15,
                  fontWeight: "normal",
                }}
              >
                {s.title}
              </span>
              <span style={T.author}>{s.author}</span>
              {s.year != null && (
                <span style={T.meta}>{s.year}</span>
              )}
            </div>
            <p
              style={{
                ...T.body,
                fontSize: 14,
                margin: 0,
                color: C.muted,
                lineHeight: 1.7,
              }}
            >
              {s.why}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});

export const ElaborateBlock = memo(function ElaborateBlock({
  card,
  text,
}: {
  card: CardLike;
  text: string;
}) {
  const C = useC();
  const T = makeT(C);
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
        <Sparkles size={12} style={{ color: C.faint }} />
        <span style={T.label}>On this quote</span>
      </div>
      <div
        style={{
          borderLeft: `2px solid ${C.border}`,
          paddingLeft: 16,
          marginBottom: 16,
        }}
      >
        <p
          style={{
            ...T.quoteMain,
            fontSize: 15,
            marginBottom: 6,
          }}
        >
          "{card.quote}"
        </p>
        <span style={T.book}>{card.book}</span>
        {card.author && (
          <span style={{ ...T.author, marginLeft: 8 }}>{card.author}</span>
        )}
      </div>
      <p
        style={{
          ...T.body,
          whiteSpace: "pre-wrap",
          lineHeight: 1.85,
        }}
        dangerouslySetInnerHTML={renderText(text, C)}
      />
    </div>
  );
});

type QuizQuestion = {
  id: string;
  quote: string;
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
};
export const QuizBlock = memo(function QuizBlock({
  questions,
}: {
  questions?: QuizQuestion[];
}) {
  const C = useC();
  const T = makeT(C);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);

  if (!questions?.length)
    return <p style={T.body}>Couldn't generate quiz questions.</p>;
  const q = questions[current];
  const answered = answers[current] !== undefined;
  const score = Object.entries(answers).filter(
    ([i, a]) => questions[+i]?.correct === a
  ).length;

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div style={{ animation: "fadeIn 0.2s ease" }}>
        <div
          style={{
            textAlign: "center",
            padding: "28px 0 22px",
          }}
        >
          <div style={{ fontSize: 34, marginBottom: 10 }}>
            {pct >= 80 ? "🎉" : pct >= 50 ? "📚" : "🤔"}
          </div>
          <p
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: C.ink,
              fontFamily: FONT_SANS,
              marginBottom: 4,
            }}
          >
            {score}/{questions.length}
          </p>
          <p style={{ ...T.body, color: C.muted }}>
            {pct >= 80
              ? "You know your library well."
              : pct >= 50
                ? "Decent recall — worth reviewing."
                : "Time for a re-read?"}
          </p>
        </div>
        <Divider style={{ margin: "18px 0" }} />
        {questions.map((q2, i) => {
          const a = answers[i];
          const ok = a === q2.correct;
          return (
            <div
              key={i}
              style={{
                padding: "12px 0",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    flexShrink: 0,
                    marginTop: 2,
                    color: ok ? C.sage : C.danger,
                  }}
                >
                  {ok ? "✓" : "✗"}
                </span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      ...T.quoteMain,
                      fontSize: 14,
                      marginBottom: 4,
                    }}
                  >
                    "{q2.quote}"
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: ok ? C.sage : C.danger,
                      fontFamily: FONT_SANS,
                    }}
                  >
                    {ok
                      ? `Correct: ${q2.options[q2.correct]}`
                      : `You said: ${q2.options[a] ?? "—"} · Answer: ${q2.options[q2.correct]}`}
                  </p>
                  {q2.explanation && (
                    <p style={{ ...T.caption, marginTop: 3 }}>
                      {q2.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 18 }}>
          <Btn
            variant="primary"
            size="sm"
            onClick={() => {
              setAnswers({});
              setCurrent(0);
              setDone(false);
            }}
          >
            Retake
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 18,
        }}
      >
        <span style={{ fontSize: 13 }}>🎯</span>
        <span style={T.label}>
          Quiz · {current + 1} of {questions.length}
        </span>
        <div
          style={{
            flex: 1,
            height: 2,
            borderRadius: 1,
            background: C.border,
            marginLeft: 8,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${((current + 1) / questions.length) * 100}%`,
              background: C.ink,
              borderRadius: 1,
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>
      <div
        style={{
          marginBottom: 16,
          padding: "16px 18px",
          background: C.surface,
          borderRadius: R.lg,
          borderLeft: `2px solid ${C.border}`,
        }}
      >
        <p
          style={{
            ...T.quoteMain,
            fontSize: 14,
            marginBottom: 7,
          }}
        >
          "{q.quote}"
        </p>
        <p
          style={{
            ...T.body,
            fontSize: 14,
            color: C.secondary,
            margin: 0,
          }}
        >
          {q.question}
        </p>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginBottom: 14,
        }}
      >
        {q.options.map((opt, i) => {
          let bg = C.base,
            border = C.border,
            col = C.ink;
          if (answered) {
            if (i === q.correct) {
              bg = C.sageBg;
              border = C.sageBorder;
              col = C.sage;
            } else if (i === answers[current]) {
              bg = "#fff5f5";
              border = "#fca5a5";
              col = "#9b1c1c";
            }
          }
          return (
            <button
              key={i}
              onClick={() => {
                if (!answered)
                  setAnswers((a) => ({ ...a, [current]: i }));
              }}
              style={{
                textAlign: "left",
                padding: "11px 15px",
                borderRadius: R.lg,
                border: `1.5px solid ${border}`,
                background: bg,
                color: col,
                fontFamily: FONT_SANS,
                fontSize: 14,
                cursor: answered ? "default" : "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (!answered)
                  e.currentTarget.style.borderColor = C.borderHover;
              }}
              onMouseLeave={(e) => {
                if (!answered) e.currentTarget.style.borderColor = C.border;
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  opacity: 0.4,
                  flexShrink: 0,
                  letterSpacing: "0.05em",
                }}
              >
                {["A", "B", "C", "D"][i]}
              </span>
              {opt}
              {answered && i === q.correct && (
                <Check size={12} style={{ marginLeft: "auto", flexShrink: 0 }} />
              )}
              {answered &&
                i === answers[current] &&
                i !== q.correct && (
                  <X size={12} style={{ marginLeft: "auto", flexShrink: 0 }} />
                )}
            </button>
          );
        })}
      </div>
      {answered && (
        <div style={{ animation: "fadeIn 0.2s ease" }}>
          {q.explanation && (
            <p
              style={{
                ...T.caption,
                marginBottom: 12,
                padding: "8px 12px",
                background: C.surface,
                borderRadius: R.sm,
              }}
            >
              {q.explanation}
            </p>
          )}
          <Btn
            variant="primary"
            size="sm"
            onClick={() => {
              if (current < questions.length - 1) setCurrent((c) => c + 1);
              else setDone(true);
            }}
          >
            {current < questions.length - 1 ? "Next →" : "See results"}
          </Btn>
        </div>
      )}
    </div>
  );
});

export const CompareBlock = memo(function CompareBlock({
  bookA,
  bookB,
  text,
}: {
  bookA: string;
  bookB: string;
  text: string;
}) {
  const C = useC();
  const T = makeT(C);
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
        <span style={{ fontSize: 13 }}>⚖</span>
        <span style={T.label}>Comparing</span>
        <span style={{ ...T.book, fontSize: 11 }}>{bookA}</span>
        <span style={{ fontSize: 11, color: C.faint }}>vs</span>
        <span style={{ ...T.book, fontSize: 11 }}>{bookB}</span>
      </div>
      <p
        style={{
          ...T.body,
          whiteSpace: "pre-wrap",
          lineHeight: 1.85,
        }}
        dangerouslySetInnerHTML={renderText(text, C)}
      />
    </div>
  );
});

type Stats = {
  books: number;
  authors: number;
  topTags: [string, number][];
  thisWeek: number;
  annotated: number;
  oldest: CardLike | null;
};
export const StatsBlock = memo(function StatsBlock({
  stats,
}: {
  stats: Stats;
}) {
  const C = useC();
  const T = makeT(C);
  const {
    books,
    authors,
    topTags,
    thisWeek,
    annotated,
    oldest,
  } = stats;
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 18,
        }}
      >
        <span style={{ fontSize: 13 }}>◉</span>
        <span style={T.label}>Library snapshot</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 18,
        }}
      >
        {[
          { label: "Books", value: books },
          { label: "Authors", value: authors },
          { label: "Annotated", value: annotated },
          { label: "This week", value: thisWeek },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              padding: "14px 16px",
              borderRadius: R.lg,
              border: `1px solid ${C.border}`,
              background: C.surface,
            }}
          >
            <p
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: C.ink,
                fontFamily: FONT_SANS,
                marginBottom: 3,
                letterSpacing: "-0.02em",
              }}
            >
              {value}
            </p>
            <p style={{ ...T.caption, margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>
      {topTags.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ ...T.label, marginBottom: 10 }}>Top tags</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {topTags.map(([tag, count]) => (
              <span
                key={tag}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 13,
                  fontFamily: FONT_SANS,
                  color: C.secondary,
                }}
              >
                <span
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: C.faint,
                  }}
                />
                {tag}
                <span style={{ color: C.faint, fontSize: 11 }}>{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {oldest?.year != null && (
        <p style={{ ...T.caption, marginTop: 8 }}>
          Oldest source: <em>{oldest.book}</em>
          {oldest.author ? ` by ${oldest.author}` : ""} (
          {fmtYear(oldest.year)})
        </p>
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

type ThemeItem = {
  id: string;
  name: string;
  description: string;
  cardIds: string[];
  confirmed?: boolean;
};
export const ThemeBanner = memo(function ThemeBanner({
  themes,
  onConfirm,
  onDismissAll,
}: {
  themes: ThemeItem[];
  onConfirm: (theme: ThemeItem) => void;
  onDismissAll: () => void;
}) {
  const C = useC();
  const T = makeT(C);
  const [idx, setIdx] = useState(0);
  if (!themes.length) return null;
  const t = themes[idx];
  return (
    <div
      style={{
        marginBottom: 24,
        borderRadius: R.lg,
        background: C.sageBg,
        border: `1px solid ${C.sageBorder}`,
        padding: "14px 18px",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 5,
            }}
          >
            <Sparkles size={10} style={{ color: C.sage }} />
            <span
              style={{
                ...T.label,
                fontSize: 9,
                color: C.sage,
              }}
            >
              Theme detected
              {themes.length > 1 ? ` (${idx + 1}/${themes.length})` : ""}
            </span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: C.sage,
              fontWeight: 600,
              marginBottom: 2,
              fontFamily: FONT_SANS,
            }}
          >
            "{t.name}"
          </p>
          <p
            style={{
              ...T.caption,
              color: C.sage,
              opacity: 0.8,
            }}
          >
            {t.description} · {t.cardIds.length} card
            {t.cardIds.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <Btn
            size="xs"
            variant="ghost"
            style={{
              color: C.sage,
              border: `1px solid ${C.sageBorder}`,
            }}
            onClick={() => {
              onConfirm(t);
              if (idx >= themes.length - 1)
                setIdx(Math.max(0, idx - 1));
            }}
          >
            <Check size={10} /> Add
          </Btn>
          {themes.length > 1 && (
            <Btn
              size="xs"
              variant="ghost"
              style={{ color: C.sage }}
              onClick={() => setIdx((i) => (i + 1) % themes.length)}
            >
              Next
            </Btn>
          )}
          <button
            onClick={onDismissAll}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.sage,
              display: "inline-flex",
              padding: 2,
            }}
          >
            <X size={12} />
          </button>
        </div>
      </div>
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
  collections,
  themes,
  tags,
  onAdd,
  onRemove,
  onClearAll,
}: {
  filters: Filter[];
  collections: Collection[];
  themes: ThemeItem[];
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
    collections.length && { type: "coll", label: "Collection" },
    themes.length && { type: "theme", label: "Theme" },
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
    if (step.type === "coll")
      return collections
        .map((col) => ({
          value: col.id,
          label: col.name,
          dot: col.color,
          meta: undefined,
        }))
        .filter((o) => !active.has(o.value));
    if (step.type === "theme")
      return themes
        .map((t) => ({
          value: t.id,
          label: t.name,
          dot: undefined,
          meta: undefined,
        }))
        .filter((o) => !active.has(o.value));
    return [];
  }, [step, filters, tags, collections, themes]);

  const resolveLabel = (f: Filter) => {
    if (f.type === "tag") return { label: f.value, dot: undefined, typeLabel: "Tag" };
    if (f.type === "coll") {
      const c = collections.find((c) => c.id === f.value);
      return {
        label: c?.name ?? f.value,
        dot: c?.color,
        typeLabel: "Collection",
      };
    }
    if (f.type === "theme") {
      const t = themes.find((t) => t.id === f.value);
      return {
        label: t?.name ?? f.value,
        dot: undefined,
        typeLabel: "Theme",
      };
    }
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
                onClick={() => setStep(opt)}
              >
                <span style={{ fontSize: 13, color: C.secondary }}>
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

export const RandomCard = memo(function RandomCard({
  card,
  onNext,
  onClose,
}: {
  card: CardLike;
  onNext: () => void;
  onClose: () => void;
}) {
  const C = useC();
  const T = makeT(C);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [card.id]);
  useKey("Escape", onClose, [onClose]);
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
          right: 20,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: `1px solid ${C.border}`,
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
            <p
              style={{
                fontSize: 14,
                color: C.muted,
                marginTop: 16,
                maxWidth: 400,
                margin: "16px auto 0",
                lineHeight: 1.8,
                fontFamily: FONT_SERIF,
              }}
            >
              "{card.note}"
            </p>
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
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Btn variant="outline" size="sm" onClick={onNext}>
            <Shuffle size={12} /> Another one
          </Btn>
        </div>
      </div>
    </div>
  );
});

export const LibraryPanel = memo(function LibraryPanel({
  cards,
  themes,
  collections,
  onUpdate,
  onTagsChange,
  onDelete,
  onSetCollections,
  onCreateCollection,
  onElaborate,
  onClose,
  onRandom,
  onExport,
  allCards,
}: Omit<NoteCardProps, "card"> & {
  cards: CardLike[];
  themes: ThemeItem[];
  onClose: () => void;
  onRandom: () => void;
  onExport: () => void;
  allCards?: CardLike[];
}) {
  const C = useC();
  const T = makeT(C);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useKey("Escape", onClose, [onClose]);
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);

  const tags = useMemo(
    () =>
      [...new Set(cards.flatMap((c) => c.tags ?? []))].map((tag) => ({
        tag,
        count: cards.filter((c) => (c.tags ?? []).includes(tag)).length,
      })),
    [cards]
  );
  const visible = useMemo(() => {
    let r = cards;
    for (const f of filters) {
      if (f.type === "tag")
        r = r.filter((c) => (c.tags ?? []).includes(f.value));
      if (f.type === "coll")
        r = r.filter((c) =>
          (c.collectionIds ?? []).includes(f.value)
        );
      if (f.type === "theme") {
        const t = themes.find((t) => t.id === f.value);
        r = r.filter((c) => t?.cardIds.includes(c.id));
      }
    }
    if (search.trim()) {
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
  }, [cards, filters, themes, search]);

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
  const hasFilters = filters.length > 0 || search.trim().length > 0;
  const cardProps = {
    collections,
    onUpdate,
    onTagsChange,
    onDelete,
    onSetCollections,
    onCreateCollection,
    onElaborate,
    allCards: allCards ?? cards,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: C.base,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT_SANS,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          borderBottom: `1px solid ${C.border}`,
          background: C.base,
        }}
      >
        <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 28px" }}>
          <div
            style={{
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
              <span style={{ ...T.meta, opacity: 0.4, marginLeft: 4 }}>·</span>
              <span style={{ ...T.caption, marginLeft: 4 }}>
                {visible.length}
                {hasFilters ? ` of ${cards.length}` : ""} card
                {visible.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Btn variant="ghost" size="sm" onClick={onRandom}>
                <Shuffle size={12} /> Random
              </Btn>
              <Btn variant="ghost" size="sm" onClick={onExport}>
                <Download size={12} /> Export
              </Btn>
              <Btn variant="ghost" size="sm" onClick={onClose}>
                <X size={12} /> Close
              </Btn>
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
            maxWidth: 660,
            margin: "0 auto",
            padding: "10px 28px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
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
              placeholder="Search…"
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
            collections={collections}
            themes={themes}
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
            maxWidth: 660,
            margin: "0 auto",
            padding: "4px 28px 100px",
          }}
        >
          {bookGroups.length === 0 ? (
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
          ) : (
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
  const [selected, setSelected] = useState(
    () => new Set(cards.map((c) => c.id))
  );
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const tags = useMemo(
    () =>
      [...new Set(cards.flatMap((c) => c.tags ?? []))].map((tag) => ({
        tag,
        count: cards.filter((c) => (c.tags ?? []).includes(tag)).length,
      })),
    [cards]
  );
  const visible = useMemo(
    () =>
      activeTag
        ? cards.filter((c) => (c.tags ?? []).includes(activeTag))
        : cards,
    [cards, activeTag]
  );
  const exportText = useMemo(
    () =>
      cards
        .filter((c) => selected.has(c.id))
        .map(cardToExport)
        .join("\n"),
    [cards, selected]
  );
  useKey("Escape", onClose, [onClose]);
  const doCopy = async () => {
    await copyText(exportText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1600);
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: C.base,
        zIndex: 150,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT_SANS,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          borderBottom: `1px solid ${C.border}`,
          background: C.base,
        }}
      >
        <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 28px" }}>
          <div
            style={{
              height: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.ink,
                  letterSpacing: "-0.01em",
                }}
              >
                Export
              </span>
              <span style={{ ...T.meta, opacity: 0.4, marginLeft: 4 }}>·</span>
              <span style={{ ...T.caption, marginLeft: 4 }}>
                {selected.size} of {cards.length} selected
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Btn
                variant="primary"
                size="sm"
                onClick={doCopy}
                disabled={!selected.size}
                style={copied ? { background: C.sage } : {}}
              >
                {copied ? (
                  <>
                    <Check size={13} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Copy {selected.size || ""} card
                    {selected.size !== 1 ? "s" : ""}
                  </>
                )}
              </Btn>
              <Btn variant="ghost" size="sm" onClick={onClose}>
                <X size={12} /> Close
              </Btn>
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
            maxWidth: 660,
            margin: "0 auto",
            padding: "10px 28px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 5,
              overflowX: "auto",
              scrollbarWidth: "none",
              flex: 1,
            }}
          >
            {[
              { tag: null as string | null, label: "All" },
              ...tags.map(({ tag }) => ({ tag, label: tag })),
            ].map(({ tag, label }) => {
              const active = activeTag === tag || (!tag && !activeTag);
              return (
                <button
                  key={label}
                  onClick={() =>
                    setActiveTag((p) => (p === tag ? null : tag))
                  }
                  style={{
                    padding: "5px 12px",
                    borderRadius: R.pill,
                    fontSize: 12,
                    fontFamily: FONT_SANS,
                    fontWeight: active ? 500 : 400,
                    background: active ? C.ink : C.surface,
                    color: active ? C.base : C.muted,
                    border: `1px solid ${active ? C.ink : C.border}`,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Btn
              variant="ghost"
              size="xs"
              onClick={() =>
                setSelected(new Set(cards.map((c) => c.id)))
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
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            maxWidth: 660,
            margin: "0 auto",
            padding: "4px 28px 100px",
          }}
        >
          <p style={{ ...T.caption, marginTop: 14, marginBottom: 6 }}>
            Tap to select or deselect
          </p>
          <Divider />
          {visible.map((c) => (
            <div
              key={c.id}
              style={{
                padding: "16px 0",
                borderBottom: `1px solid ${C.border}`,
                cursor: "pointer",
                position: "relative",
              }}
              onClick={() =>
                setSelected((s) => {
                  const n = new Set(s);
                  n.has(c.id) ? n.delete(c.id) : n.add(c.id);
                  return n;
                })
              }
            >
              <div
                style={{
                  position: "absolute",
                  top: 18,
                  right: 0,
                  width: 17,
                  height: 17,
                  borderRadius: R.sm,
                  border: `1.5px solid ${selected.has(c.id) ? C.ink : C.border}`,
                  background: selected.has(c.id) ? C.ink : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                {selected.has(c.id) && (
                  <Check size={9} color={C.base} />
                )}
              </div>
              <p
                style={{
                  ...T.quoteMain,
                  marginBottom: 7,
                  paddingRight: 28,
                }}
              >
                "{c.quote}"
              </p>
              <span style={T.book}>{c.book}</span>
              {c.author && (
                <span style={{ ...T.author, marginLeft: 8 }}>
                  {c.author}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      {selected.size > 0 && (
        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            padding: "14px 28px",
            flexShrink: 0,
          }}
        >
          <div style={{ maxWidth: 660, margin: "0 auto" }}>
            <p style={{ ...T.label, marginBottom: 7 }}>Preview</p>
            <pre
              style={{
                fontSize: 13,
                color: C.secondary,
                fontFamily: FONT_SERIF,
                lineHeight: 1.8,
                margin: 0,
                whiteSpace: "pre-wrap",
                maxHeight: 68,
                overflow: "hidden",
                maskImage:
                  "linear-gradient(to bottom, black 50%, transparent 100%)",
              }}
            >
              {exportText}
            </pre>
          </div>
        </div>
      )}
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
  connections?: Connection[] | null;
  prompts?: WritePrompt[];
  cards?: CardLike[];
  draft?: string;
  tensions?: Tension[];
  framing?: string;
  suggestions?: Suggestion[];
  bookA?: string;
  bookB?: string;
  stats?: Stats;
  session?: ReadingSession;
  quotes?: ImportQuote[];
  label?: string;
  questions?: QuizQuestion[];
};

export const MsgBubble = memo(function MsgBubble({
  m,
  collections,
  allCards,
  onUpdate,
  onTagsChange,
  onDelete,
  onSetCollections,
  onCreateCollection,
  onElaborate,
  onDismissConnection,
  onImportConfirm,
  onImportDiscard,
  onReadingNote,
  savedCardId,
}: {
  m: Message;
  collections: Collection[];
  allCards: CardLike[];
  onUpdate: (id: string, patch: Partial<CardLike>) => void;
  onTagsChange: (id: string, tags: string[]) => void;
  onDelete: (id: string) => void;
  onSetCollections: (id: string, ids: string[]) => void;
  onCreateCollection: (col: Collection) => void;
  onElaborate?: (card: CardLike) => void;
  onDismissConnection: (id: string) => void;
  onImportConfirm: (id: string, quotes: ImportQuote[]) => void;
  onImportDiscard: (id: string) => void;
  onReadingNote?: (cardId: string, note: string) => void;
  savedCardId: string | null;
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
  const cardProps = {
    collections,
    onUpdate,
    onTagsChange,
    onDelete,
    onSetCollections,
    onCreateCollection,
    onElaborate,
    allCards,
    savedCardId,
  };
  return (
    <div>
      {m.type === "saved" && m.liveCard && (
        <div>
          <div
            style={{
              borderLeft: `1px solid ${C.border}`,
              paddingLeft: 20,
            }}
          >
            <NoteCard
              card={m.liveCard}
              {...cardProps}
              justSaved={m.liveCard?.id === savedCardId}
            />
          </div>
          <ConnectionNotice
            connections={m.connections ?? undefined}
            onDismiss={() => onDismissConnection(m.id)}
          />
        </div>
      )}
      {m.type === "synthesis" && (
        <SynthesisBlock
          text={m.text ?? ""}
          cards={m.cards ?? []}
          {...cardProps}
        />
      )}
      {m.type === "write" && (
        <WritePrompts
          prompts={m.prompts}
          cards={m.cards}
          {...cardProps}
        />
      )}
      {m.type === "draft" && (
        <DraftBlock draft={m.draft ?? ""} cards={m.cards} {...cardProps} />
      )}
      {m.type === "tension" && (
        <TensionBlock
          text={m.text ?? ""}
          tensions={m.tensions}
          {...cardProps}
        />
      )}
      {m.type === "digest" && (
        <DigestBlock
          framing={m.framing ?? ""}
          cards={m.cards ?? []}
          {...cardProps}
        />
      )}
      {m.type === "recommend" && (
        <RecommendBlock suggestions={m.suggestions} />
      )}
      {m.type === "elaborate" && m.card && (
        <ElaborateBlock card={m.card} text={m.text ?? ""} />
      )}
      {m.type === "quiz" && (
        <QuizBlock questions={m.questions} />
      )}
      {m.type === "compare" && m.bookA && m.bookB && (
        <CompareBlock
          bookA={m.bookA}
          bookB={m.bookB}
          text={m.text ?? ""}
        />
      )}
      {m.type === "stats" && m.stats && (
        <StatsBlock stats={m.stats} />
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
          {m.cards.map((c) => (
            <NoteCard key={c.id} card={c} {...cardProps} />
          ))}
        </div>
      )}
    </div>
  );
});
