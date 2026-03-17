"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useReducer,
} from "react";
import { Moon, Sun, ArrowUp, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  ThemeCtx,
  LIGHT,
  DARK,
  R,
  FONT_SANS,
  FONT_SERIF,
  makeT,
  getPlaceholder,
  cleanTag,
  cardToCtx,
  uid,
  Btn,
  TagPickerDrawer,
  RandomCard,
  ExportPanel,
  LibraryPanel,
  EmptyState,
  MsgBubble,
  Thinking,
  CommandPalette,
  BookPalette,
} from "./notecards-components";

const NOW = () => Date.now();
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const mkMsg = (role: "user" | "assistant", payload: Record<string, unknown>) => ({
  id: uid(),
  role,
  ...payload,
});

const SYSTEM =
  `You are a thoughtful reading companion helping a user explore their personal notecard library — quotes saved from books they've read. Stay grounded in their actual collection. Help them think with their own material. Be concise, warm, specific. Use *asterisks* for emphasis and book titles.`;

// ─── localStorage keys ─────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  collections: "nc_collections_v1",
  dark: "nc_dark_v1",
};

// ─── Storage via Supabase ─────────────────────────────────────────────────────

type NotecardRow = {
  id: string;
  user_id: string;
  quote: string;
  book: string;
  author: string | null;
  year: number | null;
  tags: string[] | null;
  note: string | null;
  collection_ids: string[] | null;
  created_at: string | null;
  last_seen_at: string | null;
};

const rowToCard = (row: NotecardRow) => ({
  id: row.id,
  quote: row.quote,
  book: row.book,
  author: row.author ?? "",
  year: row.year,
  tags: row.tags ?? [],
  note: row.note ?? "",
  collectionIds: row.collection_ids ?? [],
  createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at).getTime() : Date.now(),
});

const cardToRow = (card: any, userId: string): NotecardRow => ({
  id: card.id,
  user_id: userId,
  quote: card.quote,
  book: card.book,
  author: card.author || null,
  year: card.year ?? null,
  tags: card.tags ?? [],
  note: card.note || null,
  collection_ids: card.collectionIds ?? [],
  created_at: new Date(card.createdAt || Date.now()).toISOString(),
  last_seen_at: new Date(card.lastSeenAt || card.createdAt || Date.now()).toISOString(),
});

// ─── Cards reducer ────────────────────────────────────────────────────────────
function cardsReducer(state: any[], action: any) {
  switch (action.type) {
    case "SET":
      return action.cards;
    case "ADD":
      return [action.card, ...state];
    case "UPDATE":
      return state.map((c) =>
        c.id === action.id ? { ...c, ...action.patch } : c,
      );
    case "DELETE":
      return state.filter((c) => c.id !== action.id);
    case "SEEN":
      return state.map((c) =>
        c.id === action.id ? { ...c, lastSeenAt: NOW() } : c,
      );
    case "SET_TAGS":
      return state.map((c) =>
        c.id === action.id ? { ...c, tags: action.tags } : c,
      );
    case "SET_COLS":
      return state.map((c) =>
        c.id === action.id ? { ...c, collectionIds: action.ids } : c,
      );
    default:
      return state;
  }
}

// ─── AI ───────────────────────────────────────────────────────────────────────
const MODEL = "claude-sonnet-4-20250514";
async function callClaude(
  messages: any[],
  system: string,
  signal: AbortSignal,
  useSearch = false,
  maxTokens = 2000,
) {
  const body: any = { model: MODEL, max_tokens: maxTokens, system, messages };
  if (useSearch)
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const res = await fetch("/api/claude", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(
      `API ${res.status}: ${e?.error?.message || res.statusText}`,
    );
  }
  const data = await res.json();
  return (
    data.content?.filter((b: any) => b.type === "text").map((b: any) => b.text)
      .join("") || ""
  );
}
async function parseJSON(raw: string) {
  let s = raw.replace(/```json|```/g, "").trim();
  // Extract JSON object/array if Claude wrapped it in extra text
  const start = s.search(/[\[{]/);
  if (start > 0) s = s.slice(start);
  const end = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (end > 0) s = s.slice(0, end + 1);
  return JSON.parse(s);
}

// ─── Book search ──────────────────────────────────────────────────────────────
const STATIC_BOOKS = [
  { title: "Meditations", author: "Marcus Aurelius", year: 180 },
  { title: "Nicomachean Ethics", author: "Aristotle", year: -350 },
  { title: "The Obstacle Is the Way", author: "Ryan Holiday", year: 2014 },
  { title: "Ego Is the Enemy", author: "Ryan Holiday", year: 2016 },
  { title: "Man's Search for Meaning", author: "Viktor Frankl", year: 1946 },
  { title: "The Republic", author: "Plato", year: -380 },
  { title: "Thus Spoke Zarathustra", author: "Friedrich Nietzsche", year: 1883 },
  { title: "Sapiens", author: "Yuval Noah Harari", year: 2011 },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", year: 2011 },
  { title: "Atomic Habits", author: "James Clear", year: 2018 },
  { title: "Deep Work", author: "Cal Newport", year: 2016 },
  { title: "The War of Art", author: "Steven Pressfield", year: 2002 },
  { title: "Bird by Bird", author: "Anne Lamott", year: 1994 },
  { title: "On Writing", author: "Stephen King", year: 2000 },
  { title: "Crime and Punishment", author: "Fyodor Dostoevsky", year: 1866 },
  { title: "1984", author: "George Orwell", year: 1949 },
  { title: "The Brothers Karamazov", author: "Fyodor Dostoevsky", year: 1880 },
  { title: "The Stranger", author: "Albert Camus", year: 1942 },
  { title: "Beyond Good and Evil", author: "Friedrich Nietzsche", year: 1886 },
  { title: "Brave New World", author: "Aldous Huxley", year: 1932 },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925 },
  { title: "A Dance with Dragons", author: "George R.R. Martin", year: 2011 },
  { title: "The Alchemist", author: "Paulo Coelho", year: 1988 },
  { title: "Siddhartha", author: "Hermann Hesse", year: 1922 },
];
const staticSearch = (q: string) => {
  if (!q) return [] as { title: string; author: string; year: number | null }[];
  const ql = q.toLowerCase();
  return STATIC_BOOKS.filter(
    (b) =>
      b.title.toLowerCase().includes(ql) ||
      b.author.toLowerCase().includes(ql),
  ).slice(0, 6);
};
async function searchOpenLibrary(
  q: string,
  signal: AbortSignal,
): Promise<{ title: string; author: string; year: number | null }[]> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=title,author_name,first_publish_year&limit=7`,
      { signal },
    );
    if (!res.ok) return staticSearch(q);
    const data = await res.json();
    const r = (data.docs || []).map((d: any) => ({
      title: d.title,
      author: d.author_name?.[0] || "",
      year: d.first_publish_year || null,
    }));
    return r.length ? r : staticSearch(q);
  } catch (e: any) {
    return e?.name === "AbortError" ? [] : staticSearch(q);
  }
}
async function fetchBookDetails(
  title: string,
  author: string,
  signal: AbortSignal,
) {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&fields=subject&limit=1`,
      { signal },
    );
    const data = await res.json();
    const d = data.docs?.[0];
    return d ? { subjects: (d.subject || []).slice(0, 8) } : null;
  } catch {
    return null;
  }
}
function buildPersonalBooks(cards: any[]) {
  const seen = new Map<string, { title: string; author: string; year: number | null }>();
  [...cards].reverse().forEach((c) => {
    const k = c.book.toLowerCase();
    if (!seen.has(k))
      seen.set(k, {
        title: c.book,
        author: c.author || "",
        year: c.year ?? null,
      });
  });
  return [...seen.values()];
}
function mergeBookSuggestions(
  personal: { title: string; author: string; year: number | null }[],
  external: { title: string; author: string; year: number | null }[],
  query: string,
) {
  const ql = query.toLowerCase();
  const pm = personal.filter(
    (b) =>
      b.title.toLowerCase().includes(ql) ||
      b.author.toLowerCase().includes(ql),
  );
  const ef = external.filter(
    (e) =>
      !pm.some(
        (p) => p.title.toLowerCase() === e.title.toLowerCase(),
      ),
  );
  return [...pm, ...ef].slice(0, 8);
}

