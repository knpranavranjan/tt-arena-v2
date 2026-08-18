import type {
  AppUser,
  Club,
  Match,
  Player,
  Pool,
  PoolStanding,
  RatingExport,
  TTEvent,
  Tournament,
} from "@/lib/types";

export const clubs: Club[] = [
  {
    id: "club-apex",
    name: "Apex Table Tennis Club",
    location: "Bengaluru",
    state: "Karnataka",
    description:
      "Bengaluru's premier competitive club, producing state and national medalists since 2008.",
    playerIds: ["p-1", "p-2", "p-7", "p-11"],
    founded: 2008,
  },
  {
    id: "club-spinforge",
    name: "SpinForge Academy",
    location: "Pune",
    state: "Maharashtra",
    description: "High-performance training academy focused on junior development.",
    playerIds: ["p-3", "p-8", "p-12"],
    founded: 2015,
  },
  {
    id: "club-riverside",
    name: "Riverside Paddlers",
    location: "Kolkata",
    state: "West Bengal",
    description: "Community club with the largest active membership in eastern India.",
    playerIds: ["p-4", "p-9"],
    founded: 1998,
  },
  {
    id: "club-vanguard",
    name: "Vanguard TTC",
    location: "Chennai",
    state: "Tamil Nadu",
    description: "Home to three national champions and a full-time coaching staff.",
    playerIds: ["p-5", "p-6", "p-10"],
    founded: 2011,
  },
];

export const players: Player[] = [
  {
    id: "p-1",
    name: "Arjun Sharma",
    clubId: "club-apex",
    clubName: "Apex Table Tennis Club",
    state: "Karnataka",
    category: "Senior",
    gender: "MALE",
    rating: 1942,
    dateOfBirth: "1998-04-12",
    wins: 61,
    losses: 14,
    recentForm: ["W", "W", "W", "L", "W"],
  },
  {
    id: "p-2",
    name: "Meera Nair",
    clubId: "club-apex",
    clubName: "Apex Table Tennis Club",
    state: "Karnataka",
    category: "Senior",
    gender: "FEMALE",
    rating: 1887,
    dateOfBirth: "2000-09-03",
    wins: 54,
    losses: 19,
    recentForm: ["W", "L", "W", "W", "W"],
  },
  {
    id: "p-3",
    name: "Kabir Deshmukh",
    clubId: "club-spinforge",
    clubName: "SpinForge Academy",
    state: "Maharashtra",
    category: "Under 21",
    gender: "MALE",
    rating: 1765,
    dateOfBirth: "2005-01-22",
    wins: 38,
    losses: 21,
    recentForm: ["L", "W", "W", "L", "W"],
  },
  {
    id: "p-4",
    name: "Ritika Sen",
    clubId: "club-riverside",
    clubName: "Riverside Paddlers",
    state: "West Bengal",
    category: "Senior",
    gender: "FEMALE",
    rating: 1810,
    dateOfBirth: "1999-11-30",
    wins: 45,
    losses: 24,
    recentForm: ["W", "W", "L", "W", "L"],
  },
  {
    id: "p-5",
    name: "Vikram Rao",
    clubId: "club-vanguard",
    clubName: "Vanguard TTC",
    state: "Tamil Nadu",
    category: "Senior",
    gender: "MALE",
    rating: 2015,
    dateOfBirth: "1996-06-18",
    wins: 78,
    losses: 12,
    recentForm: ["W", "W", "W", "W", "L"],
  },
  {
    id: "p-6",
    name: "Ananya Krishnan",
    clubId: "club-vanguard",
    clubName: "Vanguard TTC",
    state: "Tamil Nadu",
    category: "Under 21",
    gender: "FEMALE",
    rating: 1698,
    dateOfBirth: "2004-03-27",
    wins: 29,
    losses: 18,
    recentForm: ["L", "L", "W", "W", "W"],
  },
  {
    id: "p-7",
    name: "Rohan Kulkarni",
    clubId: "club-apex",
    clubName: "Apex Table Tennis Club",
    state: "Karnataka",
    category: "Under 17",
    gender: "MALE",
    rating: 1540,
    dateOfBirth: "2009-08-14",
    wins: 22,
    losses: 15,
    recentForm: ["W", "W", "L", "W", "W"],
  },
  {
    id: "p-8",
    name: "Ishaan Verma",
    clubId: "club-spinforge",
    clubName: "SpinForge Academy",
    state: "Maharashtra",
    category: "Senior",
    gender: "MALE",
    rating: 1856,
    dateOfBirth: "1997-12-05",
    wins: 49,
    losses: 22,
    recentForm: ["W", "L", "W", "L", "W"],
  },
  {
    id: "p-9",
    name: "Priya Chatterjee",
    clubId: "club-riverside",
    clubName: "Riverside Paddlers",
    state: "West Bengal",
    category: "Veteran (40+)",
    gender: "FEMALE",
    rating: 1620,
    dateOfBirth: "1980-02-09",
    wins: 33,
    losses: 20,
    recentForm: ["W", "W", "W", "L", "L"],
  },
  {
    id: "p-10",
    name: "Aditya Menon",
    clubId: "club-vanguard",
    clubName: "Vanguard TTC",
    state: "Tamil Nadu",
    category: "Under 13",
    gender: "MALE",
    rating: 1290,
    dateOfBirth: "2013-05-19",
    wins: 14,
    losses: 9,
    recentForm: ["W", "L", "W", "W", "L"],
  },
  {
    id: "p-11",
    name: "Sneha Iyer",
    clubId: "club-apex",
    clubName: "Apex Table Tennis Club",
    state: "Karnataka",
    category: "Under 21",
    gender: "FEMALE",
    rating: 1732,
    dateOfBirth: "2003-10-02",
    wins: 31,
    losses: 17,
    recentForm: ["W", "W", "W", "W", "W"],
  },
  {
    id: "p-12",
    name: "Dev Patil",
    clubId: "club-spinforge",
    clubName: "SpinForge Academy",
    state: "Maharashtra",
    category: "Under 17",
    gender: "MALE",
    rating: 1478,
    dateOfBirth: "2010-07-25",
    wins: 19,
    losses: 13,
    recentForm: ["L", "W", "W", "L", "W"],
  },
];

