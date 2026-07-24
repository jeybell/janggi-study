"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type AuthState = { error: string | null; message: string | null }

function toErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "네트워크 오류가 발생했습니다."
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  let signInError: string | null
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    signInError = error?.message ?? null
  } catch (e) {
    return { error: toErrorMessage(e), message: null }
  }

  if (signInError) return { error: signInError, message: null }
  redirect("/games")
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message, message: null }
    return { error: null, message: "가입 확인 이메일을 보냈습니다. 확인 후 로그인해주세요." }
  } catch (e) {
    return { error: toErrorMessage(e), message: null }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
