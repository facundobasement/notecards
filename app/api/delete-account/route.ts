import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Verify the user's JWT using the anon client
  const anonClient = createClient(supabaseUrl, anonKey);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Use service role client for admin operations
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Delete notecards first, then the auth user. This ordering is intentional:
  // if auth deletion fails the user can still log in and retry the full flow;
  // if we deleted the auth user first and data deletion failed, the account
  // would be gone but orphaned data would remain with no way to clean it up.
  // Delete all user's notecards
  const { error: deleteCardsError } = await adminClient
    .from("notecards")
    .delete()
    .eq("user_id", user.id);

  if (deleteCardsError) {
    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
  }

  // Delete the auth user
  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteUserError) {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
