
import React, { useState } from 'react';
import Home from './views/Home';
import Cuatrola from './views/Cuatrola';
import SieteMedia from './views/SieteMedia';
import Tute from './views/Tute';

type ViewType = 'home' | 'cuatrola' | 'tute' | 'hilei' | 'siete-media';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('home');

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home onSelectGame={setCurrentView} />;
      case 'cuatrola':
        return <Cuatrola onBack={() => setCurrentView('home')} />;
      case 'siete-media':
        return <SieteMedia onBack={() => setCurrentView('home')} />;
      case 'tute':
        return <Tute onBack={() => setCurrentView('home')} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-500">Próximamente</h1>
            <p className="text-slate-400 text-center">El juego {currentView.toUpperCase()} está en desarrollo.</p>
            <button 
              onClick={() => setCurrentView('home')}
              className="px-6 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition font-bold"
            >
              Volver al inicio
            </button>
          </div>
        );
    }
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden flex flex-col">
      <main className="flex-1 w-full relative overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
