
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../types';
import { createFullDeck, shuffleDeck, calculateScore75 } from '../constants/cards';

const CARD_BACK = 'https://raw.githubusercontent.com/mcmd/playingcards.io-spanish.playing.cards/refs/heads/master/img/back.png';

interface SieteMediaProps {
  onBack: () => void;
}

type SieteMediaPhase = 'player-turn' | 'house-turn' | 'round-over';

const SieteMedia: React.FC<SieteMediaProps> = ({ onBack }) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [houseHand, setHouseHand] = useState<Card[]>([]);
  const [phase, setPhase] = useState<SieteMediaPhase>('player-turn');
  const [message, setMessage] = useState<string>('Tu turno. ¿Pides o te plantas?');
  const [winner, setWinner] = useState<'player' | 'house' | null>(null);

  const startNewGame = useCallback(() => {
    const newDeck = shuffleDeck(createFullDeck());
    const pFirst = newDeck.pop()!;
    const hFirst = newDeck.pop()!;
    
    setDeck(newDeck);
    setPlayerHand([pFirst]);
    setHouseHand([hFirst]);
    setPhase('player-turn');
    setWinner(null);
    setMessage('Tu turno. ¿Pides o te plantas?');
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const playerHit = () => {
    if (phase !== 'player-turn') return;
    
    const newDeck = [...deck];
    const card = newDeck.pop();
    if (!card) return;

    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(newDeck);

    const score = calculateScore75(newHand);
    if (score > 7.5) {
      setMessage(`¡Te has pasado! (${score})`);
      setWinner('house');
      setPhase('round-over');
    }
  };

  const playerStand = () => {
    if (phase !== 'player-turn') return;
    setPhase('house-turn');
    setMessage('Turno de la banca...');
  };

  useEffect(() => {
    if (phase === 'house-turn') {
      const timer = setTimeout(() => {
        const pScore = calculateScore75(playerHand);
        const hScore = calculateScore75(houseHand);

        // La banca pide si tiene menos que el jugador y no se ha pasado
        if (hScore < pScore && hScore <= 7.5) {
          const newDeck = [...deck];
          const card = newDeck.pop();
          if (card) {
            setHouseHand(prev => [...prev, card]);
            setDeck(newDeck);
          }
        } else {
          // La banca se planta o se pasa
          if (hScore > 7.5) {
            setWinner('player');
            setMessage(`¡Ganas! La banca se ha pasado con ${hScore}`);
          } else if (hScore >= pScore) {
            setWinner('house');
            setMessage(`La banca gana con ${hScore} vs tus ${pScore}`);
          } else {
            setWinner('player');
            setMessage(`¡Ganas con ${pScore} vs ${hScore}!`);
          }
          setPhase('round-over');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, houseHand, playerHand, deck]);

  const pScore = calculateScore75(playerHand);
  const hScore = calculateScore75(houseHand);

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden relative">
      {/* Header compacta */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-white/5 shrink-0 z-30">
        <button onClick={onBack} className="text-amber-500 hover:text-amber-400 font-semibold text-sm flex items-center gap-1">
          ← Menú
        </button>
        <h1 className="text-lg font-black text-amber-500 tracking-tighter uppercase italic">Siete y Media</h1>
        <div className="text-[10px] text-slate-500 font-bold bg-slate-900 px-2 py-1 rounded">
          DECK: {deck.length}
        </div>
      </div>

      {/* Barra de Estado Dinámica (Mensaje de Juego) */}
      <div className={`py-3 text-center border-b transition-colors duration-500 shrink-0 z-30 ${
        phase === 'round-over' 
          ? (winner === 'player' ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-rose-500/20 border-rose-500/30')
          : 'bg-amber-500/10 border-amber-500/20'
      }`}>
        <p className={`text-sm md:text-base font-black uppercase tracking-widest ${
          phase === 'round-over'
            ? (winner === 'player' ? 'text-emerald-400' : 'text-rose-400')
            : 'text-amber-400'
        }`}>
          {phase === 'round-over' ? (winner === 'player' ? '¡VICTORIA!' : '¡DERROTA!') : message}
        </p>
        {phase === 'round-over' && (
          <p className="text-[10px] md:text-xs text-slate-400 font-medium mt-0.5">{message}</p>
        )}
      </div>

      {/* Mesa de juego (Área de cartas 100% visible) */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 gap-8 md:gap-12 overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-slate-900 to-slate-950 opacity-40"></div>

        {/* Mano de la Banca */}
        <div className="relative flex flex-col items-center gap-3 z-10 w-full animate-in slide-in-from-top duration-700">
          <div className="flex items-center gap-3">
             <div className="h-px w-8 md:w-16 bg-white/10"></div>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">La Banca</span>
             <div className="h-px w-8 md:w-16 bg-white/10"></div>
          </div>
          
          <div className="flex -space-x-10 md:-space-x-16 items-center justify-center min-h-[120px] md:min-h-[160px]">
            {houseHand.map((card, i) => (
              <div key={card.id} className="w-20 h-28 md:w-28 md:h-40 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden transform hover:scale-105 transition-transform duration-300" style={{ zIndex: i }}>
                <img src={card.imageUrl} className="w-full h-full object-contain" alt={card.name} />
              </div>
            ))}
          </div>
          
          <div className="px-4 py-1 bg-slate-800/80 backdrop-blur-sm rounded-full border border-white/5">
            <span className="text-xs font-bold text-slate-400">Total: </span>
            <span className="text-sm font-black text-white">{hScore}</span>
          </div>
        </div>

        {/* Separador Central Visual */}
        <div className="w-full max-w-xs h-px bg-gradient-to-r from-transparent via-white/5 to-transparent z-10"></div>

        {/* Mano del Jugador */}
        <div className="relative flex flex-col items-center gap-3 z-10 w-full animate-in slide-in-from-bottom duration-700">
          <div className="px-4 py-1 bg-amber-500/10 backdrop-blur-sm rounded-full border border-amber-500/20">
            <span className="text-xs font-bold text-amber-500/70">Tu Mano: </span>
            <span className="text-sm font-black text-amber-500">{pScore}</span>
          </div>

          <div className="flex -space-x-10 md:-space-x-16 items-center justify-center min-h-[140px] md:min-h-[200px]">
            {playerHand.map((card, i) => (
              <div key={card.id} className="w-24 h-34 md:w-36 md:h-52 bg-white rounded-xl shadow-2xl border-2 border-slate-200 overflow-hidden transform hover:-translate-y-4 transition-transform duration-300" style={{ zIndex: i }}>
                <img src={card.imageUrl} className="w-full h-full object-contain" alt={card.name} />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
             <div className="h-px w-8 md:w-16 bg-white/10"></div>
             <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Jugador</span>
             <div className="h-px w-8 md:w-16 bg-white/10"></div>
          </div>
        </div>
      </div>

      {/* Controles Inferiores (Footer) */}
      <div className="bg-slate-950 border-t border-white/10 px-6 py-5 md:py-8 flex justify-center gap-4 shrink-0 z-30">
        {phase === 'player-turn' ? (
          <>
            <button 
              onClick={playerHit} 
              className="flex-1 max-w-[200px] py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm md:text-base rounded-2xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 transform hover:scale-[1.02]"
            >
              PEDIR CARTA
            </button>
            <button 
              onClick={playerStand} 
              className="flex-1 max-w-[200px] py-4 bg-amber-600 hover:bg-amber-500 text-white font-black text-sm md:text-base rounded-2xl shadow-lg shadow-amber-900/20 transition-all active:scale-95 transform hover:scale-[1.02]"
            >
              PLANTARSE
            </button>
          </>
        ) : phase === 'round-over' ? (
          <button 
            onClick={startNewGame} 
            className="w-full max-w-[400px] py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm md:text-base rounded-2xl shadow-xl shadow-indigo-900/20 transition-all transform hover:scale-[1.02] animate-bounce-short"
          >
            VOLVER A JUGAR
          </button>
        ) : (
          <div className="flex items-center gap-3 py-4">
             <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
             <span className="text-slate-400 font-black text-sm uppercase tracking-widest">Esperando a la banca...</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short {
          animation: bounce-short 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default SieteMedia;
