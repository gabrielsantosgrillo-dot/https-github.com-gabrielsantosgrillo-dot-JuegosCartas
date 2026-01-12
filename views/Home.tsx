
import React from 'react';

interface HomeProps {
  onSelectGame: (game: 'home' | 'cuatrola' | 'tute' | 'hilei' | 'siete-media') => void;
}

const Home: React.FC<HomeProps> = ({ onSelectGame }) => {
  const games = [
    { id: 'cuatrola', name: 'Cuatrola', color: 'emerald', description: 'El clásico extremeño de estrategia y bazas.' },
    { id: 'tute', name: 'Tute', color: 'amber', description: 'Domina las parejas y los cánticos en este mítico juego.' },
    { id: 'hilei', name: 'Hilei', color: 'blue', description: 'Pura velocidad y reflejos con la baraja.' },
    { id: 'siete-media', name: 'Siete y Media', color: 'red', description: '¿Te plantarás o arriesgarás para llegar al siete y medio?' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 md:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950 overflow-y-auto">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
          CARD CASINO
        </h1>
        <p className="text-slate-400 text-base md:text-lg">Selecciona un juego para empezar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-4xl">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelectGame(game.id as any)}
            className={`group relative flex flex-col p-5 md:p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10`}
          >
            <div className={`text-xl md:text-2xl font-bold mb-1 text-emerald-400 group-hover:text-emerald-300 transition-colors text-left`}>
              {game.name}
            </div>
            <p className="text-slate-500 text-xs md:text-sm text-left">{game.description}</p>
            <div className="mt-4 self-end">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-emerald-500 group-hover:underline">Jugar Ahora →</span>
            </div>
          </button>
        ))}
      </div>

      <footer className="mt-12 text-slate-600 text-[10px] md:text-sm">
        Desarrollado con pasión por los clásicos
      </footer>
    </div>
  );
};

export default Home;
