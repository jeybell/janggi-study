import type { Coord, File, Piece, PieceType, Side, SetupType } from "./types"

// 내부 좌표 관례: HAN 앞줄은 rank 1, CHO 앞줄은 rank 10.
const BACK_RANK: Record<Side, number> = { HAN: 1, CHO: 10 }
const CANNON_RANK: Record<Side, number> = { HAN: 3, CHO: 8 }
const SOLDIER_RANK: Record<Side, number> = { HAN: 4, CHO: 7 }
// 궁은 뒷줄이 아니라 궁성 중앙(뒷줄에서 상대 쪽으로 한 칸)에서 시작한다.
const GENERAL_RANK: Record<Side, number> = { HAN: 2, CHO: 9 }

// 마상마상 / 상마상마 / 마상상마 / 상마마상: file 2,3 과 7,8 자리의 마(HORSE)/상(ELEPHANT) 배치
const SETUP_KNIGHT_ELEPHANT: Record<SetupType, [PieceType, PieceType, PieceType, PieceType]> = {
  MSMS: ["HORSE", "ELEPHANT", "HORSE", "ELEPHANT"],
  SMSM: ["ELEPHANT", "HORSE", "ELEPHANT", "HORSE"],
  MSSM: ["HORSE", "ELEPHANT", "ELEPHANT", "HORSE"],
  SMMS: ["ELEPHANT", "HORSE", "HORSE", "ELEPHANT"],
}

let idCounter = 0
function nextId(): string {
  idCounter += 1
  return `p${idCounter}`
}

function coord(file: number, rank: number): Coord {
  return { file: file as File, rank: rank as Coord["rank"] }
}

export function initialPieces(setup: { cho: SetupType; han: SetupType }): Piece[] {
  const pieces: Piece[] = []

  for (const side of ["CHO", "HAN"] as Side[]) {
    const back = BACK_RANK[side]
    const [f2, f3, f7, f8] = SETUP_KNIGHT_ELEPHANT[setup[side === "CHO" ? "cho" : "han"]]

    pieces.push(
      { id: nextId(), side, type: "CHARIOT", coord: coord(1, back) },
      { id: nextId(), side, type: f2, coord: coord(2, back) },
      { id: nextId(), side, type: f3, coord: coord(3, back) },
      { id: nextId(), side, type: "GUARD", coord: coord(4, back) },
      { id: nextId(), side, type: "GENERAL", coord: coord(5, GENERAL_RANK[side]) },
      { id: nextId(), side, type: "GUARD", coord: coord(6, back) },
      { id: nextId(), side, type: f7, coord: coord(7, back) },
      { id: nextId(), side, type: f8, coord: coord(8, back) },
      { id: nextId(), side, type: "CHARIOT", coord: coord(9, back) },
    )

    const cannonRank = CANNON_RANK[side]
    pieces.push(
      { id: nextId(), side, type: "CANNON", coord: coord(2, cannonRank) },
      { id: nextId(), side, type: "CANNON", coord: coord(8, cannonRank) },
    )

    const soldierRank = SOLDIER_RANK[side]
    for (const file of [1, 3, 5, 7, 9]) {
      pieces.push({ id: nextId(), side, type: "SOLDIER", coord: coord(file, soldierRank) })
    }
  }

  return pieces
}
