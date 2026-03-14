"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const FONT_SERIF = "'Playfair Display', Georgia, serif";
const FONT_SANS = "'DM Sans', 'Inter', system-ui, sans-serif";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        router.replace("/app");
      }
    });
  }, [router]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@400;500&display=swap');
      `}</style>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f6f3",
          fontFamily: FONT_SANS,
        }}
      >
        <main
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: 360,
            padding: "0 24px",
          }}
        >
          <div
            style={{
              width: 20,
              height: 1,
              background: "#e2e1de",
              marginBottom: 32,
            }}
          />
          <h1
            style={{
              fontSize: 28,
              fontFamily: FONT_SERIF,
              color: "#0f0f0d",
              fontWeight: 600,
              marginBottom: 16,
              letterSpacing: "-0.01em",
            }}
          >
            Notecards
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "#787874",
              lineHeight: 1.6,
              maxWidth: 320,
              marginBottom: 28,
            }}
          >
            Save quotes from the books you read and explore them with an AI
            reading companion.
          </p>
          <button
            type="button"
            onClick={handleLogin}
            style={{
              background: "#0f0f0d",
              color: "#f7f6f3",
              padding: "10px 24px",
              borderRadius: 99,
              fontSize: 13,
              fontFamily: FONT_SANS,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#3a3a38";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0f0f0d";
            }}
          >
            Continue with Google
          </button>
          <p
            style={{
              fontSize: 12,
              color: "#b0afa9",
              marginTop: 20,
            }}
          >
            Your library is private and only visible to you.
          </p>
        </main>
      </div>
    </>
  );
}
