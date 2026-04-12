import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateLeagueForm } from "./CreateLeagueForm";

export default async function CreateLeaguePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name, code, country")
    .order("name");

  return <CreateLeagueForm competitions={competitions ?? []} />;
}