export const events: TTEvent[] = [
  {
    id: "evt-open-2026",
    name: "TT Open 2026",
    organizer: "Karnataka Table Tennis Association",
    venue: "Kanteerava Indoor Stadium",
    date: "2026-09-12",
    location: "Bengaluru, Karnataka",
    status: "UPCOMING",
    tournamentIds: ["trn-open-senior", "trn-open-u21"],
    participatingClubIds: ["club-apex", "club-spinforge", "club-vanguard"],
  },
  {
    id: "evt-monsoon-cup",
    name: "Monsoon Cup",
    organizer: "Maharashtra TT Federation",
    venue: "Balewadi Sports Complex",
    date: "2026-08-22",
    location: "Pune, Maharashtra",
    status: "LIVE",
    tournamentIds: ["trn-monsoon-open"],
    participatingClubIds: ["club-spinforge", "club-riverside"],
  },
  {
    id: "evt-eastern-championship",
    name: "Eastern Regional Championship",
    organizer: "West Bengal TT Association",
    venue: "Netaji Indoor Stadium",
    date: "2026-06-02",
    location: "Kolkata, West Bengal",
    status: "COMPLETED",
    tournamentIds: ["trn-eastern-senior"],
    participatingClubIds: ["club-riverside", "club-apex"],
  },
];

