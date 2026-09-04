'use client'

import React from 'react'

import { Badge, Competitor, RankPill, Table, TableWrap, Td, Th } from '@/components/tournament-console/ui'
import { cn } from '@/lib/utils'
import { ruleLabel } from '@/lib/tournament/standings'
import type { Player, RankedRow, TieBreakRule } from '@/lib/tournament/types'

/**
 * Live pool table. Rows that currently advance are shaded, so the effect of
 * changing the tie-break rule is visible immediately.
 */
export default function StandingsTable({
  rows,
  playerById,
  seedOf,
  advancePerPool = 1,
  tieRule,
  fillIds,
  doubles = false,
}: {
  rows: RankedRow[]
  playerById: Map<string, Player>
  seedOf: (id: string) => number | string
  advancePerPool?: number
  tieRule: TieBreakRule
  fillIds?: Set<string>
  doubles?: boolean
}) {
  const hasTie = rows.some((r) => r.tieGroup !== null)

  return (
    <>
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th className="w-11">#</Th>
              <Th>{doubles ? 'Pair' : 'Player'}</Th>
              <Th num>Seed</Th>
              <Th num title="Played">P</Th>
              <Th num title="Won">W</Th>
              <Th num title="Lost">L</Th>
              <Th num title="Games won and lost">Games</Th>
              <Th num title="Points for">PF</Th>
              <Th num title="Points against">PA</Th>
              <Th num title="Point difference">PD</Th>
              <Th num title="Group points">Pts</Th>
              <Th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const qualifies = r.rank <= advancePerPool
              const filled = Boolean(fillIds?.has(r.playerId)) && !qualifies
              return (
                <tr
                  key={r.playerId}
                  className={cn(
                    'transition-colors hover:bg-subtle',
                    qualifies && 'bg-linear-to-r from-good-soft to-transparent to-40%',
                    filled && 'bg-linear-to-r from-warn-soft to-transparent to-40%',
                  )}
                >
                  <Td>
                    <RankPill rank={r.rank} highlight={qualifies || filled} />
                  </Td>
                  <Td className={qualifies ? 'font-semibold' : undefined}>
                    {doubles ? (
                      <Competitor player={playerById.get(r.playerId)} size={18} />
                    ) : (
                      (playerById.get(r.playerId)?.name ?? '—')
                    )}
                  </Td>
                  <Td num mono className="text-ink-faint">
                    {seedOf(r.playerId)}
                  </Td>
                  <Td num mono>{r.played}</Td>
                  <Td num mono>{r.won}</Td>
                  <Td num mono>{r.lost}</Td>
                  <Td num mono>
                    {r.gamesFor}–{r.gamesAgainst}
                  </Td>
                  <Td num mono>{r.pointsFor}</Td>
                  <Td num mono>{r.pointsAgainst}</Td>
                  <Td num mono className={r.pointDiff > 0 ? 'text-good' : r.pointDiff < 0 ? 'text-bad' : undefined}>
                    {r.pointDiff > 0 ? '+' : ''}
                    {r.pointDiff}
                  </Td>
                  <Td num mono className="font-semibold text-ink">{r.matchPoints}</Td>
                  <Td>
                    {r.tieGroup !== null ? <Badge tone="warn">tie {r.tieGroup}</Badge> : null}
                    {r.tieGroup === null && filled ? <Badge tone="warn">fill</Badge> : null}
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </TableWrap>

      {hasTie ? (
        <p className="px-3 pb-3 pt-2.5 text-xs text-ink-faint">
          Players level on group points were separated by <strong className="font-semibold">{ruleLabel(tieRule)}</strong>,
          then by games difference, point difference, points scored and seed.
        </p>
      ) : null}
    </>
  )
}
