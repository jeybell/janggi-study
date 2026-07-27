"use client"

import { useMemo, useState, useTransition } from "react"
import { Board } from "@/components/Board"
import { MoveTreeView } from "@/components/MoveTreeView"
import { saveGameContent } from "@/app/actions/games"
import { pieceAt, piecesAtPath } from "@/lib/board"
import { addMove, deleteNode, findNode, getPath, updateNode } from "@/lib/moveTree"
import { formatMove, sideLabel } from "@/lib/notation"
import { checkStatus, legalDestinations, sideToMove } from "@/lib/rules"
import { RESULT_OPTIONS, SUGGESTED_TAGS } from "@/lib/types"
import type { Coord, GameContent } from "@/lib/types"

function sameCoord(a: Coord | null, b: Coord): boolean {
  return !!a && a.file === b.file && a.rank === b.rank
}

export function GameEditor({ gameId, initialContent }: { gameId: string; initialContent: GameContent }) {
  const [content, setContent] = useState<GameContent>(initialContent)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [pendingFrom, setPendingFrom] = useState<Coord | null>(null)
  const [dirty, setDirty] = useState(false)
  const [isSaving, startSaving] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState("")
  const [illegalHint, setIllegalHint] = useState(false)

  const path = useMemo(() => getPath(content.moves, currentId), [content.moves, currentId])
  const pieces = useMemo(() => piecesAtPath(content.meta.setup, path), [content.meta.setup, path])
  const currentNode = currentId ? findNode(content.moves, currentId) : null
  const nextOptions = currentNode ? currentNode.children : content.moves
  const lastMove = currentNode ? { from: currentNode.from, to: currentNode.to } : null

  const turn = useMemo(() => sideToMove(path.length), [path.length])
  const status = useMemo(() => checkStatus(turn, pieces), [turn, pieces])
  const legalTargets = useMemo(() => {
    const piece = pendingFrom ? pieceAt(pieces, pendingFrom) : undefined
    return piece ? legalDestinations(piece, pieces) : []
  }, [pendingFrom, pieces])

  function mutate(next: GameContent) {
    setContent(next)
    setDirty(true)
  }

  function handleIntersectionClick(c: Coord) {
    setIllegalHint(false)

    if (!pendingFrom) {
      const piece = pieceAt(pieces, c)
      if (!piece || piece.side !== turn) return
      setPendingFrom(c)
      return
    }

    if (sameCoord(pendingFrom, c)) {
      setPendingFrom(null)
      return
    }

    // 같은 편 다른 기물을 클릭하면 선택을 그 기물로 옮긴다
    const clickedPiece = pieceAt(pieces, c)
    if (clickedPiece && clickedPiece.side === turn) {
      setPendingFrom(c)
      return
    }

    if (!legalTargets.some((t) => sameCoord(c, t))) {
      setIllegalHint(true)
      return
    }

    const { tree, id } = addMove(content.moves, currentId, { side: turn, from: pendingFrom, to: c })
    mutate({ ...content, moves: tree })
    setCurrentId(id)
    setPendingFrom(null)
  }

  function handleDeleteCurrent() {
    if (!currentId || !currentNode) return
    if (currentNode.children.length > 0) {
      const ok = window.confirm("이 수 이후의 변화도도 함께 삭제됩니다. 계속할까요?")
      if (!ok) return
    }
    const parentId = path.length >= 2 ? path[path.length - 2].id : null
    mutate({ ...content, moves: deleteNode(content.moves, currentId) })
    setCurrentId(parentId)
  }

  function handleCommentChange(comment: string) {
    if (!currentId) return
    mutate({ ...content, moves: updateNode(content.moves, currentId, { comment }) })
  }

  function toggleTag(tag: string) {
    if (!currentId || !currentNode) return
    const has = currentNode.tags.includes(tag)
    const tags = has ? currentNode.tags.filter((t) => t !== tag) : [...currentNode.tags, tag]
    mutate({ ...content, moves: updateNode(content.moves, currentId, { tags }) })
  }

  function addCustomTag() {
    const tag = tagInput.trim()
    if (!tag) return
    setTagInput("")
    if (!currentNode || currentNode.tags.includes(tag)) return
    toggleTag(tag)
  }

  function handleSave() {
    setSaveError(null)
    startSaving(async () => {
      try {
        await saveGameContent(gameId, content)
        setDirty(false)
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "저장에 실패했습니다.")
      }
    })
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:flex-row">
      <div className="md:w-[420px]">
        <Board
          pieces={pieces}
          selected={pendingFrom}
          legalTargets={legalTargets}
          lastMove={lastMove}
          onIntersectionClick={handleIntersectionClick}
        />

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button type="button" onClick={() => setCurrentId(null)} disabled={path.length === 0} className="rounded border px-2 py-1 text-sm disabled:opacity-40 dark:border-neutral-700">
            처음
          </button>
          <button
            type="button"
            onClick={() => setCurrentId(path.length >= 2 ? path[path.length - 2].id : null)}
            disabled={path.length === 0}
            className="rounded border px-2 py-1 text-sm disabled:opacity-40 dark:border-neutral-700"
          >
            ◀ 이전
          </button>
          <button
            type="button"
            onClick={() => nextOptions[0] && setCurrentId(nextOptions[0].id)}
            disabled={nextOptions.length === 0}
            className="rounded border px-2 py-1 text-sm disabled:opacity-40 dark:border-neutral-700"
          >
            다음 ▶
          </button>
          {nextOptions.length > 1 && (
            <select
              className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              onChange={(e) => e.target.value && setCurrentId(e.target.value)}
              value=""
            >
              <option value="">변화 선택...</option>
              {nextOptions.map((n, i) => (
                <option key={n.id} value={n.id}>
                  {i === 0 ? "본선" : `변화${i}`}: {sideLabel(n.side)} {formatMove(n)}
                </option>
              ))}
            </select>
          )}
        </div>

        <p className="mt-2 text-center text-xs text-neutral-500">
          {sideLabel(turn)} 차례
          {status === "CHECK" && <span className="ml-1 font-semibold text-red-600">— 장군!</span>}
          {status === "CHECKMATE" && <span className="ml-1 font-semibold text-red-600">— 외통(더 이상 둘 수 없음)</span>}
          {" · "}
          {pendingFrom ? "이동할 위치를 클릭하세요" : "이동할 기물을 클릭하세요"}
        </p>
        {illegalHint && <p className="mt-1 text-center text-xs text-red-600">그 위치로는 이동할 수 없습니다.</p>}
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <section className="rounded border border-neutral-200 p-3 text-sm dark:border-neutral-800">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>초: {content.meta.players.cho || "?"}</span>
            <span>한: {content.meta.players.han || "?"}</span>
            <span>결과: {RESULT_OPTIONS.find((r) => r.value === content.meta.result)?.label}</span>
            {content.meta.source && <span>출처: {content.meta.source}</span>}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">수순 / 변화도</h2>
            <button
              type="button"
              onClick={handleDeleteCurrent}
              disabled={!currentId}
              className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 disabled:opacity-30 dark:border-red-900"
            >
              현재 수 삭제
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto rounded border border-neutral-200 p-2 dark:border-neutral-800">
            <MoveTreeView nodes={content.moves} currentId={currentId} onSelect={setCurrentId} />
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">해설</h2>
          {currentNode ? (
            <>
              <textarea
                value={currentNode.comment}
                onChange={(e) => handleCommentChange(e.target.value)}
                placeholder="이 수에 대한 해설을 입력하세요"
                rows={4}
                className="rounded border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-2 py-0.5 text-xs ${
                      currentNode.tags.includes(tag)
                        ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                        : "border-neutral-300 dark:border-neutral-700"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {currentNode.tags
                  .filter((t) => !SUGGESTED_TAGS.includes(t))
                  .map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="rounded-full border border-neutral-900 bg-neutral-900 px-2 py-0.5 text-xs text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                    >
                      {tag} ×
                    </button>
                  ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addCustomTag()
                    }
                  }}
                  placeholder="태그 추가"
                  className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <button type="button" onClick={addCustomTag} className="rounded border px-2 py-1 text-sm dark:border-neutral-700">
                  추가
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-400">수를 선택하면 해설을 입력할 수 있습니다.</p>
          )}
        </section>

        <div className="mt-auto flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !dirty}
            className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {isSaving ? "저장 중..." : dirty ? "저장" : "저장됨"}
          </button>
          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        </div>
      </div>
    </div>
  )
}
