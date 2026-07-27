import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { RESULT_OPTIONS, SUGGESTED_TAGS, type GameContent } from "@/lib/types"

type Row = { id: string; content: GameContent; tags: string[]; played_at: string | null }

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; title?: string; playedAt?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("games")
    .select("id, content, tags, played_at")
    .order("played_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (sp.tag) query = query.contains("tags", [sp.tag])
  if (sp.playedAt) query = query.eq("played_at", sp.playedAt)
  if (sp.title) query = query.ilike("content->meta->>title", `%${sp.title}%`)

  const { data, error } = await query
  const games = (data ?? []) as Row[]

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">대국 목록</h1>
        <Link href="/games/new" className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900">
          + 대국 추가
        </Link>
      </div>

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded border border-neutral-200 p-3 text-sm dark:border-neutral-800">
        <label className="flex flex-col gap-1">
          제목
          <input name="title" defaultValue={sp.title ?? ""} className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900" />
        </label>
        <label className="flex flex-col gap-1">
          일자
          <input type="date" name="playedAt" defaultValue={sp.playedAt ?? ""} className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900" />
        </label>
        <label className="flex flex-col gap-1">
          태그
          <select name="tag" defaultValue={sp.tag ?? ""} className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900">
            <option value="">전체</option>
            {SUGGESTED_TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded border px-3 py-1.5 dark:border-neutral-700">
          검색
        </button>
        {(sp.title || sp.playedAt || sp.tag) && (
          <Link href="/games" className="text-neutral-500 underline underline-offset-2">
            초기화
          </Link>
        )}
      </form>

      {error && <p className="text-sm text-red-600">목록을 불러오지 못했습니다: {error.message}</p>}

      {games.length === 0 ? (
        <p className="text-sm text-neutral-400">조건에 맞는 대국이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {games.map((g) => (
            <li key={g.id}>
              <Link
                href={`/games/${g.id}`}
                className="flex flex-col gap-1 rounded border border-neutral-200 p-3 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{g.content.meta.title || "(제목 없음)"}</span>
                  <span className="text-neutral-500">{g.played_at ?? ""}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span>{RESULT_OPTIONS.find((r) => r.value === g.content.meta.result)?.label}</span>
                  {g.tags.map((t) => (
                    <span key={t} className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
                      #{t}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
