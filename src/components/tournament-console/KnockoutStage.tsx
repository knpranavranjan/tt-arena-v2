'use client'

/*
 * Ported from the tt-tournament prototype. `Slot` / `MatchCard` are defined
 * inside the component on purpose — they close over the live bracket, the
 * editing state and the store actions. They are render helpers, not remounted
 * component boundaries, so the static-components lint does not apply here.
 */
/* eslint-disable react-hooks/static-components */

import React, { useMemo, useState } from 'react'

import ScoreEditor from '@/components/tournament-console/ScoreEditor'
import {
  ActionBar, Badge, Button, Card, CardBody, CardFoot, CardHead, Checkbox, Competitor, Empty,
  PageHead, Progress, SeedPill,
} from '@/components/tournament-console/ui'
import { cn } from '@/lib/utils'
import { log2, roundName, THIRD_PLACE_STAGE } from '@/lib/tournament/bracketMath'
import {
  bracketProgress, championId, findBracketMatch, fourthPlaceId, knockoutGameRules, runnerUpId,
  thirdPlaceId,
} from '@/lib/tournament/knockout'
import { formatGames, gameTally } from '@/lib/tournament/scoring'
import type { KnockoutMatch } from '@/lib/tournament/types'
import { useActiveTournament } from '@/lib/matches-store'

