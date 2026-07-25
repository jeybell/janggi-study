import Link from "next/link"

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/games" className="font-semibold">
          장기 급탈출 도우미
        </Link>
        <Link href="/games" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
          목록
        </Link>
        <Link href="/games/new" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
          대국 추가
        </Link>
        <Link href="/stats" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
          통계
        </Link>
      </nav>
    </header>
  )
}
