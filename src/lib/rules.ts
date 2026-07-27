import { applyMove, pieceAt } from "./board"
import type { Coord, Piece, Side } from "./types"

// 합법수 엔진. 궁성 좌표와 대각선 구조는 실제 규칙대로 고정값으로 정의한다.
// (한 궁성: file 4-6, rank 1-3 / 초 궁성: file 4-6, rank 8-10)

function c(file: number, rank: number): Coord {
  return { file: file as Coord["file"], rank: rank as Coord["rank"] }
}

function key(p: Coord): string {
  return `${p.file},${p.rank}`
}

function inBounds(p: Coord): boolean {
  return p.file >= 1 && p.file <= 9 && p.rank >= 1 && p.rank <= 10
}

function other(side: Side): Side {
  return side === "CHO" ? "HAN" : "CHO"
}

type Palace = {
  ranks: [number, number, number]
  center: Coord
  corners: Coord[]
}

const PALACES: Record<Side, Palace> = {
  HAN: { ranks: [1, 2, 3], center: c(5, 2), corners: [c(4, 1), c(6, 1), c(4, 3), c(6, 3)] },
  CHO: { ranks: [8, 9, 10], center: c(5, 9), corners: [c(4, 8), c(6, 8), c(4, 10), c(6, 10)] },
}

// 궁성 대각선: 모서리-중앙-반대모서리 3점이 한 직선. 한 궁성/초 궁성 각각 2줄.
const DIAGONAL_LINES: Coord[][] = [
  [PALACES.HAN.corners[0], PALACES.HAN.center, PALACES.HAN.corners[3]], // (4,1)-(5,2)-(6,3)
  [PALACES.HAN.corners[1], PALACES.HAN.center, PALACES.HAN.corners[2]], // (6,1)-(5,2)-(4,3)
  [PALACES.CHO.corners[0], PALACES.CHO.center, PALACES.CHO.corners[3]], // (4,8)-(5,9)-(6,10)
  [PALACES.CHO.corners[1], PALACES.CHO.center, PALACES.CHO.corners[2]], // (6,8)-(5,9)-(4,10)
]

// 한 칸 대각선 인접(궁/사 이동용): 모서리<->중앙만 인접, 모서리끼리는 인접 아님
const DIAGONAL_ADJACENCY = new Map<string, Coord[]>()
for (const line of DIAGONAL_LINES) {
  const [a, b, cc] = line
  DIAGONAL_ADJACENCY.set(key(a), [...(DIAGONAL_ADJACENCY.get(key(a)) ?? []), b])
  DIAGONAL_ADJACENCY.set(key(cc), [...(DIAGONAL_ADJACENCY.get(key(cc)) ?? []), b])
  DIAGONAL_ADJACENCY.set(key(b), [...(DIAGONAL_ADJACENCY.get(key(b)) ?? []), a, cc])
}

// 슬라이딩 기물(차)용: 각 점에서 대각선을 따라 뻗어나가는 방향별 점 목록
const DIAGONAL_SLIDE_DIRECTIONS = new Map<string, Coord[][]>()
for (const [a, b, cc] of DIAGONAL_LINES) {
  DIAGONAL_SLIDE_DIRECTIONS.set(key(a), [...(DIAGONAL_SLIDE_DIRECTIONS.get(key(a)) ?? []), [b, cc]])
  DIAGONAL_SLIDE_DIRECTIONS.set(key(cc), [...(DIAGONAL_SLIDE_DIRECTIONS.get(key(cc)) ?? []), [b, a]])
  DIAGONAL_SLIDE_DIRECTIONS.set(key(b), [...(DIAGONAL_SLIDE_DIRECTIONS.get(key(b)) ?? []), [a], [cc]])
}

// 포(대각선)용: 모서리에서만 성립 (받침=중앙, 도착=반대 모서리)
const CANNON_DIAGONAL = new Map<string, { screen: Coord; landing: Coord }>()
for (const [a, b, cc] of DIAGONAL_LINES) {
  CANNON_DIAGONAL.set(key(a), { screen: b, landing: cc })
  CANNON_DIAGONAL.set(key(cc), { screen: b, landing: a })
}

function isOwn(pieces: Piece[], p: Coord, side: Side): boolean {
  return pieceAt(pieces, p)?.side === side
}

