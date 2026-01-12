
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

const CARD_BACK_URL = 'https://raw.githubusercontent.com/mcmd/playingcards.io-spanish.playing.cards/master/img/reverso.png';
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

  const isActionInProgress = useRef(false);

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

  const finalizeHandScore = useCallback((winner: PlayerPosition, finalHandScore: HandScore) => {
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

      // REGLA PRIORITARIA: Cuatrola o Sextola por bazas
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

  const checkAvailableCantos = (hand: Card[], player: PlayerPosition, currentTrump: Suit): PendingCanto[] => {
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
  };

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
        const nextTrickCount = completedTricks + 1;
        
        // Actualizamos puntuación y guardamos la referencia para el cierre si es la última baza
        setHandScore(prev => {
          const next = { ...prev };
          if (getTeam(winner) === 1) { next.team1Points += trickPoints; next.team1Tricks += 1; }
          else { next.team2Points += trickPoints; next.team2Tricks += 1; }
          
          setCurrentTrick([]);
          const availableCantos = checkAvailableCantos(hands[winner], winner, trumpSuit);
          if (availableCantos.length > 0) {
            if (winner === 'bottom') {
              setHumanCanCanto(availableCantos);
              isActionInProgress.current = false;
            } else {
              performCanto(availableCantos.sort((a, b) => b.points - a.points)[0], next);
            }
          } else {
            if (nextTrickCount === 5) {
              finalizeHandScore(winner, next);
            } else {
              setCurrentPlayer(winner);
              isActionInProgress.current = false;
            }
          }
          return next;
        });
        setCompletedTricks(nextTrickCount);
      }, 800);
    } else {
      setCurrentPlayer(getNextPlayer(player, soloPlayer));
      isActionInProgress.current = false;
    }
  }, [currentPlayer, currentTrick, trumpSuit, soloPlayer, completedTricks, getNextPlayer, hands, finalizeHandScore]);

  const performCanto = useCallback((canto: PendingCanto, updatedHandScore?: HandScore) => {
    setCanticosRealizados(prev => ({ ...prev, [canto.player]: [...prev[canto.player], canto.suit] }));
    setHandCantosHistory(prev => [...prev, canto]);
    setHandScore(prev => {
      const next = { ...prev };
      if (getTeam(canto.player) === 1) next.team1Canticos += canto.points;
      else next.team2Canticos += canto.points;
      return next;
    });
    setActiveCantoVisual(canto);
    setHumanCanCanto([]);
    setTimeout(() => {
      setActiveCantoVisual(null);
      const scoreToUse = updatedHandScore || handScore;
      if (completedTricks === 5) {
        finalizeHandScore(canto.player, scoreToUse);
      } else {
        setCurrentPlayer(canto.player);
        isActionInProgress.current = false;
      }
    }, 2000);
  }, [completedTricks, finalizeHandScore, handScore]);

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

  const evaluateAISolo = (hand: Card[], trump: Suit): boolean => {
    const trumps = hand.filter(c => c.suit === trump);
    return (trumps.some(c => c.number === 1) && trumps.some(c => c.number === 3) && trumps.length >= 3) || (trumps.some(c => c.number === 1) && trumps.length >= 4);
  };

  const PlayerLabel = ({ position }: { position: PlayerPosition }) => {
    const isDealer = currentDealer === position;
    const isCurrent = currentPlayer === position;
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${isCurrent ? 'bg-emerald-500/40 border-emerald-400 scale-110 shadow-lg' : 'bg-slate-900/60 border-white/5'}`}>
        <span className={`text-[9px] font-black uppercase tracking-widest ${isCurrent ? 'text-white' : 'text-slate-500'}`}>{playerNames[position]}</span>
        {isDealer && <span className="text-emerald-400 text-[6px] font-black italic underline">DA</span>}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden relative text-white">
      {/* HUD Superior */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/95 border-b border-white/10 z-20 shrink-0">
        <button onClick={onBack} className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 active:scale-90 transition-transform">MENÚ</button>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-[7px] text-slate-500 font-black uppercase tracking-widest">NOSOTROS</p>
            <p className="text-3xl font-black text-emerald-400 leading-none">{teamScore.team1}</p>
          </div>
          <div className="flex flex-col items-center">
            {trumpCard && (
              <div className="w-8 h-12 bg-white rounded border-2 border-amber-500 shadow-xl overflow-hidden"><img src={trumpCard.imageUrl} className="w-full h-full object-contain" /></div>
            )}
            <p className="text-[7px] font-black text-amber-500 uppercase mt-1 italic">{trumpSuit}</p>
          </div>
          <div className="text-center">
            <p className="text-[7px] text-slate-500 font-black uppercase tracking-widest">ELLOS</p>
            <p className="text-3xl font-black text-rose-500 leading-none">{teamScore.team2}</p>
          </div>
        </div>
        <div className="text-[8px] font-black text-slate-700 italic">FIN {TARGET_SCORE}</div>
      </div>

      <div className="bg-emerald-500/10 py-1 text-center text-emerald-400 text-[9px] font-bold uppercase tracking-[0.2em] border-b border-emerald-500/20 z-20 shrink-0 shadow-inner">{message}</div>

      <div className="flex-1 relative flex flex-col items-center justify-between py-12 px-2 overflow-hidden">
        {/* Historial de Cánticos */}
        <div className="absolute top-24 left-4 flex flex-col gap-2 z-30 pointer-events-none max-h-[40%] overflow-hidden">
          {handCantosHistory.map((hc, idx) => (
            <div key={idx} className="bg-slate-950/80 px-2 py-1.5 rounded-xl border border-amber-500/40 shadow-xl animate-in slide-in-from-left">
              <p className="text-[7px] font-black text-amber-400 uppercase tracking-widest mb-1">{playerNames[hc.player]}: +{hc.points}</p>
              <div className="flex gap-1">{hc.cards.map(c => <div key={c.id} className="w-4 h-6 bg-white rounded-sm overflow-hidden"><img src={c.imageUrl} className="w-full h-full object-contain" /></div>)}</div>
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_100%)] opacity-80"></div>

        {/* Rival Superior */}
        <div className="flex flex-col items-center gap-4 z-10 shrink-0">
          <PlayerLabel position="top" />
          <div className="flex -space-x-8 h-16 items-center">
            {hands.top.length > 0 ? hands.top.map((_, i) => <div key={i} className="w-10 h-16 bg-white rounded-md shadow-lg border border-slate-300 overflow-hidden transform scale-95"><CardBack /></div>)
            : soloPlayer && getPartner(soloPlayer) === 'top' && <div className="text-[9px] font-black text-amber-500 italic opacity-50">Retirado</div>}
          </div>
        </div>

        {/* Tapete Central */}
        <div className="flex-1 w-full flex items-center justify-center relative min-h-0">
          <div className="w-72 h-64 md:w-96 md:h-80 bg-[radial-gradient(circle_at_center,_#065f46_0%,_#020617_100%)] rounded-[120px] border-4 border-white/5 shadow-2xl flex items-center justify-center relative">
            {gamePhase === 'bidding' ? (
              <div className="text-center space-y-4 px-6 animate-in zoom-in duration-300">
                <p className="text-[10px] font-black text-emerald-500/40 uppercase tracking-widest">SUBASTA</p>
                {currentBidder === 'bottom' ? (
                  <div className="flex gap-4">
                    <button onClick={() => makeBid('paso')} className="px-6 py-2.5 bg-slate-900 border border-white/10 rounded-full text-[10px] font-black uppercase text-white hover:bg-slate-800 active:scale-95 transition-all">PASO</button>
                    <button onClick={() => makeBid('solo')} className="px-6 py-2.5 bg-emerald-600 rounded-full text-[10px] font-black uppercase text-white shadow-lg shadow-emerald-900/40 active:translate-y-0.5 transition-all">IR SOLO</button>
                  </div>
                ) : <p className="text-emerald-500 text-[10px] font-black animate-pulse uppercase">{playerNames[currentBidder]} pensando...</p>}
              </div>
            ) : (
              <div className="relative w-full h-full">
                {currentTrick.map((p, idx) => {
                  const offsets: Record<PlayerPosition, string> = {
                    bottom: 'bottom-8 left-1/2 -translate-x-1/2 translate-y-2',
                    top: 'top-8 left-1/2 -translate-x-1/2 -translate-y-2',
                    left: 'left-8 top-1/2 -translate-y-1/2 rotate-90 -translate-x-2',
                    right: 'right-8 top-1/2 -translate-y-1/2 -rotate-90 translate-x-2'
                  };
                  return (
                    <div key={idx} className={`absolute transform transition-all duration-300 ${offsets[p.player]}`}>
                      <div className="w-14 h-20 md:w-16 md:h-24 bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden"><img src={p.card.imageUrl} className="w-full h-full object-contain" /></div>
                    </div>
                  );
                })}
                {activeCantoVisual && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-50 animate-in zoom-in duration-300">
                    <div className="bg-slate-950/95 p-6 rounded-3xl border border-amber-500 shadow-2xl text-center">
                      <p className="text-amber-500 font-black text-xs uppercase mb-4">{playerNames[activeCantoVisual.player]} canta las {activeCantoVisual.points}</p>
                      <div className="flex gap-2">{activeCantoVisual.cards.map(c => <div key={c.id} className="w-16 h-24 bg-white rounded border border-amber-500/20"><img src={c.imageUrl} className="w-full h-full object-contain" /></div>)}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Laterales */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
          <PlayerLabel position="left" /><div className="flex flex-col -space-y-12">{hands.left.map((_, i) => <div key={i} className="w-10 h-16 bg-white rounded-md shadow-lg rotate-90"><CardBack /></div>)}</div>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
          <PlayerLabel position="right" /><div className="flex flex-col -space-y-12">{hands.right.map((_, i) => <div key={i} className="w-10 h-16 bg-white rounded-md shadow-lg -rotate-90"><CardBack /></div>)}</div>
        </div>

        {/* Jugador */}
        <div className="w-full flex flex-col items-center gap-6 z-20 shrink-0">
          <PlayerLabel position="bottom" />
          {humanCanCanto.length > 0 && (
            <div className="flex gap-4 mb-2">
              {humanCanCanto.map((c, i) => (
                <button key={i} onClick={() => performCanto(c)} className="px-5 py-2.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full uppercase shadow-lg active:scale-95 transition-all">CANTAR {c.points}</button>
              ))}
              <button onClick={() => { setHumanCanCanto([]); if(completedTricks === 5) finalizeHandScore(currentPlayer, handScore); else isActionInProgress.current = false; }} className="px-5 py-2.5 bg-slate-800 text-white font-black text-[10px] rounded-full uppercase">PASAR</button>
            </div>
          )}
          <div className="flex justify-center items-end gap-2 w-full max-w-[95vw] h-32 px-4 pb-2">
            {hands.bottom.length > 0 ? (
              hands.bottom.map((card) => {
                const playable = getPlayableCards(hands.bottom, currentTrick, trumpSuit);
                const isTurn = gamePhase === 'playing' && currentPlayer === 'bottom';
                const isPlayable = isTurn && playable.some(c => c.id === card.id);
                return (
                  <button key={card.id} disabled={!isPlayable && isTurn} onClick={() => playCard(card, 'bottom')} className={`relative transition-all duration-300 transform ${isPlayable ? 'hover:-translate-y-12 active:scale-90 z-30' : 'translate-y-4'}`} style={{ width: '18vw', maxWidth: '75px' }}>
                    <div className={`aspect-[2/3] bg-white rounded-lg shadow-xl overflow-hidden border-2 ${isPlayable ? 'border-emerald-400' : 'border-slate-800'}`}><img src={card.imageUrl} className="w-full h-full object-contain" /></div>
                  </button>
                );
              })
            ) : soloPlayer && getPartner(soloPlayer) === 'bottom' && <div className="text-[12px] font-black text-amber-500 italic uppercase bg-amber-500/10 px-6 py-2 rounded-full border border-amber-500/30">Retirado</div>}
          </div>
        </div>
      </div>

      {/* Resumen de la Mano (DISEÑO 2 COLUMNAS) */}
      {(gamePhase === 'hand-over' || gamePhase === 'game-over') && (
        <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-3xl text-center flex flex-col">
            
            {/* Banner Pleno Bazas (Cuatrola / Sextola) */}
            {(handScore.team1Tricks === 5 || handScore.team2Tricks === 5) && (
              <div className="mb-6 animate-pulse px-4">
                <div className="bg-emerald-500 text-slate-950 text-[10px] md:text-[12px] font-black py-3 rounded-full shadow-lg uppercase tracking-widest w-full break-words">
                  {soloPlayer ? '¡SEXTOLA CONSIGUIENTE! (+6)' : '¡CUATROLA CONSIGUIENTE! (+4)'}
                </div>
              </div>
            )}

            <h2 className="text-xl md:text-3xl font-black text-emerald-500 mb-6 uppercase tracking-tighter italic border-b border-white/5 pb-4">
              {gamePhase === 'game-over' ? 'RESULTADO FINAL' : 'RESUMEN DE LA MANO'}
            </h2>

            <div className="grid grid-cols-2 gap-4 md:gap-8 mb-8">
               {/* COLUMNA NOSOTROS */}
               <div className="flex flex-col gap-4">
                  <div className={`p-4 md:p-6 rounded-2xl border transition-all ${getTeam(lastTrickWinner || 'bottom') === 1 ? 'bg-emerald-500/10 border-emerald-500/40 shadow-emerald-500/20' : 'bg-slate-800/50 border-white/5'}`}>
                    <p className="text-[8px] font-black text-emerald-500 uppercase mb-1">MARCADOR</p>
                    <p className="text-3xl md:text-5xl font-black text-white">{teamScore.team1}</p>
                  </div>
                  <div className="bg-black/30 p-3 md:p-4 rounded-xl text-left flex flex-col gap-2 border border-white/5">
                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest border-b border-white/5 pb-1 mb-1">Nosotros</p>
                    <div className="flex justify-between text-[10px] md:text-xs">
                      <span className="text-slate-400">Bazas:</span>
                      <span className="text-white font-black">{handScore.team1Tricks} / 5</span>
                    </div>
                    <div className="flex justify-between text-[10px] md:text-xs">
                      <span className="text-slate-400">Puntos:</span>
                      <span className="text-white font-bold">{handScore.team1Points}</span>
                    </div>
                    <div className="flex justify-between text-[10px] md:text-xs">
                      <span className="text-slate-400">Cantes:</span>
                      <span className="text-amber-400 font-bold">+{handScore.team1Canticos}</span>
                    </div>
                    <div className="flex justify-between text-[10px] md:text-xs">
                      <span className="text-slate-400">Las 10:</span>
                      <span className={getTeam(lastTrickWinner || 'left') === 1 ? 'text-emerald-400' : 'text-slate-600'}>
                        {getTeam(lastTrickWinner || 'left') === 1 ? '+10' : '0'}
                      </span>
                    </div>
                  </div>
               </div>

               {/* COLUMNA ELLOS */}
               <div className="flex flex-col gap-4">
                  <div className={`p-4 md:p-6 rounded-2xl border transition-all ${getTeam(lastTrickWinner || 'bottom') === 2 ? 'bg-rose-500/10 border-rose-500/40 shadow-rose-500/20' : 'bg-slate-800/50 border-white/5'}`}>
                    <p className="text-[8px] font-black text-rose-500 uppercase mb-1">MARCADOR</p>
                    <p className="text-3xl md:text-5xl font-black text-white">{teamScore.team1}</p>
                  </div>
                  <div className="bg-black/30 p-3 md:p-4 rounded-xl text-left flex flex-col gap-2 border border-white/5">
                    <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest border-b border-white/5 pb-1 mb-1">Ellos</p>
                    <div className="flex justify-between text-[10px] md:text-xs">
                      <span className="text-slate-400">Bazas:</span>
                      <span className="text-white font-black">{handScore.team2Tricks} / 5</span>
                    </div>
                    <div className="flex justify-between text-[10px] md:text-xs">
                      <span className="text-slate-400">Puntos:</span>
                      <span className="text-white font-bold">{handScore.team2Points}</span>
                    </div>
                    <div className="flex justify-between text-[10px] md:text-xs">
                      <span className="text-slate-400">Cantes:</span>
                      <span className="text-amber-400 font-bold">+{handScore.team2Canticos}</span>
                    </div>
                    <div className="flex justify-between text-[10px] md:text-xs">
                      <span className="text-slate-400">Las 10:</span>
                      <span className={getTeam(lastTrickWinner || 'bottom') === 2 ? 'text-rose-400' : 'text-slate-600'}>
                        {getTeam(lastTrickWinner || 'bottom') === 2 ? '+10' : '0'}
                      </span>
                    </div>
                  </div>
               </div>
            </div>

            {gamePhase === 'game-over' && (
              <div className="mb-6 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <p className="text-amber-400 font-black text-lg md:text-xl uppercase italic">
                  {teamScore.team1 >= TARGET_SCORE ? '¡VICTORIA PARA NOSOTROS!' : '¡ELLOS GANAN LA PARTIDA!'}
                </p>
              </div>
            )}

            <button 
              onClick={() => { if (gamePhase === 'game-over') window.location.reload(); else { const order: PlayerPosition[] = ['bottom', 'left', 'top', 'right']; setCurrentDealer(prev => order[(order.indexOf(prev) + 1) % 4]); startNewHand(); } }} 
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm md:text-base rounded-full shadow-lg active:scale-95 transition-all uppercase tracking-widest"
            >
              {gamePhase === 'game-over' ? 'REINICIAR TODO' : 'SIGUIENTE MANO'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cuatrola;
