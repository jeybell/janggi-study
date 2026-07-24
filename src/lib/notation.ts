// 표기법 전용 모듈. 내부 좌표({file,rank})를 화면에 어떻게 표시할지는
// 이 파일에서만 결정한다. 표기 규칙을 바꾸고 싶으면 여기만 수정하면 된다.
import type { Coord, MoveNode, PieceType, Side } from "./types"

export function formatCoord(c: Coord): string {
  return `${c.file}${c.rank}`
}

const PIECE_LABEL: Record<PieceType, string> = {
  GENERAL: "궁",
  GUARD: "사",
  CHARIOT: "차",
  CANNON: "포",
  HORSE: "마",
  ELEPHANT: "상",
  SOLDIER: "졸",
}

export function pieceLabel(type: PieceType): string {
  return PIECE_LABEL[type]
}

export function sideLabel(side: Side): string {
  return side === "CHO" ? "초" : "한"
}

export function formatMove(move: Pick<MoveNode, "from" | "to">): string {
  return `${formatCoord(move.from)}-${formatCoord(move.to)}`
}