function palaceMoves(piece: Piece, pieces: Piece[]): Coord[] {
  const { ranks } = PALACES[piece.side]
  const from = piece.coord
  const out: Coord[] = []
  for (const [df, dr] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const nf = from.file + df
    const nr = from.rank + dr
    if (nf >= 4 && nf <= 6 && (ranks as number[]).includes(nr)) out.push(c(nf, nr))
  }
  out.push(...(DIAGONAL_ADJACENCY.get(key(from)) ?? []))
  return out.filter((p) => !isOwn(pieces, p, piece.side))
}

function slideDir(from: Coord, df: number, dr: number, pieces: Piece[], side: Side): Coord[] {
  const out: Coord[] = []
  let f = from.file + df
  let r = from.rank + dr
  while (f >= 1 && f <= 9 && r >= 1 && r <= 10) {
    const occ = pieceAt(pieces, c(f, r))
    if (!occ) {
      out.push(c(f, r))
    } else {
      if (occ.side !== side) out.push(c(f, r))
      break
    }
    f += df
    r += dr
  }
  return out
}

function chariotMoves(piece: Piece, pieces: Piece[]): Coord[] {
  const out: Coord[] = [
    ...slideDir(piece.coord, 1, 0, pieces, piece.side),
    ...slideDir(piece.coord, -1, 0, pieces, piece.side),
    ...slideDir(piece.coord, 0, 1, pieces, piece.side),
    ...slideDir(piece.coord, 0, -1, pieces, piece.side),
  ]
  for (const dir of DIAGONAL_SLIDE_DIRECTIONS.get(key(piece.coord)) ?? []) {
    for (const p of dir) {
      const occ = pieceAt(pieces, p)
      if (!occ) {
        out.push(p)
        continue
      }
      if (occ.side !== piece.side) out.push(p)
      break
    }
  }
  return out
}

function cannonOrthogonalMoves(piece: Piece, pieces: Piece[]): Coord[] {
  const out: Coord[] = []
  for (const [df, dr] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    let f = piece.coord.file + df
    let r = piece.coord.rank + dr
    let screen: Piece | undefined
    while (f >= 1 && f <= 9 && r >= 1 && r <= 10) {
      screen = pieceAt(pieces, c(f, r))
      if (screen) break
      f += df
      r += dr
    }
    if (!screen || screen.type === "CANNON") continue
    f += df
    r += dr
    while (f >= 1 && f <= 9 && r >= 1 && r <= 10) {
      const occ = pieceAt(pieces, c(f, r))
      if (!occ) {
        out.push(c(f, r))
        f += df
        r += dr
        continue
      }
      if (occ.side !== piece.side && occ.type !== "CANNON") out.push(c(f, r))
      break
    }
  }
  return out
}

function cannonDiagonalMoves(piece: Piece, pieces: Piece[]): Coord[] {
  const line = CANNON_DIAGONAL.get(key(piece.coord))
  if (!line) return []
  const screen = pieceAt(pieces, line.screen)
  if (!screen || screen.type === "CANNON") return []
  const landing = pieceAt(pieces, line.landing)
  if (!landing) return [line.landing]
  if (landing.side !== piece.side && landing.type !== "CANNON") return [line.landing]
  return []
}

const HORSE_LEGS: [number, number, [number, number][]][] = [
  [1, 0, [
    [1, 1],
    [1, -1],
  ]],
  [-1, 0, [
    [-1, 1],
    [-1, -1],
  ]],
  [0, 1, [
    [1, 1],
    [-1, 1],
  ]],
  [0, -1, [
    [1, -1],
    [-1, -1],
  ]],
]

function horseMoves(piece: Piece, pieces: Piece[]): Coord[] {
  const out: Coord[] = []
  for (const [lf, lr, diagBranches] of HORSE_LEGS) {
    const leg = c(piece.coord.file + lf, piece.coord.rank + lr)
    if (!inBounds(leg) || pieceAt(pieces, leg)) continue
    for (const [df, dr] of diagBranches) {
      const dest = c(leg.file + df, leg.rank + dr)
      if (!inBounds(dest)) continue
      if (isOwn(pieces, dest, piece.side)) continue
      out.push(dest)
    }
  }
  return out
}

