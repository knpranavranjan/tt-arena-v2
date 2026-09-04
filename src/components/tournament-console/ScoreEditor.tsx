'use client'

import React, { useState } from 'react'

import { Button, Note, Table, TableWrap, Td, Th } from '@/components/tournament-console/ui'
import { gameTally, gamesToWin, validateGames } from '@/lib/tournament/scoring'
import type { AnyMatch, MatchBase, Player, WinRule } from '@/lib/tournament/types'

type Draft = [string, string]

/**
 * Game-by-game score entry. The winner is never typed — it is derived from the
 * games and validated against the match's game rules (points to win a set, and
 * Golden Point vs win-by-two, best of N). Entry is two-step: type the games and
 * "Check score" against the rules, then "Confirm & advance" to lock it in.
 */
export default function ScoreEditor({
  match,
  playerById,
  bestOf,
  pointsToWin = 11,
  winBy = 'win_by_two',
  advanceHint,
  onSave,
  onCancel,
}: {
  match: AnyMatch
  playerById: Map<string, Player>
  bestOf: number
  pointsToWin?: number
  winBy?: WinRule
  /** What happens when this result is confirmed, e.g. "X advances to the Semi Final." */
  advanceHint?: string
  onSave: (result: Partial<MatchBase>) => void
  onCancel: () => void
}) {
  const a = playerById.get(match.aId ?? '')
  const b = playerById.get(match.bId ?? '')
  const need = gamesToWin(bestOf)

  const [games, setGames] = useState<Draft[]>(() => {
    const rows: Draft[] = match.games.map(([x, y]) => [String(x), String(y)])
    while (rows.length < bestOf) rows.push(['', ''])
    return rows
  })
  const [phase, setPhase] = useState<'edit' | 'confirm'>('edit')

  const check = validateGames(games, bestOf, pointsToWin, winBy !== 'golden')
  const winnerId = check.winner === 'a' ? match.aId : check.winner === 'b' ? match.bId : null
  const winnerName = winnerId === match.aId ? a?.name : b?.name

  const setCell = (index: number, side: 0 | 1, value: string) => {
    if (phase !== 'edit') return
    const clean = value.replace(/[^0-9]/g, '').slice(0, 2)
    setGames((rows) =>
      rows.map((row, i) => (i === index ? (side === 0 ? [clean, row[1]] : [row[0], clean]) : row)),
    )
  }

  const confirming = phase === 'confirm'

  return (
    <div className="flex flex-col gap-3">
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th className="w-14">Game</Th>
              <Th>{a?.name ?? '—'}</Th>
              <Th>{b?.name ?? '—'}</Th>
            </tr>
          </thead>
          <tbody>
            {games.map((row, i) => (
              <tr key={i}>
                <Td mono className="text-ink-faint">
                  {i + 1}
                </Td>
                {([0, 1] as const).map((side) => (
                  <Td key={side}>
                    <input
                      inputMode="numeric"
                      value={row[side]}
                      placeholder="—"
                      disabled={confirming}
                      aria-label={`Game ${i + 1}, ${side === 0 ? a?.name : b?.name}`}
                      onChange={(e) => setCell(i, side, e.target.value)}
                      className="tabular w-14 rounded-md border border-line bg-panel px-1 py-1.5 text-center text-[13px] outline-none focus:border-focus focus:ring-[3px] focus:ring-focus-soft disabled:opacity-60"
                    />
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>

      {confirming ? (
        <Note tone="good">
          ✓ <strong className="font-semibold">{winnerName}</strong> wins {gameTally(check.games)}
          {advanceHint ? ` — ${advanceHint}` : '.'}
        </Note>
      ) : check.errors.length > 0 ? (
        <Note tone="warn">{check.errors[0]}</Note>
      ) : (
        <Note tone="good">
          Winner: <strong className="font-semibold">{winnerName}</strong> — first to {need} games.
        </Note>
      )}

      <div className="flex flex-wrap gap-2">
        {confirming ? (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onSave({ games: check.games, winnerId, played: true, mode: 'manual' })}
            >
              Confirm &amp; advance
            </Button>
            <Button size="sm" onClick={() => setPhase('edit')}>
              Back to edit
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="primary" disabled={!check.ok} onClick={() => setPhase('confirm')}>
              Check score
            </Button>
            <Button size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
