import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Zap, 
  FastForward, 
  RotateCcw, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown,
  Dice5,
  Rocket,
  Diamond,
  Bomb,
  CircleDot,
  Grid3X3,
  Layers,
  Sparkles,
  ListTree,
  Activity,
  BarChart3,
  Sliders
} from 'lucide-react';
import { BettingStrategy, BetResult, StakeGameType, BotStatistics } from '../types';
import { StakeLiveChart } from './StakeLiveChart';
import confetti from 'canvas-confetti';

interface AutoBetEngineProps {
  strategy: BettingStrategy;
  balance: number;
  currency: string;
  isAutobetting: boolean;
  onStartAutoBet: () => void;
  onStopAutoBet: () => void;
  onExecuteSingleBet: () => Promise<BetResult | null>;
  onExecuteBatchBets?: (count: number) => Promise<void>;
  lastBet: BetResult | null;
  currentStreak: number;
  betSpeedMs: number;
  setBetSpeedMs: (speed: number) => void;
  stopReason: string | null;
  sessionProfit: number;
  bets?: BetResult[];
  stats?: BotStatistics;
  onClearHistory?: () => void;
}

export const AutoBetEngine: React.FC<AutoBetEngineProps> = ({
  strategy,
  balance,
  currency,
  isAutobetting,
  onStartAutoBet,
  onStopAutoBet,
  onExecuteSingleBet,
  onExecuteBatchBets,
  lastBet,
  currentStreak,
  betSpeedMs,
  setBetSpeedMs,
  stopReason,
  sessionProfit,
  bets = [],
  stats,
  onClearHistory,
}) => {
  const [animatingBet, setAnimatingBet] = useState(false);
  const [simulationViewMode, setSimulationViewMode] = useState<'both' | 'game' | 'chart'>('both');

  // Trigger celebration on big win
  useEffect(() => {
    if (lastBet && lastBet.won && lastBet.payoutMultiplier >= 5) {
      try {
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        }
      } catch (err) {
        // Safe fallback in sandboxed iframe without canvas permissions
        console.debug('Confetti effect ignored in current environment:', err);
      }
    }
  }, [lastBet]);

  const handleManualBet = async () => {
    setAnimatingBet(true);
    await onExecuteSingleBet();
    setTimeout(() => setAnimatingBet(false), 200);
  };

  const handleTurboBatch = async (count: number) => {
    if (onExecuteBatchBets) {
      await onExecuteBatchBets(count);
    }
  };

  return (
    <div id="autobet-engine-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-5">
      
      {/* Engine Header & Safety Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Moteur d'Exécution & Simulation Stake
            </h3>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
              isAutobetting
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isAutobetting ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              {isAutobetting ? 'Auto-Bet Actif' : 'En Pause'}
            </span>
            {strategy.customConditions && strategy.customConditions.length > 0 && (
              <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                <ListTree className="w-3 h-3 text-purple-400" />
                {strategy.customConditions.filter(c => c.isActive !== false).length}/{strategy.customConditions.length} Conditions Stake
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Algorithme provably fair HMAC-SHA256 • Jeu : <strong className="text-slate-200 capitalize">{strategy.game}</strong>
          </p>
        </div>

        {/* View Switcher Pills + Counters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Visualizer / Chart Toggle */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setSimulationViewMode('both')}
              className={`px-2 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                simulationViewMode === 'both'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vue combinée Jeu & Graphique"
            >
              <Sliders className="w-3 h-3 text-emerald-400" />
              <span>Vue Combinée</span>
            </button>

            <button
              type="button"
              onClick={() => setSimulationViewMode('chart')}
              className={`px-2 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                simulationViewMode === 'chart'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Graphique de simulation Stake"
            >
              <Activity className="w-3 h-3" />
              <span>Graphique Stake</span>
            </button>

            <button
              type="button"
              onClick={() => setSimulationViewMode('game')}
              className={`px-2 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                simulationViewMode === 'game'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Animation du jeu uniquement"
            >
              <Dice5 className="w-3 h-3 text-cyan-400" />
              <span>Jeu</span>
            </button>
          </div>

          <div className="bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 font-semibold block">Profit Session</span>
            <span className={`text-xs sm:text-sm font-mono font-bold ${
              sessionProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {sessionProfit >= 0 ? '+' : ''}{sessionProfit.toFixed(4)} {currency}
            </span>
          </div>

          <div className="bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 font-semibold block">Série en cours</span>
            <span className={`text-xs sm:text-sm font-mono font-bold ${
              currentStreak > 0 ? 'text-emerald-400' : currentStreak < 0 ? 'text-rose-400' : 'text-slate-300'
            }`}>
              {currentStreak > 0 ? `+${currentStreak} W` : currentStreak < 0 ? `${currentStreak} L` : '0'}
            </span>
          </div>
        </div>
      </div>

      {/* Stop Reason Alert */}
      {stopReason && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="font-semibold">{stopReason}</span>
          </div>
          <span className="text-[11px] text-slate-400">Auto-bet interrompu par sécurité</span>
        </div>
      )}

      {/* Interactive Game Visualizer Canvas */}
      {(simulationViewMode === 'both' || simulationViewMode === 'game') && (
        <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-5 sm:p-6 relative overflow-hidden">
          
          {/* Game Specific Visualizer */}
          {strategy.game === 'dice' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>0.00</span>
                <span className="text-emerald-400 font-bold">
                  Cible : {strategy.gameConfig?.diceCondition === 'below' ? '< ' : '> '}
                  {strategy.gameConfig?.diceTarget || 50.49}
                </span>
                <span>100.00</span>
              </div>

              {/* Slider bar */}
              <div className="relative w-full h-8 bg-slate-900 rounded-full border border-slate-800 overflow-hidden flex items-center">
                {/* Win Zone */}
                <div 
                  className="absolute right-0 h-full bg-emerald-500/20 border-l-2 border-emerald-400"
                  style={{ width: `${100 - (strategy.gameConfig?.diceTarget || 50.49)}%` }}
                />
                
                {/* Roll Marker */}
                {lastBet?.gameDetails?.roll !== undefined && (
                  <div 
                    className={`absolute top-0 bottom-0 w-3 rounded-full shadow-lg transition-all duration-200 ${
                      lastBet.won ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-rose-500 shadow-rose-500/50'
                    }`}
                    style={{ left: `calc(${lastBet.gameDetails.roll}% - 6px)` }}
                  />
                )}
              </div>

              {/* Result Box */}
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <span className="text-xs text-slate-400 block mb-1">Dernier Tirage</span>
                  <div className={`text-3xl font-black font-mono tracking-wider px-6 py-2 rounded-2xl border transition-all ${
                    lastBet 
                      ? lastBet.won 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-950/50' 
                        : 'bg-rose-500/10 border-rose-500 text-rose-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    {lastBet?.gameDetails?.roll !== undefined ? lastBet.gameDetails.roll.toFixed(2) : '50.00'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {strategy.game === 'limbo' && (
            <div className="text-center py-4 space-y-4">
              <div className="text-xs text-slate-400 font-mono">
                Multiplicateur Cible : <strong className="text-purple-400 font-bold">{strategy.targetMultiplier}x</strong>
              </div>

              <div className={`inline-block text-4xl sm:text-5xl font-black font-mono tracking-tight px-8 py-3 rounded-2xl border transition-all ${
                lastBet
                  ? lastBet.won
                    ? 'bg-purple-500/10 border-purple-500 text-purple-300 shadow-xl shadow-purple-950/50 scale-105'
                    : 'bg-rose-500/10 border-rose-500 text-rose-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                {lastBet?.gameDetails?.limboMultiplier !== undefined 
                  ? `${lastBet.gameDetails.limboMultiplier.toFixed(2)}x`
                  : '1.00x'}
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Rocket className="w-4 h-4 text-purple-400" />
                <span>Multiplicateur infini jusqu'à 1,000,000x</span>
              </div>
            </div>
          )}

          {strategy.game === 'mines' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Mines : <strong className="text-rose-400">{strategy.gameConfig?.minesCount || 3}</strong></span>
                <span>Gemmes requises : <strong className="text-cyan-400">{strategy.gameConfig?.minesGemsToCashout || 3}</strong></span>
                <span>Cote : <strong className="text-emerald-400">{strategy.targetMultiplier}x</strong></span>
              </div>

              {/* 5x5 Mines Grid */}
              <div className="grid grid-cols-5 gap-2 max-w-[280px] mx-auto">
                {Array.from({ length: 25 }, (_, idx) => {
                  const isChosen = (strategy.gameConfig?.minesChosenTiles || [0, 1, 2]).includes(idx);
                  const isGemInResult = lastBet?.gameDetails?.minesGrid?.[idx];
                  const isMineInResult = lastBet?.gameDetails?.minesGrid && !lastBet.gameDetails.minesGrid[idx];

                  return (
                    <div
                      key={idx}
                      className={`h-11 rounded-xl border flex items-center justify-center font-mono text-xs transition-all ${
                        lastBet
                          ? isMineInResult
                            ? 'bg-rose-950/60 border-rose-600/80 text-rose-400'
                            : isChosen
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/40'
                            : 'bg-slate-900/60 border-slate-800 text-slate-600'
                          : isChosen
                          ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-400'
                          : 'bg-slate-900 border-slate-800 text-slate-600'
                      }`}
                    >
                      {lastBet ? (
                        isMineInResult ? (
                          <Bomb className="w-5 h-5 text-rose-400 animate-bounce" />
                        ) : isChosen ? (
                          <Diamond className="w-5 h-5 text-cyan-300" />
                        ) : (
                          <Diamond className="w-3.5 h-3.5 opacity-20 text-slate-500" />
                        )
                      ) : (
                        isChosen ? <Diamond className="w-4 h-4 text-cyan-400" /> : <span className="opacity-40">{idx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {strategy.game === 'plinko' && (
            <div className="text-center py-4 space-y-3">
              <div className="text-xs text-slate-400">
                Rangées : <strong className="text-slate-200">16</strong> • Risque : <strong className="text-rose-400 uppercase">High</strong>
              </div>

              {/* Visual slot indicator */}
              <div className="flex items-center justify-center gap-1 overflow-x-auto py-2">
                {[1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000].map((mult, slotIdx) => {
                  const isCurrentSlot = lastBet?.gameDetails?.plinkoSlot === slotIdx;
                  return (
                    <div
                      key={slotIdx}
                      className={`px-1.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                        isCurrentSlot
                          ? 'bg-rose-500 text-white scale-125 shadow-lg shadow-rose-500/50 ring-2 ring-white'
                          : mult >= 26
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-800/40'
                          : mult >= 2
                          ? 'bg-amber-950/60 text-amber-300'
                          : 'bg-slate-900 text-slate-500'
                      }`}
                    >
                      {mult}x
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Dernier slot : <strong className="text-slate-100">{lastBet?.gameDetails?.plinkoSlot !== undefined ? `#${lastBet.gameDetails.plinkoSlot}` : '-'}</strong>
              </div>
            </div>
          )}

          {strategy.game === 'keno' && (
            <div className="text-center py-3 space-y-3">
              <div className="text-xs text-slate-400">
                5 Numéros choisis • Multiplicateur max : <strong className="text-amber-400 font-bold">450x</strong>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-sm mx-auto">
                {(strategy.gameConfig?.kenoNumbers || [7, 13, 21, 33, 40]).map((num) => {
                  const wasDrawn = lastBet?.gameDetails?.kenoDrawn?.includes(num);
                  return (
                    <span
                      key={num}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs border ${
                        wasDrawn
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/50'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {num}
                    </span>
                  );
                })}
              </div>

              <div className="text-xs text-slate-400">
                Correspondances : <strong className="text-amber-300">{lastBet?.gameDetails?.kenoMatches ?? 0} / 5</strong>
              </div>
            </div>
          )}

          {strategy.game === 'hilo' && (
            <div className="text-center py-4 space-y-3">
              <div className="text-xs text-slate-400">
                Cartes tirées
              </div>

              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-24 rounded-xl bg-slate-900 border-2 border-slate-700 flex flex-col items-center justify-center font-bold text-lg text-slate-200 shadow-md">
                  <span>{lastBet?.gameDetails?.hiloCards?.[0] || '8'}</span>
                  <span className="text-xs text-rose-400">♥</span>
                </div>

                <span className="text-xs font-bold text-slate-500">➔</span>

                <div className={`w-16 h-24 rounded-xl border-2 flex flex-col items-center justify-center font-bold text-lg shadow-lg ${
                  lastBet
                    ? lastBet.won ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300' : 'bg-rose-950/60 border-rose-500 text-rose-400'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}>
                  <span>{lastBet?.gameDetails?.hiloCards?.[1] || '?'}</span>
                  <span className="text-xs text-emerald-400">♠</span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Stake.com-Style Live Simulation Graph */}
      {(simulationViewMode === 'both' || simulationViewMode === 'chart') && (
        <StakeLiveChart
          bets={bets}
          stats={stats}
          currency={currency}
          isAutobetting={isAutobetting}
          startingBalance={balance - sessionProfit}
          currentBalance={balance}
          sessionProfit={sessionProfit}
          onClearHistory={onClearHistory}
          compact={simulationViewMode === 'both'}
          gameTitle={strategy.game}
        />
      )}

      {/* Controller Buttons & Speed Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        
        {/* Main Play / Stop Button */}
        <div className="sm:col-span-5 flex gap-2">
          {!isAutobetting ? (
            <button
              id="btn-start-autobet"
              onClick={onStartAutoBet}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Démarrer Auto-Bet</span>
            </button>
          ) : (
            <button
              id="btn-stop-autobet"
              onClick={onStopAutoBet}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Arrêter Auto-Bet</span>
            </button>
          )}

          {/* Single Step Test Button */}
          <button
            id="btn-single-bet"
            onClick={handleManualBet}
            disabled={isAutobetting || animatingBet}
            className="py-3 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
            title="Pari unique manuel"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Pari Unique</span>
          </button>
        </div>

        {/* Speed Controls */}
        <div className="sm:col-span-4 bg-slate-950/80 border border-slate-800 rounded-xl p-2 flex items-center justify-between gap-1">
          <span className="text-[11px] font-semibold text-slate-400 px-1">Vitesse :</span>
          <div className="flex items-center gap-1">
            {[
              { label: 'Normal', ms: 800 },
              { label: 'Rapide', ms: 250 },
              { label: 'Ultra', ms: 80 },
            ].map((spd) => (
              <button
                key={spd.ms}
                onClick={() => setBetSpeedMs(spd.ms)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  betSpeedMs === spd.ms
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Turbo Backtest / Batch 100 bets */}
        <div className="sm:col-span-3 flex items-center">
          <button
            id="btn-turbo-batch-100"
            onClick={() => handleTurboBatch(50)}
            disabled={isAutobetting}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            <FastForward className="w-3.5 h-3.5 text-purple-400" />
            <span>Backtest x50 Paris</span>
          </button>
        </div>

      </div>

    </div>
  );
};

