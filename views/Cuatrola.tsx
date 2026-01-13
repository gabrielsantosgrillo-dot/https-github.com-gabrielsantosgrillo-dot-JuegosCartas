
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Card, Suit, PlayedCard, PlayerPosition, GamePhase, BidType, Bid, 
  TeamScore, HandScore 
} from '../types';
import { 
  dealCuatrolaCards, determineWinner, findCurrentWinnerCard 
} from '../constants/cards';

const NAME_LIST = ['Daniel', 'Alejandro', 'Pablo', 'Gabriel', 'Fernando', 'Hugo', 'Lucía', 'María', 'Sara', 'Javier', 'Diego', 'Elena'];

const getRandomNames = () => {
  const shuffled = [...NAME_LIST].sort(() => Math.random() - 0.5);
  return {
    bottom: 'Tú',
    left: shuffled[0],
    top: shuffled[1],
    right: shuffled[2],
  };
};

const CARD_BACK_URL = 'https://raw.githubusercontent.com/gabrielsantosgrillo-dot/JuegosCartas/main/img/reverso.png';
const TARGET_SCORE = 20;

const CardBack: React.FC<{ className?: string }> = ({ className }) => {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className={`bg-emerald-900 flex items-center justify-center border-2 border-white/20 rounded-md ${className}`}>
        <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(45deg,#064e3b_0,#064e3b_2px,transparent_0,transparent_50%)] bg-[length:8px_8px]" />
      </div>
    );
  }
  return (
    <img 
      src={CARD_BACK_URL} 
      onError={() => setError(true)} 
      className={`object-cover w-full h-full rounded-md shadow-sm ${className}`} 
      alt="Reverso"
    />
  );
};

interface CuatrolaProps {
  onBack: () => void;
}

interface PendingCanto {
  player: PlayerPosition;
  suit: Suit;
  points: number;
  cards: Card[];
}

