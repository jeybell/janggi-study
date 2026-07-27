"use client"

import { pieceLabel, sideLabel } from "@/lib/notation"
import type { Coord, Piece } from "@/lib/types"

const FILES = 9
const RANKS = 10
const CELL = 64
const PAD = 44
const WIDTH = (FILES - 1) * CELL + PAD * 2
const HEIGHT = (RANKS - 1) * CELL + PAD * 2
const PIECE_SIZE = 58

function x(file: number): number {
  return PAD + (file - 1) * CELL
}
function y(rank: number): number {
  return PAD + (rank - 1) * CELL
}

const LINE_COLOR = "#5b4632"

function samePoint(a: Coord | null | undefined, b: Coord): boolean {
  return !!a && a.file === b.file && a.rank === b.rank
}

function pieceImageSrc(p: Piece): string {
  return `/pieces/${p.side.toLowerCase()}_${p.type.toLowerCase()}.png`
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
      <defs>
        <linearGradient id="woodBase" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e7c384" />
          <stop offset="100%" stopColor="#d4a969" />
        </linearGradient>
        <filter id="woodGrain" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.09" numOctaves={4} seed={7} result="noise" />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0.36  0 0 0 0 0.24  0 0 0 0 0.1  0 0 0 0.45 0"
          />
        </filter>
        <filter id="pieceShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.3" floodColor="#000000" floodOpacity="0.4" />
        </filter>
      </defs>

      <rect x={0} y={0} width={WIDTH} height={HEIGHT} rx={10} fill="url(#woodBase)" />
      <rect x={0} y={0} width={WIDTH} height={HEIGHT} rx={10} filter="url(#woodGrain)" />
      <rect x={1} y={1} width={WIDTH - 2} height={HEIGHT - 2} rx={9} fill="none" stroke="#8a6a3f" strokeWidth={2} />

      {/* 세로줄 */}
      {Array.from({ length: FILES }, (_, i) => i + 1).map((file) => (
        <line key={`v${file}`} x1={x(file)} y1={y(1)} x2={x(file)} y2={y(RANKS)} stroke={LINE_COLOR} strokeWidth={1.5} />
      ))}
      {/* 가로줄 */}
      {Array.from({ length: RANKS }, (_, i) => i + 1).map((rank) => (
        <line key={`h${rank}`} x1={x(1)} y1={y(rank)} x2={x(FILES)} y2={y(rank)} stroke={LINE_COLOR} strokeWidth={1.5} />
      ))}

      {/* 궁성 대각선 (한: rank1-3, 초: rank8-10, file 4-6) */}
      {[
        [4, 1, 6, 3],
        [6, 1, 4, 3],
        [4, 8, 6, 10],
        [6, 8, 4, 10],
      ].map(([fx, fy, tx, ty], i) => (
        <line key={`p${i}`} x1={x(fx)} y1={y(fy)} x2={x(tx)} y2={y(ty)} stroke={LINE_COLOR} strokeWidth={1.5} />
      ))}

      {/* 마지막 수 강조 */}
      {lastMove && (
        <>
          <circle cx={x(lastMove.from.file)} cy={y(lastMove.from.rank)} r={11} className="fill-yellow-300/50" />
          <circle cx={x(lastMove.to.file)} cy={y(lastMove.to.rank)} r={PIECE_SIZE / 2 + 4} className="fill-none stroke-yellow-500" strokeWidth={2.5} />
        </>
      )}

      {/* 선택 강조 */}
      {selected && (
        <circle cx={x(selected.file)} cy={y(selected.rank)} r={PIECE_SIZE / 2 + 6} className="fill-none stroke-emerald-500" strokeWidth={2.5} />
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
        <image
          key={p.id}
          href={pieceImageSrc(p)}
          x={x(p.coord.file) - PIECE_SIZE / 2}
          y={y(p.coord.rank) - PIECE_SIZE / 2}
          width={PIECE_SIZE}
          height={PIECE_SIZE}
          filter={samePoint(selected, p.coord) ? undefined : "url(#pieceShadow)"}
          className="pointer-events-none"
        >
          <title>{`${sideLabel(p.side)} ${pieceLabel(p.type, p.side)}`}</title>
        </image>
      ))}
    </svg>
  )
}
