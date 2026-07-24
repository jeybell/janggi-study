"use client"

import { formatMove, sideLabel } from "@/lib/notation"
import type { MoveNode } from "@/lib/types"

function NodeButton({
  node,
  currentId,
  onSelect,
}: {
  node: MoveNode
  currentId: string | null
  onSelect: (id: string) => void
}) {
  const isCurrent = node.id === currentId
  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className={`rounded px-1.5 py-0.5 text-sm whitespace-nowrap ${
        isCurrent
          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
          : "hover:bg-neutral-200 dark:hover:bg-neutral-800"
      }`}
      title={node.comment || undefined}
    >
      {sideLabel(node.side)} {formatMove(node)}
      {node.comment ? " 💬" : ""}
      {node.tags.length > 0 ? ` #${node.tags.join(" #")}` : ""}
    </button>
  )
}

// 분기가 없는 한 줄기(trunk)를 이어서 그리고, 분기가 생기는 지점에서만 들여쓰기한다.
// (모든 수마다 들여쓰기하면 긴 본선이 계단처럼 깊어지는 것을 방지)
function VariationLine({
  start,
  currentId,
  onSelect,
  label,
}: {
  start: MoveNode
  currentId: string | null
  onSelect: (id: string) => void
  label?: string
}) {
  const trunk: MoveNode[] = []
  const branches: { afterId: string; siblings: MoveNode[] }[] = []

  let node: MoveNode | undefined = start
  while (node) {
    trunk.push(node)
    if (node.children.length > 1) {
      branches.push({ afterId: node.id, siblings: node.children.slice(1) })
    }
    node = node.children[0]
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1">
        {label && <span className="text-xs text-neutral-400">{label}</span>}
        {trunk.map((n) => (
          <NodeButton key={n.id} node={n} currentId={currentId} onSelect={onSelect} />
        ))}
      </div>
      {branches.map((b) => (
        <div key={b.afterId} className="ml-4 mt-1 border-l border-neutral-200 pl-3 dark:border-neutral-800">
          <MoveTreeView nodes={b.siblings} currentId={currentId} onSelect={onSelect} />
        </div>
      ))}
    </div>
  )
}

export function MoveTreeView({
  nodes,
  currentId,
  onSelect,
}: {
  nodes: MoveNode[]
  currentId: string | null
  onSelect: (id: string) => void
}) {
  if (nodes.length === 0) {
    return <p className="text-sm text-neutral-400">아직 입력된 수가 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-1">
      {nodes.map((node, i) => (
        <VariationLine
          key={node.id}
          start={node}
          currentId={currentId}
          onSelect={onSelect}
          label={nodes.length > 1 ? (i === 0 ? "본선" : `변화${i}`) : undefined}
        />
      ))}
    </div>
  )
}
