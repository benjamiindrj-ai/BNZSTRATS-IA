import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Layers, 
  DollarSign, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  RotateCcw,
  Download,
  Eye,
  Zap,
  Award,
  ShieldAlert,
  BarChart2
} from 'lucide-react';
import { BetResult, BotStatistics } from '../types';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface StakeLiveChartProps {
  bets: BetResult[];
  stats?: BotStatistics;
  currency: string;
  isAutobetting?: boolean;
  startingBalance?: number;
  currentBalance?: number;
  sessionProfit?: number;
  onClearHistory?: () => void;
  compact?: boolean;
  gameTitle?: string;
}

export const StakeLiveChart: React.FC<StakeLiveChartProps> = ({
  bets,
  stats,
  currency,
  isAutobetting = false,
  startingBalance = 100,
  currentBalance,
  sessionProfit = 0,
  onClearHistory,
  compact = false,
  gameTitle = 'Dice',
}) => {
  const [chartMode, setChartMode] = useState<'profit' | 'balance' | 'wager' | 'bets'>('profit');
  const [timeframe, setTimeframe] = useState<'25' | '50' | '100' | '250' | 'all'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // Filtered bets slice based on selected timeframe
  const displayBets = useMemo(() => {
    if (timeframe === 'all' || bets.length === 0) return bets;
    const count = parseInt(timeframe, 10);
    return bets.slice(-count);
  }, [bets, timeframe]);

  // Transform data for chart
  const chartData = useMemo(() => {
    if (bets.length === 0) {
      // Return 2 dummy neutral points so the grid looks like Stake UI waiting for bets
      return [
        { betIndex: 0, profit: 0, balance: startingBalance, wager: 0, betAmount: 0, won: true, multiplier: 1 },
        { betIndex: 1, profit: 0, balance: startingBalance, wager: 0, betAmount: 0, won: true, multiplier: 1 }
      ];
    }

    let runningWager = 0;
    // Compute total wager up to the slice start if truncated
    const sliceStartIndex = bets.length - displayBets.length;
    for (let i = 0; i < sliceStartIndex; i++) {
      runningWager += bets[i].betAmount;
    }

    return displayBets.map((b) => {
      runningWager += b.betAmount;
      return {
        betIndex: b.betNumber,
        profit: Number(b.runningProfit.toFixed(4)),
        deltaProfit: Number(b.profit.toFixed(4)),
        balance: Number(b.runningBalance.toFixed(4)),
        wager: Number(runningWager.toFixed(4)),
        betAmount: Number(b.betAmount.toFixed(4)),
        won: b.won,
        multiplier: b.payoutMultiplier,
        targetMultiplier: b.targetMultiplier,
        game: b.game,
        timestamp: b.timestamp,
        roll: b.gameDetails?.roll,
      };
    });
  }, [bets, displayBets, startingBalance]);

  // Derived metrics from session
  const totalWagered = useMemo(() => {
    return bets.reduce((acc, b) => acc + b.betAmount, 0);
  }, [bets]);

  const winsCount = useMemo(() => bets.filter(b => b.won).length, [bets]);
  const lossesCount = useMemo(() => bets.filter(b => !b.won).length, [bets]);
  const winRatePct = bets.length > 0 ? ((winsCount / bets.length) * 100).toFixed(1) : '0.0';

  const peakProfit = useMemo(() => {
    if (bets.length === 0) return 0;
    return Math.max(0, ...bets.map(b => b.runningProfit));
  }, [bets]);

  const maxDrawdown = useMemo(() => {
    if (bets.length === 0) return 0;
    return Math.min(0, ...bets.map(b => b.runningProfit));
  }, [bets]);

  const latestProfit = bets.length > 0 ? bets[bets.length - 1].runningProfit : sessionProfit;
  const isProfitable = latestProfit >= 0;

  // Min and Max values for Y axis scales
  const profitExtremes = useMemo(() => {
    if (bets.length === 0) return { min: -1, max: 1 };
    const values = chartData.map(d => d.profit);
    const minVal = Math.min(0, ...values);
    const maxVal = Math.max(0, ...values);
    const padding = Math.max(0.5, (maxVal - minVal) * 0.15);
    return {
      min: Number((minVal - padding).toFixed(2)),
      max: Number((maxVal + padding).toFixed(2)),
    };
  }, [bets, chartData]);

  // Custom Stake.com-styled Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const won = data.won;
      return (
        <div className="bg-[#0f212e] border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 font-sans min-w-[170px] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-mono">
            <span className="text-slate-400 text-[11px] font-bold">Pari #{data.betIndex}</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
              won ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}>
              {won ? 'GAGNÉ' : 'PERDU'}
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Mise :</span>
              <span className="font-mono font-bold">{data.betAmount} {currency}</span>
            </div>

            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Résultat :</span>
              <span className={`font-mono font-bold ${data.deltaProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.deltaProfit >= 0 ? '+' : ''}{data.deltaProfit} {currency}
              </span>
            </div>

            {data.roll !== undefined && (
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Tirage :</span>
                <span className="font-mono font-semibold text-cyan-300">{data.roll.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between border-t border-slate-800 pt-1 font-semibold">
              <span className="text-slate-400">Profit Cumulé :</span>
              <span className={`font-mono font-bold ${data.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.profit >= 0 ? '+' : ''}{data.profit} {currency}
              </span>
            </div>

            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400">Solde :</span>
              <span className="font-mono text-slate-200">{data.balance} {currency}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // CSV Export
  const handleDownloadCsv = () => {
    if (bets.length === 0) return;
    const headers = ['Bet #', 'Game', 'Bet Amount', 'Target Multiplier', 'Won', 'Profit/Loss', 'Running Profit', 'Balance'];
    const rows = bets.map(b => [
      b.betNumber,
      b.game,
      b.betAmount,
      b.targetMultiplier,
      b.won ? 'WIN' : 'LOSS',
      b.profit,
      b.runningProfit,
      b.runningBalance,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stake_simulation_chart_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      id="stake-live-chart-container"
      className={`rounded-2xl border transition-all duration-300 ${
        isExpanded 
          ? 'fixed inset-4 z-50 bg-[#0f212e] border-slate-700 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between'
          : 'bg-[#0f212e] border-slate-800 p-4 sm:p-5 shadow-lg relative'
      }`}
    >
      {/* Header Bar with Stake Branding & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        
        {/* Left: Title + Mode Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Graphique de Simulation Live</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60 font-extrabold uppercase">
                    STAKE.COM
                  </span>
                </h4>
                {isAutobetting && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Évolution temps réel • {bets.length} paris exécutés
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right: View Selector (Profit / Solde / Volume / Mises) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="bg-[#1a2c38] p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setChartMode('profit')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                chartMode === 'profit'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Profit ($)</span>
            </button>

            <button
              type="button"
              onClick={() => setChartMode('balance')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                chartMode === 'balance'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              <span>Solde</span>
            </button>

            <button
              type="button"
              onClick={() => setChartMode('wager')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                chartMode === 'wager'
                  ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>Wager</span>
            </button>

            <button
              type="button"
              onClick={() => setChartMode('bets')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                chartMode === 'bets'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>Mises</span>
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="bg-[#1a2c38] p-1 rounded-xl border border-slate-800 flex items-center gap-0.5 text-[10px] font-mono font-bold">
            {(['25', '50', '100', '250', 'all'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded-lg transition ${
                  timeframe === tf
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf === 'all' ? 'TOUT' : `${tf}`}
              </button>
            ))}
          </div>

          {/* Expand & Download Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={bets.length === 0}
              title="Exporter les données en CSV"
              className="p-1.5 rounded-lg bg-[#1a2c38] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Réduire' : 'Plein écran'}
              className="p-1.5 rounded-lg bg-[#1a2c38] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>

      </div>

      {/* Stake HUD Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 my-3">
        
        {/* Profit Session */}
        <div className="bg-[#1a2c38]/90 border border-slate-800 rounded-xl p-2.5">
          <span className="text-[10px] text-slate-400 font-medium block">Profit Session</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-sm sm:text-base font-mono font-black ${
              latestProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {latestProfit >= 0 ? '+' : ''}{latestProfit.toFixed(4)}
            </span>
            <span className="text-[10px] font-mono text-slate-400">{currency}</span>
          </div>
        </div>

        {/* Total Wagered Volume */}
        <div className="bg-[#1a2c38]/90 border border-slate-800 rounded-xl p-2.5">
          <span className="text-[10px] text-slate-400 font-medium block">Wager Total</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm sm:text-base font-mono font-bold text-slate-100">
              {totalWagered.toFixed(2)}
            </span>
            <span className="text-[10px] font-mono text-purple-300">{currency}</span>
          </div>
        </div>

        {/* Win Rate & Counts */}
        <div className="bg-[#1a2c38]/90 border border-slate-800 rounded-xl p-2.5">
          <span className="text-[10px] text-slate-400 font-medium block">Taux de Réussite</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm sm:text-base font-mono font-bold text-cyan-300">
              {winRatePct}%
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              ({winsCount}W/{lossesCount}L)
            </span>
          </div>
        </div>

        {/* ATH Peak Profit */}
        <div className="bg-[#1a2c38]/90 border border-slate-800 rounded-xl p-2.5">
          <span className="text-[10px] text-slate-400 font-medium block">Pic Max (ATH)</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm sm:text-base font-mono font-bold text-emerald-400">
              +{peakProfit.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="bg-[#1a2c38]/90 border border-slate-800 rounded-xl p-2.5">
          <span className="text-[10px] text-slate-400 font-medium block">Max Drawdown</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm sm:text-base font-mono font-bold text-rose-400">
              {maxDrawdown.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Solde Actuel */}
        <div className="bg-[#1a2c38]/90 border border-slate-800 rounded-xl p-2.5">
          <span className="text-[10px] text-slate-400 font-medium block">Solde Actuel</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm sm:text-base font-mono font-bold text-slate-100">
              {(currentBalance !== undefined ? currentBalance : (startingBalance + latestProfit)).toFixed(4)}
            </span>
            <span className="text-[10px] font-mono text-emerald-400">{currency}</span>
          </div>
        </div>

      </div>

      {/* Main Chart Canvas */}
      <div className={`w-full relative ${isExpanded ? 'h-[480px]' : compact ? 'h-48 sm:h-56' : 'h-64 sm:h-72'}`}>
        
        {bets.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-[1px] z-10 rounded-xl border border-slate-800/40">
            <div className="p-3 rounded-full bg-[#1a2c38] text-slate-400 mb-2 border border-slate-700">
              <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
            <span className="text-xs font-bold text-slate-200">En attente de paris...</span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Lancez un <strong>Pari Unique</strong> ou démarrez l'<strong>Auto-Bet</strong> pour tracer la courbe en direct.
            </span>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'bets' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="betIndex" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                tickFormatter={(val) => `#${val}`}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="betAmount" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.won ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {/* Gradient for Profit curve */}
                <linearGradient id="stakeProfitGradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e701" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#00e701" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="stakeProfitGradRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e9113c" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#e9113c" stopOpacity={0.0} />
                </linearGradient>
                {/* Gradient for Balance curve */}
                <linearGradient id="stakeBalanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                {/* Gradient for Wager volume */}
                <linearGradient id="stakeWagerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.6} />

              <XAxis 
                dataKey="betIndex" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                tickFormatter={(val) => `#${val}`}
              />

              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                tickFormatter={(val) => `${val}`}
                domain={chartMode === 'profit' ? [profitExtremes.min, profitExtremes.max] : ['auto', 'auto']}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Zero Reference Line for Profit Mode */}
              {chartMode === 'profit' && (
                <ReferenceLine 
                  y={0} 
                  stroke="#475569" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ value: '0.00', position: 'right', fill: '#64748b', fontSize: 10 }}
                />
              )}

              {chartMode === 'profit' && (
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke={isProfitable ? '#00e701' : '#e9113c'} 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill={isProfitable ? 'url(#stakeProfitGradGreen)' : 'url(#stakeProfitGradRed)'}
                  isAnimationActive={!isAutobetting}
                  animationDuration={300}
                />
              )}

              {chartMode === 'balance' && (
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#06b6d4" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#stakeBalanceGrad)"
                  isAnimationActive={!isAutobetting}
                  animationDuration={300}
                />
              )}

              {chartMode === 'wager' && (
                <Area 
                  type="monotone" 
                  dataKey="wager" 
                  stroke="#a855f7" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#stakeWagerGrad)"
                  isAnimationActive={!isAutobetting}
                  animationDuration={300}
                />
              )}

            </AreaChart>
          )}
        </ResponsiveContainer>

      </div>

      {/* Footer Info Strip */}
      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Vert = En Profit
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            Rouge = En Drawdown
          </span>
        </div>

        {bets.length > 0 && onClearHistory && (
          <button
            type="button"
            onClick={onClearHistory}
            className="text-slate-500 hover:text-slate-300 underline transition"
          >
            Réinitialiser le graphique
          </button>
        )}
      </div>

    </div>
  );
};
