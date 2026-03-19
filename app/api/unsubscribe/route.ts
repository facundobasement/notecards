import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("uid");

  if (!userId) {
    return new Response("Missing user ID", { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Server misconfigured", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { digest_optout: true },
  });

  if (error) {
    return new Response("Something went wrong. Please try again.", {
      status: 500,
    });
  }

  return new Response(
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; max-width: 400px; margin: 80px auto; text-align: center; padding: 0 24px; color: #1a1a18;">
  <p style="font-size: 16px; line-height: 1.7;">You've been unsubscribed from the weekly digest.</p>
  <p style="color: #787874; font-size: 14px; line-height: 1.6;">You can re-enable it anytime in your Account settings.</p>
</body>
</html>`,
    { headers: { "Content-Type": "text/html" } },
  );
}
