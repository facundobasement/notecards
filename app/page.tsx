"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl bg-white px-8 py-10 shadow-lg dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Notecards
        </h1>
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Save quotes from the books you read and explore them with an AI
          reading companion.
        </p>
        <button
          onClick={handleLogin}
          className="mt-2 flex w-full items-center justify-center gap-3 rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          <span className="text-lg">G</span>
          <span>Continue with Google</span>
        </button>
      </main>
    </div>
  );
}

