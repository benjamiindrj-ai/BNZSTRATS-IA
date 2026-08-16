import React, { useState, useEffect, useCallback } from 'react';
import { 
  Radio, 
  RefreshCw, 
  Flame, 
  TrendingUp, 
  Clock, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  PlusCircle, 
  Activity, 
  BarChart2, 
  Target, 
  Award, 
  Percent, 
  DollarSign, 
  Sparkles,
  AlertTriangle,
  Layers,
  ArrowRight,
  Info,
  Timer,
  ExternalLink
} from 'lucide-react';
import { LiveMatchTip, LiveSportsResponse, SportTip, TrackedSportBet } from '../types';
import { formatParisTime } from '../utils/parisTime';

interface LiveSportsDashboardProps {
  currentBalance: number;
  currency: string;
  trackedBets: TrackedSportBet[];
  onTrackBet: (tip: SportTip, stakeAmount: number) => void;
}

export const LiveSportsDashboard: React.FC<LiveSportsDashboardProps> = ({
  currentBalance,
  currency,
  trackedBets,
  onTrackBet,
}) => {
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [customLeague, setCustomLeague] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [liveData, setLiveData] = useState<LiveSportsResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number>(30);
  
  // Custom stakes per card
  const [customStakes, setCustomStakes] = useState<Record<string, number>>({});
  const [trackedSuccessIds, setTrackedSuccessIds] = useState<Record<string, boolean>>({});

  // Clock for Paris Time
  const [parisTime, setParisTime] = useState<string>(formatParisTime(Date.now(), true));

  const fetchLiveRef = React.useRef<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    const timer = setInterval(() => {
      setParisTime(formatParisTime(Date.now(), true));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sportsList = [
    { id: 'all', label: 'Tous les directs', icon: '🔴' },
    { id: 'football', label: 'Football', icon: '⚽' },
    { id: 'basketball', label: 'Basketball', icon: '🏀' },
    { id: 'tennis', label: 'Tennis', icon: '🎾' },
    { id: 'mma', label: 'MMA / UFC', icon: '🥊' },
    { id: 'esports', label: 'Esports', icon: '🎮' },
    { id: 'hockey', label: 'Hockey', icon: '🏒' },
  ];

  const fetchLiveAnalysis = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const savedCreds = localStorage.getItem('stake_bot_api_credentials');
        if (savedCreds) {
          const creds = JSON.parse(savedCreds);
          if (creds.apiKey) headers['x-stake-api-token'] = creds.apiKey;
          if (creds.domain) headers['x-stake-domain'] = creds.domain;
        }
      } catch (e) {
        // ignore parse error
      }

      const response = await fetch('/api/gemini/live-sports-analysis', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sport: selectedSport,
          customLeague: customLeague.trim() || undefined,
          userBankroll: currentBalance,
          currency,
          requestTimestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error('Impossible de charger les données Live In-Play');
      }

      const data: LiveSportsResponse = await response.json();
      setLiveData(data);
      setSecondsUntilRefresh(30);
    } catch (err: any) {
      console.error('Error fetching live sports data:', err);
      setErrorMsg(err.message || 'Erreur réseau lors de la récupération du Live');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSport, customLeague, currentBalance, currency]);

  fetchLiveRef.current = fetchLiveAnalysis;

  // Initial load
  useEffect(() => {
    fetchLiveAnalysis();
  }, [fetchLiveAnalysis]);

  // Auto-refresh countdown (every second, decrementing reliably)
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          if (fetchLiveRef.current) {
            fetchLiveRef.current();
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled]);

  const handleTrackLiveBet = (liveTip: LiveMatchTip) => {
    const stakePercent = liveTip.recommendedStakePercent || 1.5;
    const defaultStake = Number(((currentBalance * stakePercent) / 100).toFixed(2));
    const finalStake = customStakes[liveTip.id] !== undefined ? customStakes[liveTip.id] : (defaultStake > 0 ? defaultStake : 1.0);

    // Convert LiveMatchTip to SportTip interface for universal tracking
    const convertedTip: SportTip = {
      id: liveTip.id,
      sport: liveTip.sport,
      match: `${liveTip.match} [LIVE ${liveTip.currentMinute} | ${liveTip.currentScore}]`,
      league: liveTip.league,
      market: liveTip.liveMarket,
      odds: liveTip.liveOdds,
      expectedValue: liveTip.liveExpectedValue,
      confidenceScore: liveTip.confidenceScore,
      riskLevel: liveTip.riskLevel,
      recommendedStakePercent: liveTip.recommendedStakePercent,
      analysisReasoning: `[LIVE IN-PLAY ${liveTip.currentMinute}] ${liveTip.liveEdgeAnalysis}`,
      keyStats: [
        `Score actuel: ${liveTip.currentScore} (${liveTip.currentMinute})`,
        `Momentum: ${liveTip.momentumTeam}`,
        `Possession: ${liveTip.inPlayStats.possession || 'N/A'} | Tirs: ${liveTip.inPlayStats.shotsOnTarget || 'N/A'}`,
        `xG Live: ${liveTip.inPlayStats.liveXg || 'N/A'}`,
        `Inflation cote: Pre-match @${liveTip.preMatchOdds || 1.40} ➔ Live @${liveTip.liveOdds}`,
      ],
      bookmakerImpliedProbability: liveTip.liveImpliedProbability,
      aiEstimatedTrueProbability: liveTip.liveTrueProbability,
      kickoffTime: `En cours (${liveTip.currentMinute} - ${liveTip.currentScore})`,
      kickoffTimestamp: Date.now(),
      minutesUntilKickoff: 0,
      stakeFixtureId: liveTip.stakeFixtureId,
      stakeUrl: liveTip.stakeUrl,
      stakeMarketName: liveTip.liveMarket,
    };

    onTrackBet(convertedTip, finalStake);
    setTrackedSuccessIds((prev) => ({ ...prev, [liveTip.id]: true }));
  };

  const getSportBadge = (sportId: string) => {
    switch (sportId) {
      case 'football': return { icon: '⚽', label: 'Football', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'basketball': return { icon: '🏀', label: 'Basketball', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'tennis': return { icon: '🎾', label: 'Tennis', color: 'bg-lime-500/20 text-lime-300 border-lime-500/30' };
      case 'mma': return { icon: '🥊', label: 'MMA / UFC', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'esports': return { icon: '🎮', label: 'Esports', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'hockey': return { icon: '🏒', label: 'Hockey', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      default: return { icon: '🏆', label: 'Sport', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    }
  };

  const displayedLiveTips = (liveData?.liveTips || []).filter((tip) => {
    if (selectedSport !== 'all' && tip.sport !== selectedSport) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Live Controller Bar */}
      <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-indigo-950/40 border border-red-500/30 rounded-2xl p-4.5 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  Scanner In-Play & Algorithme de Valeur en Temps Réel
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping mr-0.5" />
                  Live Actif
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Analyse continue du temps de jeu écoulé, des statistiques in-play (xG, tirs cadrés) et des variations de cotes pour déceler les asymétries de gains.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-center shrink-0">
            {/* Live Paris Clock */}
            <div className="h-9 px-3 bg-slate-900 border border-cyan-500/40 rounded-xl text-xs font-mono text-cyan-300 flex items-center gap-2 shadow-sm shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span>Paris : <strong className="text-white tabular-nums font-mono">{parisTime}</strong></span>
            </div>

            {/* Refresh button with stable layout and tabular countdown */}
            <button
              onClick={() => fetchLiveAnalysis()}
              disabled={isLoading}
              className="h-9 px-3.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2 shrink-0 min-w-[155px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="whitespace-nowrap flex items-center gap-1.5">
                {isLoading ? (
                  <span>Scan en direct...</span>
                ) : (
                  <>
                    <span>Rafraîchir</span>
                    <span translate="no" className="notranslate inline-flex items-center justify-center min-w-[44px] h-5 font-mono text-[11px] tabular-nums font-bold bg-red-950/80 text-red-200 px-1.5 rounded border border-red-400/40">
                      {secondsUntilRefresh} sec
                    </span>
                  </>
                )}
              </span>
            </button>

            {/* Toggle Auto Refresh */}
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`h-9 px-3 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-2 shrink-0 whitespace-nowrap min-w-[135px] justify-center ${
                autoRefreshEnabled 
                  ? 'bg-slate-900 border-red-500/40 text-red-300' 
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
              title="Activer/Désactiver le rafraîchissement automatique toutes les 30 secondes"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${autoRefreshEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span translate="no" className="notranslate">{autoRefreshEnabled ? 'Auto-Scan (30 sec)' : 'Scan manuel'}</span>
            </button>
          </div>
        </div>

        {/* Sports Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {sportsList.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                selectedSport === sport.id
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{sport.icon}</span>
              <span>{sport.label}</span>
            </button>
          ))}
        </div>

      </div>

      {/* 2. Live Market Pulse & Mathematical Edge Summary */}
      {liveData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Active Live Matches */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Matchs In-Play Scannés</span>
              <Radio className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white flex items-baseline gap-1.5">
              <span className="text-red-400">{liveData.activeMatchesCount || liveData.liveTips.length}</span>
              <span className="text-[10px] text-slate-500 font-normal">en direct</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Heure de Paris : {liveData.lastUpdatedParisTime}
            </div>
          </div>

          {/* Average Live EV+ */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">EV+ Moyen Détecté</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              +{liveData.liveOpportunitiesSummary.averageLiveEv}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Sur {liveData.liveOpportunitiesSummary.highValueSignalsCount} signaux à haute valeur
            </div>
          </div>

          {/* Top Momentum Pick */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1 col-span-2 sm:col-span-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Top Signal Momentum & Stratégie In-Play</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xs font-bold text-amber-300 line-clamp-1">
              🔥 {liveData.liveOpportunitiesSummary.topMomentumPick}
            </div>
            <div className="text-[11px] text-slate-400 leading-tight line-clamp-2">
              💡 {liveData.liveOpportunitiesSummary.liveStrategyAdvice}
            </div>
          </div>

        </div>
      )}

      {/* 3. Live Tips Stream */}
      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-800/60 p-4 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading && !liveData ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-red-400 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-200">
            Scan en direct des rencontres sportives en cours (Minute par minute)...
          </p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Calcul des probabilités conditionnelles de Poisson et identification des asymétries de cotes dues au temps écoulé.
          </p>
        </div>
      ) : displayedLiveTips.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <Info className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-300">
            Aucun match en direct correspondant aux critères de rentabilité stricts en ce moment.
          </p>
          <p className="text-[11px] text-slate-500">
            Sélectionnez "Tous les Lives" ou relancez le scan dans quelques instants.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedLiveTips.map((tip, tipIdx) => {
            const stakePercent = tip.recommendedStakePercent || 1.5;
            const defaultStake = Number(((currentBalance * stakePercent) / 100).toFixed(2));
            const currentStake = customStakes[tip.id] !== undefined ? customStakes[tip.id] : (defaultStake > 0 ? defaultStake : 1.0);
            const potentialProfit = (currentStake * (tip.liveOdds - 1)).toFixed(2);
            const isTracked = trackedSuccessIds[tip.id] || trackedBets.some(b => b.tipId === tip.id || b.match.includes(tip.match));

            // Calculate odds inflation ratio
            const oddsBoostPercent = tip.preMatchOdds 
              ? Math.round(((tip.liveOdds - tip.preMatchOdds) / tip.preMatchOdds) * 100)
              : null;

            return (
              <div
                key={tip.id ? `${tip.id}-${tipIdx}` : `live-tip-${tipIdx}`}
                className="bg-slate-900 border border-slate-800 hover:border-red-500/40 rounded-2xl p-5 shadow-sm transition space-y-4"
              >
                {/* Top Match Header & Minute Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSportBadge(tip.sport).color}`}>
                        <span>{getSportBadge(tip.sport).icon}</span>
                        <span>{getSportBadge(tip.sport).label}</span>
                      </span>

                      <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                        {tip.league}
                      </span>

                      {/* Live Period & Minute Pulsing Badge */}
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-red-600/90 px-2.5 py-0.5 rounded-full shadow-md font-mono animate-pulse">
                        <Timer className="w-3 h-3 text-white" />
                        <span>{tip.currentMinute}</span>
                        <span className="text-[10px] font-normal text-red-200">({tip.period})</span>
                      </span>

                      {/* Urgency Badge */}
                      {tip.urgencyLevel === 'high' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-amber-400" />
                          Opportunité Imminente
                        </span>
                      )}

                      {/* Stake Live In-Play Official Link */}
                      {tip.stakeUrl && (
                        <a
                          href={tip.stakeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20 transition ml-auto sm:ml-0"
                          title="Ouvrir cette rencontre directement sur Stake.com"
                        >
                          <span>⚡ Stake Live In-Play</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5">
                      <h4 className="text-base font-black text-white">
                        {tip.match}
                      </h4>
                      {/* Current Score Pill */}
                      <span className="px-2.5 py-0.5 bg-slate-950 border border-red-500/50 rounded-lg text-sm font-black font-mono text-red-400">
                        {tip.currentScore}
                      </span>
                    </div>
                  </div>

                  {/* Odds & EV+ */}
                  <div className="text-left sm:text-right flex-shrink-0 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-baseline gap-2 justify-start sm:justify-end">
                      {tip.preMatchOdds && (
                        <span className="text-xs text-slate-500 line-through font-mono">
                          @{tip.preMatchOdds.toFixed(2)}
                        </span>
                      )}
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        @{tip.liveOdds.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 justify-start sm:justify-end mt-0.5">
                      <span className="text-[11px] font-bold text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30 font-mono">
                        +{tip.liveExpectedValue}% EV Live
                      </span>
                      {oddsBoostPercent && oddsBoostPercent > 0 && (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                          +{oddsBoostPercent}% inflation cote
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* In-Play Tactical Stats Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-950/90 p-3 rounded-xl border border-slate-800/80 text-xs">
                  {tip.inPlayStats.possession && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400">Possession</span>
                      <div className="font-bold text-white font-mono">{tip.inPlayStats.possession}</div>
                    </div>
                  )}
                  {tip.inPlayStats.shotsOnTarget && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400">Tirs Cadrés</span>
                      <div className="font-bold text-cyan-300 font-mono">{tip.inPlayStats.shotsOnTarget}</div>
                    </div>
                  )}
                  {tip.inPlayStats.liveXg && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400">xG en Direct</span>
                      <div className="font-bold text-emerald-300 font-mono">{tip.inPlayStats.liveXg}</div>
                    </div>
                  )}
                  {tip.inPlayStats.dangerousAttacks && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400">Attaques Dangereuses</span>
                      <div className="font-bold text-amber-300 font-mono">{tip.inPlayStats.dangerousAttacks}</div>
                    </div>
                  )}
                  {tip.inPlayStats.foulsOrCards && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400">Fautes / Cartons</span>
                      <div className="font-bold text-rose-300 font-mono">{tip.inPlayStats.foulsOrCards}</div>
                    </div>
                  )}
                </div>

                {/* Momentum & Proposed Live Market */}
                <div className="bg-gradient-to-r from-slate-950 via-slate-950 to-indigo-950/30 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-red-400" />
                        Pari In-Play Recommandé par l'IA :
                      </div>
                      <div className="text-sm font-black text-emerald-300 mt-0.5">
                        {tip.liveMarket}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Momentum :</span>
                      <span className="font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        ⚡ {tip.momentumTeam}
                      </span>
                    </div>
                  </div>

                  {/* Quantitative Edge Explanation */}
                  <div className="text-xs text-slate-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                    <span className="font-bold text-indigo-300">📊 Analyse du temps écoulé : </span>
                    {tip.liveEdgeAnalysis}
                  </div>

                  {/* Timing advice */}
                  {tip.recommendedEntryWindow && (
                    <div className="text-[11px] text-cyan-300 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span><strong>Fenêtre d'entrée conseillée :</strong> {tip.recommendedEntryWindow}</span>
                    </div>
                  )}
                </div>

                {/* Action Bar & Quick Stake */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-medium">Mise conseillée :</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0.1"
                        value={currentStake}
                        onChange={(e) => setCustomStakes({ ...customStakes, [tip.id]: parseFloat(e.target.value) || 0 })}
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-right focus:outline-none focus:border-red-500"
                      />
                      <span className="text-xs text-slate-400 font-mono">{currency}</span>
                    </div>

                    <div className="text-xs font-mono text-emerald-400">
                      Gain net : <strong>+{potentialProfit} {currency}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Direct Stake.com Live Placement */}
                    <a
                      href={tip.stakeUrl || 'https://stake.com/sports'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-orange-950/50 transition active:scale-95"
                      title="Parier directement en direct sur Stake.com"
                    >
                      <span>⚡ Parier sur Stake.com (@{tip.liveOdds.toFixed(2)})</span>
                      <ExternalLink className="w-3 h-3 text-orange-200" />
                    </a>

                    {/* Track Live Bet Button */}
                    <button
                      onClick={() => handleTrackLiveBet(tip)}
                      disabled={isTracked}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isTracked
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 cursor-default'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 shadow-sm active:scale-95'
                      }`}
                    >
                      {isTracked ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Pari Suivi</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
                          <span>Suivre dans l'App</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
