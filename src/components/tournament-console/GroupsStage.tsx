'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import {
  ActionBar, Avatar, Badge, Button, Card, Competitor, Empty, Note, PageHead, Stat,
} from '@/components/tournament-console/ui'
import { cn } from '@/lib/utils'
import { describeSizes, poolStrength } from '@/lib/tournament/pools'
import { useActiveTournament } from '@/lib/matches-store'

/**
 * Group allocation — the host drags any player into any group. Comes after the
 * Rules step (which sets the group count) and before Pool Matches.
 */
export default function GroupsStage() {
  const { tournament, isDoubles, activeCategory, players, pools, poolMatches, poolMethod, playerById, seedOf, actions } =
    useActiveTournament()

  const [dragging, setDragging] = useState<string | null>(null)
  const [overPool, setOverPool] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const assigned = useMemo(() => new Set((pools ?? []).flatMap((p) => p.playerIds)), [pools])
  const unassigned = useMemo(() => players.filter((p) => !assigned.has(p.id)), [players, assigned])
  const currentSizes = pools?.map((p) => p.playerIds.length) ?? []

  // The allocation must reflect the current roster the moment the host lands
  // here — if players were added or removed after the pools were built, re-run
  // the same algorithm automatically. Manual rearrangements (everyone still
  // assigned) are left alone.
  const staleAllocation =
    Boolean(pools) && (unassigned.length > 0 || assigned.size !== players.length)
  const healed = useRef(false)
  useEffect(() => {
    if (staleAllocation && pools && !healed.current) {
      healed.current = true
      actions.buildPools({ poolCount: pools.length, method: poolMethod })
    } else if (!staleAllocation) {
      healed.current = false
    }
  }, [staleAllocation, pools, poolMethod, actions])
  const undersized = pools?.filter((p) => p.playerIds.length < 2) ?? []
  const spread = useMemo(() => {
    const avgs = (pools ?? []).filter((p) => p.playerIds.length > 0).map((p) => poolStrength(p, playerById).avg)
    return avgs.length ? Math.max(...avgs) - Math.min(...avgs) : 0
  }, [pools, playerById])

  const drop = (poolId: string | null) => {
    const id = dragging ?? selected
    if (!id) return
    actions.movePlayerToPool(id, poolId)
    setDragging(null)
    setOverPool(null)
    setSelected(null)
  }

  function PlayerRow({ id, n }: { id: string; n: number }) {
    const p = playerById.get(id)
    if (!p) return null
    return (
      <div
        draggable
        onDragStart={() => setDragging(id)}
        onDragEnd={() => {
          setDragging(null)
          setOverPool(null)
        }}
        onClick={(e) => {
          e.stopPropagation()
          setSelected(selected === id ? null : id)
        }}
        title="Drag to another group, or click the player then click a group"
        className={cn(
          'flex cursor-grab items-center gap-2.5 rounded-[8px] border bg-panel px-2.5 py-2 text-[12.5px] transition',
          selected === id ? 'border-focus ring-2 ring-focus-soft' : 'border-line hover:border-ink-faint',
          dragging === id && 'opacity-40',
        )}
      >
        <span className="tabular w-4 shrink-0 text-right text-[11px] text-ink-faint">{n}.</span>
        {isDoubles ? (
          <Competitor player={p} size={18} className="flex-1" />
        ) : (
          <>
            <Avatar name={p.name} size={22} />
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
          </>
        )}
        <span className="tabular shrink-0 text-[11px] text-ink-faint">{p.rating}</span>
        <span className="shrink-0 select-none text-[13px] leading-none text-ink-faint">⠿</span>
      </div>
    )
  }

  if (!pools) {
    return (
      <Card>
        <Empty title="No groups yet">
          Set the number of groups on the Rules step, then come back here to arrange the players.
        </Empty>
        <div className="px-5 pb-5">
          <Button onClick={() => actions.goto('pools')}>← Back to Rules</Button>
        </div>
      </Card>
    )
  }

  return (
    <>
      <PageHead
        eyebrow="Groups"
        title={`Groups — ${activeCategory.name}`}
        sub={`Auto-allocated by the ${poolMethod} algorithm from the seeding order. Drag any player into any group to override it.`}
      >
        <Button size="sm" onClick={() => actions.shufflePools()}>
          ⇄ Shuffle teams
        </Button>
        <Button size="sm" onClick={actions.addPool}>
          Add group
        </Button>
        <Button
          size="sm"
          onClick={() => {
            actions.buildPools({ poolCount: pools.length, method: poolMethod })
            setSelected(null)
          }}
        >
          Re-seed by {poolMethod}
        </Button>
      </PageHead>

      <div className="flex flex-col gap-4">
        {selected ? (
          <Note tone="info">
            <strong className="font-semibold">{playerById.get(selected)?.name}</strong> selected — click a group to move
            them, or click the player again to cancel.
          </Note>
        ) : null}

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pools.map((pool) => (
            <div
              key={pool.id}
              onDragOver={(e) => {
                e.preventDefault()
                setOverPool(pool.id)
              }}
              onDragLeave={() => setOverPool((v) => (v === pool.id ? null : v))}
              onDrop={(e) => {
                e.preventDefault()
                drop(pool.id)
              }}
              onClick={() => selected && drop(pool.id)}
              className={cn(
                'flex flex-col rounded-[12px] border bg-panel transition',
                overPool === pool.id
                  ? 'border-focus ring-[3px] ring-focus-soft'
                  : pool.playerIds.length < 2
                    ? 'border-bad/40'
                    : 'border-line',
              )}
            >
              <div className="flex items-center gap-2 px-3 pb-1.5 pt-3">
                <input
                  value={pool.name}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => actions.renamePool(pool.id, e.target.value)}
                  className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[13px] font-bold outline-none hover:border-line focus:border-focus focus:ring-[3px] focus:ring-focus-soft"
                />
                <span className="tabular shrink-0 text-[11px] text-ink-faint">{pool.playerIds.length}</span>
                <Button
                  size="xs"
                  variant="ghost"
                  title="Remove group"
                  disabled={pools.length < 2}
                  onClick={(e) => {
                    e.stopPropagation()
                    actions.removePool(pool.id)
                  }}
                >
                  ✕
                </Button>
              </div>

              <div className="flex min-h-[56px] flex-1 flex-col gap-1.5 p-2.5 pt-1">
                {pool.playerIds.length === 0 ? (
                  <p className="grid flex-1 place-items-center p-3 text-xs text-ink-faint">Drop players here</p>
                ) : (
                  [...pool.playerIds]
                    .sort((a, b) => seedOf(a) - seedOf(b))
                    .map((id, i) => <PlayerRow key={id} id={id} n={i + 1} />)
                )}
              </div>
            </div>
          ))}
        </div>

        {unassigned.length > 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setOverPool('__none')
            }}
            onDragLeave={() => setOverPool(null)}
            onDrop={(e) => {
              e.preventDefault()
              drop(null)
            }}
            onClick={() => selected && drop(null)}
            className={cn(
              'rounded-[12px] border bg-panel transition',
              overPool === '__none' ? 'border-focus ring-[3px] ring-focus-soft' : 'border-warn/40',
            )}
          >
            <div className="flex items-center gap-2 px-3 pb-1.5 pt-3">
              <strong className="flex-1 text-[13px] font-bold">Unassigned</strong>
              <span className="text-[11px] text-ink-faint">drag into a group</span>
              <Badge tone="warn">{unassigned.length}</Badge>
            </div>
            <div className="grid gap-1.5 p-2.5 pt-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {unassigned
                .slice()
                .sort((a, b) => seedOf(a.id) - seedOf(b.id))
                .map((p, i) => (
                  <PlayerRow key={p.id} id={p.id} n={i + 1} />
                ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat k="Groups" v={pools.length} h={describeSizes(pools.length, currentSizes)} />
          <Stat k="Fixtures" v={poolMatches.length} h={`Best of ${tournament.groupBestOf ?? tournament.bestOf}`} />
          <Stat k="Rating spread" v={spread} h="Strongest group average minus weakest" />
        </div>

        {undersized.length > 0 ? (
          <Note tone="warn">
            {undersized.length} group{undersized.length === 1 ? '' : 's'} have fewer than 2 players and generate no
            fixtures.
          </Note>
        ) : null}
      </div>

      <ActionBar>
        <span className="text-xs text-ink-faint">
          {unassigned.length > 0
            ? `${unassigned.length} player${unassigned.length === 1 ? '' : 's'} not yet in a group.`
            : `${poolMatches.length} round robin fixtures ready.`}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button onClick={() => actions.goto('pools')}>← Rules</Button>
          <Button
            variant="primary"
            disabled={poolMatches.length === 0}
            onClick={() => actions.goto('matches')}
          >
            Confirm groups &amp; continue →
          </Button>
        </div>
      </ActionBar>
    </>
  )
}
