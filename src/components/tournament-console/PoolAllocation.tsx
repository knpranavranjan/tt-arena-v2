'use client'

import { useState } from 'react'

import {
  ActionBar, Button, Card, CardBody, CardHead, ChipPicker, Field, Note, PageHead, Segmented,
} from '@/components/tournament-console/ui'
import { normalizeTieBreakOrder, tieBreakLabel, type TieBreakCriterionId } from '@/lib/tie-break'
import type { AllocationMethod, GamePoints, TieBreakRule, TournamentFormat, WinRule } from '@/lib/tournament/types'
import { useActiveTournament } from '@/lib/matches-store'
import { cn } from '@/lib/utils'

const METHODS: Array<{ value: AllocationMethod; label: string; hint: string }> = [
  { value: 'snake', label: 'Snake', hint: 'Serpentine distribution — the balanced default' },
  { value: 'sequential', label: 'Sequential', hint: 'Seeds 1-4 in Group A, 5-8 in Group B …' },
  { value: 'random', label: 'Random', hint: 'Seeded random draw' },
  { value: 'custom', label: 'Custom', hint: 'Empty groups — drag every player into place yourself' },
]

const FORMAT_OPTIONS: Array<{ value: TournamentFormat; label: string }> = [
  { value: 'pools_ko', label: 'Group & Knockout' },
  { value: 'rr_only', label: 'Round Robin' },
  { value: 'ko_only', label: 'Direct Knockout' },
]

const WIN_BY: Array<{ value: WinRule; label: string }> = [
  { value: 'golden', label: 'Golden Point' },
  { value: 'win_by_two', label: 'Win by Two' },
]

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

/**
 * Drag (or use the arrows) to set the order the standings engine walks when a
 * group finishes level. Mirrors the drag-and-drop control on the public "Host a
 * Tournament" form — same criteria, same order semantics.
 */
