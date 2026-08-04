"use client"

import { useActionState } from "react"
import { createGame, type CreateGameState } from "@/app/actions/games"
import { SETUP_TYPES } from "@/lib/types"

const initialState: CreateGameState = { error: null }

function todayLocal(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function NewGamePage() {
  const [state, formAction, pending] = useActionState(createGame, initialState)

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-lg font-semibold">대국 추가</h1>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            제목
            <input name="title" placeholder="예: OO 프로 해설 영상" className="rounded border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            일자
            <input type="date" name="playedAt" defaultValue={todayLocal()} className="rounded border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            초 차림
            <select name="setupCho" defaultValue="MSMS" required className="rounded border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900">
              {SETUP_TYPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            한 차림
            <select name="setupHan" defaultValue="MSMS" required className="rounded border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900">
              {SETUP_TYPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neutral-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {pending ? "생성 중..." : "생성하고 수순 입력 시작"}
        </button>
      </form>
    </div>
  )
}
