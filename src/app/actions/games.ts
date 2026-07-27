"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { collectTags } from "@/lib/moveTree"
import type { GameContent, GameMeta, GameResult, SetupType } from "@/lib/types"

export type CreateGameState = { error: string | null }

export async function createGame(
  _prev: CreateGameState,
  formData: FormData,
): Promise<CreateGameState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "로그인이 필요합니다." }

  const meta: GameMeta = {
    title: String(formData.get("title") ?? ""),
    setup: {
      cho: String(formData.get("setupCho") ?? "MSMS") as SetupType,
      han: String(formData.get("setupHan") ?? "MSMS") as SetupType,
    },
    result: String(formData.get("result") ?? "UNKNOWN") as GameResult,
  }

  const playedAt = String(formData.get("playedAt") ?? "")
  const content: GameContent = { meta, moves: [] }

  let gameId: string
  try {
    const { data, error } = await supabase
      .from("games")
      .insert({
        user_id: user.id,
        content,
        tags: [],
        played_at: playedAt || null,
      })
      .select("id")
      .single()

    if (error || !data) return { error: error?.message ?? "대국 생성에 실패했습니다." }
    gameId = data.id
  } catch (e) {
    return { error: e instanceof Error ? e.message : "네트워크 오류가 발생했습니다." }
  }

  redirect(`/games/${gameId}`)
}

export async function saveGameContent(id: string, content: GameContent) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("games")
    .update({ content, tags: collectTags(content.moves) })
    .eq("id", id)

  if (error) throw new Error(error.message)
}
