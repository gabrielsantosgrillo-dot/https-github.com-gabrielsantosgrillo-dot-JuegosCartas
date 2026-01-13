
import React, { useState, useCallback, useEffect } from 'react';
import { Card, Suit, PlayerPosition, PlayedCard, GamePhase, ShownCantico } from '../types';
import { dealTuteCards, determineWinner } from '../constants/cards';

const NAME_LIST = ['Daniel', 'Alejandro', 'Pablo', 'Gabriel', 'Fernando', 'Hugo', 'Lucía', 'María', 'Sara'];

const getRandomNames = () => {
  const shuffled = [...NAME_LIST].sort(() => Math.random() - 0.5);
  return { bottom: 'Tú', left: shuffled[0], top: shuffled[1], right: shuffled[2] };
};

const CARD_BACK = 'https://raw.githubusercontent.com/mcmd/playingcards.io-spanish.playing.cards/refs/heads/master/img/back.png';
const TARGET_GAME_POINTS = 5;

interface PlayerScore {
  points: number;
  gamePoints: number;
}

interface TuteProps { onBack: () => void; }

const Tute: React.FC<TuteProps> = ({ onBack }) => {
  const [playerNames] = useState<Record<PlayerPosition, string>>(getRandomNames());
  const [hands, setHands] = useState<Record<PlayerPosition, Card[]>>({ bottom: [], left: [], top: [], right: [] });
  const [deck, setDeck] = useState<Card[]>([]);
  const [trumpSuit, setTrumpSuit] = useState<Suit>('oros');
  const [trumpCard, setTrumpCard] = useState<Card | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('playing');
  const [currentTrick, setCurrentTrick] = useState<PlayedCard[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerPosition>('bottom');
  const [deckEmpty, setDeckEmpty] = useState(false);
  const [playerScores, setPlayerScores] = useState<Record<PlayerPosition, PlayerScore>>({
    bottom: { points: 0, gamePoints: 0 }, left: { points: 0, gamePoints: 0 },
    top: { points: 0, gamePoints: 0 }, right: { points: 0, gamePoints: 0 },
  });
  const [canticosUsed, setCanticosUsed] = useState<Record<PlayerPosition, string[]>>({ bottom: [], left: [], top: [], right: [] });
  const [shownCanticos, setShownCanticos] = useState<ShownCantico[]>([]);
  const [message, setMessage] = useState('¡Empieza la partida!');
  const [trumpExchangeAvailable, setTrumpExchangeAvailable] = useState(true);

  const getNextPlayer = (player: PlayerPosition): PlayerPosition => {
    const order: PlayerPosition[] = ['bottom', 'left', 'top', 'right'];
    return order[(order.indexOf(player) + 1) % 4];
  };

  const startNewHand = useCallback(() => {
    const { hands: dealt, deck: newDeck, trumpCard: trump } = dealTuteCards();
    setHands({ bottom: dealt[0], left: dealt[1], top: dealt[2], right: dealt[3] });
    setDeck(newDeck);
    setTrumpSuit(trump.suit);
    setTrumpCard(trump);
    setGamePhase('playing');
    setCurrentTrick([]);
    setCurrentPlayer('bottom');
    setDeckEmpty(false);
    setPlayerScores(prev => {
      const reset = { ...prev };
      (Object.keys(reset) as PlayerPosition[]).forEach(k => reset[k].points = 0);
      return reset;
    });
    setCanticosUsed({ bottom: [], left: [], top: [], right: [] });
    setShownCanticos([]);
    setTrumpExchangeAvailable(true);
    setMessage(`Triunfo: ${trump.name}`);
  }, []);

  const checkCanticos = (player: PlayerPosition, hand: Card[]) => {
    if (canticosUsed[player].length > 0) return 0;
    const suits: Suit[] = ['oros', 'copas', 'espadas', 'bastos'];
    let points = 0;
    for (const s of suits) {
      const hasRey = hand.some(c => c.number === 12 && c.suit === s);
      const hasCaballo = hand.some(c => c.number === 11 && c.suit === s);
      if (hasRey && hasCaballo) {
        points = s === trumpSuit ? 40 : 20;
        setShownCanticos(prev => [...prev, { player, suit: s, points, cards: [] }]);
        setCanticosUsed(prev => ({ ...prev, [player]: [...prev[player], s] }));
        setMessage(`${playerNames[player]} canta las ${points}`);
        break;
      }
    }
    return points;
  };

  const drawCards = (winner: PlayerPosition) => {
    if (deck.length === 0) {
      setDeckEmpty(true);
      return;
    }
    const newHands = { ...hands };
    const newDeck = [...deck];
    let p = winner;
    for (let i = 0; i < 4; i++) {
      if (newDeck.length > 0) newHands[p].push(newDeck.shift()!);
      p = getNextPlayer(p);
    }
    setHands(newHands);
    setDeck(newDeck);
    if (newDeck.length === 0) {
      setDeckEmpty(true);
      setTrumpCard(null);
    }
  };

  const playCard = useCallback((card: Card, player: PlayerPosition) => {
    if (currentPlayer !== player) return;
    const newTrick = [...currentTrick, { card, player }];
    setCurrentTrick(newTrick);
    setHands(prev => ({ ...prev, [player]: prev[player].filter(c => c.id !== card.id) }));

    if (newTrick.length === 4) {
      setTimeout(() => {
        const leadSuit = newTrick[0].card.suit;
        const winner = determineWinner(newTrick, trumpSuit, leadSuit);
        const points = newTrick.reduce((acc, p) => acc + p.card.points, 0);
        const cantPoints = checkCanticos(winner, hands[winner]);
        
        setPlayerScores(prev => ({
          ...prev, [winner]: { ...prev[winner], points: prev[winner].points + points + cantPoints }
        }));
        
        setCurrentTrick([]);
        if (hands[winner].length === 1 && deckEmpty) {
          // Última mano
          setGamePhase('hand-over');
        } else {
          drawCards(winner);
          setCurrentPlayer(winner);
        }
      }, 1500);
    } else {
      setCurrentPlayer(getNextPlayer(player));
    }
  }, [currentPlayer, currentTrick, hands, trumpSuit, deckEmpty]);

  useEffect(() => {
    if (currentPlayer !== 'bottom' && gamePhase === 'playing') {
      const timer = setTimeout(() => {
        const h = hands[currentPlayer];
        if (h.length > 0) playCard(h[0], currentPlayer);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gamePhase, hands, playCard]);

  useEffect(() => { startNewHand(); }, [startNewHand]);

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden relative">
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-white/5 z-20">
        <button onClick={onBack} className="text-amber-500 font-bold">← Menú</button>
        <div className="flex gap-4">
          {/* Fix: Explicitly cast Object.entries result to fix "unknown" type error */}
          {(Object.entries(playerScores) as [PlayerPosition, PlayerScore][]).map(([k, v]) => (
            <div key={k} className={`text-center px-3 py-1 rounded bg-slate-800 border ${k === 'bottom' ? 'border-amber-500/50' : 'border-white/5'}`}>
              <p className="text-[10px] text-slate-500 font-bold uppercase">{playerNames[k as PlayerPosition]}</p>
              <p className="text-lg font-black text-white">{v.points}</p>
            </div>
          ))}
        </div>
        <div className="bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 text-center">
          <p className="text-[10px] text-amber-500 font-bold uppercase">Triunfo</p>
          <p className="text-sm font-black text-white uppercase">{trumpSuit}</p>
        </div>
      </div>

      <div className="bg-amber-500/10 py-2 text-center text-amber-400 text-xs font-bold border-b border-amber-500/20">
        {message}
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-slate-950 to-slate-950"></div>
        
        {/* Mesa Central */}
        <div className="w-[500px] h-[300px] border border-white/5 bg-slate-900/40 rounded-[200px] flex items-center justify-center relative">
          {/* Mazo y Triunfo */}
          {trumpCard && !deckEmpty && (
            <div className="absolute -left-32 flex flex-col items-center gap-2">
              <div className="w-16 h-24 bg-white rounded border-2 border-slate-700 shadow-xl overflow-hidden rotate-[-15deg]">
                <img src={CARD_BACK} className="w-full h-full object-cover" />
              </div>
              <div className="w-16 h-24 bg-white rounded border-2 border-amber-500 shadow-xl overflow-hidden -mt-16 z-10">
                <img src={trumpCard.imageUrl} className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-bold text-amber-500 uppercase">{deck.length} CARTAS</span>
            </div>
          )}

          {currentTrick.map((p, i) => (
            <div key={i} className={`absolute transition-all duration-500 
              ${p.player === 'bottom' ? 'bottom-8' : p.player === 'top' ? 'top-8' : p.player === 'left' ? 'left-8' : 'right-8'}`}>
              <div className="w-20 h-32 bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-200">
                <img src={p.card.imageUrl} className="w-full h-full object-contain" />
              </div>
            </div>
          ))}
        </div>

        {/* HUD Cánticos */}
        <div className="absolute top-20 right-6 flex flex-col gap-2">
          {shownCanticos.map((c, i) => (
            <div key={i} className="bg-amber-500/20 border border-amber-500/30 p-2 rounded animate-in slide-in-from-right">
              <p className="text-[10px] font-black text-amber-500 uppercase">{playerNames[c.player]}</p>
              <p className="text-xs text-white">+{c.points} en {c.suit}</p>
            </div>
          ))}
        </div>

        {/* Mano Jugador */}
        <div className="absolute bottom-6 flex flex-col items-center gap-4">
          <div className="flex -space-x-6">
            {hands.bottom.map((card) => (
              <button 
                key={card.id}
                onClick={() => playCard(card, 'bottom')}
                className={`w-24 h-36 bg-white rounded-xl shadow-2xl border-2 border-slate-200 overflow-hidden transition-all hover:-translate-y-8 hover:z-50
                  ${currentPlayer !== 'bottom' ? '' : 'hover:border-amber-500'}`}
              >
                <img src={card.imageUrl} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {gamePhase === 'hand-over' && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 z-50">
          <div className="text-center p-12 bg-slate-900 rounded-3xl border border-white/10 shadow-2xl">
            <h2 className="text-5xl font-black text-amber-500 mb-8 uppercase tracking-tighter">Puntos de la Mano</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* Fix: Explicitly cast Object.entries result to fix "unknown" type error */}
              {(Object.entries(playerScores) as [PlayerPosition, PlayerScore][]).map(([k, v]) => (
                <div key={k} className="p-4 bg-white/5 rounded-2xl">
                  <p className="text-xs text-slate-500 uppercase font-bold">{playerNames[k as PlayerPosition]}</p>
                  <p className="text-3xl font-black text-white">{v.points}</p>
                </div>
              ))}
            </div>
            <button onClick={startNewHand} className="px-12 py-4 bg-amber-600 text-white font-black rounded-2xl hover:bg-amber-500">SIGUIENTE MANO</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tute;
