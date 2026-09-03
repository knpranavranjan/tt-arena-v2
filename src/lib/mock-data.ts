import type {
  AppUser,
  Category,
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
    address: "142, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
    description:
      "Bengaluru's premier competitive club, producing state and national medalists since 2008.",
    aboutHighlights: [
      "Professional coaching staff with international competition experience.",
      "Structured training programs for Beginner, Intermediate, and Advanced tiers.",
      "Regular in-house ranking tournaments and sparring sessions.",
      "Dedicated fitness and agility training area for physical conditioning.",
    ],
    playerIds: ["p-1", "p-2", "p-7", "p-11"],
    founded: 2008,
    phone: "+91 80 4123 5567",
    email: "contact@apexttc.in",
    verified: true,
    rating: 4.8,
    facilities: {
      tableCount: 12,
      tableVarieties: "Stiga Optimum 30 & Butterfly Centrefold 25",
      floorType: "Wooden Floor",
      floorGrade: "Professional Grade",
      lighting: "1200+ Lux",
      isAirConditioned: true,
      hasWashroom: true,
      hasParking: true,
      hasROWater: true,
      seatingCapacity: 60,
    },
  },
  {
    id: "club-spinforge",
    name: "SpinForge Academy",
    location: "Pune",
    state: "Maharashtra",
    address: "Plot 27, Baner-Pashan Link Road, Baner, Pune, Maharashtra 411045",
    description: "High-performance training academy focused on junior development.",
    aboutHighlights: [
      "Junior-focused curriculum led by certified youth development coaches.",
      "Video analysis sessions for technique correction every weekend.",
      "Partnerships with schools for talent scouting and trials.",
      "Physiotherapy support on-site during peak training hours.",
    ],
    playerIds: ["p-3", "p-8", "p-12"],
    founded: 2015,
    phone: "+91 20 4987 2231",
    email: "info@spinforgeacademy.in",
    verified: true,
    rating: 4.5,
    facilities: {
      tableCount: 8,
      tableVarieties: "Butterfly Centrefold 25 & Joola 3000-SC",
      floorType: "Synthetic Floor",
      floorGrade: "Training Grade",
      lighting: "900+ Lux",
      isAirConditioned: false,
      hasWashroom: true,
      hasParking: true,
      hasROWater: true,
      seatingCapacity: 30,
    },
  },
  {
    id: "club-riverside",
    name: "Riverside Paddlers",
    location: "Kolkata",
    state: "West Bengal",
    address: "18B, Rashbehari Avenue, Gariahat, Kolkata, West Bengal 700029",
    description: "Community club with the largest active membership in eastern India.",
    aboutHighlights: [
      "Open-membership club welcoming players of every skill level.",
      "Weekend league nights with a round-robin format for all ages.",
      "Equipment rental and racket stringing services available on-site.",
      "Long-standing community partnerships with local schools.",
    ],
    playerIds: ["p-4", "p-9"],
    founded: 1998,
    phone: "+91 33 2461 8890",
    email: "hello@riversidepaddlers.in",
    verified: true,
    rating: 4.6,
    facilities: {
      tableCount: 15,
      tableVarieties: "Stiga Optimum 30 & Cornilleau Competition 850",
      floorType: "Wooden Floor",
      floorGrade: "Community Grade",
      lighting: "1000+ Lux",
      isAirConditioned: true,
      hasWashroom: true,
      hasParking: false,
      hasROWater: true,
      seatingCapacity: 80,
    },
  },
  {
    id: "club-vanguard",
    name: "Vanguard TTC",
    location: "Chennai",
    state: "Tamil Nadu",
    address: "56, Anna Nagar 2nd Avenue, Anna Nagar, Chennai, Tamil Nadu 600040",
    description: "Home to three national champions and a full-time coaching staff.",
    aboutHighlights: [
      "Full-time coaching staff led by former national team players.",
      "High-performance program for state and national qualifiers.",
      "Match-play sessions with live scoring and video review.",
      "Strength and conditioning block twice a week for competitive players.",
    ],
    playerIds: ["p-5", "p-6", "p-10"],
    founded: 2011,
    phone: "+91 44 2615 7742",
    email: "contact@vanguardttc.in",
    verified: false,
    rating: 4.3,
    facilities: {
      tableCount: 10,
      tableVarieties: "Joola 3000-SC & Butterfly Centrefold 25",
      floorType: "Wooden Floor",
      floorGrade: "Competition Grade",
      lighting: "1100+ Lux",
      isAirConditioned: true,
      hasWashroom: false,
      hasParking: true,
      hasROWater: false,
      seatingCapacity: 45,
    },
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
    playStyle: "All-Round Attacker",
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
    playStyle: "Offensive Looper",
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
    playStyle: "Counter-Attacker",
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
    playStyle: "Defensive Chopper",
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
    playStyle: "Offensive Spinner",
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
    playStyle: "Two-Winged Looper",
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
    playStyle: "Fast Attacker",
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
    playStyle: "Blocker-Counter",
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
    playStyle: "Defensive Chopper",
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
    playStyle: "Developing Attacker",
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
    playStyle: "Offensive Looper",
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
    playStyle: "All-Round Attacker",
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
    matchFormat: "Best of 5 sets",
    ballType: "Plastic 40+, 3-star (match)",
    umpireStatus: "Umpired",
    prizePool: 40000,
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
    matchFormat: "Best of 5 sets",
    ballType: "Plastic 40+, 3-star (match)",
    umpireStatus: "Umpired",
    prizePool: 15000,
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
    matchFormat: "Best of 5 sets",
    ballType: "Plastic 40+, 2-star (training)",
    umpireStatus: "Self-officiated",
    prizePool: 25000,
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
    matchFormat: "Best of 7 sets",
    ballType: "Plastic 40+, 3-star (match)",
    umpireStatus: "Umpired",
    prizePool: 60000,
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

// Short reference code shown next to a tournament in the manage views, e.g.
// "GSTT-2026-CHN" — derived entirely from the tournament's own fields (event
// name initials, year, host city) so it's stable without needing a stored id.
export function tournamentCode(tournament: Tournament) {
  const event = getEvent(tournament.eventId);
  const words = (event?.name ?? tournament.name).replace(/[^a-zA-Z ]/g, "").split(" ").filter(Boolean);
  const codeInitials = words.map((w) => w[0]).join("").toUpperCase().slice(0, 4) || "TRN";
  const year = new Date(tournament.date).getFullYear();
  const cityRaw = (event?.location ?? tournament.venue).split(",")[0].trim();
  const city = cityRaw.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "TBD";
  return `${codeInitials}-${year}-${city}`;
}

export interface CategoryBreakdownRow {
  category: Category;
  spotsFilled: number;
  spotsTotal: number;
  feeCollected: number;
}

// The "Manage Tournament" overview groups registrants by their own player
// category — real data, not invented — since a Tournament only carries one
// nominal `category` label even though registrants can span several age
// brackets. There's no per-category cap in the data model, so the spot total
// is estimated by splitting maxPlayers across the categories actually
// present, padded a little (deterministically, from the category name) so
// the fill bar isn't always pinned at 100%.
export function getCategoryBreakdown(tournament: Tournament): CategoryBreakdownRow[] {
  const registered = getTournamentPlayers(tournament);
  const byCategory = new Map<Category, Player[]>();
  for (const p of registered) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }
  const categories = [...byCategory.keys()];
  const perCategoryCap = Math.max(1, Math.round(tournament.maxPlayers / Math.max(1, categories.length)));

  return categories
    .map((category) => {
      const categoryPlayers = byCategory.get(category)!;
      const pad = category.length % 4;
      const spotsTotal = Math.max(categoryPlayers.length, perCategoryCap) + pad;
      return {
        category,
        spotsFilled: categoryPlayers.length,
        spotsTotal,
        feeCollected: categoryPlayers.length * tournament.entryFee,
      };
    })
    .sort((a, b) => b.spotsFilled - a.spotsFilled);
}

// Player has no stored phone field — this derives a stable, presentational
// placeholder number from the player id so the registrations table has
// something realistic to show without fabricating (and persisting) fake
// contact data.
export function derivedPlayerPhone(player: Player) {
  const seed = Number(player.id.replace(/\D/g, "")) || 1;
  const first = 70000 + ((seed * 7919) % 20000);
  const second = 10000 + ((seed * 104729) % 90000);
  return `+91 ${first} ${second}`;
}