// ─── Demo cards ───────────────────────────────────────────────────────────────
const DEMO_CARDS = [
  {
    id: "d1",
    quote:
      "The impediment to action advances action. What stands in the way becomes the way.",
    book: "Meditations",
    author: "Marcus Aurelius",
    year: 180,
    tags: ["stoicism", "obstacles", "mindset"],
    note: "",
    collectionIds: [],
    createdAt: NOW() - 864e5 * 10,
    lastSeenAt: undefined,
  },
  {
    id: "d2",
    quote:
      "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    book: "Nicomachean Ethics",
    author: "Aristotle",
    year: -350,
    tags: ["habits", "excellence", "character"],
    note: "Counter to the Stoic emphasis on momentary choice?",
    collectionIds: [],
    createdAt: NOW() - 864e5 * 8,
    lastSeenAt: undefined,
  },
  {
    id: "d3",
    quote:
      "A reader lives a thousand lives before he dies. The man who never reads lives only one.",
    book: "A Dance with Dragons",
    author: "George R.R. Martin",
    year: 2011,
    tags: ["reading", "life", "imagination"],
    note: "",
    collectionIds: [],
    createdAt: NOW() - 864e5 * 5,
    lastSeenAt: undefined,
  },
  {
    id: "d4",
    quote: "The first draft of anything is shit.",
    book: "On Writing",
    author: "Stephen King",
    year: 2000,
    tags: ["writing", "drafts", "craft"],
    note: "Permission slip for every writer.",
    collectionIds: [],
    createdAt: NOW() - 864e5 * 3,
    lastSeenAt: undefined,
  },
  {
    id: "d5",
    quote:
      "You do not rise to the level of your goals. You fall to the level of your systems.",
    book: "Atomic Habits",
    author: "James Clear",
    year: 2018,
    tags: ["habits", "systems", "goals"],
    note: "",
    collectionIds: [],
    createdAt: NOW() - 864e5,
    lastSeenAt: undefined,
  },
];

// ─── AI functions ─────────────────────────────────────────────────────────────

async function intelligentFind(
  query: string,
  cards: any[],
  lastShownIds: string[] | undefined,
  signal: AbortSignal,
) {
  if (!cards.length)
    return { type: "empty", text: "Your library is empty.", cards: [] };
  const lib = cards.map(cardToCtx).join("\n");
  const lastCtx = lastShownIds?.length
    ? `Last shown IDs: ${lastShownIds.join(", ")}.`
    : "";
  const prompt = `Library:\n${lib}\n${lastCtx}\n\nQuery: "${query}"\n\nJSON: {"intent":"book_filter|author_filter|tag_filter|semantic|synthesis","target":"<value>","card_indices":[<n>],"response_text":"<reply>","is_synthesis":<bool>}`;
  try {
    const raw = await callClaude(
      [{ role: "user", content: prompt }],
      "Return only valid JSON, no markdown.",
      signal,
    );
    const p = await parseJSON(raw);
    const { intent, target, card_indices, response_text, is_synthesis } = p;
    let rc: any[] = [];
    if (intent === "book_filter")
      rc = cards.filter((c) =>
        c.book.toLowerCase().includes(target?.toLowerCase()),
      );
    else if (intent === "author_filter")
      rc = cards.filter((c) =>
        c.author?.toLowerCase().includes(target?.toLowerCase()),
      );
    else if (intent === "tag_filter")
      rc = cards.filter((c) =>
        c.tags.some((t: string) => t.includes(cleanTag(target || ""))),
      );
    else rc = (card_indices || []).map((i: number) => cards[i]).filter(Boolean);
    if (is_synthesis)
      return { type: "synthesis", text: response_text, cards: rc };
    return {
      type: "cards",
      text: rc.length
        ? response_text || `Found ${rc.length} card${rc.length !== 1 ? "s" : ""}`
        : `No cards found for *${target || query}*.`,
      cards: rc,
    };
  } catch (e: any) {
    if (e?.name === "AbortError") throw e;
    const q = query.toLowerCase();
    const m = cards.filter(
      (c) =>
        c.tags.some((t: string) => t.includes(q)) ||
        c.book.toLowerCase().includes(q) ||
        c.author?.toLowerCase().includes(q) ||
        c.quote.toLowerCase().includes(q),
    );
    return {
      type: "cards",
      text: m.length
        ? `Found ${m.length} card${m.length !== 1 ? "s" : ""}`
        : `No cards found for *${query}*.`,
      cards: m,
    };
  }
}

