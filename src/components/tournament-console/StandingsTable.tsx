'use client'

import React, { useState } from 'react'

import { Badge, Button, Competitor, RankPill, Table, TableWrap, Td, Th } from '@/components/tournament-console/ui'
import { cn } from '@/lib/utils'
import { ruleLabel } from '@/lib/tournament/standings'
import type { Player, RankedRow, TieBreakRule } from '@/lib/tournament/types'

/**
 * Live pool table. Rows that currently advance are shaded, so the effect of
 * changing the tie-break rule is visible immediately.
 *
 * Pass `onReorder` to let the organizer drag rows into any order by hand — the
 * new order is reported as a player-id list and everything downstream
 * (qualification, bracket seeding) re-derives from it.
 */
export default function StandingsTable({
  rows,
  playerById,
  seedOf,
  advancePerPool = 1,
  tieRule,
  tieOrder,
  fillIds,
  doubles = false,
  onReorder,
  manuallyOrdered = false,
  onResetOrder,
}: {
  rows: RankedRow[]
  playerById: Map<string, Player>
  seedOf: (id: string) => number | string
  advancePerPool?: number
  /** Primary tie-break — used when `tieOrder` isn't supplied. */
  tieRule: TieBreakRule
  /** Full host-set priority order; when present it's shown in the footnote. */
  tieOrder?: readonly TieBreakRule[]
  fillIds?: Set<string>
  doubles?: boolean
  onReorder?: (playerIds: string[]) => void
  manuallyOrdered?: boolean
  onResetOrder?: () => void
}) {
  const hasTie = rows.some((r) => r.tieGroup !== null)
  const draggable = Boolean(onReorder)

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const commitReorder = (from: number, to: number) => {
    if (!onReorder || from === to || from < 0 || to < 0) return
    const ids = rows.map((r) => r.playerId)
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)
    onReorder(ids)
  }

  return (
    <>
      {draggable ? (
        <div className="flex flex-wrap items-center gap-2 px-3 pb-2 pt-2.5 text-[11.5px] text-ink-faint">
          <span>Drag a row to set the finishing order by hand — qualification updates with it.</span>
          {manuallyOrdered ? (
            <>
              <Badge tone="warn">manual order</Badge>
              {onResetOrder ? (
                <Button size="xs" variant="ghost" onClick={onResetOrder}>
                  Reset to computed
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      <TableWrap>
        <Table>
          <thead>
            <tr>
              {draggable ? <Th className="w-8" /> : null}
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
            {rows.map((r, index) => {
              const qualifies = r.rank <= advancePerPool
              const filled = Boolean(fillIds?.has(r.playerId)) && !qualifies
              return (
                <tr
                  key={r.playerId}
                  draggable={draggable}
                  onDragStart={draggable ? () => setDragIndex(index) : undefined}
                  onDragEnter={draggable ? () => setDropIndex(index) : undefined}
                  onDragOver={draggable ? (e) => e.preventDefault() : undefined}
                  onDragEnd={
                    draggable
                      ? () => {
                          setDragIndex(null)
                          setDropIndex(null)
                        }
                      : undefined
                  }
                  onDrop={
                    draggable
                      ? (e) => {
                          e.preventDefault()
                          if (dragIndex !== null) commitReorder(dragIndex, index)
                          setDragIndex(null)
                          setDropIndex(null)
                        }
                      : undefined
                  }
                  className={cn(
                    'transition-colors hover:bg-subtle',
                    qualifies && 'bg-linear-to-r from-good-soft to-transparent to-40%',
                    filled && 'bg-linear-to-r from-warn-soft to-transparent to-40%',
                    draggable && 'cursor-grab',
                    dragIndex === index && 'opacity-40',
                    dropIndex === index &&
                      dragIndex !== null &&
                      dragIndex !== index &&
                      'ring-2 ring-inset ring-focus',
                  )}
                >
                  {draggable ? (
                    <Td className="select-none text-center text-ink-faint" title="Drag to reorder">
                      ⠿
                    </Td>
                  ) : null}
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
          Players level on group points were separated by{' '}
          <strong className="font-semibold">
            {(tieOrder && tieOrder.length ? [...tieOrder] : [tieRule]).map(ruleLabel).join(' → ')}
          </strong>
          , then by games difference, point difference, points scored and seed.
        </p>
      ) : null}
    </>
  )
}