function TieBreakOrderField({
  order,
  onChange,
}: {
  order: TieBreakCriterionId[]
  onChange: (next: TieBreakCriterionId[]) => void
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= order.length) return
    const next = [...order]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  return (
    <ol className="flex flex-col gap-1.5">
      {order.map((id, i) => (
        <li
          key={id}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragEnter={() => setDropIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDragEnd={() => {
            setDragIndex(null)
            setDropIndex(null)
          }}
          onDrop={(e) => {
            e.preventDefault()
            if (dragIndex !== null) move(dragIndex, i)
            setDragIndex(null)
            setDropIndex(null)
          }}
          className={cn(
            'flex cursor-grab items-center gap-2 rounded-md border border-line bg-subtle px-2.5 py-2 text-[13px] text-ink',
            dragIndex === i && 'opacity-40',
            dropIndex === i && dragIndex !== null && dragIndex !== i && 'ring-2 ring-inset ring-focus',
          )}
        >
          <span className="select-none text-ink-faint" title="Drag to reorder">
            ⠿
          </span>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-[11px] font-semibold text-ink-muted">
            {i + 1}
          </span>
          <span className="flex-1">{tieBreakLabel(id)}</span>
          <span className="flex shrink-0 items-center gap-1">
            <Button size="xs" variant="ghost" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">
              ↑
            </Button>
            <Button
              size="xs"
              variant="ghost"
              disabled={i === order.length - 1}
              onClick={() => move(i, i + 1)}
              aria-label="Move down"
            >
              ↓
            </Button>
          </span>
        </li>
      ))}
    </ol>
  )
}

export default function PoolAllocation() {
  const { tournament, activeCategory, players, pools, poolMethod, recommendation, actions } = useActiveTournament()
  const format = tournament.format
  const rrOnly = format === 'rr_only'
  const koOnly = format === 'ko_only'

  const [poolCount, setPoolCount] = useState(recommendation.poolCount || 1)
  const [method, setMethod] = useState<AllocationMethod>('snake')

  const gp: GamePoints = tournament.groupPoints ?? { win: 1, draw: 0, loss: 0 }
  const setGp = (patch: Partial<GamePoints>) => actions.updateTournament({ groupPoints: { ...gp, ...patch } })

  const tieBreakOrder = normalizeTieBreakOrder(tournament.tieBreakOrder ?? [tournament.tieBreakRule])

  const goToGroups = () => {
    const pooled = (pools ?? []).reduce((n, p) => n + p.playerIds.length, 0)
    // Always land on Groups with a fresh algorithmic allocation — rebuild when
    // there are no pools yet, the count/method changed, or the roster moved on
    // since the pools were last built.
    const needsBuild =
      !pools || pools.length !== poolCount || poolMethod !== method || pooled !== players.length
    if (needsBuild) actions.buildPools({ poolCount, method })
    actions.goto('groups')
  }

  return (
    <>
      <PageHead
        eyebrow="Rules"
        title={`Set the rules — ${activeCategory.name}`}
        sub="Every option below also takes a custom value — hit ＋ on any row if the presets don't have what you need."
      />

      <div className="flex flex-col gap-4">
        {/* -------------------------------------------------- format & structure */}
        <Card>
          <CardHead small title="Tournament format" />
          <CardBody className="flex flex-col gap-4">
            <Segmented options={FORMAT_OPTIONS} value={format} onChange={(v) => actions.updateTournament({ format: v })} />

            {!rrOnly && !koOnly ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="No. of Groups">
                  <ChipPicker
                    options={range(1, 13)}
                    value={poolCount}
                    onChange={(v) => setPoolCount(Math.max(1, Number(v) || 1))}
                    min={1}
                  />
                </Field>
                <Field label="No. of players to qualify from each group">
                  <ChipPicker
                    options={range(1, 13)}
                    value={tournament.advancePerPool ?? 2}
                    onChange={(v) => actions.updateTournament({ advancePerPool: Math.max(1, Number(v) || 1) })}
                    min={1}
                  />
                </Field>
              </div>
            ) : null}

            {!koOnly ? (
              <Field label="Allocation method" help={METHODS.find((m) => m.value === method)?.hint}>
                <Segmented options={METHODS} value={method} onChange={setMethod} />
              </Field>
            ) : null}
          </CardBody>
        </Card>

        {/* ------------------------------------------------------- group result */}
        {!koOnly ? (
          <Card>
            <CardHead small title="Group result" />
            <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Group Points for a Win">
                <ChipPicker options={range(0, 8)} value={gp.win} onChange={(v) => setGp({ win: Number(v) || 0 })} min={0} />
              </Field>
              <Field label="Group Points for a Draw">
                <ChipPicker options={range(0, 8)} value={gp.draw} onChange={(v) => setGp({ draw: Number(v) || 0 })} min={0} />
              </Field>
              <Field label="Group Points for a Loss">
                <ChipPicker options={range(0, 8)} value={gp.loss} onChange={(v) => setGp({ loss: Number(v) || 0 })} min={0} />
              </Field>
              <Field
                label="Tie-break order"
                className="sm:col-span-2 lg:col-span-3"
                help="Applied top-down when a group finishes level on points. This is what the host set on the tournament form."
              >
                <TieBreakOrderField
                  order={tieBreakOrder}
                  onChange={(next) =>
                    actions.updateTournament({
                      tieBreakOrder: next as TieBreakRule[],
                      tieBreakRule: next[0] as TieBreakRule,
                    })
                  }
                />
              </Field>
            </CardBody>
          </Card>
        ) : null}

        {/* --------------------------------------------------- group game rules */}
        {!koOnly ? (
          <Card>
            <CardHead small title="Group game rules" />
            <CardBody className="flex flex-col gap-4">
              <Field label="Sets per Game">
                <ChipPicker
                  options={range(1, 5)}
                  value={tournament.groupBestOf ?? tournament.bestOf}
                  onChange={(v) => actions.updateTournament({ groupBestOf: Math.max(1, Number(v) || 1) })}
                  min={1}
                />
              </Field>
              <Field label="Points to Win a Set">
                <ChipPicker
                  options={range(1, 21)}
                  value={tournament.groupPointsToWin ?? 11}
                  onChange={(v) => actions.updateTournament({ groupPointsToWin: Math.max(1, Number(v) || 1) })}
                  min={1}
                />
              </Field>
              <Field label="Match Win Determined by">
                <Segmented
                  options={WIN_BY}
                  value={tournament.groupWinBy ?? 'win_by_two'}
                  onChange={(v) => actions.updateTournament({ groupWinBy: v })}
                />
              </Field>
            </CardBody>
          </Card>
        ) : null}

        {/* ------------------------------------------------ knockout game rules */}
        {!rrOnly ? (
          <Card>
            <CardHead
              small
              title="Knockout game rules"
              desc="Sets can be shortened or lengthened for the closing rounds — set the quarter-finals (and every round before them) apart from the semis and final."
            />
            <CardBody className="flex flex-col gap-5">
              <div className="flex flex-col gap-4">
                <h3 className="text-[13px] font-semibold text-ink">Quarter Finals &amp; earlier rounds</h3>
                <Field label="Sets per Game">
                  <ChipPicker
                    options={range(1, 5)}
                    value={tournament.koBestOf ?? tournament.bestOf}
                    onChange={(v) => actions.updateTournament({ koBestOf: Math.max(1, Number(v) || 1) })}
                    min={1}
                  />
                </Field>
                <Field label="Points to Win a Set">
                  <ChipPicker
                    options={range(1, 21)}
                    value={tournament.koPointsToWin ?? 11}
                    onChange={(v) => actions.updateTournament({ koPointsToWin: Math.max(1, Number(v) || 1) })}
                    min={1}
                  />
                </Field>
              </div>

              <div className="flex flex-col gap-4 border-t border-line-soft pt-4">
                <h3 className="text-[13px] font-semibold text-ink">Semi Finals &amp; Final</h3>
                <Field label="Sets per Game">
                  <ChipPicker
                    options={range(1, 5)}
                    value={tournament.koSemiFinalBestOf ?? tournament.koBestOf ?? tournament.bestOf}
                    onChange={(v) => actions.updateTournament({ koSemiFinalBestOf: Math.max(1, Number(v) || 1) })}
                    min={1}
                  />
                </Field>
                <Field label="Points to Win a Set">
                  <ChipPicker
                    options={range(1, 21)}
                    value={tournament.koSemiFinalPointsToWin ?? tournament.koPointsToWin ?? 11}
                    onChange={(v) =>
                      actions.updateTournament({ koSemiFinalPointsToWin: Math.max(1, Number(v) || 1) })
                    }
                    min={1}
                  />
                </Field>
              </div>

              <Field label="Match Win Determined by">
                <Segmented
                  options={WIN_BY}
                  value={tournament.koWinBy ?? 'win_by_two'}
                  onChange={(v) => actions.updateTournament({ koWinBy: v })}
                />
              </Field>
            </CardBody>
          </Card>
        ) : null}

        {koOnly ? (
          <Note tone="info">Direct knockout — no groups. Set the knockout game rules above and continue.</Note>
        ) : rrOnly ? (
          <Note tone="info">Round robin — one league table, no groups. Everyone plays everyone once.</Note>
        ) : (
          <Note tone="info">
            {poolCount} group{poolCount === 1 ? '' : 's'} of {method} allocation — you&apos;ll arrange the players on the
            next step.
          </Note>
        )}
      </div>

      <ActionBar>
        <span className="text-xs text-ink-faint">
          {koOnly ? 'Knockout rules set.' : rrOnly ? 'League rules set.' : 'Set the rules, then arrange the groups.'}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button onClick={() => actions.goto('players')}>← Player Setup</Button>
          {koOnly ? (
            <Button variant="primary" disabled={players.length < 2} onClick={() => actions.goto('knockout')}>
              Continue to Knockout →
            </Button>
          ) : rrOnly ? (
            <Button
              variant="primary"
              disabled={players.length < 2}
              onClick={() => {
                if (!pools) actions.buildPools({ poolCount: 1, method: 'snake' })
                actions.goto('matches')
              }}
            >
              Continue to League →
            </Button>
          ) : (
            <Button variant="primary" disabled={players.length < 2} onClick={goToGroups}>
              Continue to Groups →
            </Button>
          )}
        </div>
      </ActionBar>
    </>
  )
}
