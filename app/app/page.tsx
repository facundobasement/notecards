"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import NotecardsApp from "../notecards-app";
import type { UserMeta } from "../notecards-components";

export default function AppPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userMeta, setUserMeta] = useState<UserMeta | undefined>(undefined);
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
          setUserMeta({
            name: user.user_metadata?.full_name ?? "",
            email: user.email ?? "",
            avatar: user.user_metadata?.avatar_url ?? "",
          });
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
    <NotecardsApp userId={userId} userMeta={userMeta} onSignOut={handleSignOut} />
  );
}
