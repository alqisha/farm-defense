import { useState, useEffect } from 'react';
import { GameScene } from './components/GameScene';
import { useGameStore } from './store/gameStore';
import { Coins, Wheat, Play, RefreshCw, Send, ShoppingBag, Volume2, VolumeX } from 'lucide-react';
import { AuthDialog } from './components/AuthDialog';
import { PersistenceManager } from './components/PersistenceManager';
import { TradingDialog } from './components/TradingDialog';
import { ShopDialog } from './components/ShopDialog';
import { MainMenu } from './components/MainMenu';

// Initialize Telegram WebApp
const tg = (window as any).Telegram?.WebApp;

function App() {
  const { wheat, goldWheat, wave, isWaveActive, startWave, gameStatus, restartLevel, stage, isMuted, toggleMute } = useGameStore();
  const [showTrading, setShowTrading] = useState(false);
  const [showShop, setShowShop] = useState(false);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">
      <PersistenceManager />

      {/* 3D Scene */}
      <GameScene />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">

        {/* Main Menu */}
        {gameStatus === 'MENU' && <div className="pointer-events-auto w-full h-full relative z-50"><MainMenu /></div>}

        {/* Game Over / Clear Screens */}
        {gameStatus === 'GAME_OVER' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-auto animate-in zoom-in duration-300 z-50">
            <div className="text-center p-8 bg-gray-900 border-2 border-red-500 rounded-3xl shadow-2xl shadow-red-900/50">
              <h2 className="text-5xl font-black text-red-500 mb-2 glitch-text">GAME OVER</h2>
              <p className="text-gray-400 mb-8 text-xl">The bugs ate your garden!</p>
              <button
                onClick={restartLevel}
                className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-bold text-xl flex items-center gap-3 mx-auto transition-all hover:scale-105"
              >
                <RefreshCw size={24} /> Try Again
              </button>
            </div>
          </div>
        )}

        {/* Header HUD - Only show if playing */}
        {gameStatus === 'PLAYING' && (
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-auto z-10 transition-opacity duration-500 animate-in fade-in slide-in-from-top-4">
            {/* Resources */}
            <div className="flex flex-col gap-2">
              <div className="bg-black/50 backdrop-blur-md p-2 rounded-xl border border-yellow-500/30 flex items-center gap-2 text-yellow-400 font-bold min-w-[120px]">
                <Wheat size={20} />
                <span>{Math.floor(wheat)}</span>
              </div>
              <div className="bg-black/50 backdrop-blur-md p-2 rounded-xl border border-amber-500/30 flex items-center gap-2 text-amber-400 font-bold min-w-[120px]">
                <Coins size={20} />
                <span>{goldWheat}</span>
                <button
                  onClick={() => setShowShop(true)}
                  className="ml-auto bg-amber-600 hover:bg-amber-500 text-white p-1.5 rounded-lg transition-colors shadow-lg shadow-amber-900/20 active:scale-95"
                  title="Buy Gold"
                >
                  <ShoppingBag size={16} />
                </button>
              </div>
            </div>

            {/* Wave Info & Controls */}
            <div className="flex flex-col items-end gap-2">
              <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-blue-500/30 text-blue-200 font-bold">
                Stage {stage} — Wave {wave}
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <button
                  onClick={toggleMute}
                  className="bg-gray-700/80 hover:bg-gray-600/80 text-white p-3 rounded-xl shadow-lg transition-all active:scale-95 pointer-events-auto backdrop-blur-md"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>

                <button
                  onClick={() => setShowTrading(true)}
                  className="bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-xl shadow-lg shadow-purple-900/50 transition-all active:scale-95 pointer-events-auto"
                  title="Trade"
                >
                  <Send size={24} />
                </button>

                {!isWaveActive && (
                  <button
                    onClick={startWave}
                    className="bg-green-600 hover:bg-green-500 text-white p-3 rounded-xl shadow-lg shadow-green-900/50 transition-all active:scale-95 pointer-events-auto"
                  >
                    <Play size={24} fill="currentColor" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthDialog />

      {showTrading && <TradingDialog onClose={() => setShowTrading(false)} />}
      {showShop && <ShopDialog onClose={() => setShowShop(false)} />}

    </div>
  );
}

export default App;
