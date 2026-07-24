"use client"

import { useActionState, useState } from "react"
import { signIn, signUp, type AuthState } from "@/app/actions/auth"

const initialState: AuthState = { error: null, message: null }

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const action = mode === "signin" ? signIn : signUp
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-xl font-semibold">장기 급탈출 도우미</h1>
        <p className="text-sm text-neutral-500">개인 복기 학습용 기보 저장소</p>
      </div>

      <form action={formAction} className="flex flex-col gap-3">
        <input
          type="email"
          name="email"
          placeholder="이메일"
          required
          className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          minLength={6}
          required
          className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.message && <p className="text-sm text-emerald-600">{state.message}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neutral-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {pending ? "처리 중..." : mode === "signin" ? "로그인" : "회원가입"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="text-sm text-neutral-500 underline underline-offset-2"
      >
        {mode === "signin" ? "계정이 없나요? 회원가입" : "이미 계정이 있나요? 로그인"}
      </button>
    </div>
  )
}
