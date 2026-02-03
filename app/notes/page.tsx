import { createClient } from "@/lib/supabase/server";
import NotesDropdown from "./NotesDropdown";

export default async function Page() {
  const supabase = await createClient();
  const { data: notes } = await supabase.from("places").select("name, shops");
  return (
    <div>
      <NotesDropdown notes={notes ?? []} />
    </div>
  );
}

// Client Component for dropdown and state
// File: ./NotesDropdown.tsx
// Place this in the same folder as page.tsx