export default function KnockoutStage() {
  const {
    tournament, isDoubles, qualification, playerById, seedOf, bracket, poolsComplete, poolMatches,
    manualQualifierIds, qualifierOrder, releasedStages, actions,
  } = useActiveTournament()

  const StagePublishToggle = ({ stageKey }: { stageKey: string }) => {
    const live = releasedStages.includes(stageKey)
    return (
      <button
        type="button"
        onClick={() => (live ? actions.unpublishStage(stageKey) : actions.publishStage(stageKey))}
        className={cn(
          'mx-auto mt-1 block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] transition',
          live
            ? 'bg-good-soft text-good hover:bg-good/20'
            : 'border border-line text-ink-faint hover:border-ink-faint hover:text-ink',
        )}
        title={live ? 'Published to players — click to hide' : 'Publish this round to registered players'}
      >
        {live ? '● live' : 'publish'}
      </button>
    )
  }
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showQualifiers, setShowQualifiers] = useState(!bracket)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const qualifiers = qualification?.qualifiers ?? []
  const qualifiedIds = useMemo(() => qualifiers.map((q) => q.playerId), [qualifiers])
  const qualifiedSet = useMemo(() => new Set(qualifiedIds), [qualifiedIds])

  /** Everyone who finished a pool but is not currently in the draw. */
  const notQualified = useMemo(
    () => (qualification?.allEntries ?? []).filter((e) => !qualifiedSet.has(e.playerId)),
    [qualification, qualifiedSet],
  )

  const locked = Boolean(bracket)

  const addQualifier = (playerId: string) => actions.setManualQualifiers([...qualifiedIds, playerId])
  const removeQualifier = (playerId: string) =>
    actions.setManualQualifiers(qualifiedIds.filter((id) => id !== playerId))

  /** Commit a drag as an explicit seeding order. */
  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return
    const next = [...qualifiedIds]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    actions.setQualifierOrder(next)
  }

  const groupsPlayed = poolMatches.filter((m) => m.played).length
  const fromPools = tournament.format !== 'ko_only'
  const overridden = manualQualifierIds !== null || qualifierOrder !== null

  const progress = bracket ? bracketProgress(bracket) : null
  const champ = bracket ? championId(bracket) : null
  const runnerUp = bracket ? runnerUpId(bracket) : null
  const third = bracket ? thirdPlaceId(bracket) : null
  const fourth = bracket ? fourthPlaceId(bracket) : null
  const editingMatch = bracket && editingId ? findBracketMatch(bracket, editingId) : undefined
  const name = (id: string | null | undefined) => (id ? (playerById.get(id)?.name ?? '—') : '—')

  /* ---------------------------------------------------------- bracket UI */

  function Slot({ match, side, isFinal }: { match: KnockoutMatch; side: 'a' | 'b'; isFinal?: boolean }) {
    const id = side === 'a' ? match.aId : match.bId
    const other = side === 'a' ? match.bId : match.aId
    const isWinner = match.played && match.winnerId === id
    const isLoser = match.played && !match.isBye && Boolean(id) && match.winnerId !== id
    const gamesWon = match.games.filter(([x, y]) => (side === 'a' ? x > y : y > x)).length

    if (!id) {
      return (
        <div className="flex items-center gap-2 border-b border-line-soft px-2.5 py-1.5 text-[12.5px] italic text-ink-faint last:border-b-0">
          <span className="min-w-0 flex-1 truncate">{match.round === 0 && other ? 'Bye' : 'TBD'}</span>
        </div>
      )
    }

    return (
      <div
        title={match.isBye ? 'Advanced on a bye' : undefined}
        className={cn(
          'flex items-center gap-2 border-b border-line-soft px-2.5 py-1.5 text-[12.5px] last:border-b-0',
          isWinner && isFinal
            ? 'bg-gold-soft font-semibold ring-1 ring-inset ring-gold/30'
            : isWinner
              ? 'bg-good-soft font-semibold'
              : undefined,
        )}
      >
        <SeedPill seed={seedOf(id)} />
        {isDoubles ? (
          <Competitor player={playerById.get(id)} size={16} className="flex-1" />
        ) : (
          <span className="min-w-0 flex-1 truncate">{name(id)}</span>
        )}
        {isFinal && isWinner ? <Badge tone="gold">champion</Badge> : null}
        {isFinal && isLoser ? <Badge tone="neutral">runner-up</Badge> : null}
        {match.played && !match.isBye ? <span className="tabular text-[11.5px] text-ink-muted">{gamesWon}</span> : null}
      </div>
    )
  }

  function MatchCard({ match, isFinal }: { match: KnockoutMatch; isFinal?: boolean }) {
    const ready = Boolean(match.aId && match.bId) && !match.played
    return (
      <div
        className={cn(
          'overflow-hidden rounded-[10px] border bg-panel shadow-[0_1px_2px_rgba(16,20,26,0.04)]',
          match.isBye
            ? 'border-dashed border-line opacity-75'
            : isFinal && match.played
              ? 'border-gold/40'
              : ready
                ? 'border-ink-faint'
                : 'border-line',
        )}
      >
        <Slot match={match} side="a" isFinal={isFinal} />
        <Slot match={match} side="b" isFinal={isFinal} />
        <div className="flex items-center gap-1.5 border-t border-line-soft bg-subtle px-2 py-1 text-[11px] text-ink-faint">
          {match.isBye ? (
            <span>Bye</span>
          ) : match.played ? (
            <span className="truncate font-mono">
              {gameTally(match.games)} · {formatGames(match.games)}
            </span>
          ) : match.aId && match.bId ? (
            <span>Ready</span>
          ) : (
            <span>Waiting</span>
          )}

          {match.aId && match.bId && !match.isBye ? (
            <div className="ml-auto flex gap-1">
              <Button size="xs" variant="ghost" onClick={() => setEditingId(editingId === match.id ? null : match.id)}>
                {match.played ? 'Edit' : 'Enter score'}
              </Button>
              {match.played ? (
                <Button size="xs" variant="ghost" className="text-bad" onClick={() => actions.clearKoResult(match.id)}>
                  ✕
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  // Only bail out when there is genuinely nobody to work with. If the organizer
  // has trimmed the draw too far, the editor must stay on screen so they can
  // add players back or reset to the algorithm.
  if (!qualification || qualification.allEntries.length < 2) {
    return (
      <Card>
        <Empty title="Not enough qualifiers">Play the pool stage first, or add more players.</Empty>
      </Card>
    )
  }

  const tooFewQualifiers = qualifiers.length < 2

  return (
    <>
      <PageHead
        eyebrow="Step 4"
        title="Knockout Stage"
        sub={`${qualifiers.length} qualifiers seeded into a ${qualification.bracketSize}-slot bracket (${log2(
          qualification.bracketSize,
        )} rounds, ${qualification.byes} bye${qualification.byes === 1 ? '' : 's'}). Enter each match's score, check it, then confirm to advance the winner.`}
      >
        <Button onClick={() => setShowQualifiers((v) => !v)}>{showQualifiers ? 'Hide qualifiers' : 'Show qualifiers'}</Button>
        {bracket ? (
          <Button
            variant="danger"
            onClick={() => {
              actions.clearBracket()
              setEditingId(null)
            }}
          >
            Reset bracket
          </Button>
        ) : null}
      </PageHead>

      {showQualifiers ? (
        <Card>
          <CardHead
            title="Qualifiers"
            desc="Built from the group results. Drag anyone to any seed, or add / remove players to override the algorithm."
          >
            <Badge tone={qualifiers.length === qualification.bracketSize ? 'good' : 'warn'}>
              {qualifiers.length} of {qualification.bracketSize} slots
            </Badge>
            <Button size="sm" onClick={() => actions.setManualQualifiers(null)}>
              Reset to algorithm
            </Button>
          </CardHead>

          <CardBody>
            {fromPools && !poolsComplete ? (
              <p className="mb-3.5 rounded-[10px] border border-warn/25 bg-warn-soft px-3.5 py-2.5 text-[12.5px] text-warn">
                Group stage: {groupsPlayed} of {poolMatches.length} matches entered — this list is provisional and
                re-derives from the standings as more results come in.
              </p>
            ) : null}
            {locked ? (
              <p className="mb-3.5 rounded-[10px] border border-line-soft bg-subtle px-3.5 py-2.5 text-[12.5px] text-ink-muted">
                A bracket is already built. Reordering or editing here doesn&apos;t touch it — hit{' '}
                <strong className="font-semibold">Rebuild bracket from this list</strong> below to apply your changes
                (this restarts the knockout).
              </p>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
              {/* ---------------------------------------- qualified, ordered */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-[13px] font-semibold">In the draw</h3>
                  <span className="text-[11.5px] text-ink-faint">seeding order — drag to change</span>
                  <Badge tone="good" className="ml-auto">
                    {qualifiers.length}
                  </Badge>
                </div>

                <ol className="flex flex-col gap-1.5">
                  {qualifiers.map((q, index) => {
                    const ord =
                      q.rankInPool === 1 ? 'st' : q.rankInPool === 2 ? 'nd' : q.rankInPool === 3 ? 'rd' : 'th'
                    return (
                      <li
                        key={q.playerId}
                        draggable
                        onDragStart={() => setDragIndex(index)}
                        onDragEnter={() => setDropIndex(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnd={() => {
                          setDragIndex(null)
                          setDropIndex(null)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          if (dragIndex !== null) reorder(dragIndex, index)
                          setDragIndex(null)
                          setDropIndex(null)
                        }}
                        className={cn(
                          'flex items-center gap-2 rounded-[10px] border border-line bg-panel px-2.5 py-2 text-[12.5px] transition',
                          'cursor-grab hover:border-ink-faint',
                          dragIndex === index && 'opacity-40',
                          dropIndex === index &&
                            dragIndex !== null &&
                            dragIndex !== index &&
                            'border-focus ring-2 ring-focus-soft',
                        )}
                      >
                        <span className="select-none text-ink-faint">⠿</span>
                        <span className="tabular w-6 shrink-0 text-[11.5px] font-semibold text-ink-faint">
                          {q.qualSeed}
                        </span>
                        <SeedPill seed={seedOf(q.playerId)} />
                        {isDoubles ? (
                          <Competitor
                            player={playerById.get(q.playerId)}
                            size={16}
                            className="flex-1"
                            nameClassName="font-medium"
                          />
                        ) : (
                          <span className="min-w-0 flex-1 truncate font-medium">{name(q.playerId)}</span>
                        )}
                        <span className="tabular shrink-0 text-[11.5px] text-ink-faint">
                          {q.poolName}
                          {q.row ? ` · ${q.rankInPool}${ord} · ${q.row.won}-${q.row.lost}` : ''}
                        </span>
                        {q.viaFill ? <Badge tone="warn">fill</Badge> : null}
                        {q.manual ? <Badge tone="outline">added</Badge> : null}
                        <Button
                          size="xs"
                          variant="ghost"
                          title="Remove from the draw"
                          className="text-bad"
                          onClick={() => removeQualifier(q.playerId)}
                        >
                          ✕
                        </Button>
                      </li>
                    )
                  })}
                </ol>
              </div>

              {/* --------------------------------------------- not qualified */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-[13px] font-semibold">Not in the draw</h3>
                  <span className="text-[11.5px] text-ink-faint">group W–L · point diff — add to seed them in</span>
                  <Badge tone="outline" className="ml-auto">
                    {notQualified.length}
                  </Badge>
                </div>

                {notQualified.length === 0 ? (
                  <p className="rounded-[10px] border border-line-soft bg-subtle px-3.5 py-2.5 text-[12.5px] text-ink-faint">
                    Every player who finished a pool is already in the draw.
                  </p>
                ) : (
                  <ul className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-1">
                    {notQualified.map((e) => (
                      <li
                        key={e.playerId}
                        className="flex items-center gap-2 rounded-[10px] border border-line-soft bg-canvas px-2.5 py-2 text-[12.5px]"
                      >
                        <SeedPill seed={seedOf(e.playerId)} />
                        {isDoubles ? (
                          <Competitor
                            player={playerById.get(e.playerId)}
                            size={16}
                            className="flex-1"
                            nameClassName="text-ink-muted"
                          />
                        ) : (
                          <span className="min-w-0 flex-1 truncate text-ink-muted">{name(e.playerId)}</span>
                        )}
                        <span className="tabular shrink-0 text-[11.5px] text-ink-faint">
                          {e.poolName} · {e.row ? `${e.row.won}–${e.row.lost}` : '—'} ·{' '}
                          {e.row ? `${e.row.pointDiff > 0 ? '+' : ''}${e.row.pointDiff}` : '—'}
                        </span>
                        <Button size="xs" onClick={() => addQualifier(e.playerId)}>
                          Add
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardBody>

          <CardFoot>
            <div className="flex flex-wrap items-center gap-5">
              <Checkbox
                checked={tournament.separatePools}
                onChange={(v) => actions.updateTournament({ separatePools: v })}
                title="Keep same-pool players apart in round one"
              />
              <Checkbox
                checked={tournament.thirdPlace}
                onChange={(v) => actions.setThirdPlace(v)}
                title="Play a third-place match"
                hint="The two beaten semi-finalists decide third and fourth."
              />
            </div>
            <div className="ml-auto flex items-center gap-3">
              {tooFewQualifiers ? (
                <span className="text-[11.5px] text-bad">A bracket needs at least two players.</span>
              ) : null}
              <Button
                variant={!bracket || overridden ? 'primary' : 'default'}
                disabled={tooFewQualifiers}
                onClick={() => actions.generateBracket(qualifiers)}
              >
                {bracket ? 'Rebuild bracket from this list' : 'Generate bracket'}
              </Button>
            </div>
          </CardFoot>
        </Card>
      ) : null}

      {!bracket ? (
        <Card className="mt-4">
          <Empty title="Bracket not generated">
            Generate the bracket from the qualifier list above. Byes are inserted automatically for the top seeds when
            the field is not a power of two.
          </Empty>
        </Card>
      ) : (
        <>
          <Card className="mt-4">
            <CardBody className="px-5 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <strong className="tabular font-semibold">
                    {progress!.played} / {progress!.total}
                  </strong>
                  <span className="text-xs text-ink-faint">knockout matches played</span>
                  {progress!.byes > 0 ? <Badge tone="outline">{progress!.byes} byes</Badge> : null}
                </div>
                <Progress done={progress!.played} total={progress!.total} />
                {champ ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="gold">🏆 {name(champ)}</Badge>
                    <Badge tone="neutral">2nd {name(runnerUp)}</Badge>
                    {third ? <Badge tone="neutral">3rd {name(third)}</Badge> : null}
                  </div>
                ) : (
                  <Badge tone="outline">{progress!.total - progress!.played} remaining</Badge>
                )}
              </div>
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardHead title="Bracket" desc="Enter each match's score, check it, then confirm to advance the winner." />
            <CardBody>
              <div className="overflow-x-auto px-1 pb-4 pt-2">
                <div className="flex min-w-min items-stretch gap-6">
                  {bracket.rounds.map((round, i) => (
                    <div key={i} className="flex min-w-[216px] flex-col justify-around gap-3">
                      <div className="mb-1 border-b border-line-soft pb-2 text-center text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-faint">
                        {roundName(bracket.size / 2 ** i)}
                        <StagePublishToggle stageKey={roundName(bracket.size / 2 ** i)} />
                      </div>
                      {round.map((m) => (
                        <MatchCard key={m.id} match={m} isFinal={i === bracket.rounds.length - 1} />
                      ))}
                    </div>
                  ))}

                  {bracket.thirdPlace ? (
                    <div className="flex min-w-[216px] flex-col justify-center gap-3">
                      <div className="mb-1 border-b border-line-soft pb-2 text-center text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-faint">
                        Third Place
                        <StagePublishToggle stageKey={THIRD_PLACE_STAGE} />
                      </div>
                      <MatchCard match={bracket.thirdPlace} />
                      {!bracket.thirdPlace.aId || !bracket.thirdPlace.bId ? (
                        <p className="text-center text-[11px] text-ink-faint">Waiting on both semi-finals</p>
                      ) : null}
                    </div>
                  ) : null}

                  {champ ? (
                    <div className="flex min-w-[210px] flex-col justify-center gap-2.5">
                      <div className="mb-1 border-b border-line-soft pb-2 text-center text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-faint">
                        Final standings
                      </div>

                      <div className="rounded-2xl border border-gold/40 bg-linear-to-b from-gold-soft to-panel to-70% p-4 text-center">
                        <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-gold">🏆 Champion</div>
                        <div className="mt-1.5 text-lg font-semibold tracking-[-0.02em]">{name(champ)}</div>
                        <div className="mt-0.5 text-xs text-ink-faint">
                          Seed {seedOf(champ)} · {playerById.get(champ)?.rating}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-line bg-subtle p-3 text-center">
                        <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">Runner-up</div>
                        <div className="mt-1 text-[15px] font-semibold">{name(runnerUp)}</div>
                        {runnerUp ? <div className="text-xs text-ink-faint">Seed {seedOf(runnerUp)}</div> : null}
                      </div>

                      {third ? (
                        <div className="rounded-2xl border border-line bg-panel p-3 text-center">
                          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">Third place</div>
                          <div className="mt-1 text-[15px] font-semibold">{name(third)}</div>
                          {fourth ? <div className="text-xs text-ink-faint">4th {name(fourth)}</div> : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </CardBody>
          </Card>

          {editingMatch && editingMatch.aId && editingMatch.bId ? (
            (() => {
              const isThird = editingMatch.id === bracket.thirdPlace?.id
              const isFinalRound = editingMatch.round === bracket.rounds.length - 1
              const roundLabel = isThird ? 'Third Place' : roundName(bracket.size / 2 ** editingMatch.round)
              // Third place is contested by the beaten semi-finalists, so it uses
              // the semi-final / final rule set (remaining = 4).
              const remainingInRound = isThird ? 4 : bracket.size / 2 ** editingMatch.round
              const gameRules = knockoutGameRules(tournament, remainingInRound)
              const advanceHint = isThird
                ? 'this decides third place.'
                : isFinalRound
                  ? 'this decides the champion.'
                  : `the winner moves to the ${roundName(bracket.size / 2 ** (editingMatch.round + 1))}.`
              return (
                <Card className="mt-4">
                  <CardHead
                    title={`${roundLabel} — enter score`}
                    desc={`${name(editingMatch.aId)} vs ${name(editingMatch.bId)} · best of ${gameRules.bestOf}, first to ${gameRules.pointsToWin}`}
                  />
                  <CardBody className="max-w-[440px]">
                    <ScoreEditor
                      match={editingMatch}
                      playerById={playerById}
                      bestOf={gameRules.bestOf}
                      pointsToWin={gameRules.pointsToWin}
                      winBy={gameRules.winBy}
                      advanceHint={advanceHint}
                      onCancel={() => setEditingId(null)}
                      onSave={(result) => {
                        actions.setKoResult(editingMatch.id, result)
                        setEditingId(null)
                      }}
                    />
                  </CardBody>
                </Card>
              )
            })()
          ) : null}
        </>
      )}

      <ActionBar>
        <span className="text-xs text-ink-faint">
          {champ
            ? 'The final is complete.'
            : bracket
              ? 'Enter and confirm every match to reach the final.'
              : 'Confirm the qualifier list, then generate the bracket.'}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button onClick={() => actions.goto(tournament.format === 'ko_only' ? 'players' : 'matches')}>
            ← {tournament.format === 'ko_only' ? 'Player Setup' : 'Pool Matches'}
          </Button>
          <Button variant="primary" disabled={!champ} onClick={() => actions.goto('champion')}>
            Champion →
          </Button>
        </div>
      </ActionBar>
    </>
  )
}
