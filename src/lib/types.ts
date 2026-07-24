// 도메인 타입. 내부 좌표는 { file, rank } 정수 쌍이며 표기법과 분리한다.
// 화면 표기는 lib/notation.ts 에서만 다룬다.

export type File = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export type Coord = { file: File; rank: Rank }

export type Side = "CHO" | "HAN"

export type PieceType =
  | "GENERAL"
  | "GUARD"
  | "CHARIOT"
  | "CANNON"
  | "HORSE"
  | "ELEPHANT"
  | "SOLDIER"

export type Piece = {
  id: string
  side: Side
  type: PieceType
  coord: Coord
}

// 마상마상 / 상마상마 / 마상상마 / 상마마상
export type SetupType = "MSMS" | "SMSM" | "MSSM" | "SMMS"

export type GameResult = "CHO_WIN" | "HAN_WIN" | "DRAW" | "UNKNOWN"

export type GameMeta = {
  players: { cho: string; han: string }
  setup: { cho: SetupType; han: SetupType }
  result: GameResult
  source: string
}

export type MoveNode = {
  id: string
  side: Side
  from: Coord
  to: Coord
  comment: string
  tags: string[]
  children: MoveNode[]
}

export type GameContent = {
  meta: GameMeta
  moves: MoveNode[]
}

export const SETUP_TYPES: { value: SetupType; label: string }[] = [
  { value: "MSMS", label: "마상마상" },
  { value: "SMSM", label: "상마상마" },
  { value: "MSSM", label: "마상상마" },
  { value: "SMMS", label: "상마마상" },
]

export const RESULT_OPTIONS: { value: GameResult; label: string }[] = [
  { value: "CHO_WIN", label: "초 승" },
  { value: "HAN_WIN", label: "한 승" },
  { value: "DRAW", label: "무승부" },
  { value: "UNKNOWN", label: "미정" },
]

export const SUGGESTED_TAGS = ["기물이득", "포진", "끝내기", "실수"]

export type GameListRow = {
  id: string
  content: GameContent
  tags: string[]
  played_at: string | null
  created_at: string
  updated_at: string
}
