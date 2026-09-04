'use client'

import GroupMatchBoard from '@/components/tournament-console/GroupMatchBoard'
import { ActionBar, Button, Card, Empty, PageHead } from '@/components/tournament-console/ui'
import { useActiveTournament } from '@/lib/matches-store'

export default function PoolMatches() {
  const { tournament, pools, poolMatches, poolsComplete, actions } = useActiveTournament()

  const rrOnly = tournament.format === 'rr_only'
  const played = poolMatches.filter((m) => m.played).length
  const remaining = poolMatches.length - played

  if (!pools || poolMatches.length === 0) {
    return (
      <Card>
        <Empty title="No fixtures yet">Set the groups up on the previous steps first.</Empty>
      </Card>
    )
  }

  return (
    <>
      <PageHead
        eyebrow={rrOnly ? 'League' : 'Group matches'}
        title={rrOnly ? 'League' : 'Group Matches'}
        sub={
          rrOnly
            ? "Enter every fixture's game score. The table winner is the champion."
            : "Pick a group, then enter each match's score — check it, then confirm to lock it into the standings."
        }
      />

      <GroupMatchBoard />

      <ActionBar>
        <span className="text-xs text-ink-faint">
          {poolsComplete
            ? rrOnly
              ? 'Every fixture entered — the table is final.'
              : 'All group matches entered. Qualification is final.'
            : `${remaining} match${remaining === 1 ? '' : 'es'} still to enter — you can advance early, unplayed matches count as no result.`}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {rrOnly ? (
            <Button onClick={() => actions.goto('pools')}>← Rules</Button>
          ) : (
            <Button onClick={() => actions.goto('groups')}>← Groups</Button>
          )}
          {rrOnly ? (
            <Button variant="primary" disabled={!poolsComplete} onClick={() => actions.goto('champion')}>
              Declare Champion →
            </Button>
          ) : (
            <Button variant="primary" onClick={() => actions.goto('knockout')}>
              Continue to Knockout →
            </Button>
          )}
        </div>
      </ActionBar>
    </>
  )
}
