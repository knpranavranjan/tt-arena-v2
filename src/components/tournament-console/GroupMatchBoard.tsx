'use client'

import { useState } from 'react'

import ScoreEditor from '@/components/tournament-console/ScoreEditor'
import StandingsTable from '@/components/tournament-console/StandingsTable'
import { Button, Card, CardBody, Competitor } from '@/components/tournament-console/ui'
import { cn } from '@/lib/utils'
import { POOLS_STAGE } from '@/lib/tournament/bracketMath'
import { formatGames } from '@/lib/tournament/scoring'
import type { PoolMatch } from '@/lib/tournament/types'
import { useActiveTournament } from '@/lib/matches-store'

/**
 * The group-stage board: pick a group, see its round-robin fixtures as
 * "Match N" cards, and enter each score with the two-step check → confirm flow.
 * Standings live in a collapsible section so the match grid stays clean.
 */
export default function GroupMatchBoard() {
  const {
    tournament, isDoubles, pools, poolMatches, playerById, seedOf, standingsByPool, qualification,
    manualStandingsOrder, releasedStages, actions,
  } = useActiveTournament()
  const [poolId, setPoolId] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [showStandings, setShowStandings] = useState(false)

  if (!pools || poolMatches.length === 0) return null

  const activePool = pools.find((p) => p.id === poolId) ?? pools[0]
  const matches = poolMatches.filter((m) => m.poolId === activePool.id)
  const rows = standingsByPool.get(activePool.id) ?? []
  const totalDone = poolMatches.filter((m) => m.played).length

  const name = (id: string | null | undefined) => playerById.get(id ?? '')?.name ?? '—'
  const gamesWon = (m: PoolMatch, side: 'a' | 'b') =>
    m.games.reduce((n, [x, y]) => n + ((side === 'a' ? x > y : y > x) ? 1 : 0), 0)
  const winRule = tournament.groupWinBy === 'golden' ? 'golden point' : 'win by 2'
  const fillIds = new Set((qualification?.promoted ?? []).map((q) => q.playerId))
  const poolsPublished = releasedStages.includes(POOLS_STAGE)

  return (
    <div className="flex flex-col gap-4">
      {/* rule strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-faint">
        <span>Best of {tournament.groupBestOf ?? tournament.bestOf}</span>
        <span>·</span>
        <span>
          first to {tournament.groupPointsToWin ?? 11}, {winRule}
        </span>
        <span>·</span>
        <span className="tabular">
          {totalDone}/{poolMatches.length} matches entered
        </span>
        <button
          type="button"
          onClick={() => actions.goto('pools')}
          className="text-brand-text transition hover:underline"
        >
          Edit rules
        </button>
      </div>

      {/* publish the pool schedule to registered players' Match Centre */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-line bg-panel px-3.5 py-2.5">
        <span className="text-[12px] text-ink-muted">
          {poolsPublished
            ? 'Pool schedule is live in players’ Match Centre — scores update as you enter them.'
            : 'Publish the pool fixtures and live standings to registered players.'}
        </span>
        {poolsPublished ? (
          <Button size="xs" variant="ghost" onClick={() => actions.unpublishStage(POOLS_STAGE)}>
            Unpublish
          </Button>
        ) : (
          <Button size="xs" variant="primary" onClick={() => actions.publishStage(POOLS_STAGE)}>
            Publish pool schedule
          </Button>
        )}
      </div>

      {/* group pills */}
      {pools.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {pools.map((pool) => {
            const pd = poolMatches.filter((m) => m.poolId === pool.id)
            const pdone = pd.filter((m) => m.played).length
            const active = pool.id === activePool.id
            return (
              <button
                key={pool.id}
                type="button"
                onClick={() => {
                  setPoolId(pool.id)
                  setEditing(null)
                }}
                className={cn(
                  'rounded-full px-4 py-1.5 text-[13px] font-medium transition',
                  active
                    ? 'bg-brand text-white'
                    : 'border border-line text-ink-muted hover:border-ink-faint hover:text-ink',
                )}
              >
                {pool.name}
                <span className={cn('tabular ml-1.5 text-[11px]', active ? 'text-white/70' : 'text-ink-faint')}>
                  {pdone}/{pd.length}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      {/* match grid */}
      {matches.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-ink-faint">This group needs at least 2 players.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map((m, i) => {
            const isEd = editing === m.id
            return (
              <div key={m.id} className={cn('flex flex-col gap-1.5', isEd && 'sm:col-span-2 xl:col-span-3')}>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold">Match {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => setEditing(isEd ? null : m.id)}
                    className="flex items-center gap-1 text-[12px] text-brand-text transition hover:underline"
                  >
                    <span aria-hidden>✎</span>
                    {isEd ? 'Close' : m.played ? 'Edit score' : 'Enter score'}
                  </button>
                </div>

                <div className="overflow-hidden rounded-[12px] border border-line bg-panel">
                  {(['a', 'b'] as const).map((side) => {
                    const id = side === 'a' ? m.aId : m.bId
                    const isWinner = m.played && m.winnerId === id
                    return (
                      <div
                        key={side}
                        className={cn(
                          'flex items-center gap-2.5 px-3 text-[13px]',
                          isDoubles ? 'py-2' : 'py-2.5',
                          side === 'a' && 'border-b border-line-soft',
                          isWinner ? 'font-semibold text-ink' : 'text-ink-muted',
                        )}
                      >
                        <Competitor
                          player={playerById.get(id ?? '') ?? { name: name(id) }}
                          size={isDoubles ? 20 : 24}
                          stacked={isDoubles}
                          className="flex-1"
                        />
                        <span className={cn('tabular shrink-0', isWinner ? 'text-ink' : 'text-ink-faint')}>
                          {m.played ? gamesWon(m, side) : '–'}
                        </span>
                      </div>
                    )
                  })}

                  {m.played && !isEd ? (
                    <div className="flex items-center gap-2 border-t border-line-soft px-3 py-1.5 font-mono text-[11px] text-ink-faint">
                      {formatGames(m.games)}
                      <button
                        type="button"
                        onClick={() => actions.clearPoolResult(m.id)}
                        className="ml-auto text-bad transition hover:underline"
                      >
                        clear
                      </button>
                    </div>
                  ) : null}

                  {isEd ? (
                    <div className="border-t border-line-soft p-3">
                      <div className="max-w-[440px]">
                        <ScoreEditor
                          match={m}
                          playerById={playerById}
                          bestOf={tournament.groupBestOf ?? tournament.bestOf}
                          pointsToWin={tournament.groupPointsToWin}
                          winBy={tournament.groupWinBy}
                          advanceHint={`the ${activePool.name} standings update.`}
                          onCancel={() => setEditing(null)}
                          onSave={(result) => {
                            actions.setPoolResult(m.id, result)
                            setEditing(null)
                          }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* collapsible standings */}
      <div>
        <button
          type="button"
          onClick={() => setShowStandings((v) => !v)}
          className="text-[13px] font-medium text-ink-muted transition hover:text-ink"
        >
          {showStandings ? '▾' : '▸'} {activePool.name} standings
        </button>
        {showStandings ? (
          <Card className="mt-2">
            <StandingsTable
              rows={rows}
              playerById={playerById}
              seedOf={seedOf}
              doubles={isDoubles}
              advancePerPool={qualification?.advancePerPool ?? tournament.advancePerPool ?? 1}
              tieRule={tournament.tieBreakRule}
              fillIds={fillIds}
              onReorder={(ids) => actions.reorderStanding(activePool.id, ids)}
              manuallyOrdered={Boolean(manualStandingsOrder?.[activePool.id])}
              onResetOrder={() => actions.resetStandingsOrder(activePool.id)}
            />
          </Card>
        ) : null}
      </div>
    </div>
  )
}