async function smartWrite(topic: string, cards: any[], signal: AbortSignal) {
  if (!cards.length) {
    const focus = topic ? ` about "${topic}"` : "";
    return {
      prompts: [
        { mode: "Argue", label: "Take a position", prompt: `Write a short argument${focus} based on something you've read recently. What claim would you defend, and why?` },
        { mode: "Open", label: "First paragraph", prompt: `Draft the opening paragraph of an essay${focus}. Start with a vivid image or a surprising statement.` },
        { mode: "Tension", label: "Write the contradiction", prompt: `Think of two ideas${focus ? focus.replace("about", "related to") : ""} that seem to contradict each other. Write about the tension between them.` },
      ],
      cards: [],
    };
  }
  const relevant = topic
    ? cards.filter(
        (c) =>
          c.tags.some((t: string) =>
            t.includes(topic.toLowerCase()),
          ) || c.quote.toLowerCase().includes(topic.toLowerCase()),
      )
    : cards;
  const sample = (relevant.length ? relevant : cards).slice(0, 8);
  const prompt = `Quotes:\n${sample.map(cardToCtx).join("\n")}${topic ? `\nFocus: "${topic}"` : ""}\n\nGenerate 3 writing prompts. JSON: {"prompts":[{"mode":"Argue","label":"Take a position","prompt":"<2-3 sentences>"},{"mode":"Open","label":"First paragraph","prompt":"<2-3 sentences>"},{"mode":"Tension","label":"Write the contradiction","prompt":"<2-3 sentences>"}],"source_indices":[]}`;
  const raw = await callClaude(
    [{ role: "user", content: prompt }],
    "You are a writing coach. Reference actual quotes and books. Use *asterisks* for titles.",
    signal,
  );
  const p = await parseJSON(raw);
  return {
    prompts: p.prompts || [],
    cards: (p.source_indices || []).map((i: number) => sample[i]).filter(Boolean),
  };
}

async function generateDigest(cards: any[], signal: AbortSignal) {
  if (!cards.length) return null;
  const now = NOW();
  const aged = cards.filter(
    (c) => now - (c.lastSeenAt || c.createdAt) > 864e5 * 14,
  );
  const pool = aged.length >= 3 ? aged : cards;
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
  const prompt = `Select exactly 3 of these quotes that feel thematically connected today. JSON: {"selected_indices":[i,j,k],"framing":"<1 warm, precise sentence naming the thread>"}`;
  try {
    const raw = await callClaude(
      [{ role: "user", content: JSON.stringify(shuffled.map(cardToCtx)) }],
      prompt,
      signal,
    );
    const p = await parseJSON(raw);
    const selected = (p.selected_indices || [0, 1, 2])
      .map((i: number) => shuffled[i])
      .filter(Boolean)
      .slice(0, 3);
    return {
      cards: selected,
      framing: p.framing || "Three cards worth sitting with today.",
    };
  } catch {
    return {
      cards: shuffled.slice(0, 3),
      framing: "Three cards worth sitting with today.",
    };
  }
}

async function suggestReading(cards: any[], signal: AbortSignal) {
  if (!cards.length) return null;
  const sample = cards.slice(0, 20).map(cardToCtx).join("\n");
  const prompt = `Based on this reading library:\n${sample}\n\nSuggest 4-5 books this person would deeply benefit from reading next. JSON: {"suggestions":[{"title":"<title>","author":"<author>","year":<year or null>,"why":"<1-2 sentences>"}]}`;
  const raw = await callClaude(
    [{ role: "user", content: prompt }],
    "Return ONLY JSON, no markdown. Be specific and surprising.",
    signal,
    true,
  );
  const p = await parseJSON(raw);
  return p.suggestions || [];
}

async function parseImportChunk(text: string, signal: AbortSignal) {
  const prompt = `Parse the following text and extract book quotes.\n\nText:\n${text}\n\nJSON: {"quotes":[{"quote":"<exact quote text>","book":"<book title>","author":"<author name or empty>","year":<year number or null>,"tags":["<tag1>","<tag2>"]}]}\n\nRules:\n- Extract as many distinct quotes as possible\n- Generate 2-4 relevant lowercase tags per quote\n- Return empty array if no quotes found`;
  const raw = await callClaude(
    [{ role: "user", content: prompt }],
    "Return ONLY JSON, no markdown.",
    signal,
    false,
    8192,
  );
  const p = await parseJSON(raw);
  return p.quotes || [];
}

async function parseImportText(text: string, signal: AbortSignal) {
  // Split long texts into chunks to avoid truncated JSON responses
  const MAX_CHUNK = 6000; // ~6k chars per chunk to stay within token limits
  if (text.length <= MAX_CHUNK) return parseImportChunk(text, signal);
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHUNK) {
      chunks.push(remaining);
      break;
    }
    // Split at a paragraph or line boundary near the limit
    let splitAt = remaining.lastIndexOf("\n\n", MAX_CHUNK);
    if (splitAt < MAX_CHUNK * 0.4) splitAt = remaining.lastIndexOf("\n", MAX_CHUNK);
    if (splitAt < MAX_CHUNK * 0.4) splitAt = MAX_CHUNK;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  const results = [];
  for (const chunk of chunks) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const quotes = await parseImportChunk(chunk, signal);
    results.push(...quotes);
  }
  return results;
}

