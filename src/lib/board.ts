import { initialPieces } from "./setup"
import type { Coord, GameMeta, MoveNode, Piece } from "./types"

export function pieceAt(pieces: Piece[], c: Coord): Piece | undefined {
  return pieces.find((p) => p.coord.file === c.file && p.coord.rank === c.rank)
}

export function applyMove(
  pieces: Piece[],
  from: Coord,
  to: Coord,
): { pieces: Piece[]; captured: Piece | null } {
  const moving = pieceAt(pieces, from)
  if (!moving) return { pieces, captured: null }
  const captured = pieceAt(pieces, to) ?? null

  const next = pieces
    .filter((p) => p.id !== captured?.id)
    .map((p) => (p.id === moving.id ? { ...p, coord: to } : p))

  return { pieces: next, captured }
}

// root(=setup)부터 주어진 수순 경로(path)를 순서대로 적용한 판 상태를 계산한다.
export function piecesAtPath(setup: GameMeta["setup"], path: MoveNode[]): Piece[] {
  let pieces = initialPieces(setup)
  for (const node of path) {
    pieces = applyMove(pieces, node.from, node.to).pieces
  }
  return pieces
}
