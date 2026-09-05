'use client'

import { useMemo, useState } from 'react'
import { Check, Search, UserPlus } from 'lucide-react'

import {
  ActionBar, Badge, Button, Card, CardBody, CardHead, CellInput, Competitor, Empty,
  PageHead, SeedPill, Segmented, Table, TableWrap, Td, Th,
} from '@/components/tournament-console/ui'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { usePlatformDirectory } from '@/lib/platform-directory'
import { cn } from '@/lib/utils'
import { useActiveTournament } from '@/lib/matches-store'

export default function PlayerSetup() {
  const { tournament, isDoubles, activeCategory, players, unpaired, seeded, actions } =
    useActiveTournament()
  const [view, setView] = useState<'entry' | 'seeding'>('entry')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [pick, setPick] = useState<string[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [query, setQuery] = useState('')

  const { search } = usePlatformDirectory()
  const enteredIds = useMemo(() => new Set(players.map((p) => p.id)), [players])
  const results = useMemo(() => search(query, enteredIds), [search, query, enteredIds])

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
            <Button size="sm" variant="primary" onClick={() => { setQuery(''); setAddOpen(true) }}>
              Add by ID
            </Button>
          </CardHead>

          {players.length === 0 ? (
            <Empty title="No players yet">
              Use &ldquo;Add by ID&rdquo; to find a signed-in player by their unique ID, or &ldquo;Sync from
              registrations&rdquo; to pull in everyone who signed up.
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
                          <Button size="xs" variant="ghost" title="Remove from entry list" className="text-bad" onClick={() => actions.removePlayer(p.id)}>
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] gap-4 border border-white/10 bg-[#0c0e12] p-5 text-[#e2e2e8] sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#e2e2e8]">
              <UserPlus className="h-4 w-4 text-[#ff8f86]" strokeWidth={2} />
              Add a player
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-[#8b8b93]">
              Only people with an account can be entered — search by unique ID or name. This keeps
              post-tournament ratings attributable.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a5a62]" strokeWidth={2} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. arjun_s07"
              className="w-full rounded-[6px] border border-white/10 bg-[#161719] py-2.5 pl-9 pr-3 text-sm text-[#e2e2e8] placeholder:text-[#5a5a62] focus:border-[#ff2448] focus:outline-none"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto rounded-[8px] border border-white/10 bg-white/[0.02]">
            {results.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-[#8b8b93]">
                {query.trim()
                  ? `No account matches “${query.trim()}”. They must sign up before they can be entered.`
                  : 'Start typing a unique ID or name.'}
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {results.map((person) => (
                  <li key={person.id}>
                    <button
                      type="button"
                      onClick={() => {
                        actions.addRegisteredPlayer({
                          id: person.id,
                          name: person.name,
                          rating: person.rating,
                          club: person.club,
                          state: person.state,
                        })
                        setQuery('')
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-[#c2c6d7]">
                        {person.name.slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-[#e8e8ee]">{person.name}</span>
                        <span className="block truncate text-[11px] text-[#8b8b93]">
                          @{person.handle}
                          {person.club ? ` · ${person.club}` : ''} · {person.rating}
                        </span>
                      </span>
                      {!person.hasAccount && (
                        <span className="shrink-0 rounded-[3px] bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#8b8b93]">
                          Roster
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#5a5a62]">
            <span className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-emerald-400" strokeWidth={3} />
              {players.length} in the entry list
            </span>
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-[4px] border border-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#e2e2e8] transition-colors hover:border-white/30 hover:bg-white/5"
            >
              Done
            </button>
          </div>
        </DialogContent>
      </Dialog>

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
