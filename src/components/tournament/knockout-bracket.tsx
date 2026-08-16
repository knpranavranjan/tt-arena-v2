"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface BracketPlayer {
  name: string;
  seed?: number;
}

export interface BracketMatchData {
  id: string;
  playerA?: BracketPlayer;
  playerB?: BracketPlayer;
  scoreA?: number;
  scoreB?: number;
  winner?: "A" | "B";
  isLive?: boolean;
}

export interface BracketRoundData {
  name: string;
  matches: BracketMatchData[];
}

export function KnockoutBracket({ rounds, champion }: { rounds: BracketRoundData[]; champion?: string }) {
  return (
    <div className="flex gap-8 overflow-x-auto pb-4">
      {rounds.map((round, roundIndex) => (
        <div key={round.name} className="flex min-w-[220px] flex-col justify-around gap-6">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {round.name}
          </p>
          <div className="flex flex-1 flex-col justify-around gap-6">
            {round.matches.map((match) => (
              <BracketMatch key={match.id} match={match} delay={roundIndex * 0.05} />
            ))}
          </div>
        </div>
      ))}
      {champion && (
        <div className="flex min-w-[220px] flex-col items-center justify-center gap-3">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Champion
          </p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: duration.complex, ease: ease.out }}
            className="flex flex-col items-center gap-2 rounded-lg border border-champion/40 bg-champion/10 px-5 py-4 text-center"
          >
            <Trophy className="h-6 w-6 text-champion" strokeWidth={1.5} />
            <span className="font-heading text-base font-semibold text-foreground">{champion}</span>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function BracketMatch({ match, delay }: { match: BracketMatchData; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.standard, ease: ease.out, delay }}
      className={cn(
        "rounded-lg border bg-card",
        match.isLive ? "border-live/40" : "border-border",
      )}
    >
      <PlayerRow player={match.playerA} score={match.scoreA} isWinner={match.winner === "A"} />
      <div className="h-px bg-border" />
      <PlayerRow player={match.playerB} score={match.scoreB} isWinner={match.winner === "B"} />
    </motion.div>
  );
}

function PlayerRow({
  player,
  score,
  isWinner,
}: {
  player?: BracketPlayer;
  score?: number;
  isWinner?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2 text-sm",
        isWinner ? "font-semibold text-foreground" : "text-muted-foreground",
        !player && "italic text-muted-foreground/60",
      )}
    >
      <span className="truncate">
        {player ? (
          <>
            {player.seed && <span className="mr-1.5 tabular-nums text-xs text-muted-foreground">#{player.seed}</span>}
            {player.name}
          </>
        ) : (
          "TBD"
        )}
      </span>
      {score !== undefined && <span className="tabular-nums">{score}</span>}
    </div>
  );
}
