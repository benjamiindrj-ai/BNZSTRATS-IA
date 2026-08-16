import React, { useState } from 'react';
import { 
  Sparkles, 
  Dice5, 
  Rocket, 
  Diamond, 
  CircleDot, 
  Grid3X3, 
  Layers, 
  ShieldAlert, 
  Check, 
  ArrowRight,
  Info,
  Sliders,
  Play,
  Shuffle,
  ShieldCheck,
  TrendingUp,
  Target,
  Gauge,
  Calculator,
  Compass,
  CheckCircle2,
  Search,
  Filter,
  Zap,
  Crown,
  Coins,
  Flame,
  Award,
  Copy,
  ToggleLeft,
  ToggleRight,
  ListTree,
  Workflow
} from 'lucide-react';
import { BettingStrategy, StakeGameType, RiskLevel, StrategyCondition } from '../types';
import { PREDEFINED_STRATEGIES } from '../utils/predefinedStrategies';
import { 
  generateRandomConstructiveStrategy, 
  generateRandomWagerStrategy,
  generateRandomWagerRecoveryStrategy,
  generateStakeDiceMultiConditionStrategy,
  STAKE_DICE_CONDITIONS_30_POOL,
  CONSTRUCTIVE_ARCHETYPES,
  WAGER_ARCHETYPES,
  WAGER_RECOVERY_ARCHETYPES
} from '../utils/constructiveStrategies';
import { STAKE_ORIGINALS_SPECS } from '../utils/stakeGameSpecs';

interface StrategyGeneratorProps {
  currentStrategy: BettingStrategy;
  onSelectStrategy: (strat: BettingStrategy) => void;
  onUpdateStrategy: (updates: Partial<BettingStrategy>) => void;
  currency: string;
  balance: number;
  onStartAutoBet: () => void;
  isAutobetting: boolean;
}

