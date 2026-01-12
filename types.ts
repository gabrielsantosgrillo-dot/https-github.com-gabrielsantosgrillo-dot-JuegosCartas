
export type Suit = 'oros' | 'copas' | 'espadas' | 'bastos';
export type PlayerPosition = 'bottom' | 'left' | 'top' | 'right';

export interface Card {
  id: string;
  name: string;
  imageUrl: string;
  number: number;
  suit: Suit;
  value: number; // Para Siete y Media
  points: number; // Para Cuatrola/Tute (As=11, 3=10, etc.)
  hierarchy: number; // Para jerarquía de bazas
}

export interface PlayedCard {
  card: Card;
  player: PlayerPosition;
}

export type GamePhase = 'bidding' | 'playing' | 'hand-over' | 'game-over';
export type BidType = 'paso' | 'solo' | 'cuatrola' | 'quintola';

export interface Bid {
  player: PlayerPosition;
  bid: BidType;
}

export interface TeamScore {
  team1: number;
  team2: number;
}

export interface HandScore {
  team1Points: number;
  team2Points: number;
  team1Tricks: number;
  team2Tricks: number;
  team1Canticos: number;
  team2Canticos: number;
}

export interface ShownCantico {
  player: PlayerPosition;
  suit: Suit;
  points: number;
  cards: Card[];
}
