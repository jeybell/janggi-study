import { notFound } from "next/navigation"
import { GameEditor } from "@/components/GameEditor"
import { createClient } from "@/lib/supabase/server"
import type { GameContent } from "@/lib/types"

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.from("games").select("id, content").eq("id", id).single()

  if (error || !data) notFound()

  return <GameEditor gameId={data.id} initialContent={data.content as GameContent} />
}
