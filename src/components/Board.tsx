"use client"

import { pieceLabel } from "@/lib/notation"
import type { Coord, Piece } from "@/lib/types"

const FILES = 9
const RANKS = 10
const CELL = 56
const PAD = 36
const WIDTH = (FILES - 1) * CELL + PAD * 2
const HEIGHT = (RANKS - 1) * CELL + PAD * 2

function x(file: number): number {
  return PAD + (file - 1) * CELL
}
function y(rank: number): number {
  return PAD + (rank - 1) * CELL
}

const SIDE_COLOR = { CHO: "#1d4ed8", HAN: "#b91c1c" } as const

function samePoint(a: Coord | null | undefined, b: Coord): boolean {
  return !!a && a.file === b.file && a.rank === b.rank
}

export function Board({
  pieces,
  selected = null,
  lastMove = null,
  onIntersectionClick,
}: {
  pieces: Piece[]
  selected?: Coord | null
  lastMove?: { from: Coord; to: Coord } | null
  onIntersectionClick?: (c: Coord) => void
}) {
  const points: Coord[] = []
  for (let file = 1; file <= FILES; file++) {
    for (let rank = 1; rank <= RANKS; rank++) {
      points.push({ file: file as Coord["file"], rank: rank as Coord["rank"] })
    }
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="mx-auto w-full max-w-md touch-none select-none"
      role="img"
      aria-label="장기판"
    >
      <rect x={0} y={0} width={WIDTH} height={HEIGHT} className="fill-amber-50 dark:fill-neutral-900" />

      {/* 세로줄 */}
      {Array.from({ length: FILES }, (_, i) => i + 1).map((file) => (
        <line
          key={`v${file}`}
          x1={x(file)}
          y1={y(1)}
          x2={x(file)}
          y2={y(RANKS)}
          stroke="currentColor"
          strokeWidth={1}
          className="text-neutral-400 dark:text-neutral-600"
        />
      ))}
      {/* 가로줄 */}
      {Array.from({ length: RANKS }, (_, i) => i + 1).map((rank) => (
        <line
          key={`h${rank}`}
          x1={x(1)}
          y1={y(rank)}
          x2={x(FILES)}
          y2={y(rank)}
          stroke="currentColor"
          strokeWidth={1}
          className="text-neutral-400 dark:text-neutral-600"
        />
      ))}

      {/* 궁성 대각선 (한: rank1-3, 초: rank8-10, file 4-6) */}
      {[
        [4, 1, 6, 3],
        [6, 1, 4, 3],
        [4, 8, 6, 10],
        [6, 8, 4, 10],
      ].map(([fx, fy, tx, ty], i) => (
        <line
          key={`p${i}`}
          x1={x(fx)}
          y1={y(fy)}
          x2={x(tx)}
          y2={y(ty)}
          stroke="currentColor"
          strokeWidth={1}
          className="text-neutral-400 dark:text-neutral-600"
        />
      ))}

      {/* 마지막 수 강조 */}
      {lastMove && (
        <>
          <circle cx={x(lastMove.from.file)} cy={y(lastMove.from.rank)} r={10} className="fill-yellow-300/50" />
          <circle cx={x(lastMove.to.file)} cy={y(lastMove.to.rank)} r={14} className="fill-none stroke-yellow-500" strokeWidth={2} />
        </>
      )}

      {/* 선택 강조 */}
      {selected && (
        <circle cx={x(selected.file)} cy={y(selected.rank)} r={16} className="fill-none stroke-emerald-500" strokeWidth={2.5} />
      )}

      {/* 클릭 영역 */}
      {points.map((c) => (
        <circle
          key={`hit${c.file}-${c.rank}`}
          cx={x(c.file)}
          cy={y(c.rank)}
          r={CELL / 2 - 2}
          fill="transparent"
          className={onIntersectionClick ? "cursor-pointer" : undefined}
          onClick={() => onIntersectionClick?.(c)}
        />
      ))}

      {/* 기물 */}
      {pieces.map((p) => (
        <g key={p.id} transform={`translate(${x(p.coord.file)}, ${y(p.coord.rank)})`} className="pointer-events-none">
          <circle
            r={19}
            fill="white"
            stroke={SIDE_COLOR[p.side]}
            strokeWidth={samePoint(selected, p.coord) ? 3 : 2}
            className="dark:fill-neutral-800"
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={18}
            fontWeight={700}
            fill={SIDE_COLOR[p.side]}
          >
            {pieceLabel(p.type)}
          </text>
        </g>
      ))}
    </svg>
  )
}
