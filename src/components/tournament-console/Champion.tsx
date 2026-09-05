'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import {
  ActionBar, Button, Card, CardBody, CardHead, Empty, Note, PageHead, Stat,
} from '@/components/tournament-console/ui'
import { cn } from '@/lib/utils'
import {
  allBracketMatches, fourthPlaceId, knockoutGameRules, runnerUpId, thirdPlaceId,
} from '@/lib/tournament/knockout'
import { TIE_BREAK_RULES } from '@/lib/tournament/standings'
import { useActiveTournament } from '@/lib/matches-store'
import { buildRatingMatchInputs, usePlayerRatings, type RatingChangeEntry } from '@/lib/player-ratings'

export default function Champion() {
  const {
    tournament, isDoubles, activeCategory, players, playerById, seedOf, pools, poolMatches, bracket,
    standingsByPool, champion, published, actions,
  } = useActiveTournament()
  const ratings = usePlayerRatings()

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
  const koEarly = knockoutGameRules(tournament, 8) // quarter-finals and earlier
  const koLate = knockoutGameRules(tournament, 4) // semi-finals, final, third place
  const koRulesDiffer =
    koEarly.bestOf !== koLate.bestOf || koEarly.pointsToWin !== koLate.pointsToWin
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

  // Singles ids resolve straight through the ratings store, so the podium
  // shows the just-applied rating rather than the value cached in the draw
  // when the players were first loaded. Doubles team ids aren't individual
  // players, so those keep the draw's own rating.
  const displayRating = (id: string | null | undefined) => {
    if (!id) return undefined
    return isDoubles ? playerById.get(id)?.rating : ratings.getRating(id)
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

  // Rating changes already applied for this exact tournament + category —
  // read straight from the ratings store, so this survives a page reload and
  // doesn't depend on the toast shown at the moment of publishing.
  const ratingChanges: { player: (typeof players)[number]; entry: RatingChangeEntry }[] = isDoubles
    ? []
    : players
        .map((p) => {
          const entry = ratings
            .getHistory(p.id)
            .find((h) => h.tournamentId === tournament.id && h.categoryId === activeCategory.id)
          return entry ? { player: p, entry } : null
        })
        .filter((row): row is { player: (typeof players)[number]; entry: RatingChangeEntry } => row !== null)
        .sort((a, b) => b.entry.delta - a.entry.delta)

  const publish = () => {
    const place = (id: string | null | undefined) => {
      if (!id) return undefined
      const p = playerById.get(id)
      const s = seedOf(id)
      return {
        playerId: id,
        name: p?.name ?? '—',
        seed: typeof s === 'number' ? s : undefined,
        rating: displayRating(id),
        club: p?.club || undefined,
      }
    }

    actions.publishResults({
      champion: result.championId ?? undefined,
      runnerUp: result.runnerUpId ?? undefined,
      categoryName: activeCategory.name,
      publishedAt: new Date().toISOString(),
      podium: {
        champion: place(result.championId),
        runnerUp: place(result.runnerUpId),
        // A third place is only real when the play-off (or league table) actually
        // produced one — `result.thirdId` is null otherwise.
        third: place(result.thirdId),
        fourth: place(result.fourthId),
      },
      stats: {
        players: players.length,
        matchesPlayed: totalPlayed,
        format:
          rrOnly ? 'Round robin' : tournament.format === 'ko_only' ? 'Direct knockout' : 'Group & knockout',
      },
    })

    // Doubles has no defined rating impact yet — only singles categories feed
    // the rating algorithm.
    if (!isDoubles) {
      const matches = buildRatingMatchInputs(poolMatches, bracket)
      const outcome = ratings.applyTournamentResults({
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        categoryId: activeCategory.id,
        categoryName: activeCategory.name,
        date: tournament.date,
        players: players.map((p) => ({ id: p.id, name: p.name })),
        matches,
      })
      if (outcome.applied) {
        toast.success(
          outcome.changes.length > 0
            ? `Ratings updated for ${outcome.changes.length} player${outcome.changes.length === 1 ? '' : 's'}.`
            : 'Results published — no rating changes this time.',
        )
      }
    }

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
            Seed {seedOf(result.championId ?? '')} · Rating {displayRating(result.championId)}
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
              ? `Seed ${seedOf(result.runnerUpId)} · Rating ${displayRating(result.runnerUpId)}`
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
              {!rrOnly && !koRulesDiffer ? (
                <Row
                  k="Knockout games"
                  v={`best of ${koEarly.bestOf}, first to ${koEarly.pointsToWin}, ${winBy('ko')}`}
                />
              ) : null}
              {!rrOnly && koRulesDiffer ? (
                <>
                  <Row
                    k="Knockout — QF & earlier"
                    v={`best of ${koEarly.bestOf}, first to ${koEarly.pointsToWin}, ${winBy('ko')}`}
                  />
                  <Row
                    k="Knockout — semis & final"
                    v={`best of ${koLate.bestOf}, first to ${koLate.pointsToWin}, ${winBy('ko')}`}
                  />
                </>
              ) : null}
            </dl>
          </div>
        </CardBody>
      </Card>

      {isPublished ? (
        isDoubles ? (
          <Note tone="neutral" className="mt-4">
            Doubles categories don&apos;t feed the rating algorithm yet — only singles results update ratings.
          </Note>
        ) : (
          <Card className="mt-4">
            <CardHead
              title="Rating changes"
              desc={
                ratingChanges.length > 0
                  ? `${ratingChanges.length} player${ratingChanges.length === 1 ? '' : 's'} rated from this tournament`
                  : 'No player finished with a different rating this time'
              }
            />
            {ratingChanges.length > 0 ? (
              <CardBody className="flex flex-col gap-1.5">
                {ratingChanges.map(({ player, entry }) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 rounded-[10px] border border-line-soft bg-panel px-3 py-2 text-[13px]"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">{player.name}</span>
                    <span className="tabular text-ink-faint">{entry.previousRating}</span>
                    <span className="text-ink-faint">→</span>
                    <span className="tabular font-semibold text-ink">{entry.newRating}</span>
                    <span
                      className={cn(
                        'tabular w-14 shrink-0 text-right font-semibold',
                        entry.delta > 0 ? 'text-good' : entry.delta < 0 ? 'text-bad' : 'text-ink-faint',
                      )}
                    >
                      {entry.delta > 0 ? '+' : ''}
                      {entry.delta}
                    </span>
                  </div>
                ))}
              </CardBody>
            ) : null}
          </Card>
        )
      ) : null}

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