async function generateReadingMode(cards: any[], signal: AbortSignal) {
  if (!cards.length) return null;
  const now = NOW();
  const scored = cards
    .map((c) => ({
      c,
      score:
        (now - (c.lastSeenAt || c.createdAt)) / 864e5 + (c.note ? 0 : 2),
    }))
    .sort((a, b) => b.score - a.score);
  const pool = scored.slice(0, 20).map((s) => s.c);
  const prompt = `You are a reading companion. Given these notecards, create a short "reading session" — a curated sequence of 5 cards to read slowly, with a brief reflection question after each one.\n\nCards:\n${pool.map(cardToCtx).join("\n")}\n\nJSON: {"session_title":"<evocative short title>","cards":[{"index":<n>,"reflection":"<one sharp question to sit with, 1 sentence>"}]}`;
  try {
    const raw = await callClaude(
      [{ role: "user", content: prompt }],
      "Return ONLY JSON, no markdown.",
      signal,
    );
    const p = await parseJSON(raw);
    return {
      title: p.session_title || "Reading session",
      items: (p.cards || [])
        .map((item: any) => ({
          card: pool[item.index],
          reflection: item.reflection,
        }))
        .filter((i: any) => i.card),
    };
  } catch {
    return null;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

type NotecardsAppProps = {
  userId: string;
};

export default function NotecardsApp({ userId }: NotecardsAppProps) {
  const [cards, dispatch] = useReducer(cardsReducer, []);
  const [collections, setCollections] = useState<any[]>([]);
  const [dark, setDark] = useState(false);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(true);

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLL] = useState("");
  const [flowStage, setFlowStage] = useState<string | null>(null);
  const [addCtx, setAddCtx] = useState<any>(null);
  const [bookSuggs, setBookSuggs] = useState<any[]>([]);
  const [paletteIdx, setPaletteIdx] = useState(-1);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [authorDraft, setAuthorDraft] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [pastePrompt, setPastePrompt] = useState<string | null>(null);
  const [randomCard, setRandomCard] = useState<any>(null);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const [tagDrawer, setTagDrawer] = useState<any>(null);

  const C = dark ? DARK : LIGHT;

  const cardsRef = useRef(cards);
  const messagesRef = useRef(messages);
  const addCtxRef = useRef(addCtx);
  const manualBookRef = useRef("");
  const lastShownIds = useRef<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const bookAbortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const inputContainerRef = useRef<HTMLDivElement | null>(null);
  const welcomeDigestTriggeredRef = useRef(false);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    addCtxRef.current = addCtx;
  }, [addCtx]);

  // Initial load: Supabase for cards, localStorage for collections/themes/dark
  useEffect(() => {
    async function load() {
      const [cardsRes, locCollections, locDark] = await Promise.all([
        supabase
          .from("notecards")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem(STORAGE_KEYS.collections) ?? "null")
          : null,
        typeof window !== "undefined"
          ? (() => {
              const v = localStorage.getItem(STORAGE_KEYS.dark);
              return v === null ? null : v === "true";
            })()
          : null,
      ]);
      const { data, error } = cardsRes;
      if (!error && data) {
        dispatch({
          type: "SET",
          cards: data.map((row: NotecardRow) => rowToCard(row)),
        });
      }
      if (Array.isArray(locCollections)) setCollections(locCollections);
      if (typeof locDark === "boolean") setDark(locDark);
      setStorageLoaded(true);
      setCardsLoading(false);
    }
    load();
  }, [userId]);

  // Welcome-back digest: once when user has cards but no messages (e.g. returning login)
  useEffect(() => {
    if (cardsLoading || cards.length === 0 || messages.length > 0 || welcomeDigestTriggeredRef.current) return;
    welcomeDigestTriggeredRef.current = true;

    const runWelcomeDigest = async () => {
      const count = cards.length;
      setMessages((p) => [
        ...p,
        mkMsg("assistant", {
          type: "text",
          text: `Welcome back — your library has ${count} card${count !== 1 ? "s" : ""}. Here's what's worth reading today:`,
        }),
      ]);
      setLoading(true);
      setLL("curating today's cards…");
      const ctrl = new AbortController();
      try {
        const result = await generateDigest(cards, ctrl.signal);
        if (result?.cards?.length) {
          result.cards.forEach((c: { id: string }) => markCardSeen(c.id));
          setMessages((p) => [...p, mkMsg("assistant", { type: "digest", framing: result.framing, cards: result.cards })]);
        } else {
          setMessages((p) => [
            ...p,
            mkMsg("assistant", { type: "text", text: "Type / to see what you can do." }),
          ]);
        }
      } catch {
        setMessages((p) => [
          ...p,
          mkMsg("assistant", { type: "text", text: "Type / to see what you can do." }),
        ]);
      } finally {
        setLoading(false);
        setLL("");
      }
    };
    runWelcomeDigest();
  }, [cardsLoading, cards.length, messages.length, userId]);

  // Persist collections, themes, dark to localStorage when storageLoaded
  useEffect(() => {
    if (!storageLoaded || typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.collections, JSON.stringify(collections));
  }, [storageLoaded, collections]);
  useEffect(() => {
    if (!storageLoaded || typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.dark, JSON.stringify(dark));
  }, [storageLoaded, dark]);

  // Wrapped card handlers that persist to Supabase
  const updateCard = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      dispatch({ type: "UPDATE", id, patch });
      const up: Record<string, unknown> = {};
      if (patch.quote !== undefined) up.quote = patch.quote;
      if (patch.book !== undefined) up.book = patch.book;
      if (patch.author !== undefined) up.author = patch.author;
      if (patch.year !== undefined) up.year = patch.year;
      if (patch.note !== undefined) up.note = patch.note;
      if (Object.keys(up).length)
        supabase
          .from("notecards")
          .update(up)
          .eq("id", id)
          .eq("user_id", userId)
          .then(null, (err) => console.error("Supabase update error:", err));
    },
    [userId]
  );
  const updateTags = useCallback(
    (id: string, tags: string[]) => {
      dispatch({ type: "SET_TAGS", id, tags });
      supabase
        .from("notecards")
        .update({ tags })
        .eq("id", id)
        .eq("user_id", userId)
        .then(null, (err) => console.error("Supabase tags update error:", err));
    },
    [userId]
  );
  const deleteCard = useCallback(
    async (id: string) => {
      dispatch({ type: "DELETE", id });
      const { error } = await supabase
        .from("notecards")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) console.error("Supabase delete error:", error);
    },
    [userId]
  );
  const setCardCols = useCallback(
    (id: string, ids: string[]) => {
      dispatch({ type: "SET_COLS", id, ids });
      supabase
        .from("notecards")
        .update({ collection_ids: ids })
        .eq("id", id)
        .eq("user_id", userId)
        .then(null, (err) => console.error("Supabase collections update error:", err));
    },
    [userId]
  );

  const markCardSeen = useCallback(
    (id: string) => {
      dispatch({ type: "SEEN", id });
      supabase
        .from("notecards")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId)
        .then(null, (err) => console.error("Supabase seen update error:", err));
    },
    [userId]
  );

  const createCollection = useCallback((col: { id: string; name: string; color: string; createdAt?: number }) => setCollections((p) => [...p, col]), []);

  const pickRandom = useCallback((pool: any[]) => {
    const now = NOW();
    const aged = pool.filter((c) => (now - (c.lastSeenAt || c.createdAt)) > 864e5 * 7);
    return pick(aged.length ? aged : pool);
  }, []);

  const openRandom = useCallback(() => {
    if (!cards.length) return;
    const card = pickRandom(cards);
    markCardSeen(card.id);
    setRandomCard(card);
    setShowLibrary(false);
  }, [cards, pickRandom, markCardSeen]);

  const nextRandom = useCallback(() => {
    if (cards.length <= 1) return;
    setRandomCard((prev: any) => {
      let n;
      do {
        n = pickRandom(cards);
      } while (n.id === prev?.id && cards.length > 1);
      markCardSeen(n.id);
      return n;
    });
  }, [cards, pickRandom, markCardSeen]);

  const handleReadingNote = useCallback((cardId: string, note: string) => {
    const card = cardsRef.current.find((c) => c.id === cardId);
    if (!card) return;
    const newNote = card.note ? card.note + "\n\n— " + note : note;
    dispatch({ type: "UPDATE", id: cardId, patch: { note: newNote } });
    supabase
      .from("notecards")
      .update({ note: newNote })
      .eq("id", cardId)
      .eq("user_id", userId)
      .then(null, (err) => console.error("Supabase elaborate update error:", err));
  }, [userId]);

  const handleInputChange = useCallback((val: string) => {
    setInput(val);
    if (val.startsWith("/")) {
      setShowCmdPalette(true);
      setCmdQuery(val);
    } else setShowCmdPalette(false);
    if (val.length > 60 && !val.startsWith("/")) setPastePrompt(val);
    else setPastePrompt(null);
  }, []);

  const personalBooks = useMemo(() => buildPersonalBooks(cards), [cards]);
  const bookSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleBookInput = useCallback(
    (val: string) => {
      setInput(val);
      setPaletteIdx(-1);
      setBookSuggs(mergeBookSuggestions(personalBooks, staticSearch(val), val));
      bookAbortRef.current?.abort();
      bookAbortRef.current = new AbortController();
      if (val.length >= 2) {
        setSearchingBooks(true);
        if (bookSearchTimer.current) clearTimeout(bookSearchTimer.current);
        const sig = bookAbortRef.current.signal;
        bookSearchTimer.current = setTimeout(async () => {
          const r = await searchOpenLibrary(val, sig);
          if (!sig.aborted) {
            setBookSuggs(mergeBookSuggestions(personalBooks, r, val));
            setSearchingBooks(false);
          }
        }, 400);
      } else setSearchingBooks(false);
    },
    [personalBooks]
  );

  const confirmBook = useCallback(
    async ({ title, author, year }: { title: string; author: string; year: number | null }) => {
      const ctx = addCtxRef.current;
      if (!ctx) return;
      setMessages((p) => [...p, mkMsg("user", { type: "text", text: author ? `${title} · ${author}` : title })]);
      setInput("");
      setFlowStage(null);
      setBookSuggs([]);
      setSearchingBooks(false);
      setSelectedBook(null);
      setAuthorDraft("");
      manualBookRef.current = "";
      setLoading(true);
      setLL("thinking…");
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const sig = abortRef.current.signal;
      const details = await fetchBookDetails(title, author, sig);
      const subjects = (details as any)?.subjects ?? [];
      const existingTags = [...new Set(cardsRef.current.flatMap((c) => c.tags ?? []))];
      let tags = ["reading"];
      try {
        const raw = await callClaude(
          [
            {
              role: "user",
              content: `Quote:"${ctx.quote}"\nBook:${title}\nAuthor:${author}\nYear:${year ?? "?"}\nSubjects:${(subjects as string[]).join(",") || "none"}\nExisting tags:${existingTags.join(",") || "none"}`,
            },
          ],
          `Return ONLY JSON: {"tags":["<3-5 lowercase thematic tags>"],"genre":"<string>","movement":"<string or empty>"}`,
          sig
        );
        const p = await parseJSON(raw);
        tags = (p.tags ?? []).map((t: string) => cleanTag(t)).filter(Boolean) || ["reading"];
      } catch (e: any) {
        if (e?.name === "AbortError") return;
      }
      setAddCtx((c: any) => ({ ...c, book: title, author, year: year ?? null }));
      setLoading(false);
      setLL("");
      const pid = uid();
      setMessages((p) => [...p, { id: pid, role: "assistant", type: "tagpicker_placeholder", text: "" }]);
      setTagDrawer({ pid, suggestedTags: tags, quote: ctx.quote, book: title, author });
    },
    []
  );

  const submitManualBook = useCallback(
    (title: string) => {
      if (!title.trim()) return;
      const known = personalBooks.find((b) => b.title.toLowerCase() === title.trim().toLowerCase());
      if (known) {
        setSelectedBook(known);
        setAuthorDraft(known.author ?? "");
        setBookSuggs([]);
        setInput("");
        manualBookRef.current = "";
      } else {
        setMessages((p) => [...p, mkMsg("user", { type: "text", text: title.trim() })]);
        setMessages((p) => [...p, mkMsg("assistant", { type: "text", text: "Who is the author?" })]);
        manualBookRef.current = title.trim();
        setAddCtx((ctx: any) => ({ ...ctx, book: title.trim() }));
        setFlowStage("author");
        setInput("");
        setBookSuggs([]);
        setSearchingBooks(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [personalBooks]
  );

  const handleTagConfirm = useCallback(
    async (pid: string, tags: string[]) => {
      const ctx = addCtxRef.current;
      if (!ctx) return;
      const card = {
        id: uid(),
        quote: ctx.quote,
        book: ctx.book,
        author: ctx.author,
        year: ctx.year,
        tags,
        note: "",
        collectionIds: [],
        createdAt: NOW(),
        lastSeenAt: NOW(),
      };
      dispatch({ type: "ADD", card });
      const { error } = await supabase.from("notecards").insert(cardToRow(card, userId));
      if (error) console.error("Supabase insert error:", error);
      setSavedCardId(card.id);
      setTimeout(() => setSavedCardId(null), 800);
      lastShownIds.current = [card.id];
      setMessages((p) =>
        p.map((m) => (m.id === pid ? { ...m, type: "saved", card, liveCard: card } : m))
      );
      setAddCtx(null);
      setTagDrawer(null);
    },
    [userId]
  );

  const handleTagDiscard = useCallback((pid: string) => {
    setMessages((p) => p.map((m) => (m.id === pid ? { ...m, type: "text", text: "Discarded." } : m)));
    setAddCtx(null);
    setTagDrawer(null);
  }, []);

  const handleImportConfirm = useCallback(async (pid: string, quotes: any[]) => {
    const newCards = quotes.map((q) => ({
      id: uid(),
      quote: q.quote,
      book: q.book,
      author: q.author ?? "",
      year: q.year ?? null,
      tags: (q.tags ?? []).map((t: string) => cleanTag(t)).filter(Boolean),
      note: "",
      collectionIds: [],
      createdAt: NOW(),
      lastSeenAt: NOW(),
    }));
    for (const card of newCards) {
      dispatch({ type: "ADD", card });
      const { error } = await supabase.from("notecards").insert(cardToRow(card, userId));
      if (error) console.error("Supabase insert error:", error);
    }
    setMessages((p) =>
      p.map((m) =>
        m.id === pid
          ? { ...m, type: "text", text: `Imported ${newCards.length} card${newCards.length !== 1 ? "s" : ""} into your library.` }
          : m
      )
    );
    setFlowStage(null);
  }, [userId]);

  const handleImportDiscard = useCallback((pid: string) => {
    setMessages((p) => p.map((m) => (m.id === pid ? { ...m, type: "text", text: "Import cancelled." } : m)));
    setFlowStage(null);
  }, []);

  const startAdd = useCallback((quote: string) => {
    setPastePrompt(null);
    setInput("");
    setMessages((p) => [
      ...p,
      mkMsg("user", { type: "text", text: `/add "${quote.slice(0, 60)}${quote.length > 60 ? "…" : ""}"` }),
    ]);
    setMessages((p) => [...p, mkMsg("assistant", { type: "text", text: "Which book is this from?" })]);
    setAddCtx({ quote });
    setFlowStage("book");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const runDemo = useCallback(async () => {
    for (const card of DEMO_CARDS) {
      dispatch({ type: "ADD", card });
      const { error } = await supabase.from("notecards").insert(cardToRow(card, userId));
      if (error) console.error("Supabase insert error:", error);
    }
  }, [userId]);

  const libraryCtx = useMemo(() => cards.map((c) => cardToCtx(c)).join("\n\n"), [cards]);

  const handleSend = useCallback(async () => {
    const raw = input.trim();
    if (!raw || loading) return;

    if (flowStage === "book") {
      if (selectedBook) {
        confirmBook({ ...selectedBook, author: authorDraft });
        return;
      }
      if (raw) {
        submitManualBook(raw);
        return;
      }
      return;
    }
    if (flowStage === "author") {
      setMessages((p) => [...p, mkMsg("user", { type: "text", text: raw || "Unknown" })]);
      confirmBook({ title: manualBookRef.current, author: raw || "", year: null });
      return;
    }
    if (flowStage === "import") {
      setMessages((p) => [...p, mkMsg("user", { type: "text", text: raw.length > 80 ? raw.slice(0, 80) + "…" : raw })]);
      setInput("");
      setFlowStage(null);
      setLoading(true);
      setLL("extracting quotes…");
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      try {
        const quotes = await parseImportText(raw, abortRef.current.signal);
        const pid = uid();
        setMessages((p) => [...p, { id: pid, role: "assistant", type: "import_preview", quotes }]);
      } catch (e: any) {
        if (e?.name !== "AbortError")
          setMessages((p) => [...p, mkMsg("assistant", { type: "text", text: `Import failed: ${e.message}` })]);
      }
      setLoading(false);
      setLL("");
      return;
    }

    setInput("");
    setPastePrompt(null);
    setShowCmdPalette(false);
    const sc = cards;
    const cmd = raw.toLowerCase();

    if (raw === "/library") {
      setShowLibrary(true);
      return;
    }
    if (raw === "/import") {
      setMessages((p) => [...p, mkMsg("user", { type: "text", text: "/import" })]);
      setMessages((p) => [...p, mkMsg("assistant", { type: "text", text: "Paste your text below — I'll extract any quotes I find." })]);
      setFlowStage("import");
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    if (raw === "/random") {
      if (!sc.length) {
        setMessages((p) => [...p, mkMsg("assistant", { type: "text", text: "No cards yet!" })]);
        return;
      }
      setMessages((p) => [...p, mkMsg("user", { type: "text", text: "/random" })]);
      const card = pickRandom(sc);
      markCardSeen(card.id);
      setRandomCard(card);
      return;
    }

    const ai = async (userText: string, label: string, fn: (sig: AbortSignal) => Promise<void>) => {
      setMessages((p) => [...p, mkMsg("user", { type: "text", text: userText })]);
      setLoading(true);
      setLL(label);
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      try {
        await fn(abortRef.current.signal);
      } catch (e: any) {
        if (e?.name !== "AbortError")
          setMessages((p) => [...p, mkMsg("assistant", { type: "text", text: `Failed: ${e.message}` })]);
      }
      setLoading(false);
      setLL("");
    };

    if (raw === "/digest") {
      await ai("/digest", "curating today's cards…", async (sig) => {
        const result = await generateDigest(sc, sig);
        if (result) {
          result.cards.forEach((c: { id: string }) => markCardSeen(c.id));
          setMessages((p) => [...p, mkMsg("assistant", { type: "digest", framing: result.framing, cards: result.cards })]);
        } else setMessages((p) => [...p, mkMsg("assistant", { type: "text", text: "Add more cards to get a daily digest." })]);
      });
      return;
    }
    if (cmd === "/read" || cmd.startsWith("/read ")) {
      if (sc.length < 3) {
        setMessages((p) => [...p, mkMsg("user", { type: "text", text: raw })]);
        setMessages((p) => [...p, mkMsg("assistant", { type: "text", text: "Add at least 3 cards to start a reading session." })]);
        return;
      }
      await ai(raw, "curating your session…", async (sig) => {
        const session = await generateReadingMode(sc, sig);
        if (session) setMessages((p) => [...p, mkMsg("assistant", { type: "reading", session })]);
        else setMessages((p) => [...p, mkMsg("assistant", { type: "text", text: "Couldn't generate a session right now." })]);
      });
      return;
    }
    if (raw === "/recommend") {
      if (sc.length < 3) {
        setMessages((p) => [...p, mkMsg("user", { type: "text", text: raw })]);
        setMessages((p) => [...p, mkMsg("assistant", { type: "text", text: "Add at least 3 cards so I can understand your tastes." })]);
        return;
      }
      await ai("/recommend", "thinking about your reading…", async (sig) => {
        const suggestions = await suggestReading(sc, sig);
        setMessages((p) => [...p, mkMsg("assistant", { type: "recommend", suggestions })]);
      });
      return;
    }
    if (cmd.startsWith("/add")) {
      const body = raw.slice(4).trim().replace(/^[""'""]|[""'""]$/g, "");
      setMessages((p) => [...p, mkMsg("user", { type: "text", text: raw })]);
      if (!body) {
        setMessages((p) => [...p, mkMsg("assistant", { type: "text", text: 'Try `/add "your quote"`' })]);
        return;
      }
      setMessages((p) => [...p, mkMsg("assistant", { type: "text", text: "Which book is this from?" })]);
      setAddCtx({ quote: body });
      setFlowStage("book");
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    if (cmd.startsWith("/find")) {
      const q = raw.slice(5).trim();
      setMessages((p) => [...p, mkMsg("user", { type: "text", text: raw })]);
      if (!q) {
        setMessages((p) => [...p, mkMsg("assistant", { type: "text", text: "Try `/find` with a book, author, topic, or question." })]);
        return;
      }
      await ai(raw, "reading your library…", async (sig) => {
        const result = await intelligentFind(q, sc, lastShownIds.current, sig);
        lastShownIds.current = result.cards.map((c) => c.id);
        setMessages((p) =>
          result.type === "synthesis"
            ? [...p, mkMsg("assistant", { type: "synthesis", text: result.text, cards: result.cards })]
            : [...p, mkMsg("assistant", { type: "text", text: result.text, cards: result.cards.length ? result.cards : null })]
        );
      });
      return;
    }
    if (cmd.startsWith("/write")) {
      const topic = raw.slice(6).trim();
      await ai(raw, "crafting prompts…", async (sig) => {
        const r = await smartWrite(topic, sc, sig);
        setMessages((p) => [...p, mkMsg("assistant", { type: "write", prompts: r.prompts, cards: r.cards })]);
      });
      return;
    }

    setMessages((p) => [...p, mkMsg("user", { type: "text", text: raw })]);
    setLoading(true);
    setLL("thinking…");
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const lib = libraryCtx;
    const lastCtx = lastShownIds.current.length ? `\n\nLast shown IDs: ${lastShownIds.current.join(", ")}.` : "";
    const sys = `${SYSTEM}\n\nLibrary:\n${lib || "Empty."}${lastCtx}`;
    const history = messagesRef.current
      .filter((m) => m.role === "user" && m.type === "text")
      .slice(-8)
      .map((m) => ({ role: "user" as const, content: (m as any).text }));
    try {
      const reply = await callClaude([...history, { role: "user", content: raw }], sys, abortRef.current.signal, true);
      setMessages((p) => [...p, mkMsg("assistant", { type: "text", text: reply })]);
    } catch (e: any) {
      if (e?.name !== "AbortError")
        setMessages((p) => [...p, mkMsg("assistant", { type: "text", text: `Something went wrong: ${e.message}` })]);
    }
    setLoading(false);
    setLL("");
  }, [
    input,
    loading,
    flowStage,
    selectedBook,
    authorDraft,
    cards,
    userId,
    confirmBook,
    submitManualBook,
    pickRandom,
    personalBooks,
    libraryCtx,
    markCardSeen,
  ]);

  useEffect(() => {
    setMessages((msgs) =>
      msgs.map((m) => {
        if (m.type !== "saved" || !(m as any).card) return m;
        const live = cards.find((c) => c.id === (m as any).card.id);
        return { ...m, liveCard: live ?? null };
      })
    );
  }, [cards]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    document.body.style.overflow = showLibrary || showExport || !!randomCard ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showLibrary, showExport, randomCard]);

  useEffect(() => () => {
    abortRef.current?.abort();
    bookAbortRef.current?.abort();
  }, []);

  const showEmpty = !cardsLoading && cards.length === 0 && messages.length === 0;
  const hasInput = input.trim().length > 0;
  const msgCardProps = useMemo(() => ({
    collections,
    allCards: cards,
    onUpdate: updateCard,
    onTagsChange: updateTags,
    onDelete: deleteCard,
    onSetCollections: setCardCols,
    onCreateCollection: createCollection,
    savedCardId,
    inputContainerRef,
  }), [collections, cards, updateCard, updateTags, deleteCard, setCardCols, createCollection, savedCardId]);

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ fontFamily: FONT_SANS, background: C.base, minHeight: "100vh" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');
          :focus-visible{outline:2px solid ${C.ink};outline-offset:2px}
          ::selection{background:${C.surfaceAlt}}
          ::-webkit-scrollbar-thumb{background:${C.border}}
        `}</style>

        <button
          onClick={() => setDark((d) => !d)}
          title={dark ? "Switch to light" : "Switch to dark"}
          style={{
            position: "fixed",
            bottom: 28,
            right: 24,
            zIndex: 40,
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
            opacity: 0.5,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.color = C.ink;
            e.currentTarget.style.borderColor = C.borderHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.5";
            e.currentTarget.style.color = C.faint;
            e.currentTarget.style.borderColor = C.border;
          }}
        >
          {dark ? <Sun size={13} /> : <Moon size={13} />}
        </button>

        {tagDrawer && (
          <TagPickerDrawer
            suggestedTags={tagDrawer.suggestedTags}
            quote={tagDrawer.quote}
            book={tagDrawer.book}
            author={tagDrawer.author}
            inputContainerRef={inputContainerRef}
            onConfirm={(tags) => handleTagConfirm(tagDrawer.pid, tags)}
            onDiscard={() => handleTagDiscard(tagDrawer.pid)}
          />
        )}
        {randomCard && (
          <RandomCard
            card={randomCard}
            onNext={nextRandom}
            onClose={() => setRandomCard(null)}
          />
        )}
        {showExport && (
          <ExportPanel cards={cards} onClose={() => setShowExport(false)} />
        )}
        {showLibrary && !showExport && (
          <LibraryPanel
            cards={cards}
            {...msgCardProps}
            onClose={() => setShowLibrary(false)}
            onRandom={() => {
              setShowLibrary(false);
              openRandom();
            }}
            onExport={() => setShowExport(true)}
          />
        )}

        <div
          style={{
            maxWidth: 640,
            width: "100%",
            margin: "0 auto",
            padding: "0 28px",
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          <div style={{ flex: 1, paddingBottom: 28 }}>
            {cardsLoading ? (
              <div style={{ display: "flex", minHeight: "82vh", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: 14, color: C.faint, fontFamily: FONT_SANS }}>Loading your library…</p>
              </div>
            ) : showEmpty ? (
              <EmptyState
                onSave={() => {
                  setInput("/add ");
                  inputRef.current?.focus();
                }}
                onDemo={runDemo}
              />
            ) : (
              <div style={{ paddingTop: 44 }}>
                {messages.map((m) =>
                  (m as any).type === "tagpicker_placeholder" ? null : (
                    <div key={m.id} style={{ animation: "fadeIn 0.25s ease", marginBottom: 36 }}>
                      <MsgBubble
                        m={m as any}
                        {...msgCardProps}
                        onImportConfirm={handleImportConfirm}
                        onImportDiscard={handleImportDiscard}
                        onReadingNote={handleReadingNote}
                      />
                    </div>
                  )
                )}
                {loading && <Thinking label={loadingLabel} />}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div
            style={{
              position: "sticky",
              bottom: 0,
              paddingBottom: 32,
              paddingTop: 16,
              background: `linear-gradient(to bottom, transparent, ${C.base} 20px)`,
            }}
          >
            {pastePrompt && !flowStage && (
              <div
                style={{
                  animation: "fadeIn 0.15s ease",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  borderRadius: R.lg,
                  border: `1px solid ${C.border}`,
                  background: C.base,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: C.muted,
                    fontFamily: FONT_SERIF,
                  }}
                >
                  "{pastePrompt.slice(0, 72)}…"
                </span>
                <Btn variant="primary" size="xs" onClick={() => startAdd(pastePrompt)}>
                  Save as quote
                </Btn>
                <button
                  onClick={() => setPastePrompt(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.faint,
                    display: "inline-flex",
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <div style={{ position: "relative" }}>
              {showCmdPalette && (
                <CommandPalette
                  query={cmdQuery}
                  onSelect={(cmd) => {
                    setInput(cmd + " ");
                    setShowCmdPalette(false);
                    inputRef.current?.focus();
                  }}
                />
              )}
              {flowStage === "book" && !selectedBook && (
                <BookPalette
                  suggestions={bookSuggs}
                  activeIdx={paletteIdx}
                  onSelect={(b) => {
                    setSelectedBook(b);
                    setAuthorDraft(b.author ?? "");
                    setBookSuggs([]);
                    setInput("");
                  }}
                  loading={searchingBooks}
                />
              )}

              <div
                ref={inputContainerRef}
                style={{
                  background: C.inputBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: R.xl + 4,
                  boxShadow: C.inputShadow,
                  padding: "14px 14px 14px 20px",
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 10,
                  transition: "box-shadow 0.2s, border-color 0.2s",
                }}
                onFocusCapture={(e) => {
                  e.currentTarget.style.boxShadow = C.inputShadowFocus;
                  e.currentTarget.style.borderColor = C.borderHover;
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.boxShadow = C.inputShadow;
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                {flowStage === "book" && !selectedBook && (
                  <span
                    style={{
                      ...makeT(C).label,
                      flexShrink: 0,
                      paddingBottom: 4,
                      alignSelf: "center",
                    }}
                  >
                    Book
                  </span>
                )}
                {flowStage === "author" && (
                  <span
                    style={{
                      ...makeT(C).label,
                      flexShrink: 0,
                      paddingBottom: 4,
                      alignSelf: "center",
                    }}
                  >
                    Author
                  </span>
                )}
                {flowStage === "import" && (
                  <span
                    style={{
                      ...makeT(C).label,
                      flexShrink: 0,
                      paddingBottom: 4,
                      alignSelf: "center",
                    }}
                  >
                    Import
                  </span>
                )}

                {selectedBook ? (
                  <>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={makeT(C).book}>{selectedBook.title}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ ...makeT(C).author, fontSize: 12 }}>by</span>
                        <input
                          autoFocus
                          value={authorDraft}
                          onChange={(e) => setAuthorDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              confirmBook({ ...selectedBook, author: authorDraft });
                            }
                            if (e.key === "Escape") {
                              setSelectedBook(null);
                              setAuthorDraft("");
                            }
                          }}
                          placeholder="Author name…"
                          style={{
                            flex: 1,
                            border: "none",
                            borderBottom: `1px solid ${C.border}`,
                            outline: "none",
                            fontSize: 14,
                            lineHeight: 1.7,
                            background: "transparent",
                            fontFamily: FONT_SANS,
                            color: C.ink,
                            padding: "0 0 1px",
                          }}
                        />
                      </div>
                    </div>
                    <Btn
                      variant="primary"
                      size="sm"
                      onClick={() => confirmBook({ ...selectedBook, author: authorDraft })}
                    >
                      Confirm
                    </Btn>
                    <button
                      onClick={() => {
                        setSelectedBook(null);
                        setAuthorDraft("");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: C.faint,
                        cursor: "pointer",
                        display: "inline-flex",
                      }}
                    >
                      <X size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) =>
                        flowStage === "book"
                          ? handleBookInput(e.target.value)
                          : handleInputChange(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setShowCmdPalette(false);
                          setPastePrompt(null);
                          return;
                        }
                        if (flowStage === "book" && bookSuggs.length) {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setPaletteIdx((i) => Math.min(i + 1, bookSuggs.length - 1));
                            return;
                          }
                          if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setPaletteIdx((i) => Math.max(i - 1, -1));
                            return;
                          }
                          if (e.key === "Enter" && paletteIdx >= 0) {
                            e.preventDefault();
                            const b = bookSuggs[paletteIdx];
                            setSelectedBook(b);
                            setAuthorDraft(b.author ?? "");
                            setBookSuggs([]);
                            setInput("");
                            return;
                          }
                        }
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowCmdPalette(false), 150)}
                      placeholder={getPlaceholder(cards, flowStage)}
                      rows={flowStage === "import" ? 4 : 1}
                      aria-label="Message input"
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        resize: "none",
                        fontSize: 14,
                        lineHeight: 1.75,
                        background: "transparent",
                        maxHeight: flowStage === "import" ? 200 : 120,
                        fontFamily: FONT_SANS,
                        color: C.ink,
                        padding: "2px 0",
                      }}
                      onInput={(e) => {
                        if (flowStage !== "import") {
                          const t = e.target as HTMLTextAreaElement;
                          t.style.height = "auto";
                          t.style.height = t.scrollHeight + "px";
                        }
                      }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={flowStage !== "author" && (!input.trim() || loading)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: "none",
                        flexShrink: 0,
                        background: hasInput && !loading ? C.ink : C.surface,
                        color: hasInput && !loading ? C.base : C.faint,
                        cursor: hasInput && !loading ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                        transform: hasInput ? "scale(1)" : "scale(0.88)",
                        opacity: hasInput ? 1 : 0.45,
                      }}
                    >
                      {loading ? (
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            border: `1.5px solid ${C.faint}`,
                            borderTopColor: C.ink,
                            borderRadius: "50%",
                            animation: "spin 0.7s linear infinite",
                          }}
                        />
                      ) : (
                        <ArrowUp size={14} />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </ThemeCtx.Provider>
  );
}

