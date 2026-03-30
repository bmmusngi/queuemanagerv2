/**
 * Smart Drafting Utility
 * Isolated matchmaking logic for experimental On-Deck capabilities.
 */

export interface DraftSettings {
  levelWeight: number;    // Weight for skill parity (L1-L5)
  idleWeight: number;     // Weight for wait time (longest idle)
  historyWeight: number;  // Weight for avoiding repeat partners/opponents
  tournamentMode: boolean; // If true, prioritizes "Partners" staying together
}

export interface Player {
  id: string;
  name: string;
  levelWeight: number;
  partnerId?: string | null;
  playingStatus: string;
  // ... other fields
}

export interface Game {
  teamA: Player[];
  teamB: Player[];
  status: string;
}

/**
 * Suggests a match (Team A and Team B) based on available players and history.
 */
export const suggestMatch = (
  availablePlayers: Player[],
  sessionGames: Game[],
  settings: DraftSettings
) => {
  if (availablePlayers.length < 4) return null;

  // 1. Separate Partners vs Singles
  const partners: Player[][] = [];
  const processedPartnerIds = new Set<string>();

  const singles: Player[] = [];

  availablePlayers.forEach(p => {
    if (p.partnerId && !processedPartnerIds.has(p.id)) {
      const partner = availablePlayers.find(ap => ap.id === p.partnerId);
      if (partner) {
        partners.push([p, partner]);
        processedPartnerIds.add(p.id);
        processedPartnerIds.add(partner.id);
      } else {
        singles.push(p);
      }
    } else if (!p.partnerId) {
      singles.push(p);
    }
  });

  // 2. Formation Priority: Pair vs Pair > Pair vs Singles > Singles vs Singles
  let teamA: Player[] = [];
  let teamB: Player[] = [];

  if (partners.length >= 2) {
    // Best case: Tournament Practice (Pair vs Pair)
    teamA = partners[0];
    teamB = partners[1];
  } else if (partners.length === 1 && singles.length >= 2) {
    // Mixed: Pair vs (Single + Single)
    teamA = partners[0];
    teamB = singles.slice(0, 2);
  } else if (singles.length >= 4) {
    // Standard: (Single + Single) vs (Single + Single)
    // For now, take the first 4 (most idle if the input is sorted)
    teamA = [singles[0], singles[1]];
    teamB = [singles[2], singles[3]];
  } else {
    return null; // Not enough players to form a full doubles match
  }

  return { teamA, teamB, type: 'DOUBLES' };
};
