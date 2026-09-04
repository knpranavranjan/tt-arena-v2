'use client'

import { useMemo, useState } from 'react'

import {
  ActionBar, Badge, Button, Card, CardBody, CardHead, CellInput, Competitor, Empty,
  PageHead, SeedPill, Segmented, Table, TableWrap, Td, Th,
} from '@/components/tournament-console/ui'
import { cn } from '@/lib/utils'
import { useActiveTournament } from '@/lib/matches-store'

export default function PlayerSetup() {
  const { tournament, isDoubles, activeCategory, players, unpaired, seeded, actions } =
    useActiveTournament()
  const [view, setView] = useState<'entry' | 'seeding'>('entry')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [pick, setPick] = useState<string[]>([])

  const noun = isDoubles ? 'pair' : 'player'
  const nouns = isDoubles ? 'pairs' : 'players'

  const togglePick = (id: string) =>
    setPick((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-2),
    )

  const duplicates = useMemo(() => {
    const seen = new Set<string>()
    const dupes = new Set<string>()
    for (const p of players) {
      const key = p.name.trim().toLowerCase()
      if (seen.has(key)) dupes.add(key)
      seen.add(key)
    }
    return dupes
  }, [players])

  const dropSeed = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return
    const ids = seeded.map((s) => s.id)
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)
    actions.setSeedOrder(ids)
  }

  return (
    <>
      <PageHead
        eyebrow="Step 1"
        title={`${isDoubles ? 'Pairs' : 'Players'} — ${activeCategory.name}`}
        sub={
          isDoubles
            ? `Registrants for this division, paired two-by-two. Split a pair to send both players to the tray, then pick any two to re-pair. Switch to Seeding to set the draw order.`
            : `The entry list is pre-filled from the players who registered for this division (cap ${activeCategory.maxPlayers}). Add, edit or remove anyone. Switch to Seeding to set the draw order by hand.`
        }
      >
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'entry', label: 'Entry list' },
            { value: 'seeding', label: 'Seeding' },
          ]}
        />
      </PageHead>

      {view === 'entry' && !isDoubles ? (
        <Card>
          <CardHead title="Entry list" desc={`${players.length} player${players.length === 1 ? '' : 's'}`}>
            <Button size="sm" onClick={() => actions.syncFromRegistrations()}>
              Sync from registrations
            </Button>
            <Button size="sm" variant="danger" disabled={players.length === 0} onClick={actions.clearPlayers}>
              Clear all
            </Button>
            <Button size="sm" onClick={() => actions.addPlayer()}>
              Add player
            </Button>
          </CardHead>

          {players.length === 0 ? (
            <Empty title="No players yet">
              Use &ldquo;Add player&rdquo;, or &ldquo;Sync from registrations&rdquo; to pull in everyone who signed up.
            </Empty>
          ) : (
            <TableWrap className="max-h-[560px] overflow-y-auto">
              <Table>
                <thead className="sticky top-0 z-10">
                  <tr>
                    <Th className="w-12">#</Th>
                    <Th>Name</Th>
                    <Th num className="w-24">Rating</Th>
                    <Th className="w-44">Club</Th>
                    <Th className="w-32">State</Th>
                    <Th className="w-36" />
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, i) => (
                    <tr key={p.id} className="hover:bg-subtle">
                      <Td mono className="text-ink-faint">{i + 1}</Td>
                      <Td>
                        <CellInput
                          value={p.name}
                          className={duplicates.has(p.name.trim().toLowerCase()) ? 'text-warn' : undefined}
                          onChange={(e) => actions.updatePlayer(p.id, { name: e.target.value })}
                        />
                      </Td>
                      <Td num>
                        <CellInput
                          type="number"
                          value={p.rating}
                          className="tabular text-right"
                          onChange={(e) => actions.updatePlayer(p.id, { rating: Number(e.target.value) || 0 })}
                        />
                      </Td>
                      <Td>
                        <CellInput value={p.club} placeholder="—" onChange={(e) => actions.updatePlayer(p.id, { club: e.target.value })} />
                      </Td>
                      <Td>
                        <CellInput value={p.state} placeholder="—" onChange={(e) => actions.updatePlayer(p.id, { state: e.target.value })} />
                      </Td>
                      <Td>
                        <div className="flex flex-nowrap gap-1">
                          <Button size="xs" variant="ghost" title="Move up" disabled={i === 0} onClick={() => actions.movePlayerOrder(p.id, -1)}>
                            ↑
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            title="Move down"
                            disabled={i === players.length - 1}
                            onClick={() => actions.movePlayerOrder(p.id, 1)}
                          >
                            ↓
                          </Button>
                          <Button size="xs" variant="ghost" title="Duplicate" onClick={() => actions.duplicatePlayer(p.id)}>
                            ⧉
                          </Button>
                          <Button size="xs" variant="ghost" title="Delete" className="text-bad" onClick={() => actions.removePlayer(p.id)}>
                            ✕
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Card>
      ) : view === 'entry' && isDoubles ? (
        <Card>
          <CardHead
            title="Pairs"
            desc={`${players.length} pair${players.length === 1 ? '' : 's'}${
              unpaired.length ? ` · ${unpaired.length} unpaired` : ''
            }`}
          >
            <Button
              size="sm"
              onClick={() => {
                actions.autoPairAll()
                setPick([])
              }}
            >
              Auto-pair all
            </Button>
            <Button size="sm" variant="danger" disabled={players.length === 0} onClick={actions.clearPlayers}>
              Clear all
            </Button>
          </CardHead>

          {players.length === 0 && unpaired.length === 0 ? (
            <Empty title="No pairs yet">Use &ldquo;Auto-pair all&rdquo; to build the doubles field.</Empty>
          ) : (
            <CardBody className="flex flex-col gap-4">
              <ol className="flex flex-col gap-1.5">
                {players.map((p, i) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-[10px] border border-line bg-panel px-3 py-2 text-[13px]"
                  >
                    <span className="tabular w-6 shrink-0 text-right text-[11.5px] text-ink-faint">{i + 1}.</span>
                    <Competitor player={p} size={20} className="flex-1" />
                    <span className="tabular shrink-0 text-[11.5px] text-ink-faint">{p.rating}</span>
                    <Button
                      size="xs"
                      variant="ghost"
                      title="Split this pair"
                      onClick={() => actions.splitPair(p.id)}
                    >
                      Split
                    </Button>
                  </li>
                ))}
              </ol>

              {unpaired.length > 0 ? (
                <div className="rounded-[12px] border border-warn/40 bg-warn-soft/40 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <strong className="text-[13px] font-bold">Unpaired players</strong>
                    <span className="text-[11.5px] text-ink-faint">pick two, then pair them</span>
                    <Badge tone="warn" className="ml-auto">{unpaired.length}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {unpaired.map((m) => {
                      const on = pick.includes(m.id)
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => togglePick(m.id)}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-[12.5px] transition',
                            on
                              ? 'border-focus bg-panel ring-2 ring-focus-soft'
                              : 'border-line bg-panel hover:border-ink-faint',
                          )}
                        >
                          {m.name}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={pick.length !== 2}
                      onClick={() => {
                        if (pick.length === 2) actions.formPair(pick[0], pick[1])
                        setPick([])
                      }}
                    >
                      Pair selected
                    </Button>
                    {pick.length > 0 ? (
                      <Button size="sm" onClick={() => setPick([])}>
                        Clear selection
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </CardBody>
          )}
        </Card>
      ) : (
        <Card>
          <CardHead
            title="Seeding"
            desc={`Drag a ${noun} anywhere to set the seed order by hand. Seeds feed the draw directly.`}
          >
            <Badge tone="outline">{seeded.length} seeds</Badge>
            <Button size="sm" onClick={() => actions.setSeedOrder(null)}>
              Reset to rating
            </Button>
          </CardHead>
          {seeded.length === 0 ? (
            <Empty title="Nothing to seed yet">Add {nouns} first.</Empty>
          ) : (
            <CardBody>
              <ol className="flex flex-col gap-1.5">
                {seeded.map((p, index) => (
                  <li
                    key={p.id}
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
                      if (dragIndex !== null) dropSeed(dragIndex, index)
                      setDragIndex(null)
                      setDropIndex(null)
                    }}
                    className={cn(
                      'flex cursor-grab items-center gap-3 rounded-[10px] border border-line bg-panel px-3 py-2 text-[13px] transition hover:border-ink-faint',
                      dragIndex === index && 'opacity-40',
                      dropIndex === index && dragIndex !== null && dragIndex !== index && 'border-focus ring-2 ring-focus-soft',
                    )}
                  >
                    <span className="select-none text-ink-faint">⠿</span>
                    <SeedPill seed={p.seed} />
                    {isDoubles ? (
                      <Competitor
                        player={p}
                        size={18}
                        className="flex-1"
                        nameClassName={p.seed <= 4 ? 'font-semibold' : undefined}
                      />
                    ) : (
                      <span className={cn('min-w-0 flex-1 truncate', p.seed <= 4 && 'font-semibold')}>{p.name}</span>
                    )}
                    <span className="tabular shrink-0 text-[11.5px] text-ink-faint">{p.rating}</span>
                    {!isDoubles ? (
                      <span className="hidden shrink-0 text-[11.5px] text-ink-faint sm:block">{p.club || '—'}</span>
                    ) : null}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[11.5px] text-ink-faint">
                Drag to reorder. A hand-set order sticks even when ratings change — hit &ldquo;Reset to rating&rdquo; to
                go back to automatic.
              </p>
            </CardBody>
          )}
        </Card>
      )}

      <ActionBar>
        <span className="text-xs text-ink-faint">
          {players.length < 2
            ? `At least 2 ${nouns} are needed to continue.`
            : `${players.length} ${nouns} seeded 1–${players.length}.${
                isDoubles && unpaired.length ? ` ${unpaired.length} player${unpaired.length === 1 ? '' : 's'} still unpaired.` : ''
              }`}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            variant="primary"
            disabled={players.length < 2}
            onClick={() => actions.goto(tournament.format === 'ko_only' ? 'knockout' : 'pools')}
          >
            {tournament.format === 'ko_only' ? 'Continue to Knockout →' : 'Continue to Pool Allocation →'}
          </Button>
        </div>
      </ActionBar>
    </>
  )
}
