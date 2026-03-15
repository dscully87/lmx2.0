import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: competitions, error } = await supabase
    .from("competitions")
    .select("id, api_id, name, code, country, emblem_url")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ competitions: competitions ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json() as {
    api_id: string;
    name: string;
    code: string;
    country: string;
    emblem_url: string;
  };

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("competitions")
    .upsert(
      {
        api_id: body.api_id,
        name: body.name,
        code: body.code,
        country: body.country,
        emblem_url: body.emblem_url || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "api_id" }
    )
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data?.id });
}