export const tournaments: Tournament[] = [
  {
    id: "trn-open-senior",
    eventId: "evt-open-2026",
    name: "TT Open 2026 — Senior Singles",
    venue: "Kanteerava Indoor Stadium",
    organizer: "Karnataka Table Tennis Association",
    date: "2026-09-12",
    registrationDeadline: "2026-09-01",
    maxPlayers: 32,
    registeredPlayerIds: ["p-1", "p-2", "p-5", "p-4", "p-8", "p-9"],
    format: "POOL_KNOCKOUT",
    category: "Senior",
    entryFee: 500,
    description: "Flagship senior singles event of TT Open 2026, pool stage followed by knockout.",
    status: "REGISTRATION_OPEN",
    poolSize: 4,
  },
  {
    id: "trn-open-u21",
    eventId: "evt-open-2026",
    name: "TT Open 2026 — Under 21 Singles",
    venue: "Kanteerava Indoor Stadium",
    organizer: "Karnataka Table Tennis Association",
    date: "2026-09-13",
    registrationDeadline: "2026-09-01",
    maxPlayers: 16,
    registeredPlayerIds: ["p-3", "p-6", "p-11"],
    format: "SINGLE_ELIMINATION",
    category: "Under 21",
    entryFee: 300,
    description: "Under-21 knockout draw run alongside the senior TT Open.",
    status: "REGISTRATION_OPEN",
  },
  {
    id: "trn-monsoon-open",
    eventId: "evt-monsoon-cup",
    name: "Monsoon Cup — Open Singles",
    venue: "Balewadi Sports Complex",
    organizer: "Maharashtra TT Federation",
    date: "2026-08-22",
    registrationDeadline: "2026-08-10",
    maxPlayers: 16,
    registeredPlayerIds: ["p-3", "p-8", "p-12", "p-4", "p-9", "p-1"],
    format: "POOL_KNOCKOUT",
    category: "Senior",
    entryFee: 400,
    description: "Currently in progress — pool stage completed, knockout underway.",
    status: "KNOCKOUT",
    poolSize: 4,
  },
  {
    id: "trn-eastern-senior",
    eventId: "evt-eastern-championship",
    name: "Eastern Regional Championship — Senior Singles",
    venue: "Netaji Indoor Stadium",
    organizer: "West Bengal TT Association",
    date: "2026-06-02",
    registrationDeadline: "2026-05-20",
    maxPlayers: 24,
    registeredPlayerIds: ["p-4", "p-9", "p-1", "p-2"],
    format: "POOL_KNOCKOUT",
    category: "Senior",
    entryFee: 450,
    description: "Completed regional championship for the eastern zone.",
    status: "COMPLETED",
    poolSize: 4,
    champion: "p-1",
    runnerUp: "p-4",
    semiFinalists: ["p-2", "p-9"],
  },
];

export const pools: Pool[] = [
  { id: "pool-a", tournamentId: "trn-monsoon-open", name: "Pool A", playerIds: ["p-3", "p-4"] },
  { id: "pool-b", tournamentId: "trn-monsoon-open", name: "Pool B", playerIds: ["p-8", "p-9"] },
  { id: "pool-c", tournamentId: "trn-monsoon-open", name: "Pool C", playerIds: ["p-12"] },
];

export const poolStandings: Record<string, PoolStanding[]> = {
  "pool-a": [
    { playerId: "p-3", played: 3, wins: 3, losses: 0, points: 6, qualified: true },
    { playerId: "p-4", played: 3, wins: 1, losses: 2, points: 2, qualified: false },
  ],
  "pool-b": [
    { playerId: "p-8", played: 3, wins: 2, losses: 1, points: 4, qualified: true },
    { playerId: "p-9", played: 3, wins: 2, losses: 1, points: 4, qualified: true },
  ],
};

