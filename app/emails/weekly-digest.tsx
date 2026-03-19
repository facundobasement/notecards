import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Hr,
  Preview,
  Section,
} from "@react-email/components";

export interface WeeklyDigestProps {
  firstName: string;
  quotesThisWeek: number;
  booksThisWeek: string[];
  featuredQuote?: { quote: string; book: string; author?: string };
  reviewEligible?: { book: string; count: number };
  streakWeeks?: number;
  totalQuotes: number;
  totalBooks: number;
  appUrl: string;
  userId: string;
}

const serif = "Georgia, 'Times New Roman', Times, serif";
const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function WeeklyDigest({
  firstName,
  quotesThisWeek,
  booksThisWeek,
  featuredQuote,
  reviewEligible,
  streakWeeks,
  totalQuotes,
  totalBooks,
  appUrl,
  userId,
}: WeeklyDigestProps) {
  const isActive = quotesThisWeek > 0;
  const booksText =
    booksThisWeek.length === 1
      ? booksThisWeek[0]
      : booksThisWeek.length === 2
        ? `${booksThisWeek[0]} and ${booksThisWeek[1]}`
        : booksThisWeek.slice(0, -1).join(", ") + ", and " + booksThisWeek[booksThisWeek.length - 1];

  return (
    <Html>
      <Head />
      <Preview>
        {isActive
          ? `You saved ${quotesThisWeek} quote${quotesThisWeek === 1 ? "" : "s"} this week`
          : "A quote from your library"}
      </Preview>
      <Body style={{ backgroundColor: "#ffffff", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", padding: "40px 24px" }}>
          {/* Greeting */}
          <Text style={{ fontFamily: sans, fontSize: 15, color: "#1a1a18", lineHeight: "1.7", marginBottom: 0 }}>
            Hi {firstName},
          </Text>

          {/* Active week summary */}
          {isActive && (
            <Text style={{ fontFamily: sans, fontSize: 15, color: "#1a1a18", lineHeight: "1.7" }}>
              You saved {quotesThisWeek} quote{quotesThisWeek === 1 ? "" : "s"} this week
              {booksThisWeek.length > 0 ? `, from ${booksText}` : ""}.
            </Text>
          )}

          {/* Quiet week */}
          {!isActive && (
            <Text style={{ fontFamily: sans, fontSize: 15, color: "#1a1a18", lineHeight: "1.7" }}>
              It&apos;s been a quiet week. Here&apos;s something from your library:
            </Text>
          )}

          {/* Featured quote */}
          {featuredQuote && (
            <Section>
              <Hr style={{ borderColor: "#e2e1de", borderWidth: "0.5px", margin: "24px 0" }} />
              <Text style={{
                fontFamily: serif,
                fontSize: 16,
                fontStyle: "italic",
                color: "#1a1a18",
                lineHeight: "1.75",
                margin: "0 0 8px",
              }}>
                &ldquo;{featuredQuote.quote.length > 280
                  ? featuredQuote.quote.slice(0, 280) + "..."
                  : featuredQuote.quote}&rdquo;
              </Text>
              <Text style={{
                fontFamily: sans,
                fontSize: 13,
                color: "#787874",
                margin: 0,
              }}>
                — {featuredQuote.book}{featuredQuote.author ? `, ${featuredQuote.author}` : ""}
              </Text>
              <Hr style={{ borderColor: "#e2e1de", borderWidth: "0.5px", margin: "24px 0" }} />
            </Section>
          )}

          {/* Review nudge */}
          {reviewEligible && (
            <Text style={{ fontFamily: sans, fontSize: 14, color: "#3a3a38", lineHeight: "1.7" }}>
              You have {reviewEligible.count} quotes from{" "}
              <span style={{ fontFamily: serif, fontStyle: "italic" }}>{reviewEligible.book}</span>.
              It might be time to ask{" "}
              <Link href={appUrl} style={{ color: "#6b8f71", textDecoration: "none" }}>
                what it taught you
              </Link>.
            </Text>
          )}

          {/* Quiet week library stats */}
          {!isActive && (
            <Text style={{ fontFamily: sans, fontSize: 14, color: "#787874", lineHeight: "1.7" }}>
              You have {totalQuotes} quotes from {totalBooks} book{totalBooks === 1 ? "" : "s"}{" "}
              <Link href={appUrl} style={{ color: "#6b8f71", textDecoration: "none" }}>
                waiting for you
              </Link>.
            </Text>
          )}

          {/* Streak */}
          {streakWeeks && streakWeeks >= 3 && (
            <Text style={{ fontFamily: sans, fontSize: 13, color: "#b0afa9", marginTop: 20 }}>
              Week {streakWeeks} of reading.
            </Text>
          )}

          {/* Sign-off */}
          <Text style={{ fontFamily: sans, fontSize: 14, color: "#787874", marginTop: 28 }}>
            — Your reading companion
          </Text>

          {/* Footer */}
          <Hr style={{ borderColor: "#e2e1de", borderWidth: "0.5px", margin: "32px 0 16px" }} />
          <Text style={{ fontFamily: sans, fontSize: 11, color: "#b0afa9", lineHeight: "1.6" }}>
            You&apos;re receiving this because you use Notecards.{" "}
            <Link href={`${appUrl}/api/unsubscribe?uid=${userId}`} style={{ color: "#b0afa9" }}>
              Unsubscribe
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WeeklyDigest;
