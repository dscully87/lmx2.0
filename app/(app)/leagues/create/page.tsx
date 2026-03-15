import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateLeagueForm } from "./CreateLeagueForm";

export default async function CreateLeaguePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "manager" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name, code, country")
    .order("name");

  return <CreateLeagueForm competitions={competitions ?? []} />;
}
