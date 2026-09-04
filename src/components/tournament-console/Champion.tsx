'use client'

import { useState } from 'react'

import {
  ActionBar, Button, Card, CardBody, CardHead, Empty, Note, PageHead, Stat,
} from '@/components/tournament-console/ui'
import { cn } from '@/lib/utils'
import { allBracketMatches, fourthPlaceId, runnerUpId, thirdPlaceId } from '@/lib/tournament/knockout'
import { TIE_BREAK_RULES } from '@/lib/tournament/standings'
import { useActiveTournament } from '@/lib/matches-store'

export default function Champion() {
  const {
    tournament, isDoubles, activeCategory, players, playerById, seedOf, pools, poolMatches, bracket,
    standingsByPool, champion, published, actions,
  } = useActiveTournament()

  const [confirming, setConfirming] = useState(false)
  const rrOnly = tournament.format === 'rr_only'
  const isPublished = Boolean(published?.champion)

  const result = (() => {
    if (!champion) return null
    if (rrOnly) {
      const rows = pools?.length ? (standingsByPool.get(pools[0].id) ?? []) : []
      return {
        championId: rows[0]?.playerId ?? null,
        runnerUpId: rows[1]?.playerId ?? null,
        thirdId: rows[2]?.playerId ?? null,
        fourthId: rows[3]?.playerId ?? null,
      }
    }
    if (!bracket) return null
    return {
      championId: champion,
      runnerUpId: runnerUpId(bracket),
      thirdId: thirdPlaceId(bracket),
      fourthId: fourthPlaceId(bracket),
    }
  })()

  const poolPlayed = poolMatches.filter((m) => m.played).length
  const koPlayed = bracket ? allBracketMatches(bracket).filter((m) => m.played && !m.isBye).length : 0
  const totalPlayed = poolPlayed + koPlayed

  const winBy = (r: 'group' | 'ko') =>
    (r === 'group' ? tournament.groupWinBy : tournament.koWinBy) === 'golden' ? 'golden point' : 'win by 2'
  const gp = tournament.groupPoints ?? { win: 2, draw: 1, loss: 1 }
  const tieBreak = TIE_BREAK_RULES.find((t) => t.value === tournament.tieBreakRule)?.label ?? '—'

  if (!champion || !result) {
    return (
      <Card>
        <Empty title="No champion yet">
          {rrOnly ? 'Complete every league fixture to decide the table winner.' : 'Complete the final to declare a champion.'}
        </Empty>
      </Card>
    )
  }

  const placeName = (id: string | null | undefined) => {
    const p = id ? playerById.get(id) : undefined
    if (!p) return '—'
    if (isDoubles && p.members && p.members.length > 1) {
      return (
        <span className="flex flex-col items-center leading-tight">
          {p.members.map((m) => (
            <span key={m.id}>{m.name}</span>
          ))}
        </span>
      )
    }
    return p.name
  }

  const publish = () => {
    actions.publishResults({
      champion: result.championId ?? undefined,
      runnerUp: result.runnerUpId ?? undefined,
    })
    setConfirming(false)
  }

  return (
    <>
      <PageHead
        eyebrow="Results"
        title="Champion"
        sub={`${tournament.name} · ${activeCategory.name} · ${tournament.date}${tournament.location ? ` · ${tournament.location}` : ''}`}
      >
        {isPublished ? (
          <Button variant="primary" disabled>
            Results published ✓
          </Button>
        ) : confirming ? (
          <>
            <Button variant="primary" onClick={publish}>
              Confirm &amp; publish
            </Button>
            <Button onClick={() => setConfirming(false)}>Cancel</Button>
          </>
        ) : (
          <Button variant="primary" onClick={() => setConfirming(true)}>
            Publish results
          </Button>
        )}
      </PageHead>

      {confirming ? (
        <Note tone="warn">
          Publishing locks in the final placings and marks this tournament <strong className="font-semibold">completed</strong>.
          Confirm to go ahead.
        </Note>
      ) : null}

      <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <div className="rounded-2xl border border-gold/40 bg-linear-to-b from-gold-soft to-panel to-70% p-6 text-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-gold">🏆 Champion</div>
          <div className={cn('mt-2 font-semibold tracking-[-0.02em]', isDoubles ? 'text-lg' : 'text-2xl')}>
            {placeName(result.championId)}
          </div>
          <div className="mt-1 text-[12.5px] text-ink-faint">
            Seed {seedOf(result.championId ?? '')} · Rating {playerById.get(result.championId ?? '')?.rating}
            {playerById.get(result.championId ?? '')?.club ? ` · ${playerById.get(result.championId ?? '')?.club}` : ''}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-linear-to-b from-subtle to-panel to-70% p-6 text-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">🥈 Runner-up</div>
          <div className={cn('mt-2 font-semibold tracking-[-0.02em]', isDoubles ? 'text-base' : 'text-xl')}>
            {placeName(result.runnerUpId)}
          </div>
          <div className="mt-1 text-[12.5px] text-ink-faint">
            {result.runnerUpId
              ? `Seed ${seedOf(result.runnerUpId)} · Rating ${playerById.get(result.runnerUpId)?.rating}`
              : ''}
          </div>
        </div>

        {result.thirdId ? (
          <div className="rounded-2xl border border-line bg-panel p-6 text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">🥉 Third place</div>
            <div className={cn('mt-2 font-semibold tracking-[-0.02em]', isDoubles ? 'text-base' : 'text-xl')}>
              {placeName(result.thirdId)}
            </div>
            <div className="mt-1 text-[12.5px] text-ink-faint">
              Seed {seedOf(result.thirdId)}
              {result.fourthId ? ` · 4th ${playerById.get(result.fourthId)?.name}` : ''}
            </div>
          </div>
        ) : null}
      </div>

      <Card className="mt-4">
        <CardHead title="Tournament summary" />
        <CardBody className="flex flex-col gap-5">
          <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
            <Stat k={isDoubles ? 'Pairs' : 'Players'} v={players.length} />
            <Stat
              k="Matches played"
              v={totalPlayed}
              h={rrOnly ? 'round robin' : `${poolPlayed} group · ${koPlayed} knockout`}
            />
            <Stat
              k="Groups"
              v={pools?.length ?? 1}
              h={pools ? pools.map((p) => p.playerIds.length).join(' / ') : '—'}
            />
          </div>

          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-faint">Match rules</div>
            <dl className="grid gap-x-8 gap-y-1.5 text-[12.5px] sm:grid-cols-2">
              <Row k="Format" v={rrOnly ? 'Round robin' : tournament.format === 'ko_only' ? 'Direct knockout' : 'Group & knockout'} />
              {!rrOnly ? (
                <Row
                  k="Qualifiers per group"
                  v={tournament.format === 'ko_only' ? 'n/a' : String(tournament.advancePerPool ?? 2)}
                />
              ) : null}
              {tournament.format !== 'ko_only' ? (
                <>
                  <Row
                    k="Group games"
                    v={`best of ${tournament.groupBestOf ?? tournament.bestOf}, first to ${tournament.groupPointsToWin ?? 11}, ${winBy('group')}`}
                  />
                  <Row k="Group points (W / D / L)" v={`${gp.win} / ${gp.draw} / ${gp.loss}`} />
                  <Row k="Tie-break" v={tieBreak} />
                </>
              ) : null}
              {!rrOnly ? (
                <Row
                  k="Knockout games"
                  v={`best of ${tournament.koBestOf ?? tournament.bestOf}, first to ${tournament.koPointsToWin ?? 11}, ${winBy('ko')}`}
                />
              ) : null}
            </dl>
          </div>
        </CardBody>
      </Card>

      <ActionBar>
        <Note tone={isPublished ? 'good' : 'neutral'} className="flex-1">
          {players.length} {isDoubles ? 'pairs' : 'players'} →{' '}
          {pools ? `${pools.length} group${pools.length === 1 ? '' : 's'}` : 'direct entry'} →{' '}
          {totalPlayed} matches → champion.
          {isPublished ? ' Results are published — this tournament is marked completed.' : ''}
        </Note>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button onClick={() => actions.goto(rrOnly ? 'matches' : 'knockout')}>← Back</Button>
        </div>
      </ActionBar>
    </>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line-soft py-1 last:border-0">
      <dt className="text-ink-faint">{k}</dt>
      <dd className="text-right text-ink">{v}</dd>
    </div>
  )
}