function elephantMoves(piece: Piece, pieces: Piece[]): Coord[] {
  const out: Coord[] = []
  for (const [lf, lr, diagBranches] of HORSE_LEGS) {
    const leg = c(piece.coord.file + lf, piece.coord.rank + lr)
    if (!inBounds(leg) || pieceAt(pieces, leg)) continue
    for (const [df, dr] of diagBranches) {
      const mid = c(leg.file + df, leg.rank + dr)
      if (!inBounds(mid) || pieceAt(pieces, mid)) continue
      const dest = c(mid.file + df, mid.rank + dr)
      if (!inBounds(dest)) continue
      if (isOwn(pieces, dest, piece.side)) continue
      out.push(dest)
    }
  }
  return out
}

function soldierMoves(piece: Piece, pieces: Piece[]): Coord[] {
  const forward = piece.side === "HAN" ? 1 : -1
  const candidates = [
    c(piece.coord.file, piece.coord.rank + forward),
    c(piece.coord.file + 1, piece.coord.rank),
    c(piece.coord.file - 1, piece.coord.rank),
  ].filter(inBounds)

  const enemyPalace = PALACES[other(piece.side)]
  if (piece.coord.file >= 4 && piece.coord.file <= 6 && (enemyPalace.ranks as number[]).includes(piece.coord.rank)) {
    candidates.push(...(DIAGONAL_ADJACENCY.get(key(piece.coord)) ?? []))
  }

  return candidates.filter((p) => !isOwn(pieces, p, piece.side))
}

export function pseudoMoves(piece: Piece, pieces: Piece[]): Coord[] {
  switch (piece.type) {
    case "GENERAL":
    case "GUARD":
      return palaceMoves(piece, pieces)
    case "CHARIOT":
      return chariotMoves(piece, pieces)
    case "CANNON":
      return [...cannonOrthogonalMoves(piece, pieces), ...cannonDiagonalMoves(piece, pieces)]
    case "HORSE":
      return horseMoves(piece, pieces)
    case "ELEPHANT":
      return elephantMoves(piece, pieces)
    case "SOLDIER":
      return soldierMoves(piece, pieces)
  }
}

function findGeneral(side: Side, pieces: Piece[]): Piece | undefined {
  return pieces.find((p) => p.side === side && p.type === "GENERAL")
}

function attacksSquare(attackerSide: Side, target: Coord, pieces: Piece[]): boolean {
  return pieces
    .filter((p) => p.side === attackerSide)
    .some((p) => pseudoMoves(p, pieces).some((m) => m.file === target.file && m.rank === target.rank))
}

export function isInCheck(side: Side, pieces: Piece[]): boolean {
  const general = findGeneral(side, pieces)
  if (!general) return false
  return attacksSquare(other(side), general.coord, pieces)
}

// 궁 마주보기 금지: 두 궁이 같은 파일에서 아무 기물도 없이 마주보면 안 된다
function generalsFacing(pieces: Piece[]): boolean {
  const cho = findGeneral("CHO", pieces)
  const han = findGeneral("HAN", pieces)
  if (!cho || !han || cho.coord.file !== han.coord.file) return false
  const [lo, hi] = cho.coord.rank < han.coord.rank ? [cho.coord.rank, han.coord.rank] : [han.coord.rank, cho.coord.rank]
  for (let r = lo + 1; r < hi; r++) {
    if (pieceAt(pieces, c(cho.coord.file, r))) return false
  }
  return true
}

export function isLegalMove(piece: Piece, to: Coord, pieces: Piece[]): boolean {
  if (!pseudoMoves(piece, pieces).some((m) => m.file === to.file && m.rank === to.rank)) return false
  const { pieces: next } = applyMove(pieces, piece.coord, to)
  if (isInCheck(piece.side, next)) return false
  if (generalsFacing(next)) return false
  return true
}

export function legalDestinations(piece: Piece, pieces: Piece[]): Coord[] {
  return pseudoMoves(piece, pieces).filter((to) => isLegalMove(piece, to, pieces))
}

export function hasAnyLegalMove(side: Side, pieces: Piece[]): boolean {
  return pieces.some((p) => p.side === side && legalDestinations(p, pieces).length > 0)
}

// ply(현재까지 둔 수의 개수)로 다음 차례를 정한다. 초(CHO)가 항상 선(先)이다.
export function sideToMove(plyCount: number): Side {
  return plyCount % 2 === 0 ? "CHO" : "HAN"
}

export type CheckStatus = "NONE" | "CHECK" | "CHECKMATE"

export function checkStatus(side: Side, pieces: Piece[]): CheckStatus {
  if (!isInCheck(side, pieces)) return "NONE"
  return hasAnyLegalMove(side, pieces) ? "CHECK" : "CHECKMATE"
}