export const StrategyGenerator: React.FC<StrategyGeneratorProps> = ({
  currentStrategy,
  onSelectStrategy,
  onUpdateStrategy,
  currency,
  balance,
  onStartAutoBet,
  isAutobetting,
}) => {
  const [activeGame, setActiveGame] = useState<StakeGameType>(currentStrategy.game || 'dice');
  const [generatorMode, setGeneratorMode] = useState<'constructive' | 'wager' | 'wager_recovery' | 'dice_conditions'>('constructive');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiRisk, setAiRisk] = useState<RiskLevel>('low');
  const [aiTargetProfitPct, setAiTargetProfitPct] = useState(15);
  const [aiMethodology, setAiMethodology] = useState<'oscars_grind' | 'paroli' | 'dalembert' | 'kelly' | 'fibonacci' | 'wager' | 'wager_recovery' | 'custom'>('oscars_grind');
  const [wagerTargetVolumeInput, setWagerTargetVolumeInput] = useState<number>(25000);
  const [recoveryDeficitInput, setRecoveryDeficitInput] = useState<number>(15);
  const [recoveryWinrateBand, setRecoveryWinrateBand] = useState<'all' | 'high_multiplier' | 'balanced' | 'safe'>('all');
  const [constructiveWinrateBand, setConstructiveWinrateBand] = useState<'all' | 'sniper_10_20' | 'dynamic_25_40' | 'balanced_45_60' | 'safe_65_85'>('all');
  const [diceConditionCount, setDiceConditionCount] = useState<number>(12);
  const [diceArchetypeStyle, setDiceArchetypeStyle] = useState<'anti_streak' | 'oscillator' | 'tactical_matrix' | 'vip_volume' | 'master_30'>('oscillator');
  const [copiedConditionCode, setCopiedConditionCode] = useState(false);
  const [activeConditionCategoryFilter, setActiveConditionCategoryFilter] = useState<string>('all');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [presetSearch, setPresetSearch] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');

  const gameList: Array<{ id: StakeGameType; name: string; icon: React.ReactNode; maxMultBadge: string; rtpBadge: string; color: string }> = [
    { id: 'dice', name: 'Dice', icon: <Dice5 className="w-4 h-4" />, maxMultBadge: 'Max x9,900', rtpBadge: 'RTP 99%', color: 'emerald' },
    { id: 'limbo', name: 'Limbo', icon: <Rocket className="w-4 h-4" />, maxMultBadge: 'Max x1,000,000', rtpBadge: 'RTP 99%', color: 'purple' },
    { id: 'mines', name: 'Mines', icon: <Diamond className="w-4 h-4" />, maxMultBadge: 'Max x5,148,297', rtpBadge: 'RTP 99%', color: 'cyan' },
    { id: 'plinko', name: 'Plinko', icon: <CircleDot className="w-4 h-4" />, maxMultBadge: 'Max x10,000', rtpBadge: 'RTP 99%', color: 'rose' },
    { id: 'crash', name: 'Crash', icon: <TrendingUp className="w-4 h-4" />, maxMultBadge: 'Max x1,000,000', rtpBadge: 'RTP 99%', color: 'amber' },
    { id: 'keno', name: 'Keno', icon: <Grid3X3 className="w-4 h-4" />, maxMultBadge: 'Max x1,000', rtpBadge: 'RTP 99%', color: 'amber' },
    { id: 'hilo', name: 'Hilo', icon: <Layers className="w-4 h-4" />, maxMultBadge: 'Max x1,000,000', rtpBadge: 'RTP 99%', color: 'indigo' },
    { id: 'wheel', name: 'Wheel', icon: <Compass className="w-4 h-4" />, maxMultBadge: 'Max x49.5', rtpBadge: 'RTP 99%', color: 'teal' },
    { id: 'blackjack', name: 'Blackjack', icon: <CheckCircle2 className="w-4 h-4" />, maxMultBadge: 'RTP 99.43%', rtpBadge: 'Max x2.5', color: 'blue' },
    { id: 'roulette', name: 'Roulette', icon: <Compass className="w-4 h-4" />, maxMultBadge: 'Max x36', rtpBadge: 'RTP 97.3%', color: 'emerald' },
  ];

  const handleGameSelect = (gameId: StakeGameType) => {
    setActiveGame(gameId);
    // Find matching preset or adapt
    const matchingPreset = PREDEFINED_STRATEGIES.find((s) => {
      if (s.game !== gameId) return false;
      if (generatorMode === 'wager_recovery') return s.isRecoveryStrategy;
      if (generatorMode === 'wager') return s.isWagerStrategy && !s.isRecoveryStrategy;
      return !s.isWagerStrategy && !s.isRecoveryStrategy;
    }) || PREDEFINED_STRATEGIES.find((s) => s.game === gameId);
    
    if (matchingPreset) {
      onSelectStrategy({ ...matchingPreset, currency });
    } else {
      onUpdateStrategy({
        game: gameId,
        name: `Stratégie constructive ${gameId.toUpperCase()}`,
        targetMultiplier: gameId === 'limbo' ? 2.0 : gameId === 'mines' ? 1.74 : 2.0,
      });
    }
  };

  const handleGenerateRandomConstructive = () => {
    const strat = generateRandomConstructiveStrategy(
      activeGame,
      balance > 0 ? balance : 100,
      currency,
      constructiveWinrateBand
    );
    onSelectStrategy(strat);
  };

  const handleGenerateRandomWager = () => {
    const strat = generateRandomWagerStrategy(activeGame, balance > 0 ? balance : 100, currency, wagerTargetVolumeInput);
    onSelectStrategy(strat);
  };

  const handleGenerateRandomWagerRecovery = () => {
    const strat = generateRandomWagerRecoveryStrategy(
      activeGame,
      balance > 0 ? balance : 100,
      currency,
      recoveryDeficitInput,
      recoveryWinrateBand
    );
    onSelectStrategy(strat);
  };

  const handleGenerateDiceMultiConditions = () => {
    const strat = generateStakeDiceMultiConditionStrategy(
      balance > 0 ? balance : 100,
      currency,
      diceConditionCount,
      diceArchetypeStyle
    );
    onSelectStrategy(strat);
  };

  const handleToggleConditionActive = (conditionId: string) => {
    if (!currentStrategy.customConditions) return;
    const updated = currentStrategy.customConditions.map((c) =>
      c.id === conditionId ? { ...c, isActive: c.isActive === false ? true : false } : c
    );
    onUpdateStrategy({ customConditions: updated });
  };

  const handleCopyStakeConditions = () => {
    if (!currentStrategy.customConditions || currentStrategy.customConditions.length === 0) return;
    const activeConds = currentStrategy.customConditions.filter(c => c.isActive !== false);
    const formatted = activeConds.map((c, i) => 
      `Rule #${i + 1}: ${c.stakeUiCode || c.description} [${c.triggerType} => ${c.actionType}]`
    ).join('\n');
    navigator.clipboard.writeText(
      `STAKE.COM ADVANCED AUTOBET STRATEGY: ${currentStrategy.name}\n` +
      `Game: Dice | Base Bet: ${currentStrategy.baseBet} ${currentStrategy.currency}\n` +
      `Target Multiplier: ${currentStrategy.targetMultiplier}x | Win Chance: ${currentStrategy.winChance}%\n` +
      `Total Rules: ${activeConds.length}\n\n` +
      formatted
    );
    setCopiedConditionCode(true);
    setTimeout(() => setCopiedConditionCode(false), 2500);
  };

  const handleGenerateAiStrategy = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const isRecoveryMode = generatorMode === 'wager_recovery' || aiMethodology === 'wager_recovery';
      const isWagerMode = generatorMode === 'wager' || aiMethodology === 'wager';
      const response = await fetch('/api/gemini/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: activeGame,
          riskLevel: isRecoveryMode || isWagerMode ? 'ultra_safe' : aiRisk,
          bankroll: balance > 0 ? balance : 100,
          targetProfit: isRecoveryMode ? (recoveryDeficitInput / (balance > 0 ? balance : 100)) * 100 : aiTargetProfitPct,
          methodology: aiMethodology,
          isWager: isWagerMode,
          isWagerRecovery: isRecoveryMode,
          wagerTargetVolume: wagerTargetVolumeInput,
          userPrompt: aiPrompt 
            ? `${aiPrompt} (Méthode: ${aiMethodology})` 
            : isRecoveryMode 
              ? `Stratégie de récupération post stop-loss : combler un déficit de ${recoveryDeficitInput} ${currency} sans martingale`
              : `Méthode: ${aiMethodology}`,
          currency,
        }),
      });

      const data = await response.json();
      if (data.strategy) {
        onSelectStrategy(data.strategy);
      } else if (data.error) {
        setAiError(data.error);
      }
    } catch (err: any) {
      setAiError(err.message || 'Erreur lors de la génération');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const filteredPresets = PREDEFINED_STRATEGIES.filter((s) => {
    if (s.game !== activeGame) return false;
    if (selectedRiskFilter === 'conditions') {
      if (!s.customConditions || s.customConditions.length === 0) return false;
    } else if (selectedRiskFilter === 'wager_recovery') {
      if (!s.isRecoveryStrategy) return false;
    } else if (selectedRiskFilter === 'wager') {
      if (!s.isWagerStrategy || s.isRecoveryStrategy) return false;
    } else if (selectedRiskFilter !== 'all') {
      if (s.riskLevel !== selectedRiskFilter) return false;
    }
    if (presetSearch.trim()) {
      const q = presetSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.aiRationale && s.aiRationale.toLowerCase().includes(q)) ||
        (s.vipTierTarget && s.vipTierTarget.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const effectiveBankroll = balance > 0 ? balance : 100;
  const estimatedWagerVolume = currentStrategy.wagerTargetVolume || (effectiveBankroll * (currentStrategy.estimatedWagerTurnover || 300));
  const estimatedRakeback = (estimatedWagerVolume * 0.01 * (currentStrategy.estimatedRakebackPercent ? currentStrategy.estimatedRakebackPercent / 100 : 0.10)).toFixed(2);

  return (
    <div id="strategy-generator-container" className="space-y-6">
      
      {/* 1. Game Selection Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Dice5 className="w-4 h-4 text-emerald-400" />
            Sélectionner un jeu Casino & Originaux Stake ({PREDEFINED_STRATEGIES.length} stratégies)
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              100% Stratégies Constructives & Mathématiques (Anti-Martingale)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
          {gameList.map((g) => {
            const isSelected = activeGame === g.id;
            const count = PREDEFINED_STRATEGIES.filter((s) => s.game === g.id).length;
            return (
              <button
                key={g.id}
                id={`game-btn-${g.id}`}
                onClick={() => handleGameSelect(g.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all relative ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-900 border border-slate-700 text-emerald-400">
                  {count}
                </span>
                <div className={`p-1.5 rounded-lg mb-1 ${isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                  {g.icon}
                </div>
                <span className="font-bold">{g.name}</span>
                <span className="text-[9px] text-amber-400 font-mono mt-0.5 font-bold">{g.maxMultBadge}</span>
                <span className="text-[8px] text-slate-500 font-mono">{g.rtpBadge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Switcher Banner : Constructive vs WAGER High-Volume vs WAGER Recovery vs Dice Multi-Conditions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-1.5 bg-slate-950 border border-slate-800 rounded-xl gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setGeneratorMode('constructive');
              if (aiMethodology === 'wager' || aiMethodology === 'wager_recovery') setAiMethodology('oscars_grind');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              generatorMode === 'constructive'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Constructives (Croissance)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setGeneratorMode('dice_conditions');
              setActiveGame('dice');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              generatorMode === 'dice_conditions'
                ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-purple-950/50 font-extrabold'
                : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
            }`}
          >
            <ListTree className="w-3.5 h-3.5 text-purple-300" />
            <span>🎲 DICE STAKE (4 à 30 RÈGLES)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setGeneratorMode('wager');
              setAiMethodology('wager');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              generatorMode === 'wager'
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-md shadow-amber-950/50 font-extrabold'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>⚡ SECTION WAGER (Gros Volume VIP)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setGeneratorMode('wager_recovery');
              setAiMethodology('wager_recovery');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              generatorMode === 'wager_recovery'
                ? 'bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 text-white shadow-md shadow-cyan-950/50 font-extrabold'
                : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>🛡️ WAGER RÉCUPÉRATION (Post Stop-Loss)</span>
          </button>
        </div>
        <span className="text-[11px] text-slate-400 font-mono hidden md:inline-block pr-2">
          {generatorMode === 'dice_conditions'
            ? 'Architecture Autobet Stake.com (4 à 30 Conditions)'
            : generatorMode === 'wager_recovery' 
              ? 'Reconstitution Post-SL (Cotes 90-95% & D\'Alembert doux)' 
              : generatorMode === 'wager' 
                ? 'Mode Haut Débit (250x-450x Bankroll)' 
                : 'Cycles +1 Unité & Anti-Martingale'}
        </span>
      </div>

      {/* 2. AI Generator & Presets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Gemini AI Strategy Architect & Random Generator */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm space-y-4">
          
          {/* Quick Random Generator (Dice Conditions, Constructive, Wager or Wager Recovery) */}
          {generatorMode === 'dice_conditions' ? (
            <div className="bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-slate-950 border border-purple-500/50 rounded-xl p-3.5 shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <ListTree className="w-3.5 h-3.5 text-purple-400" />
                  Générateur DICE Multi-Conditions (Stake.com)
                </span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono font-bold border border-purple-500/30">
                  4 À 30 RÈGLES • COMPATIBLE STAKE
                </span>
              </div>
              <p className="text-[11px] text-purple-100/90 mb-3 leading-snug">
                Génère une stratégie avancée entièrement automatisée pour <strong>DICE</strong> avec 4 à 30 conditions chaînées (rebond sur perte, inversion de direction, paliers de profit, coupe-circuits et réinitialisations).
              </p>

              {/* Number of Conditions (4 to 30) */}
              <div className="mb-3 bg-slate-950/70 p-2.5 rounded-lg border border-purple-800/40">
                <div className="flex items-center justify-between text-[11px] font-semibold text-purple-200 mb-1.5">
                  <span>Nombre de Conditions Chaînées :</span>
                  <span className="font-mono font-extrabold text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/40">
                    {diceConditionCount} Conditions
                  </span>
                </div>
                
                {/* Fast Preset Buttons for condition count */}
                <div className="grid grid-cols-6 gap-1 mb-2">
                  {[4, 8, 12, 18, 24, 30].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setDiceConditionCount(count)}
                      className={`text-[10px] py-1 rounded font-mono font-bold transition border ${
                        diceConditionCount === count
                          ? 'bg-purple-500 text-slate-950 border-purple-300 shadow'
                          : 'bg-slate-900 border-slate-800 text-purple-300 hover:bg-purple-950/40'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="4"
                  max="30"
                  step="1"
                  value={diceConditionCount}
                  onChange={(e) => setDiceConditionCount(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                  <span>4 (Base)</span>
                  <span>12 (Dynamique)</span>
                  <span>20 (Tactique)</span>
                  <span>30 (Max Stake)</span>
                </div>
              </div>

              {/* Tactical Archetype Style */}
              <div className="mb-3 bg-slate-950/70 p-2.5 rounded-lg border border-purple-800/40">
                <div className="text-[11px] font-semibold text-purple-200 mb-1.5">
                  Archétype Tactique :
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDiceArchetypeStyle('anti_streak')}
                    className={`text-[10px] p-1.5 rounded-md text-left transition border ${
                      diceArchetypeStyle === 'anti_streak'
                        ? 'bg-purple-500/25 border-purple-400 text-purple-200 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-purple-300">🛡️ Anti-Streak Matrix</div>
                    <div className="text-[9px] text-slate-400">Inversion direction & Rebond</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiceArchetypeStyle('oscillator')}
                    className={`text-[10px] p-1.5 rounded-md text-left transition border ${
                      diceArchetypeStyle === 'oscillator'
                        ? 'bg-purple-500/25 border-purple-400 text-purple-200 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-purple-300">⚡ Oscillateur Asymétrique</div>
                    <div className="text-[9px] text-slate-400">Cotes variables & Micro-progression</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiceArchetypeStyle('tactical_matrix')}
                    className={`text-[10px] p-1.5 rounded-md text-left transition border ${
                      diceArchetypeStyle === 'tactical_matrix'
                        ? 'bg-purple-500/25 border-purple-400 text-purple-200 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-purple-300">⚖️ Grind Tactique</div>
                    <div className="text-[9px] text-slate-400">Amortisseurs & Paliers de gain</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiceArchetypeStyle('vip_volume')}
                    className={`text-[10px] p-1.5 rounded-md text-left transition border ${
                      diceArchetypeStyle === 'vip_volume'
                        ? 'bg-purple-500/25 border-purple-400 text-purple-200 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-purple-300">👑 VIP Volume Safe</div>
                    <div className="text-[9px] text-slate-400">Turnover max & Safe Decay</div>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDiceArchetypeStyle('master_30');
                    setDiceConditionCount(30);
                  }}
                  className={`w-full mt-1.5 text-[10px] py-1.5 px-2 rounded-md text-center transition border ${
                    diceArchetypeStyle === 'master_30'
                      ? 'bg-purple-500/30 border-purple-300 text-purple-100 font-bold'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold text-purple-300">🌌 Master Quant (30 Conditions Complètes Stake)</span>
                </button>
              </div>

              <button
                id="btn-random-dice-conditions-strategy"
                onClick={handleGenerateDiceMultiConditions}
                disabled={isAutobetting}
                className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-purple-950/60 transition flex items-center justify-center gap-2"
              >
                <ListTree className="w-3.5 h-3.5 text-purple-200" />
                <span>Générer Stratégie DICE ({diceConditionCount} Conditions)</span>
              </button>
            </div>
          ) : generatorMode === 'wager_recovery' ? (
            <div className="bg-gradient-to-r from-cyan-950/80 via-teal-950/70 to-slate-950 border border-cyan-500/50 rounded-xl p-3.5 shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                  Générateur Récupération WAGER (25% à 95% Winrate)
                </span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono font-bold border border-cyan-500/30">
                  MICRO-MISES • 0 MARTINGALE
                </span>
              </div>
              <p className="text-[11px] text-cyan-100/90 mb-3 leading-snug">
                Conçue pour redresser une perte subie en session Wager avec de <strong>toutes petites mises</strong> (0.05$ à 0.20$), sans forcer sur un seul clic lourd.
              </p>

              {/* Deficit to recoup selector */}
              <div className="mb-2.5 bg-slate-950/70 p-2.5 rounded-lg border border-cyan-800/40">
                <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-200 mb-1">
                  <span>Déficit / Stop-Loss à Récupérer :</span>
                  <span className="font-mono font-bold text-cyan-400">-{recoveryDeficitInput.toFixed(2)} {currency}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={recoveryDeficitInput}
                  onChange={(e) => setRecoveryDeficitInput(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                  <span>5 {currency}</span>
                  <span>25 {currency}</span>
                  <span>50 {currency}</span>
                  <span>100 {currency}</span>
                </div>
              </div>

              {/* Winrate Spectrum Selector (25% to 95%) */}
              <div className="mb-3 bg-slate-950/70 p-2.5 rounded-lg border border-cyan-800/40">
                <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-200 mb-1.5">
                  <span>Profil de Cote & Winrate :</span>
                  <span className="font-mono text-[10px] text-cyan-300 font-bold">
                    {recoveryWinrateBand === 'high_multiplier' ? '25% - 35% (3x-4x)' : recoveryWinrateBand === 'balanced' ? '40% - 65% (1.5x-2.5x)' : recoveryWinrateBand === 'safe' ? '70% - 95% (1.05x-1.35x)' : '25% à 95% (Tous)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRecoveryWinrateBand('high_multiplier')}
                    className={`text-[10px] p-1.5 rounded-md text-left transition border ${
                      recoveryWinrateBand === 'high_multiplier'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-cyan-300">🎯 Cotes 3x - 4x</div>
                    <div className="text-[9px] text-slate-400">25-35% Win • Micro-mises</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecoveryWinrateBand('balanced')}
                    className={`text-[10px] p-1.5 rounded-md text-left transition border ${
                      recoveryWinrateBand === 'balanced'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-cyan-300">⚖️ Cotes 1.6x - 2.5x</div>
                    <div className="text-[9px] text-slate-400">40-65% Win • Équilibré</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecoveryWinrateBand('safe')}
                    className={`text-[10px] p-1.5 rounded-md text-left transition border ${
                      recoveryWinrateBand === 'safe'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-cyan-300">🛡️ Cotes 1.05x - 1.35x</div>
                    <div className="text-[9px] text-slate-400">70-95% Win • Paliers Sûrs</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecoveryWinrateBand('all')}
                    className={`text-[10px] p-1.5 rounded-md text-left transition border ${
                      recoveryWinrateBand === 'all'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-cyan-300">🌟 Tout le Spectre</div>
                    <div className="text-[9px] text-slate-400">25% à 95% Aléatoire</div>
                  </button>
                </div>
              </div>

              <button
                id="btn-random-wager-recovery-strategy"
                onClick={handleGenerateRandomWagerRecovery}
                disabled={isAutobetting}
                className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-cyan-950/60 transition flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Générer Stratégie de Récupération {activeGame.toUpperCase()} (1-Clic)</span>
              </button>
            </div>
          ) : generatorMode === 'wager' ? (
            <div className="bg-gradient-to-r from-amber-950/70 via-orange-950/60 to-amber-950/70 border border-amber-600/50 rounded-xl p-3.5 shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  Générateur Aléatoire WAGER VIP (Gros Volume)
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold border border-amber-500/30">
                  98% WIN • 0 MARTINGALE
                </span>
              </div>
              <p className="text-[11px] text-amber-100/90 mb-3 leading-snug">
                Génère instantanément une stratégie de mise plate à haute fréquence (95-98% de probabilité) pour faire tourner <strong>~250x à 450x</strong> votre capital ({effectiveBankroll.toFixed(2)} {currency}) sans risque d'emballement.
              </p>

              {/* Target Volume selector */}
              <div className="mb-3 bg-slate-950/70 p-2.5 rounded-lg border border-amber-800/40">
                <div className="flex items-center justify-between text-[11px] font-semibold text-amber-200 mb-1">
                  <span>Objectif de Volume de Mise :</span>
                  <span className="font-mono font-bold text-amber-400">~{wagerTargetVolumeInput.toLocaleString()} {currency}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="100000"
                  step="5000"
                  value={wagerTargetVolumeInput}
                  onChange={(e) => setWagerTargetVolumeInput(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                  <span>5k (Bronze)</span>
                  <span>25k (Silver)</span>
                  <span>50k (Gold)</span>
                  <span>100k (Platine)</span>
                </div>
              </div>

              <button
                id="btn-random-wager-strategy"
                onClick={handleGenerateRandomWager}
                disabled={isAutobetting}
                className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-950/60 transition flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Générer Stratégie WAGER pour {activeGame.toUpperCase()} (1-Clic)</span>
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-emerald-950/70 to-teal-950/60 border border-emerald-700/40 rounded-xl p-3.5 shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Shuffle className="w-3.5 h-3.5" />
                  Générateur Constructif Intelligent (10% à 85% Winrate)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                  1-CLIC MATHÉMATIQUE
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mb-2.5 leading-snug">
                Crée instantanément une stratégie constructive sans martingale calibrée sur votre capital ({effectiveBankroll.toFixed(2)} {currency}) avec micro-mises et cotes asymétriques.
              </p>

              {/* Winrate Selector for Constructive */}
              <div className="mb-3 bg-slate-950/70 p-2.5 rounded-lg border border-emerald-800/40">
                <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-200 mb-1.5">
                  <span>Profil de Cote & Winrate :</span>
                  <span className="font-mono text-[10px] text-emerald-300 font-bold">
                    {constructiveWinrateBand === 'sniper_10_20'
                      ? '10% - 20% (Cotes 5x - 10x)'
                      : constructiveWinrateBand === 'dynamic_25_40'
                      ? '25% - 40% (Cotes 2.5x - 4x)'
                      : constructiveWinrateBand === 'balanced_45_60'
                      ? '45% - 60% (Cotes 1.6x - 2.2x)'
                      : constructiveWinrateBand === 'safe_65_85'
                      ? '65% - 85% (Cotes 1.15x - 1.5x)'
                      : '10% à 85% (Tous)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConstructiveWinrateBand('sniper_10_20')}
                    className={`text-[10px] p-1.5 rounded-md text-left transition border ${
                      constructiveWinrateBand === 'sniper_10_20'
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-emerald-300">🎯 Sniper (10-20%)</div>
                    <div className="text-[9px] text-slate-400">Cotes 5x-10x • Micro-mises</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConstructiveWinrateBand('dynamic_25_40')}
                    className={`text-[10px] p-1.5 rounded-md text-left transition border ${
                      constructiveWinrateBand === 'dynamic_25_40'
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-emerald-300">⚡ Dynamique (25-40%)</div>
                    <div className="text-[9px] text-slate-400">Cotes 2.5x-4x • Asymétrique</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConstructiveWinrateBand('balanced_45_60')}
                    className={`text-[10px] p-1.5 rounded-md text-left transition border ${
                      constructiveWinrateBand === 'balanced_45_60'
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-emerald-300">⚖️ Équilibré (45-60%)</div>
                    <div className="text-[9px] text-slate-400">Cotes 1.6x-2.2x • Grind</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConstructiveWinrateBand('safe_65_85')}
                    className={`text-[10px] p-1.5 rounded-md text-left transition border ${
                      constructiveWinrateBand === 'safe_65_85'
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-emerald-300">🛡️ Haute Proba (65-85%)</div>
                    <div className="text-[9px] text-slate-400">Cotes 1.15x-1.5x • Régulier</div>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setConstructiveWinrateBand('all')}
                  className={`w-full mt-1.5 text-[10px] py-1 px-2 rounded-md text-center transition border ${
                    constructiveWinrateBand === 'all'
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold text-emerald-300">🌟 Tout le Spectre (10% à 85% Aléatoire)</span>
                </button>
              </div>

              <button
                id="btn-random-constructive-strategy"
                onClick={handleGenerateRandomConstructive}
                disabled={isAutobetting}
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition flex items-center justify-center gap-2"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Générer Stratégie {constructiveWinrateBand !== 'all' ? `[${constructiveWinrateBand.replace('_', ' ').toUpperCase()}]` : 'Optimisée'} pour {activeGame.toUpperCase()}</span>
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center shadow-md shadow-purple-500/20">
                <div className="w-full h-full bg-slate-900 rounded-[5px] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  Architecte IA Gemini 3.7 (Sur-Mesure)
                </h4>
                <p className="text-[11px] text-slate-400">
                  {generatorMode === 'wager_recovery' 
                    ? 'Algorithme de redressement mathématique post-stop loss' 
                    : generatorMode === 'wager' 
                      ? 'Optimiseur quantitatif de volume et rakeback VIP' 
                      : 'Modèle quantitatif personnalisé sans doublement agressif'}
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Methodology choice */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Méthodologie Constructive Préférée
                </label>
                <select
                  value={aiMethodology}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setAiMethodology(val);
                    if (val === 'wager_recovery') setGeneratorMode('wager_recovery');
                    else if (val === 'wager') setGeneratorMode('wager');
                    else setGeneratorMode('constructive');
                  }}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2 text-xs text-slate-200 focus:ring-1 focus:ring-purple-500 focus:outline-none font-semibold"
                >
                  <option value="oscars_grind">Oscar's Grind (+1 unité par cycle, zéro hausse sur perte)</option>
                  <option value="wager">⚡ WAGER Gros Volume VIP (Mise plate 98% Winrate & Rakeback)</option>
                  <option value="wager_recovery">🛡️ WAGER Récupération (Post-Stop Loss / Anti-Drawdown)</option>
                  <option value="paroli">Paroli 1-2-4 (Anti-Martingale sur séries positives)</option>
                  <option value="dalembert">D'Alembert Linéaire (+1u sur défaite / -1u sur victoire)</option>
                  <option value="fibonacci">Suite Douce de Fibonacci (Récupération amortie)</option>
                  <option value="kelly">Fractional Kelly Scalper (Cotes courtes 1.20x-1.40x)</option>
                  <option value="custom">Optimisation Automatique IA</option>
                </select>
              </div>

              {/* Risk Level Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Profil de Risque
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['ultra_safe', 'low', 'medium'] as RiskLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setAiRisk(lvl)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition ${
                        aiRisk === lvl
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lvl === 'ultra_safe' ? 'Ultra Sûr (Wager/Recup)' : lvl === 'low' ? 'Faible (Défensif)' : 'Modéré (Croissance)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Profit or Target Volume */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>{generatorMode === 'wager_recovery' ? 'Montant à récupérer :' : 'Objectif de Take-Profit :'}</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {generatorMode === 'wager_recovery' 
                      ? `${recoveryDeficitInput.toFixed(2)} ${currency}` 
                      : `+${aiTargetProfitPct}% (${((balance > 0 ? balance : 100) * (aiTargetProfitPct / 100)).toFixed(2)} ${currency})`}
                  </span>
                </div>
                {generatorMode === 'wager_recovery' ? (
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={recoveryDeficitInput}
                    onChange={(e) => setRecoveryDeficitInput(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                ) : (
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="5"
                    value={aiTargetProfitPct}
                    onChange={(e) => setAiTargetProfitPct(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                )}
              </div>

              {/* Prompt custom */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Critères spécifiques (Optionnel)
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={generatorMode === 'wager_recovery' 
                    ? `Ex: Récupérer ${recoveryDeficitInput} USDT après un stop loss sur Dice, cotes sécurisées, 0 martingale...`
                    : generatorMode === 'wager' 
                      ? "Ex: Mises ultra-rapides, cible 50,000 USDT de volume, stop-loss 20%..." 
                      : "Ex: Stop-loss serré à 15%, cycles de 5 minutes, encaissement dès 2 victoires consécutives..."}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
                />
              </div>

              {aiError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Generate Button */}
              <button
                id="btn-generate-ai-strategy"
                onClick={handleGenerateAiStrategy}
                disabled={isGeneratingAi || isAutobetting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Calcul & Optimisation Mathématique...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Générer Stratégie IA Gemini 3.7 {generatorMode === 'wager_recovery' ? '(RÉCUPÉRATION)' : generatorMode === 'wager' ? '(WAGER)' : ''}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Preset Selector & Filter Section */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-400" />
                Catalogue {activeGame.toUpperCase()} ({filteredPresets.length} dispo)
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {filteredPresets.length} / {PREDEFINED_STRATEGIES.filter((s) => s.game === activeGame).length}
              </span>
            </div>

            {/* Search and Risk Filter */}
            <div className="space-y-1.5">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  placeholder="Filtrer par nom, cote, méthode, WAGER, Récupération..."
                  className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'Tous' },
                  { id: 'conditions', label: '🎲 Multi-Conditions' },
                  { id: 'wager', label: '⚡ WAGER VIP' },
                  { id: 'wager_recovery', label: '🛡️ Récupération' },
                  { id: 'ultra_safe', label: 'Ultra Sûr' },
                  { id: 'low', label: 'Faible' },
                  { id: 'medium', label: 'Modéré' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedRiskFilter(f.id)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition ${
                      selectedRiskFilter === f.id
                        ? f.id === 'conditions'
                          ? 'bg-purple-500/25 text-purple-200 border border-purple-400 font-bold'
                          : f.id === 'wager_recovery'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                          : f.id === 'wager' 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredPresets.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Aucune stratégie ne correspond aux filtres.
                </div>
              ) : (
                filteredPresets.map((strat) => {
                  const isSelected = currentStrategy.id === strat.id;
                  return (
                    <button
                      key={strat.id}
                      onClick={() => onSelectStrategy({ ...strat, currency })}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition relative ${
                        isSelected
                          ? strat.isRecoveryStrategy
                            ? 'bg-cyan-950/40 border-cyan-500 text-white font-medium shadow-md ring-1 ring-cyan-500/40'
                            : strat.isWagerStrategy 
                              ? 'bg-amber-950/30 border-amber-500 text-white font-medium shadow-md ring-1 ring-amber-500/40'
                              : 'bg-slate-800/90 border-emerald-500 text-white font-medium shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="truncate flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {strat.isRecoveryStrategy ? (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                🛡️ RÉCUPÉRATION
                              </span>
                            ) : strat.isWagerStrategy ? (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                WAGER
                              </span>
                            ) : null}
                            <span className="font-bold text-slate-100 truncate text-[12px]">{strat.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mb-1.5">{strat.description}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                              {strat.targetMultiplier}x
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              {strat.winChance}% win
                            </span>
                            {strat.vipTierTarget && (
                              <span className="text-[9px] font-mono font-bold text-purple-300 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                                VIP {strat.vipTierTarget}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className={`p-1 rounded-full text-slate-950 flex-shrink-0 ${strat.isRecoveryStrategy ? 'bg-cyan-400' : strat.isWagerStrategy ? 'bg-amber-400' : 'bg-emerald-500'}`}>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Active Strategy Inspector & Matrix Settings */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">

          {/* Header of Active Strategy */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-bold text-white tracking-tight">
                  {currentStrategy.name}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                  {currentStrategy.game}
                </span>
                {currentStrategy.isRecoveryStrategy ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-cyan-400" /> RÉCUPÉRATION WAGER
                  </span>
                ) : currentStrategy.isWagerStrategy ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" /> MODE WAGER VIP
                  </span>
                ) : null}
                {STAKE_ORIGINALS_SPECS[currentStrategy.game] && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                    Gain Max: {STAKE_ORIGINALS_SPECS[currentStrategy.game].maxMultiplierFormatted}
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> Constructive
                </span>
                {currentStrategy.author === 'ai' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> IA
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {currentStrategy.description}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                id="btn-quick-start-autobet"
                onClick={onStartAutoBet}
                disabled={isAutobetting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Tester en Sandbox</span>
              </button>
            </div>
          </div>

          {/* RECOVERY SPECIFIC HUD BANNER (if active strategy is Wager Recovery) */}
          {currentStrategy.isRecoveryStrategy ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 via-slate-950 to-teal-950/60 border border-cyan-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-200">
                    Protocole de Récupération & Réparation de Bankroll
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  Anti-Martingale Linéaire
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="bg-slate-900/90 p-2 rounded-lg border border-cyan-900/30">
                  <span className="text-[10px] text-slate-400 block">Cible de Récupération</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    +{currentStrategy.stopOnProfit} {currency}
                  </span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded-lg border border-cyan-900/30">
                  <span className="text-[10px] text-slate-400 block">Win Rate Théorique</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {currentStrategy.winChance}%
                  </span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded-lg border border-cyan-900/30">
                  <span className="text-[10px] text-slate-400 block">Sécurité Perte</span>
                  <span className="text-xs font-mono font-bold text-teal-400">
                    Mise plate / +1u doux
                  </span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded-lg border border-cyan-900/30">
                  <span className="text-[10px] text-slate-400 block">Protection Ruine</span>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    Stop Loss -{currentStrategy.stopOnLoss} {currency}
                  </span>
                </div>
              </div>
            </div>
          ) : currentStrategy.isWagerStrategy ? (
            /* WAGER SPECIFIC HUD BANNER (if active strategy is Wager) */
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-orange-950/40 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-200">
                    Tableau de Bord Wager & Farming VIP Stake
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  {currentStrategy.vipTierTarget ? `Palier Cible : ${currentStrategy.vipTierTarget}` : 'VIP Level-Up'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="bg-slate-900/90 p-2 rounded-lg border border-amber-900/30">
                  <span className="text-[10px] text-slate-400 block">Turnover Estimé</span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {currentStrategy.estimatedWagerTurnover || 350}x Bankroll
                  </span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded-lg border border-amber-900/30">
                  <span className="text-[10px] text-slate-400 block">Volume Projeté</span>
                  <span className="text-xs font-mono font-bold text-white">
                    ~{estimatedWagerVolume.toLocaleString()} {currency}
                  </span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded-lg border border-amber-900/30">
                  <span className="text-[10px] text-slate-400 block">Rakeback Estimé</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    +{estimatedRakeback} {currency}
                  </span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded-lg border border-amber-900/30">
                  <span className="text-[10px] text-slate-400 block">Profil Variance</span>
                  <span className="text-xs font-mono font-bold text-teal-400">
                    Ultra-Basse (0 Martingale)
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Stake Original Spec Banner */}
          {STAKE_ORIGINALS_SPECS[currentStrategy.game] && (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-600/30 flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <span className="text-base">🏆</span>
                <div>
                  <span className="font-bold text-white block">
                    Plafond Officiel {STAKE_ORIGINALS_SPECS[currentStrategy.game].name} : <span className="text-amber-400 font-mono font-extrabold">{STAKE_ORIGINALS_SPECS[currentStrategy.game].maxMultiplierFormatted}</span>
                  </span>
                  <span className="text-[11px] text-slate-300">{STAKE_ORIGINALS_SPECS[currentStrategy.game].maxWinPotentialNote}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold hidden sm:inline-block">
                RTP {STAKE_ORIGINALS_SPECS[currentStrategy.game].rtp}%
              </span>
            </div>
          )}

          {/* STAKE MULTI-CONDITIONS MATRIX INSPECTOR (4 to 30 Conditions) */}
          {currentStrategy.customConditions && currentStrategy.customConditions.length > 0 ? (
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/40 via-slate-950 to-indigo-950/40 border border-purple-500/40 space-y-3.5 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300">
                    <ListTree className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                      Matrice des Conditions Stake.com
                      <span className="text-[10px] bg-purple-500/25 text-purple-300 px-2 py-0.2 rounded-full font-mono font-extrabold border border-purple-500/40">
                        {currentStrategy.customConditions.filter(c => c.isActive !== false).length} / {currentStrategy.customConditions.length} Actives
                      </span>
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      Règles d'automatisation exécutées séquentiellement en Auto-bet & Sandbox
                    </p>
                  </div>
                </div>

                {/* Fast Action Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyStakeConditions}
                    className="px-2.5 py-1 rounded-lg bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-500/40 text-[10px] font-bold transition flex items-center gap-1"
                  >
                    {copiedConditionCode ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300">Copié pour Stake !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-purple-300" />
                        <span>Copier pour Stake.com</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const allActive = currentStrategy.customConditions?.every(c => c.isActive !== false);
                      const updated = currentStrategy.customConditions?.map(c => ({ ...c, isActive: !allActive }));
                      onUpdateStrategy({ customConditions: updated });
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-medium transition"
                  >
                    {currentStrategy.customConditions.every(c => c.isActive !== false) ? 'Tout Suspendre' : 'Tout Réactiver'}
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                {[
                  { id: 'all', label: 'Toutes les Règles' },
                  { id: 'streak', label: '⚡ Séries & Pertes' },
                  { id: 'direction', label: '🔄 Inversions Over/Under' },
                  { id: 'profit_loss', label: '💰 Paliers de Profit / Stop' },
                  { id: 'volume', label: '👑 Volume & Cadence' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveConditionCategoryFilter(f.id)}
                    className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition border ${
                      activeConditionCategoryFilter === f.id
                        ? 'bg-purple-500/25 border-purple-400 text-purple-200 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Conditions List View */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {currentStrategy.customConditions
                  .filter((cond) => {
                    if (activeConditionCategoryFilter === 'streak') {
                      return cond.triggerType.includes('loss') || cond.triggerType.includes('win');
                    }
                    if (activeConditionCategoryFilter === 'direction') {
                      return cond.actionType.includes('direction') || cond.actionType.includes('target');
                    }
                    if (activeConditionCategoryFilter === 'profit_loss') {
                      return cond.triggerType.includes('profit') || cond.triggerType.includes('loss_amount') || cond.actionType.includes('stop');
                    }
                    if (activeConditionCategoryFilter === 'volume') {
                      return cond.triggerType.includes('bets') || cond.actionType.includes('fixed');
                    }
                    return true;
                  })
                  .map((cond, idx) => {
                    const isActive = cond.isActive !== false;
                    return (
                      <div
                        key={cond.id || idx}
                        className={`p-2.5 rounded-xl border text-xs transition ${
                          isActive
                            ? 'bg-slate-900/90 border-purple-800/40 text-slate-200 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800/50 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60 mt-0.5">
                              #{idx + 1}
                            </span>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* Trigger badge */}
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  SI : {cond.triggerType.replace(/_/g, ' ')} {cond.triggerValue !== undefined ? `(${cond.triggerValue})` : ''}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-500" />
                                {/* Action badge */}
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  ALORS : {cond.actionType.replace(/_/g, ' ')} {cond.actionValue !== undefined ? `(${cond.actionValue})` : ''}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300">
                                {cond.description}
                              </p>
                              {cond.stakeUiCode && (
                                <div className="text-[10px] font-mono text-purple-300/80 bg-slate-950/80 px-2 py-0.5 rounded border border-purple-900/30 inline-block">
                                  Stake Auto-Bet : <strong className="text-purple-200">{cond.stakeUiCode}</strong>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Toggle Active Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleConditionActive(cond.id)}
                            title={isActive ? 'Désactiver cette règle' : 'Activer cette règle'}
                            className={`p-1 rounded-lg transition ${
                              isActive ? 'text-purple-400 hover:text-purple-300' : 'text-slate-600 hover:text-slate-400'
                            }`}
                          >
                            {isActive ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : currentStrategy.game === 'dice' ? (
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/30 flex items-center justify-between gap-3 text-xs text-purple-200">
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <div>
                  <span className="font-bold text-white block">
                    Automatisation Multi-Conditions Stake (DICE)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Vous pouvez équiper cette stratégie de 4 à 30 conditions chaînées (rebond, inversion Over/Under, coupe-circuits).
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerateDiceMultiConditions}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shadow transition flex-shrink-0 flex items-center gap-1.5"
              >
                <ListTree className="w-3.5 h-3.5" />
                <span>Générer {diceConditionCount} Conditions</span>
              </button>
            </div>
          ) : null}

          {/* AI / Math Rationale box */}
          {currentStrategy.aiRationale && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <span className="font-semibold text-slate-200">Justification mathématique & Algorithme :</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {currentStrategy.aiRationale}
                </p>
              </div>
            </div>
          )}

          {/* Parameter Matrix Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            
            {/* Base Bet */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Mise de base ({currency})
              </label>
              <input
                type="number"
                step="0.001"
                min="0.0001"
                value={currentStrategy.baseBet}
                onChange={(e) => onUpdateStrategy({ baseBet: Math.max(0.0001, parseFloat(e.target.value) || 0.01) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                {(balance > 0 ? (currentStrategy.baseBet / balance) * 100 : 0).toFixed(2)}% du solde
              </span>
            </div>

            {/* Target Multiplier */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Multiplicateur Cible
              </label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={currentStrategy.targetMultiplier}
                onChange={(e) => {
                  const val = Math.max(1.01, parseFloat(e.target.value) || 2.0);
                  const winChance = Number((99 / val).toFixed(2));
                  onUpdateStrategy({ targetMultiplier: val, winChance });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Win chance : {currentStrategy.winChance || (99 / currentStrategy.targetMultiplier).toFixed(2)}%
              </span>
            </div>

            {/* On Loss Action */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Action sur Perte
              </label>
              <select
                value={currentStrategy.onLossAction}
                onChange={(e) => onUpdateStrategy({ onLossAction: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="reset">Mise plate / Réinitialiser (Wager / Paroli)</option>
                <option value="custom">Mise constante / Fixe (Oscar's Grind)</option>
                <option value="increase_fixed">Ajouter mise fixe (+d'Alembert)</option>
                <option value="fibonacci">Suite de Fibonacci douce</option>
                <option value="multiply">Multiplier la mise (x{currentStrategy.onLossValue || 2})</option>
              </select>
              {currentStrategy.onLossAction === 'multiply' && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Facteur:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    value={currentStrategy.onLossValue || 2.0}
                    onChange={(e) => onUpdateStrategy({ onLossValue: parseFloat(e.target.value) || 2.0 })}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-mono text-slate-200"
                  />
                </div>
              )}
            </div>

            {/* On Win Action */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Action sur Victoire
              </label>
              <select
                value={currentStrategy.onWinAction}
                onChange={(e) => onUpdateStrategy({ onWinAction: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="reset">Réinitialiser à la base (Wager)</option>
                <option value="increase_fixed">Augmenter d'1 unité (Oscar's Grind)</option>
                <option value="increase_pct">Doubler / Capitaliser (Paroli)</option>
                <option value="custom">Diminuer de 1 unité (D'Alembert)</option>
              </select>
            </div>

            {/* Stop Loss */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <label className="text-xs font-semibold text-rose-400 block mb-1">
                Stop Loss Max ({currency})
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={currentStrategy.stopOnLoss}
                onChange={(e) => onUpdateStrategy({ stopOnLoss: Math.max(1, parseFloat(e.target.value) || 10) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-rose-200 font-mono font-bold focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Arrêt strict en cas de perte
              </span>
            </div>

            {/* Take Profit */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <label className="text-xs font-semibold text-emerald-400 block mb-1">
                Take Profit Cible ({currency})
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={currentStrategy.stopOnProfit}
                onChange={(e) => onUpdateStrategy({ stopOnProfit: Math.max(1, parseFloat(e.target.value) || 10) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-200 font-mono font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Verrouillage immédiat des gains
              </span>
            </div>

            {/* Trailing Stop-Loss Protection */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-cyan-800/50 col-span-1 sm:col-span-2 md:col-span-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-300">
                    Trailing Stop-Loss Dynamique (Sécurisation des Bénéfices au Sommet)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const isCurrentlyEnabled = currentStrategy.trailingStopLoss?.enabled;
                    onUpdateStrategy({
                      trailingStopLoss: {
                        enabled: !isCurrentlyEnabled,
                        activationProfit: currentStrategy.trailingStopLoss?.activationProfit || 5,
                        trailDistance: currentStrategy.trailingStopLoss?.trailDistance || 2.5,
                      }
                    });
                  }}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                    currentStrategy.trailingStopLoss?.enabled
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {currentStrategy.trailingStopLoss?.enabled ? '✓ Trailing Actif' : 'Désactivé'}
                </button>
              </div>

              {currentStrategy.trailingStopLoss?.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-cyan-900/30 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Déclencher après un gain de :
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        value={currentStrategy.trailingStopLoss.activationProfit}
                        onChange={(e) => onUpdateStrategy({
                          trailingStopLoss: {
                            ...currentStrategy.trailingStopLoss!,
                            activationProfit: Math.max(0.5, parseFloat(e.target.value) || 5),
                          }
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-200 font-mono font-bold"
                      />
                      <span className="text-[11px] font-mono text-slate-400">{currency}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Seuil d'armement du Trailing</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Distance de repli autorisée (Trail) :
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={currentStrategy.trailingStopLoss.trailDistance}
                        onChange={(e) => onUpdateStrategy({
                          trailingStopLoss: {
                            ...currentStrategy.trailingStopLoss!,
                            trailDistance: Math.max(0.2, parseFloat(e.target.value) || 2),
                          }
                        })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-200 font-mono font-bold"
                      />
                      <span className="text-[11px] font-mono text-slate-400">{currency}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Arrêt si le profit chute de cette valeur depuis le pic</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Guidelines and comparison recap */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Gestion Asymétrique</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Les pertes n'augmentent jamais de façon exponentielle. Votre bankroll est protégée contre les séquences défavorables.
              </p>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold mb-1">
                <Target className="w-3.5 h-3.5" />
                <span>Objectifs par Paliers</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Chaque cycle vise un micro-profit fixe (+1 unité) ou un turnover massif de volume pour accumuler du rakeback.
              </p>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Wager & Farming VIP</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Mode WAGER haute fréquence pour faire tourner des dizaines de milliers d'unités de volume en minimisant la variance.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

