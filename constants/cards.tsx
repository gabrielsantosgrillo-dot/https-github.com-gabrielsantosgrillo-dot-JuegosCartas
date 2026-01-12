
import { Card, Suit, PlayedCard, PlayerPosition } from '../types';

export const getPoints = (number: number): number => {
  switch (number) {
    case 1: return 11;
    case 3: return 10;
    case 12: return 4;
    case 11: return 3;
    case 10: return 2;
    default: return 0;
  }
};

// Hierarchy for Tute/Cuatrola: 1 > 3 > 12 > 11 > 10 > 7 > 6 > 5 > 4 > 2
export const getHierarchy = (number: number): number => {
  switch (number) {
    case 1: return 10;
    case 3: return 9;
    case 12: return 8;
    case 11: return 7;
    case 10: return 6;
    case 7: return 5;
    case 6: return 4;
    case 5: return 3;
    case 4: return 2;
    case 2: return 1;
    default: return 0;
  }
};

const BASE_IMG = 'https://raw.githubusercontent.com/gabrielsantosgrillo-dot/JuegosCartas/main/img/';

export const CARDS: Card[] = [];
const suits: Suit[] = ['oros', 'copas', 'espadas', 'bastos'];
const numbers = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

suits.forEach(suit => {
  numbers.forEach(num => {
    const idNum = num < 10 ? `0${num}` : `${num}`;
    CARDS.push({
      id: `${idNum}-${suit}`,
      name: `${num === 1 ? 'As' : num === 10 ? 'Sota' : num === 11 ? 'Caballo' : num === 12 ? 'Rey' : num} de ${suit}`,
      imageUrl: `${BASE_IMG}${idNum}-${suit}.png`,
      number: num,
      suit: suit,
      value: num >= 10 ? 0.5 : num,
      points: getPoints(num),
      hierarchy: getHierarchy(num)
    });
  });
});

export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export const createFullDeck = (): Card[] => [...CARDS];

export const calculateScore75 = (hand: Card[]): number => {
  return hand.reduce((acc, card) => acc + card.value, 0);
};

export const dealCuatrolaCards = (): Card[][] => {
  const cuatrolaNumbers = [1, 3, 10, 11, 12];
  const cuatrolaDeck = CARDS.filter(c => cuatrolaNumbers.includes(c.number));
  const deck = shuffleDeck([...cuatrolaDeck]);
  return [
    deck.slice(0, 5),
    deck.slice(5, 10),
    deck.slice(10, 15),
    deck.slice(15, 20)
  ];
};

// Deals cards for Tute game.
export const dealTuteCards = (): { hands: Card[][], deck: Card[], trumpCard: Card } => {
  const fullDeck = shuffleDeck(createFullDeck());
  const hands: Card[][] = [[], [], [], []];
  
  // Deal 8 cards to each player (total 32)
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 4; j++) {
      hands[j].push(fullDeck.shift()!);
    }
  }
  
  // The next card is the trump card
  const trumpCard = fullDeck.shift()!;
  
  // Remaining deck including trump at the bottom
  const deck = [...fullDeck, trumpCard];
  
  return { hands, deck, trumpCard };
};

export function findCurrentWinnerCard(trick: PlayedCard[], trumpSuit: Suit): PlayedCard {
  let best = trick[0];
  const leadSuit = trick[0].card.suit;

  for (let i = 1; i < trick.length; i++) {
    const current = trick[i];
    const bestIsTrump = best.card.suit === trumpSuit;
    const currentIsTrump = current.card.suit === trumpSuit;

    if (currentIsTrump && !bestIsTrump) {
      best = current;
    } else if (currentIsTrump && bestIsTrump) {
      if (current.card.hierarchy > best.card.hierarchy) {
        best = current;
      }
    } else if (!currentIsTrump && !bestIsTrump) {
      if (current.card.suit === leadSuit && best.card.suit === leadSuit) {
        if (current.card.hierarchy > best.card.hierarchy) {
          best = current;
        }
      } else if (current.card.suit === leadSuit && best.card.suit !== leadSuit) {
        best = current;
      }
    }
  }
  return best;
}

export const determineWinner = (trick: PlayedCard[], trumpSuit: Suit, leadSuit: Suit): PlayerPosition => {
  return findCurrentWinnerCard(trick, trumpSuit).player;
};