export const matches: Match[] = [
  {
    id: "m-1",
    tournamentId: "trn-monsoon-open",
    round: "Semifinal",
    table: 1,
    playerAId: "p-3",
    playerBId: "p-8",
    scoreA: 2,
    scoreB: 1,
    status: "LIVE",
  },
  {
    id: "m-2",
    tournamentId: "trn-monsoon-open",
    round: "Semifinal",
    table: 2,
    playerAId: "p-9",
    playerBId: "p-4",
    scoreA: 0,
    scoreB: 0,
    status: "SCHEDULED",
  },
  {
    id: "m-3",
    tournamentId: "trn-eastern-senior",
    round: "Final",
    table: 1,
    playerAId: "p-1",
    playerBId: "p-5",
    scoreA: 3,
    scoreB: 2,
    status: "COMPLETED",
    winnerId: "p-1",
  },
  {
    id: "m-4",
    tournamentId: "trn-eastern-senior",
    round: "Semifinal",
    table: 2,
    playerAId: "p-1",
    playerBId: "p-11",
    scoreA: 3,
    scoreB: 0,
    status: "COMPLETED",
    winnerId: "p-1",
  },
  {
    id: "m-5",
    tournamentId: "trn-open-senior",
    round: "Round of 16",
    table: 3,
    playerAId: "p-7",
    playerBId: "p-1",
    scoreA: 3,
    scoreB: 1,
    status: "COMPLETED",
    winnerId: "p-7",
  },
  {
    id: "m-6",
    tournamentId: "trn-eastern-senior",
    round: "Quarterfinal",
    table: 3,
    playerAId: "p-1",
    playerBId: "p-8",
    scoreA: 3,
    scoreB: 1,
    status: "COMPLETED",
    winnerId: "p-1",
  },
  {
    id: "m-7",
    tournamentId: "trn-monsoon-open",
    round: "Round of 16",
    table: 2,
    playerAId: "p-1",
    playerBId: "p-12",
    scoreA: 3,
    scoreB: 0,
    status: "COMPLETED",
    winnerId: "p-1",
  },
  {
    id: "m-8",
    tournamentId: "trn-monsoon-open",
    round: "Quarterfinal",
    table: 1,
    playerAId: "p-4",
    playerBId: "p-1",
    scoreA: 1,
    scoreB: 3,
    status: "COMPLETED",
    winnerId: "p-1",
  },
  {
    id: "m-9",
    tournamentId: "trn-monsoon-open",
    round: "Semifinal",
    table: 1,
    playerAId: "p-1",
    playerBId: "p-3",
    scoreA: 2,
    scoreB: 3,
    status: "COMPLETED",
    winnerId: "p-3",
  },
];

export const ratingExports: RatingExport[] = [
  {
    tournamentId: "trn-eastern-senior",
    status: "SENT",
    createdAt: "2026-06-02T18:30:00Z",
    sentAt: "2026-06-02T18:31:12Z",
    lastAttempt: "2026-06-02T18:31:12Z",
    response: "202 Accepted",
  },
];

export const appUsers: AppUser[] = [
  { id: "u-1", name: "Arjun Sharma", email: "arjun@apexttc.in", role: "PLAYER", status: "ACTIVE", linkedId: "p-1" },
  { id: "u-2", name: "Apex TTC Admin", email: "contact@apexttc.in", role: "CLUB", status: "ACTIVE", linkedId: "club-apex" },
  { id: "u-3", name: "Karnataka TTA Ops", email: "ops@ktta.in", role: "HOST", status: "ACTIVE", linkedId: null },
  { id: "u-4", name: "Platform Admin", email: "admin@ttmanagement.app", role: "ADMIN", status: "ACTIVE", linkedId: null },
  { id: "u-5", name: "Meera Nair", email: "meera@apexttc.in", role: "PLAYER", status: "ACTIVE", linkedId: "p-2" },
];

export function getPlayer(id: string) {
  return players.find((p) => p.id === id);
}

export function getClub(id: string) {
  return clubs.find((c) => c.id === id);
}

export function getEvent(id: string) {
  return events.find((e) => e.id === id);
}

export function getTournament(id: string) {
  return tournaments.find((t) => t.id === id);
}

export function getAppUser(id: string) {
  return appUsers.find((u) => u.id === id);
}

export function getWeeklyDelta(player: Player) {
  const seed = Number(player.id.replace("p-", "")) || 1;
  return 10 + ((seed * 17) % 80);
}

export function getRatingHistory(player: Player) {
  const checkpoints = ["Jan", "Mar", "May", "Jul", "Sep", "Now"];
  const seed = Number(player.id.replace("p-", "")) || 1;
  const swing = 60 + (seed % 5) * 12;
  const start = player.rating - swing;
  return checkpoints.map((label, i) => {
    const progress = i / (checkpoints.length - 1);
    const wobble = Math.sin(i + seed) * 10;
    const rating = i === checkpoints.length - 1
      ? player.rating
      : Math.round(start + (player.rating - start) * progress + wobble);
    return { label, rating };
  });
}

export function getClubPlayers(clubId: string) {
  return players.filter((p) => p.clubId === clubId);
}

export function getTournamentPlayers(tournament: Tournament) {
  return tournament.registeredPlayerIds
    .map((id) => getPlayer(id))
    .filter((p): p is Player => Boolean(p));
}
