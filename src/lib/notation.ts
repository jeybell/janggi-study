// 표기법 전용 모듈. 내부 좌표({file,rank})를 화면에 어떻게 표시할지는
// 이 파일에서만 결정한다. 표기 규칙을 바꾸고 싶으면 여기만 수정하면 된다.
import type { Coord, MoveNode, PieceType, Side } from "./types"

export function formatCoord(c: Coord): string {
  return `${c.file}${c.rank}`
}

// 장기 기물은 한자로 표기한다. 궁(장군)과 졸/병은 진영에 따라 글자가 다르다
// (초: 楚/卒, 한: 漢/兵). 나머지 기물은 양 진영이 같은 글자를 쓴다.
const PIECE_LABEL: Record<PieceType, string> = {
  GENERAL: "將",
  GUARD: "士",
  CHARIOT: "車",
  CANNON: "包",
  HORSE: "馬",
  ELEPHANT: "象",
  SOLDIER: "卒",
}

const SIDE_PIECE_LABEL: Partial<Record<Side, Partial<Record<PieceType, string>>>> = {
  CHO: { GENERAL: "楚", SOLDIER: "卒" },
  HAN: { GENERAL: "漢", SOLDIER: "兵" },
}

export function pieceLabel(type: PieceType, side: Side): string {
  return SIDE_PIECE_LABEL[side]?.[type] ?? PIECE_LABEL[type]
}

export function sideLabel(side: Side): string {
  return side === "CHO" ? "초" : "한"
}

export function formatMove(move: Pick<MoveNode, "from" | "to">): string {
  return `${formatCoord(move.from)}-${formatCoord(move.to)}`
}
