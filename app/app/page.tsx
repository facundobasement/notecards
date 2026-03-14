"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import NotecardsApp from "../notecards-app";

export default function AppPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (cancelled) return;
        const user = data?.user;
        if (!user) {
          router.replace("/");
        } else {
          setUserId(user.id);
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (checking || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Loading your notecards…
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        position: "fixed",
        top: 16,
        right: 20,
        zIndex: 999,
      }}>
        <button
          onClick={handleSignOut}
          style={{
            fontSize: 11,
            fontFamily: "system-ui, sans-serif",
            color: "#888",
            background: "transparent",
            border: "1px solid #ddd",
            borderRadius: 99,
            padding: "4px 12px",
            cursor: "pointer",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "#333";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#999";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "#888";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#ddd";
          }}
        >
          Sign out
        </button>
      </div>
      <NotecardsApp userId={userId} />
    </div>
  );
}