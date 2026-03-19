import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { WeeklyDigest } from "@/app/emails/weekly-digest";

interface NotecardRow {
  id: string;
  user_id: string;
  quote: string;
  book: string;
  author: string | null;
  starred: boolean;
  created_at: string | null;
}

interface DigestData {
  firstName: string;
  quotesThisWeek: number;
  booksThisWeek: string[];
  featuredQuote?: { quote: string; book: string; author?: string };
  reviewEligible?: { book: string; count: number };
  streakWeeks?: number;
  totalQuotes: number;
  totalBooks: number;
}

function computeDigest(cards: NotecardRow[], userName: string): DigestData {
  const now = Date.now();
  const oneWeekAgo = now - 7 * 86400000;
  const threeWeeksAgo = now - 21 * 86400000;

  const thisWeek = cards.filter(
    (c) => new Date(c.created_at ?? 0).getTime() > oneWeekAgo,
  );
  const booksThisWeek = [...new Set(thisWeek.map((c) => c.book))];

  // Featured quote: most recent starred this week, or longest this week, or random from library
  const starredThisWeek = thisWeek
    .filter((c) => c.starred)
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime(),
    );
  const byLength = [...thisWeek].sort(
    (a, b) => b.quote.length - a.quote.length,
  );
  const pick =
    starredThisWeek[0] ??
    byLength[0] ??
    cards[Math.floor(Math.random() * cards.length)];

  // Review eligible: books with 3+ quotes, last quote > 21 days ago
  const bookGroups = new Map<string, NotecardRow[]>();
  for (const c of cards) {
    const group = bookGroups.get(c.book) ?? [];
    group.push(c);
    bookGroups.set(c.book, group);
  }
  let reviewEligible: { book: string; count: number } | undefined;
  for (const [book, group] of bookGroups) {
    if (group.length < 3) continue;
    const latest = Math.max(
      ...group.map((c) => new Date(c.created_at ?? 0).getTime()),
    );
    if (latest < threeWeeksAgo) {
      reviewEligible = { book, count: group.length };
      break;
    }
  }

  // Streak: count consecutive weeks with at least 1 quote
  let streakWeeks = 0;
  for (let w = 0; w < 52; w++) {
    const weekStart = now - (w + 1) * 7 * 86400000;
    const weekEnd = now - w * 7 * 86400000;
    if (
      cards.some((c) => {
        const t = new Date(c.created_at ?? 0).getTime();
        return t >= weekStart && t < weekEnd;
      })
    ) {
      streakWeeks++;
    } else {
      break;
    }
  }

  const uniqueBooks = [...new Set(cards.map((c) => c.book))];

  return {
    firstName: userName.split(" ")[0] || "Reader",
    quotesThisWeek: thisWeek.length,
    booksThisWeek,
    featuredQuote: pick
      ? {
          quote: pick.quote,
          book: pick.book,
          author: pick.author ?? undefined,
        }
      : undefined,
    reviewEligible,
    streakWeeks: streakWeeks >= 3 ? streakWeeks : undefined,
    totalQuotes: cards.length,
    totalBooks: uniqueBooks.length,
  };
}

export async function GET(request: Request) {
  // Verify cron secret (Vercel auto-injects for cron jobs)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !serviceRoleKey || !resendKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const resend = new Resend(resendKey);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://notecards.vercel.app";

  // Get all users
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers();

  let sent = 0;
  const errors: string[] = [];

  for (const user of users ?? []) {
    // Skip opted-out users and users without email
    if (user.user_metadata?.digest_optout) continue;
    if (!user.email) continue;

    try {
      // Get user's cards
      const { data: cards } = await supabase
        .from("notecards")
        .select("id, user_id, quote, book, author, starred, created_at")
        .eq("user_id", user.id);

      if (!cards?.length) continue;

      const digest = computeDigest(
        cards as NotecardRow[],
        user.user_metadata?.full_name ?? "",
      );

      await resend.emails.send({
        from: "Notecards <hello@notecards.app>",
        to: user.email,
        subject: "Your reading week",
        react: WeeklyDigest({ ...digest, appUrl, userId: user.id }),
      });
      sent++;
    } catch (err) {
      errors.push(`${user.id}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return NextResponse.json({ sent, errors: errors.length ? errors : undefined });
}