const Cuatrola: React.FC<CuatrolaProps> = ({ onBack }) => {
  const [playerNames] = useState<Record<PlayerPosition, string>>(getRandomNames());
  const [hands, setHands] = useState<Record<PlayerPosition, Card[]>>({
    bottom: [], left: [], top: [], right: []
  });
  const [trumpSuit, setTrumpSuit] = useState<Suit>('oros');
  const [trumpCard, setTrumpCard] = useState<Card | null>(null);
  const [currentDealer, setCurrentDealer] = useState<PlayerPosition>('bottom');
  const [manoPlayer, setManoPlayer] = useState<PlayerPosition>('left');
  const [gamePhase, setGamePhase] = useState<GamePhase>('bidding');
  const [bids, setBids] = useState<Bid[]>([]);
  const [currentBidder, setCurrentBidder] = useState<PlayerPosition>('left');
  const [currentTrick, setCurrentTrick] = useState<PlayedCard[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerPosition>('left');
  const [completedTricks, setCompletedTricks] = useState<number>(0);
  const [handScore, setHandScore] = useState<HandScore>({
    team1Points: 0, team2Points: 0, team1Tricks: 0, team2Tricks: 0, team1Canticos: 0, team2Canticos: 0
  });
  const [lastTrickWinner, setLastTrickWinner] = useState<PlayerPosition | null>(null);
  const [soloPlayer, setSoloPlayer] = useState<PlayerPosition | null>(null);
  const [teamScore, setTeamScore] = useState<TeamScore>({ team1: 0, team2: 0 });
  const [message, setMessage] = useState<string>('Repartiendo...');
  
  const [canticosRealizados, setCanticosRealizados] = useState<Record<PlayerPosition, Suit[]>>({
    bottom: [], left: [], top: [], right: []
  });
  const [handCantosHistory, setHandCantosHistory] = useState<PendingCanto[]>([]);
  const [activeCantoVisual, setActiveCantoVisual] = useState<PendingCanto | null>(null);
  const [humanCanCanto, setHumanCanCanto] = useState<PendingCanto[]>([]);

  // Referencias para evitar problemas de cierres (closures) en los timeouts
  const handsRef = useRef(hands);
  const completedTricksRef = useRef(completedTricks);
  const handScoreRef = useRef(handScore);
  const isActionInProgress = useRef(false);

  useEffect(() => { handsRef.current = hands; }, [hands]);
  useEffect(() => { completedTricksRef.current = completedTricks; }, [completedTricks]);
  useEffect(() => { handScoreRef.current = handScore; }, [handScore]);

  const getTeam = (player: PlayerPosition): 1 | 2 => {
    return player === 'bottom' || player === 'top' ? 1 : 2;
  };

  const getPartner = (player: PlayerPosition): PlayerPosition => {
    if (player === 'bottom') return 'top';
    if (player === 'top') return 'bottom';
    if (player === 'left') return 'right';
    return 'left';
  };

  const getNextPlayer = useCallback((player: PlayerPosition, currentSolo: PlayerPosition | null): PlayerPosition => {
    const order: PlayerPosition[] = ['bottom', 'left', 'top', 'right'];
    let index = order.indexOf(player);
    let nextPlayer: PlayerPosition;
    do {
      index = (index + 1) % 4;
      nextPlayer = order[index];
    } while (currentSolo && nextPlayer === getPartner(currentSolo));
    return nextPlayer;
  }, []);

  const finalizeHandScore = useCallback((winner: PlayerPosition, finalHandScore: HandScore) => {
    if (!finalHandScore) return;
    setLastTrickWinner(winner);
    setGamePhase('hand-over');

    const bonus1 = (getTeam(winner) === 1) ? 10 : 0;
    const bonus2 = (getTeam(winner) === 2) ? 10 : 0;
    
    setTeamScore(prev => {
      const totalP1 = finalHandScore.team1Points + bonus1 + finalHandScore.team1Canticos;
      const totalP2 = finalHandScore.team2Points + bonus2 + finalHandScore.team2Canticos;
      let t1Add = 0; 
      let t2Add = 0;

      const isSoloHand = soloPlayer !== null;

      if (finalHandScore.team1Tricks === 5) {
        t1Add = isSoloHand ? 6 : 4; 
      } else if (finalHandScore.team2Tricks === 5) {
        t2Add = isSoloHand ? 6 : 4;
      } else if (totalP1 > totalP2) {
        t1Add = isSoloHand ? 2 : 1;
      } else if (totalP2 > totalP1) {
        t2Add = isSoloHand ? 2 : 1;
      } else {
        if (getTeam(winner) === 1) t1Add = isSoloHand ? 2 : 1;
        else t2Add = isSoloHand ? 2 : 1;
      }

      const nextScore = { team1: prev.team1 + t1Add, team2: prev.team2 + t2Add };
      if (nextScore.team1 >= TARGET_SCORE || nextScore.team2 >= TARGET_SCORE) {
        setTimeout(() => setGamePhase('game-over'), 1200);
      }
      return nextScore;
    });
  }, [soloPlayer]);

  const checkAvailableCantos = useCallback((hand: Card[], player: PlayerPosition, currentTrump: Suit): PendingCanto[] => {
    const suits: Suit[] = ['oros', 'copas', 'espadas', 'bastos'];
    const available: PendingCanto[] = [];
    suits.forEach(s => {
      if (canticosRealizados[player].includes(s)) return;
      const has11 = hand.find(c => c.number === 11 && c.suit === s);
      const has12 = hand.find(c => c.number === 12 && c.suit === s);
      if (has11 && has12) {
        available.push({
          player, suit: s,
          points: s === currentTrump ? 40 : 20,
          cards: [has11, has12]
        });
      }
    });
    return available;
  }, [canticosRealizados]);

  const performCanto = useCallback((canto: PendingCanto) => {
    const nextScore = { ...handScoreRef.current };
    if (getTeam(canto.player) === 1) nextScore.team1Canticos += canto.points;
    else nextScore.team2Canticos += canto.points;

    setHandScore(nextScore);
    setCanticosRealizados(prev => ({ ...prev, [canto.player]: [...prev[canto.player], canto.suit] }));
    setHandCantosHistory(prev => [...prev, canto]);
    setActiveCantoVisual(canto);
    setHumanCanCanto([]);

    setTimeout(() => {
      setActiveCantoVisual(null);
      if (completedTricksRef.current === 5) {
        finalizeHandScore(canto.player, nextScore);
      } else {
        setCurrentPlayer(canto.player);
        isActionInProgress.current = false;
      }
    }, 2000);
  }, [finalizeHandScore]);

  const playCard = useCallback((card: Card, player: PlayerPosition) => {
    if (currentPlayer !== player || isActionInProgress.current) return;
    isActionInProgress.current = true;
    
    const newTrick = [...currentTrick, { card, player }];
    setCurrentTrick(newTrick);
    setHands(prev => ({ ...prev, [player]: prev[player].filter(c => c.id !== card.id) }));
    
    const expectedSize = soloPlayer ? 3 : 4;
    
    if (newTrick.length === expectedSize) {
      setTimeout(() => {
        const leadSuit = newTrick[0].card.suit;
        const winner = determineWinner(newTrick, trumpSuit, leadSuit);
        const trickPoints = newTrick.reduce((sum, p) => sum + p.card.points, 0);
        const nextTrickCount = completedTricksRef.current + 1;
        
        // Calculamos el nuevo puntaje síncronamente antes de asignarlo
        const nextHandScore = { ...handScoreRef.current };
        if (getTeam(winner) === 1) { 
          nextHandScore.team1Points += trickPoints; 
          nextHandScore.team1Tricks += 1; 
        } else { 
          nextHandScore.team2Points += trickPoints; 
          nextHandScore.team2Tricks += 1; 
        }
        
        setHandScore(nextHandScore);
        setCompletedTricks(nextTrickCount);
        setCurrentTrick([]);

        const currentHand = handsRef.current[winner].filter(c => !newTrick.some(nt => nt.player === winner && nt.card.id === c.id));
        const availableCantos = checkAvailableCantos(currentHand, winner, trumpSuit);
        
        if (availableCantos.length > 0) {
          if (winner === 'bottom') {
            setHumanCanCanto(availableCantos);
            isActionInProgress.current = false;
          } else {
            performCanto(availableCantos.sort((a, b) => b.points - a.points)[0]);
          }
        } else {
          if (nextTrickCount === 5) {
            finalizeHandScore(winner, nextHandScore);
          } else {
            setCurrentPlayer(winner);
            isActionInProgress.current = false;
          }
        }
      }, 800);
    } else {
      setCurrentPlayer(getNextPlayer(player, soloPlayer));
      isActionInProgress.current = false;
    }
  }, [currentPlayer, currentTrick, trumpSuit, soloPlayer, getNextPlayer, checkAvailableCantos, performCanto, finalizeHandScore]);

  const startNewHand = useCallback(() => {
    const dealt = dealCuatrolaCards();
    const order: PlayerPosition[] = ['bottom', 'left', 'top', 'right'];
    const dealerIndex = order.indexOf(currentDealer);
    const manoIndex = (dealerIndex + 1) % 4;
    const starter = order[manoIndex];
    const painterCard = dealt[dealerIndex][dealt[dealerIndex].length - 1];
    
    setHands({ bottom: dealt[0], left: dealt[1], top: dealt[2], right: dealt[3] });
    setTrumpSuit(painterCard.suit);
    setTrumpCard(painterCard);
    setManoPlayer(starter);
    setGamePhase('bidding');
    setBids([]);
    setCurrentTrick([]);
    setCompletedTricks(0);
    setHandScore({ team1Points: 0, team2Points: 0, team1Tricks: 0, team2Tricks: 0, team1Canticos: 0, team2Canticos: 0 });
    setLastTrickWinner(null);
    setSoloPlayer(null);
    setCanticosRealizados({ bottom: [], left: [], top: [], right: [] });
    setHandCantosHistory([]);
    setActiveCantoVisual(null);
    setHumanCanCanto([]);
    
    setCurrentBidder(starter);
    setCurrentPlayer(starter);
    setMessage(`${playerNames[currentDealer].toUpperCase()} PINTA EL ${painterCard.name.toUpperCase()}`);
    isActionInProgress.current = false;
  }, [currentDealer, playerNames]);

  const makeBid = useCallback((bid: BidType) => {
    isActionInProgress.current = false;
    const newBids = [...bids, { player: currentBidder, bid }];
    setBids(newBids);
    let activeSolo = soloPlayer;
    if (bid === 'solo') {
      activeSolo = currentBidder;
      setSoloPlayer(currentBidder);
      const partner = getPartner(currentBidder);
      setHands(prev => ({ ...prev, [partner]: [] }));
    }
    const nextBidder = getNextPlayer(currentBidder, activeSolo);
    if (newBids.length === 4 || activeSolo) {
      setGamePhase('playing');
      const painterName = playerNames[currentDealer].toUpperCase();
      setMessage(activeSolo ? `${playerNames[activeSolo].toUpperCase()} VA SOLO (PINTÓ ${painterName})` : `A JUGAR (PINTÓ ${painterName})`);
      let starter = manoPlayer;
      if (activeSolo && starter === getPartner(activeSolo)) starter = getNextPlayer(starter, activeSolo);
      setCurrentPlayer(starter);
    } else {
      setCurrentBidder(nextBidder);
    }
  }, [bids, currentBidder, currentDealer, getNextPlayer, playerNames, soloPlayer, manoPlayer]);

  useEffect(() => {
    if (gamePhase === 'playing' && currentPlayer !== 'bottom' && !isActionInProgress.current) {
      const timer = setTimeout(() => {
        const playable = getPlayableCards(hands[currentPlayer], currentTrick, trumpSuit);
        if (playable.length > 0) playCard(playable.sort((a,b) => b.hierarchy - a.hierarchy)[0], currentPlayer);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, currentPlayer, currentTrick, hands, trumpSuit, playCard]);

  useEffect(() => {
    if (gamePhase === 'bidding' && currentBidder !== 'bottom') {
      const timer = setTimeout(() => makeBid(evaluateAISolo(hands[currentBidder], trumpSuit) ? 'solo' : 'paso'), 1000);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, currentBidder, makeBid, hands, trumpSuit]);

  useEffect(() => { startNewHand(); }, []);

  const getPlayableCards = (hand: Card[], trick: PlayedCard[], trump: Suit): Card[] => {
    if (trick.length === 0) return hand;
    const leadSuit = trick[0].card.suit;
    const winnerCard = findCurrentWinnerCard(trick, trump);
    const winnerIsTrump = winnerCard.card.suit === trump;
    const hasLead = hand.some(c => c.suit === leadSuit);
    const hasTrump = hand.some(c => c.suit === trump);
    if (hasLead) {
      const leadCards = hand.filter(c => c.suit === leadSuit);
      if (winnerIsTrump) return leadCards;
      const canBeat = leadCards.some(c => c.hierarchy > winnerCard.card.hierarchy);
      return canBeat ? leadCards.filter(c => c.hierarchy > winnerCard.card.hierarchy) : leadCards;
    }
    if (hasTrump) {
      const trumpCards = hand.filter(c => c.suit === trump);
      if (winnerIsTrump) {
        const canBeat = trumpCards.some(c => c.hierarchy > winnerCard.card.hierarchy);
        return canBeat ? trumpCards.filter(c => c.hierarchy > winnerCard.card.hierarchy) : hand;
      }
      return trumpCards;
    }
    return hand;
  };

