import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { countBranchPoints, countMoves } from "@/lib/moveTree"
import { RESULT_OPTIONS, SETUP_TYPES, type GameContent } from "@/lib/types"

type Row = { id: string; content: GameContent; tags: string[] }

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 shrink-0 truncate">{label}</span>
      <div className="h-3 flex-1 rounded bg-neutral-100 dark:bg-neutral-800">
        <div className="h-3 rounded bg-neutral-900 dark:bg-neutral-100" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 shrink-0 text-right text-neutral-500">{count}</span>
    </div>
  )
}

export default async function StatsPage() {
  const supabase = await createClient()
  const { data } = await supabase.from("games").select("id, content, tags")
  const games = (data ?? []) as Row[]

  const tagCounts = new Map<string, number>()
  for (const g of games) for (const t of g.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
  const tagEntries = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])
  const maxTagCount = tagEntries[0]?.[1] ?? 1

  const setupLabel = (v: string) => SETUP_TYPES.find((s) => s.value === v)?.label ?? v
  const comboMap = new Map<string, Record<string, number>>()
  for (const g of games) {
    const key = `${setupLabel(g.content.meta.setup.cho)} / ${setupLabel(g.content.meta.setup.han)}`
    const rec = comboMap.get(key) ?? {}
    rec[g.content.meta.result] = (rec[g.content.meta.result] ?? 0) + 1
    comboMap.set(key, rec)
  }

  const branchRows = games
    .map((g) => ({
      id: g.id,
      label: `${g.content.meta.players.cho || "?"} vs ${g.content.meta.players.han || "?"}`,
      branches: countBranchPoints(g.content.moves),
      moves: countMoves(g.content.moves),
    }))
    .filter((r) => r.branches > 0)
    .sort((a, b) => b.branches - a.branches)
    .slice(0, 10)
  const maxBranch = branchRows[0]?.branches ?? 1

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-6">
      <h1 className="text-lg font-semibold">통계</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">태그 빈도</h2>
        {tagEntries.length === 0 ? (
          <p className="text-sm text-neutral-400">태그가 달린 수가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {tagEntries.map(([tag, count]) => (
              <Bar key={tag} label={tag} count={count} max={maxTagCount} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">차림 조합별 결과 분포</h2>
        {comboMap.size === 0 ? (
          <p className="text-sm text-neutral-400">저장된 대국이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left dark:border-neutral-800">
                  <th className="py-1 pr-2">차림 (초 / 한)</th>
                  {RESULT_OPTIONS.map((r) => (
                    <th key={r.value} className="px-2 py-1 text-right">
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...comboMap.entries()].map(([combo, rec]) => (
                  <tr key={combo} className="border-b border-neutral-100 dark:border-neutral-900">
                    <td className="py-1 pr-2">{combo}</td>
                    {RESULT_OPTIONS.map((r) => (
                      <td key={r.value} className="px-2 py-1 text-right text-neutral-600 dark:text-neutral-400">
                        {rec[r.value] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">분기 다발 대국 Top 10</h2>
        {branchRows.length === 0 ? (
          <p className="text-sm text-neutral-400">변화도가 있는 대국이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {branchRows.map((r) => (
              <Link key={r.id} href={`/games/${r.id}`} className="block">
                <Bar label={r.label} count={r.branches} max={maxBranch} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
