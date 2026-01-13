
import React from 'react';

interface HomeProps {
  onSelectGame: (game: 'home' | 'cuatrola' | 'tute' | 'hilei' | 'siete-media') => void;
}

const BASE_IMG = 'https://raw.githubusercontent.com/gabrielsantosgrillo-dot/JuegosCartas/main/img/';

const Home: React.FC<HomeProps> = ({ onSelectGame }) => {
  const games = [
    { 
      id: 'cuatrola', 
      name: 'Cuatrola', 
      cardImg: '01-oros.png', 
      description: 'Estrategia extremeña.',
      gradient: 'from-emerald-500/10 to-emerald-900/30'
    },
    { 
      id: 'tute', 
      name: 'Tute', 
      cardImg: '12-copas.png', 
      description: 'Cánticos y maestría.',
      gradient: 'from-amber-500/10 to-amber-900/30'
    },
    { 
      id: 'hilei', 
      name: 'Hilei', 
      cardImg: '01-espadas.png', 
      description: 'Velocidad pura.',
      gradient: 'from-blue-500/10 to-blue-900/30'
    },
    { 
      id: 'siete-media', 
      name: 'Siete y Media', 
      cardImg: '07-bastos.png', 
      description: 'Arriesga al máximo.',
      gradient: 'from-rose-500/10 to-rose-900/30'
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#020617] relative overflow-hidden font-sans">
      {/* Fondos Decorativos */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#064e3b_0%,_#020617_100%)] opacity-40 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-10 pointer-events-none"></div>
      
      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col items-center justify-between py-6 px-4 z-10">
        
        {/* Header / Título */}
        <div className="text-center mt-2 md:mt-8">
          <div className="inline-block relative">
            <div className="absolute -inset-x-12 -top-6 h-24 bg-emerald-500/20 blur-[60px] rounded-full"></div>
            <h1 className="text-3xl md:text-6xl font-black tracking-tighter text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] leading-tight">
              JUEGOS CARTAS<br className="md:hidden" /> ESPAÑOLA
            </h1>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="h-px w-8 bg-emerald-500/40"></div>
            <p className="text-emerald-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] italic">Colección Premium</p>
            <div className="h-px w-8 bg-emerald-500/40"></div>
          </div>
        </div>

        {/* Grid de Juegos - Adaptado para una sola pantalla */}
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 my-4">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id as any)}
              className={`group relative flex flex-row lg:flex-col items-center p-3 md:p-6 rounded-2xl md:rounded-[2rem] border border-white/5 bg-slate-900/30 backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:border-emerald-500/30 hover:bg-slate-900/60 overflow-hidden`}
            >
              {/* Efecto de fondo en hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
              
              {/* Contenedor de la Carta */}
              <div className="relative shrink-0 mr-4 lg:mr-0 lg:mb-6 transform transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                <div className="absolute inset-0 bg-white/10 blur-xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-18 md:w-24 md:h-36 bg-white rounded-lg shadow-xl border-2 border-slate-800 overflow-hidden relative z-10">
                  <img 
                    src={`${BASE_IMG}${game.cardImg}`} 
                    className="w-full h-full object-contain" 
                    alt={game.name} 
                  />
                </div>
              </div>

              {/* Textos */}
              <div className="flex-1 lg:text-center relative z-10">
                <h2 className="text-lg md:text-xl font-black text-white group-hover:text-emerald-400 transition-colors truncate">
                  {game.name}
                </h2>
                <p className="text-slate-400 text-[10px] md:text-xs font-medium leading-tight hidden md:block">
                  {game.description}
                </p>
                <div className="mt-1 md:hidden">
                   <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Jugar →</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer / Créditos */}
        <footer className="w-full flex flex-col items-center gap-2 pt-4 border-t border-white/5">
          <p className="text-slate-500 text-[10px] md:text-xs font-medium tracking-wide">
            Creado por <span className="text-emerald-400 font-black italic uppercase">Gabriel Santos Grillo</span>
          </p>
          <div className="flex gap-4 items-center">
            <button className="text-slate-600 hover:text-emerald-500 transition-colors text-[8px] font-bold uppercase tracking-widest">
              Privacidad
            </button>
            <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
            <p className="text-slate-700 text-[8px] font-bold uppercase tracking-widest">© 2025</p>
          </div>
        </footer>

      </div>

      <style>{`
        body {
          background-color: #020617;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        /* Ajustes para pantallas muy pequeñas */
        @media (max-height: 600px) {
          h1 { font-size: 1.5rem !important; }
          .my-4 { margin-top: 0.5rem !important; margin-bottom: 0.5rem !important; }
          footer { padding-top: 0.5rem !important; }
        }
      `}</style>
    </div>
  );
};

export default Home;
