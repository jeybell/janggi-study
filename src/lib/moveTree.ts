import type { Coord, MoveNode, Side } from "./types"

let idCounter = 0
export function nextMoveId(): string {
  idCounter += 1
  return `m${Date.now().toString(36)}${idCounter}`
}

type Location = { node: MoveNode; parentChildren: MoveNode[]; path: MoveNode[] }

// 트리 전체에서 id로 노드를 찾고, root부터 그 노드까지의 경로(path, 노드 자신 포함)를 함께 반환한다.
export function locate(tree: MoveNode[], id: string): Location | null {
  function walk(nodes: MoveNode[], path: MoveNode[]): Location | null {
    for (const node of nodes) {
      const nextPath = [...path, node]
      if (node.id === id) return { node, parentChildren: nodes, path: nextPath }
      const found = walk(node.children, nextPath)
      if (found) return found
    }
    return null
  }
  return walk(tree, [])
}

export function getPath(tree: MoveNode[], id: string | null): MoveNode[] {
  if (id === null) return []
  return locate(tree, id)?.path ?? []
}

export function findNode(tree: MoveNode[], id: string): MoveNode | null {
  return locate(tree, id)?.node ?? null
}

// parentId === null 이면 첫 수(최상위)로 추가한다. 해당 위치에 이미 자식이 있으면 새 변화도(형제)로 추가된다.
export function addMove(
  tree: MoveNode[],
  parentId: string | null,
  move: { side: Side; from: Coord; to: Coord },
): { tree: MoveNode[]; id: string } {
  const id = nextMoveId()
  const newNode: MoveNode = { id, ...move, comment: "", tags: [], children: [] }

  if (parentId === null) {
    return { tree: [...tree, newNode], id }
  }

  function walk(nodes: MoveNode[]): MoveNode[] {
    return nodes.map((node) => {
      if (node.id === parentId) {
        return { ...node, children: [...node.children, newNode] }
      }
      return { ...node, children: walk(node.children) }
    })
  }

  return { tree: walk(tree), id }
}

export function deleteNode(tree: MoveNode[], id: string): MoveNode[] {
  function walk(nodes: MoveNode[]): MoveNode[] {
    return nodes.filter((n) => n.id !== id).map((n) => ({ ...n, children: walk(n.children) }))
  }
  return walk(tree)
}

export function updateNode(
  tree: MoveNode[],
  id: string,
  patch: Partial<Pick<MoveNode, "comment" | "tags">>,
): MoveNode[] {
  function walk(nodes: MoveNode[]): MoveNode[] {
    return nodes.map((n) =>
      n.id === id ? { ...n, ...patch } : { ...n, children: walk(n.children) },
    )
  }
  return walk(tree)
}

export function collectTags(tree: MoveNode[]): string[] {
  const set = new Set<string>()
  function walk(nodes: MoveNode[]) {
    for (const n of nodes) {
      for (const t of n.tags) set.add(t)
      walk(n.children)
    }
  }
  walk(tree)
  return [...set]
}

// 분기(자식이 2개 이상)가 있는 노드 개수 = "분기 다발" 정도를 세는 데 사용
export function countBranchPoints(tree: MoveNode[]): number {
  let count = 0
  function walk(nodes: MoveNode[]) {
    for (const n of nodes) {
      if (n.children.length > 1) count += 1
      walk(n.children)
    }
  }
  walk(tree)
  return count
}

export function countMoves(tree: MoveNode[]): number {
  let count = 0
  function walk(nodes: MoveNode[]) {
    for (const n of nodes) {
      count += 1
      walk(n.children)
    }
  }
  walk(tree)
  return count
}
