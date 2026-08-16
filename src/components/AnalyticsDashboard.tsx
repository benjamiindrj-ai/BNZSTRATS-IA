import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Award, 
  ShieldAlert, 
  Download, 
  Sparkles, 
  Filter, 
  Search, 
  CheckCircle2, 
  XCircle,
  BarChart3,
  Layers,
  History
} from 'lucide-react';
import { BotStatistics, BetResult, StakeGameType, BettingStrategy } from '../types';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';

interface AnalyticsDashboardProps {
  stats: BotStatistics;
  bets: BetResult[];
  currency: string;
  strategy: BettingStrategy;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  stats,
  bets,
  currency,
  strategy,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'won' | 'lost'>('all');
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('all');
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  // Prepare chart data (equity curve)
  const chartData = bets.map((b, idx) => ({
    betIndex: idx + 1,
    profit: Number(b.runningProfit.toFixed(4)),
    betAmount: b.betAmount,
    won: b.won,
    multiplier: b.payoutMultiplier,
  }));

  // Filter bets table
  const filteredBets = bets.filter((b) => {
    if (filterType === 'won' && !b.won) return false;
    if (filterType === 'lost' && b.won) return false;
    if (selectedGameFilter !== 'all' && b.game !== selectedGameFilter) return false;
    return true;
  });

  // Export to CSV
  const handleExportCsv = () => {
    if (bets.length === 0) return;
    const headers = ['Bet #', 'Timestamp', 'Game', 'Bet Amount', 'Target Multiplier', 'Payout Multiplier', 'Won', 'Profit', 'Running Balance'];
    const rows = bets.map((b) => [
      b.betNumber,
      new Date(b.timestamp).toISOString(),
      b.game,
      b.betAmount,
      b.targetMultiplier,
      b.payoutMultiplier,
      b.won ? 'YES' : 'NO',
      b.profit,
      b.runningBalance,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stake_bot_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Run AI Session Analysis
  const handleRunAiAnalysis = async () => {
    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/gemini/analyze-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats,
          recentBets: bets.slice(-20),
          currentStrategy: strategy,
        }),
      });
      const data = await res.json();
      setAiAnalysisResult(data.analysis || 'Analyse indisponible.');
    } catch (err: any) {
      setAiAnalysisResult(`Erreur d'analyse : ${err.message}`);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  return (
    <div id="analytics-dashboard-panel" className="space-y-6">
      
      {/* 1. High-Level KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Net Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Profit Net</span>
            {stats.netProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className={`text-lg sm:text-xl font-bold font-mono ${
            stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit.toFixed(4)}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">{currency}</span>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Taux Victoire</span>
            <Percent className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-100">
            {stats.winRate.toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">
            {stats.totalWon} W / {stats.totalLost} L
          </span>
        </div>

        {/* Total Wagered */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Volume Misé</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-100">
            {stats.totalWagered.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">{currency} (Total)</span>
        </div>

        {/* Total Bets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Total Paris</span>
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-100">
            {stats.totalBets}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">Tirages exécutés</span>
        </div>

        {/* Max Drawdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Max Drawdown</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-400">
            -{stats.maxDrawdown.toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">Creux maximal</span>
        </div>

        {/* Max Streaks */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Séries Max</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-sm font-bold font-mono text-slate-200">
            <span className="text-emerald-400">+{stats.maxWinStreak}W</span> / <span className="text-rose-400">-{stats.maxLossStreak}L</span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">Pics de variance</span>
        </div>

      </div>

      {/* 2. Charts & AI Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Equity Curve Chart */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Courbe d'Équité & Évolution du Profit
              </h4>
              <p className="text-xs text-slate-400">Profit cumulé net ({currency}) sur la session</p>
            </div>

            <span className="text-xs font-mono font-bold text-slate-300">
              {bets.length} points
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={stats.netProfit >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={stats.netProfit >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="betIndex" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke={stats.netProfit >= 0 ? '#10b981' : '#f43f5e'}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#profitGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Aucun pari enregistré. Lancez un auto-bet pour visualiser la courbe.
              </div>
            )}
          </div>
        </div>

        {/* Gemini AI Performance Review */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold text-white">
                Audit IA de Session
              </h4>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 text-xs text-slate-300 min-h-[160px] leading-relaxed overflow-y-auto">
              {aiAnalysisResult ? (
                <div className="whitespace-pre-wrap">{aiAnalysisResult}</div>
              ) : (
                <p className="text-slate-500 text-[11px]">
                  Cliquez sur "Analyser la session" pour obtenir un diagnostic mathématique par Gemini 3.7 (volatilité, déviation standard, recommandation de cashout).
                </p>
              )}
            </div>
          </div>

          <button
            id="btn-run-ai-analysis"
            onClick={handleRunAiAnalysis}
            disabled={isAnalyzingAi || bets.length === 0}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-950/40 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAnalyzingAi ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Audit en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyser la Session avec l'IA</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* 3. Live Bet Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">
              Historique Détaillé des Paris ({filteredBets.length})
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter buttons */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['all', 'won', 'lost'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-lg font-semibold capitalize transition ${
                    filterType === t
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t === 'all' ? 'Tous' : t === 'won' ? 'Gagnés' : 'Perdus'}
                </button>
              ))}
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              disabled={bets.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4"># Paris</th>
                <th className="py-3 px-4">Jeu</th>
                <th className="py-3 px-4">Mise ({currency})</th>
                <th className="py-3 px-4">Cote Cible</th>
                <th className="py-3 px-4">Multiplicateur</th>
                <th className="py-3 px-4">Profit ({currency})</th>
                <th className="py-3 px-4">Solde</th>
                <th className="py-3 px-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredBets.slice(-50).reverse().map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-4 font-semibold text-slate-300">
                    #{b.betNumber}
                  </td>
                  <td className="py-2.5 px-4 uppercase text-[11px] font-bold text-slate-400">
                    {b.game}
                  </td>
                  <td className="py-2.5 px-4 text-slate-200">
                    {b.betAmount.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {b.targetMultiplier.toFixed(2)}x
                  </td>
                  <td className="py-2.5 px-4 text-slate-300 font-bold">
                    {b.payoutMultiplier.toFixed(2)}x
                  </td>
                  <td className={`py-2.5 px-4 font-bold ${
                    b.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {b.profit >= 0 ? '+' : ''}{b.profit.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {b.runningBalance.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-4 font-sans">
                    {b.won ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Gagné
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        <XCircle className="w-3 h-3" /> Perdu
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredBets.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-500 font-sans">
                    Aucun pari correspondant dans l'historique.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
