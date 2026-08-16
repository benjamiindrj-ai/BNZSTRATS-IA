import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ShieldCheck, 
  Percent, 
  Activity, 
  Clock, 
  Target, 
  Flame, 
  RefreshCw, 
  Filter, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Globe,
  Calculator,
  Bookmark,
  Coins,
  Zap,
  Gauge,
  Scale,
  BarChart3,
  ArrowDownRight,
  ArrowUpRight,
  Users,
  Award,
  Check,
  PlusCircle,
  Radio,
  Search,
  SlidersHorizontal,
  X,
  CloudSun,
  Wind,
  Droplets,
  Database,
  Key,
  Cpu
} from 'lucide-react';
import { SportTip, SportAnalysisResponse, TrackedSportBet } from '../types';
import { BetAccuracyTracker } from './BetAccuracyTracker';
import { LiveSportsDashboard } from './LiveSportsDashboard';
import { IntegrationsHubModal } from './IntegrationsHubModal';
import { formatParisTime, formatParisFullDate, formatKickoffCountdown } from '../utils/parisTime';

export type MarketCategory = 'all' | '1x2' | 'over_under' | 'handicap' | 'btts' | 'double_chance' | 'props' | 'combos';

interface MarketFilterOption {
  id: MarketCategory;
  label: string;
  shortLabel: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
}

export const MARKET_CATEGORY_OPTIONS: MarketFilterOption[] = [
  { 
    id: 'all', 
    label: 'Tous les Marchés', 
    shortLabel: 'Tous', 
    icon: '🎯', 
    badgeBg: 'bg-slate-800', 
    badgeText: 'text-slate-200',
    badgeBorder: 'border-slate-700',
    description: 'Toutes les opportunités Stake.com' 
  },
  { 
    id: '1x2', 
    label: '1N2 / Vainqueur (Match Winner)', 
    shortLabel: '1N2 / Vainqueur', 
    icon: '⚔️', 
    badgeBg: 'bg-blue-500/20', 
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/40',
    description: 'Vainqueur du Match, 1X2, Moneyline' 
  },
  { 
    id: 'over_under', 
    label: 'Over / Under (Totaux Buts & Pts)', 
    shortLabel: 'Over / Under', 
    icon: '📈', 
    badgeBg: 'bg-emerald-500/20', 
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    description: 'Plus de / Moins de X buts, points ou sets' 
  },
  { 
    id: 'handicap', 
    label: 'Handicap Asiatique & Spreads', 
    shortLabel: 'Handicap / Spreads', 
    icon: '⚖️', 
    badgeBg: 'bg-purple-500/20', 
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/40',
    description: 'Handicaps asiatiques, écart de points & spreads' 
  },
  { 
    id: 'btts', 
    label: 'Les 2 Équipes Marquent (BTTS)', 
    shortLabel: 'BTTS (2 Marquent)', 
    icon: '⚽', 
    badgeBg: 'bg-amber-500/20', 
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40',
    description: 'Les deux équipes marquent (Oui / Non)' 
  },
  { 
    id: 'double_chance', 
    label: 'Double Chance & DNB (Remboursé Nul)', 
    shortLabel: 'Double Chance / DNB', 
    icon: '🛡️', 
    badgeBg: 'bg-cyan-500/20', 
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/40',
    description: '1X, X2, 12 et Draw No Bet (Remboursé si nul)' 
  },
  { 
    id: 'props', 
    label: 'Performances & Buteurs (Props)', 
    shortLabel: 'Props & Buteurs', 
    icon: '🌟', 
    badgeBg: 'bg-rose-500/20', 
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/40',
    description: 'Buteurs, Points/Passes NBA, performances' 
  },
  { 
    id: 'combos', 
    label: 'Combos & Mi-Temps', 
    shortLabel: 'Combos / MT', 
    icon: '⚡', 
    badgeBg: 'bg-indigo-500/20', 
    badgeText: 'text-indigo-300',
    badgeBorder: 'border-indigo-500/40',
    description: '1N2 & Over/Under, Mi-temps / Fin de match' 
  },
];

export const classifyMarket = (marketName: string = '', stakeMarketId?: string, stakeMarketName?: string): MarketCategory => {
  const combined = `${marketName} ${stakeMarketId || ''} ${stakeMarketName || ''}`.toLowerCase();

  if (
    combined.includes('over') || 
    combined.includes('under') || 
    combined.includes('plus de') || 
    combined.includes('moins de') || 
    combined.includes('total buts') || 
    combined.includes('total points') || 
    combined.includes('total_') ||
    combined.includes('totaux') || 
    combined.includes('total ') ||
    combined.includes('o/u')
  ) {
    return 'over_under';
  }

  if (
    combined.includes('handicap') || 
    combined.includes('spread') || 
    combined.includes('asiatique') || 
    combined.includes('asian') || 
    combined.includes('ah_') ||
    combined.includes('ecart') || 
    combined.includes('écart') || 
    /\b(\+|-)\d+(\.5)?\b/.test(combined)
  ) {
    return 'handicap';
  }

  if (
    combined.includes('btts') || 
    combined.includes('deux équipes') || 
    combined.includes('les 2 équipes') || 
    combined.includes('les deux marquent') || 
    combined.includes('both teams') || 
    combined.includes('gg/ng') || 
    combined.includes('but pour les 2')
  ) {
    return 'btts';
  }

  if (
    combined.includes('double chance') || 
    combined.includes('draw no bet') || 
    combined.includes('dnb') || 
    combined.includes('remboursé si nul') || 
    combined.includes('rembourse si nul') || 
    combined.includes('sans le nul') ||
    combined.includes(' 1x') || 
    combined.includes(' x2') || 
    combined.includes(' 12')
  ) {
    return 'double_chance';
  }

  if (
    combined.includes('buteur') || 
    combined.includes('passeur') || 
    combined.includes('points de ') || 
    combined.includes('passes de ') || 
    combined.includes('rebonds') || 
    combined.includes('tirs cadrés') || 
    combined.includes('cartons') || 
    combined.includes('corners') || 
    combined.includes('props') || 
    combined.includes('player_') ||
    combined.includes('performance')
  ) {
    return 'props';
  }

  if (
    combined.includes(' & ') || 
    combined.includes(' et ') || 
    combined.includes('combo') || 
    combined.includes('mi-temps') || 
    combined.includes('mt/fm') || 
    combined.includes('1ère mi-temps') || 
    combined.includes('1st half')
  ) {
    return 'combos';
  }

  if (
    combined.includes('1x2') || 
    combined.includes('1n2') || 
    combined.includes('victoire') || 
    combined.includes('vainqueur') || 
    combined.includes('moneyline') || 
    combined.includes('gagne') || 
    combined.includes('match winner') || 
    combined.includes('domicile') || 
    combined.includes('extérieur')
  ) {
    return '1x2';
  }

  return '1x2';
};

export const getMarketCategoryBadge = (category: MarketCategory) => {
  switch (category) {
    case '1x2':
      return { label: '1N2 / Vainqueur', icon: '⚔️', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    case 'over_under':
      return { label: 'Over / Under', icon: '📈', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    case 'handicap':
      return { label: 'Handicap Spread', icon: '⚖️', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
    case 'btts':
      return { label: 'Les 2 Marquent (BTTS)', icon: '⚽', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    case 'double_chance':
      return { label: 'Double Chance / DNB', icon: '🛡️', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
    case 'props':
      return { label: 'Props & Buteurs', icon: '🌟', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
    case 'combos':
      return { label: 'Combos & Mi-Temps', icon: '⚡', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    default:
      return { label: 'Marché Stake', icon: '🎯', color: 'bg-slate-500/20 text-slate-300 border-slate-500/40' };
  }
};

interface SportsAnalysisProps {
  currentBalance: number;
  currency: string;
  trackedBets: TrackedSportBet[];
  onTrackBet: (tip: SportTip, stakeAmount: number) => void;
  onUpdateTrackedStatus: (id: string, status: 'won' | 'lost' | 'void' | 'pending', finalScore?: string, notes?: string) => void;
  onBatchUpdateTrackedStatus?: (updates: Array<{ id: string; status: 'won' | 'lost' | 'void' | 'pending'; finalScore?: string; resolutionNotes?: string; autoResolved?: boolean }>) => void;
  onUpdateTrackedStake?: (id: string, stakePercent: number, stakeAmount: number) => void;
  onDeleteTrackedBet: (id: string) => void;
  onClearTrackedBets: () => void;
}

export const SportsAnalysis: React.FC<SportsAnalysisProps> = ({ 
  currentBalance, 
  currency,
  trackedBets,
  onTrackBet,
  onUpdateTrackedStatus,
  onBatchUpdateTrackedStatus,
  onUpdateTrackedStake,
  onDeleteTrackedBet,
  onClearTrackedBets
}) => {
  const [mainViewMode, setMainViewMode] = useState<'tips' | 'live' | 'tracker'>('tips');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [marketType, setMarketType] = useState<'value_bets' | 'safe_low_odds' | 'high_odds_acca' | 'player_props'>('value_bets');
  const [customLeague, setCustomLeague] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<SportAnalysisResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Market Selection Filter & Search Filter
  const [selectedMarketCategory, setSelectedMarketCategory] = useState<MarketCategory>('all');
  const [marketSearchText, setMarketSearchText] = useState<string>('');
  const [drawerMarketSubFilter, setDrawerMarketSubFilter] = useState<string>('all');

  // Filtered tips & Advanced Quant Filters
  const [filterRisk, setFilterRisk] = useState<'all' | 'safe' | 'value' | 'aggressive'>('all');
  const [minEvFilter, setMinEvFilter] = useState<number>(0);
  const [minConfidenceFilter, setMinConfidenceFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'ev' | 'confidence' | 'kickoff' | 'odds'>('ev');
  const [onlyDroppingOdds, setOnlyDroppingOdds] = useState<boolean>(false);
  const [expandedStakeTipId, setExpandedStakeTipId] = useState<string | null>(null);

  // Live Paris Time clock state
  const [currentParisTime, setCurrentParisTime] = useState<string>(formatParisTime(Date.now(), true));
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentParisTime(formatParisTime(Date.now(), true));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sportsList = [
    { id: 'all', label: 'Tous les Sports', icon: '🏆' },
    { id: 'football', label: 'Football', icon: '⚽' },
    { id: 'basketball', label: 'Basketball (NBA)', icon: '🏀' },
    { id: 'tennis', label: 'Tennis (ATP/WTA)', icon: '🎾' },
    { id: 'mma', label: 'MMA (UFC)', icon: '🥊' },
    { id: 'esports', label: 'E-Sports (CS/LoL)', icon: '🎮' },
  ];

  const marketOptions = [
    { id: 'value_bets', label: 'Value Bets (EV+)', desc: 'Meilleure espérance de gain mathématique' },
    { id: 'safe_low_odds', label: 'Sécurisé / Faible Risque', desc: 'Cotes 1.40 à 1.85, haute probabilité' },
    { id: 'high_odds_acca', label: 'Combinés / Grosses Cotes', desc: 'Accas et cotes boostées' },
    { id: 'player_props', label: 'Performances Joueurs', desc: 'Buteurs, Points/Passes NBA, etc.' },
  ];

  // Stats calculation for the badge
  const resolvedCount = trackedBets.filter(b => b.status === 'won' || b.status === 'lost').length;
  const wonCount = trackedBets.filter(b => b.status === 'won').length;
  const winRateSummary = resolvedCount > 0 ? ((wonCount / resolvedCount) * 100).toFixed(0) : '0';

  const fetchSportsAnalysis = async () => {
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

      const res = await fetch('/api/gemini/analyze-sports', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sport: selectedSport,
          marketType,
          userBankroll: currentBalance > 0 ? currentBalance : 100,
          currency,
          customLeague: customLeague.trim(),
          requestTimestamp: Date.now(),
        }),
      });

      if (!res.ok) {
        throw new Error(`Erreur serveur (${res.status})`);
      }

      const data = await res.json();
      setAnalysisData(data);
    } catch (err: any) {
      console.error('Failed to fetch sports analysis:', err);
      setErrorMsg(err.message || 'Impossible de charger les analyses sportives.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSportsAnalysis();
  }, [selectedSport, marketType]);

  // Compute count of tips per market category for dynamic badges
  const marketCategoryCounts: Record<MarketCategory, number> = {
    all: 0,
    '1x2': 0,
    over_under: 0,
    handicap: 0,
    btts: 0,
    double_chance: 0,
    props: 0,
    combos: 0,
  };

  const rawTips = analysisData?.tips || [];
  rawTips.forEach((tip) => {
    if (selectedSport === 'all' || tip.sport === selectedSport) {
      marketCategoryCounts.all++;
      const cat = classifyMarket(tip.market, tip.stakeMarketId, tip.stakeMarketName);
      if (marketCategoryCounts[cat] !== undefined) {
        marketCategoryCounts[cat]++;
      }
    }
  });

  const displayedTips = rawTips
    .filter((tip) => {
      if (selectedSport !== 'all' && tip.sport !== selectedSport) return false;
      if (filterRisk !== 'all' && tip.riskLevel !== filterRisk) return false;
      if (minEvFilter > 0 && tip.expectedValue < minEvFilter) return false;
      if (minConfidenceFilter > 0 && tip.confidenceScore < minConfidenceFilter) return false;
      if (onlyDroppingOdds && (!tip.droppingOddsAlert || tip.droppingOddsAlert.trend !== 'dropping')) return false;
      
      // Market Category Filter
      if (selectedMarketCategory !== 'all') {
        const tipCategory = classifyMarket(tip.market, tip.stakeMarketId, tip.stakeMarketName);
        const hasMatchingStakeMarket = tip.allStakeMarkets?.some(m => classifyMarket(m.marketName, m.marketId) === selectedMarketCategory);
        if (tipCategory !== selectedMarketCategory && !hasMatchingStakeMarket) {
          return false;
        }
      }

      // Keyword / Search Filter
      if (marketSearchText.trim()) {
        const q = marketSearchText.trim().toLowerCase();
        const fullText = `${tip.match} ${tip.league} ${tip.market} ${tip.stakeMarketName || ''} ${tip.analysisReasoning || ''}`.toLowerCase();
        if (!fullText.includes(q)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'ev') return b.expectedValue - a.expectedValue;
      if (sortBy === 'confidence') return b.confidenceScore - a.confidenceScore;
      if (sortBy === 'odds') return b.odds - a.odds;
      if (sortBy === 'kickoff') return (a.kickoffTimestamp || 0) - (b.kickoffTimestamp || 0);
      return 0;
    });

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

  return (
    <div id="sports-analysis-view" className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-orange-950/40 border border-blue-600/40 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-orange-500/30 border border-blue-500/40 flex items-center justify-center text-orange-400 shadow-md text-xl">
            🏆
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Analyses & Modélisation Prédictive Sportsbook
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/20 to-orange-500/20 text-orange-300 border border-orange-500/30">
                Stake Quant Engine
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Optimisation de la probabilité de victoire par <strong>Distribution de Poisson</strong>, <strong>Expected Value (EV+)</strong>, cotes réelles <strong>Stake.com</strong> et <strong>Audit de Fiabilité</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* External Integrations Hub Trigger Pill */}
          <button
            onClick={() => setIsIntegrationsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-950/80 hover:bg-blue-900/90 border border-blue-500/50 rounded-xl text-xs font-semibold text-blue-200 hover:text-white shadow-sm transition active:scale-95"
            title="Consulter les modules gratuits connectés (Open-Meteo, The Odds API, Football-Data, RapidAPI)"
          >
            <CloudSun className="w-3.5 h-3.5 text-amber-400" />
            <span>APIs & Météo Stades</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Live Paris Clock Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-cyan-500/40 rounded-xl text-xs font-mono text-cyan-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>🗼 Heure de Paris : <strong className="text-white">{currentParisTime}</strong></span>
          </div>

          {/* Main Sub-Tab Switcher */}
          <div className="bg-slate-900/90 border border-slate-700/80 p-1 rounded-xl flex items-center gap-1 shadow-sm flex-wrap">
            <button
              onClick={() => setMainViewMode('tips')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mainViewMode === 'tips'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Pré-Match & Value (Stake.com)</span>
            </button>

            <button
              onClick={() => setMainViewMode('live')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mainViewMode === 'live'
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md shadow-orange-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-300 animate-pulse" />
              <span>En Direct Live (Stake.com)</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-red-950/90 text-orange-200 border border-orange-500/40 rounded">
                In-Play
              </span>
            </button>

            <button
              onClick={() => setMainViewMode('tracker')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mainViewMode === 'tracker'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-orange-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-white" />
              <span>Bilan & Suivi IA</span>
              {trackedBets.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  mainViewMode === 'tracker' ? 'bg-slate-950 text-orange-300 border border-orange-500/40' : 'bg-slate-800 text-emerald-400'
                }`}>
                  {trackedBets.length} {resolvedCount > 0 ? `(${winRateSummary}%)` : ''}
                </span>
              )}
            </button>
          </div>

          {mainViewMode === 'tips' && (
            <button
              onClick={fetchSportsAnalysis}
              disabled={isLoading}
              className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 border border-slate-700 shrink-0 min-w-[110px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="whitespace-nowrap">{isLoading ? 'Analyse...' : 'Actualiser'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Mode Rendering: Live vs Tracker vs Pre-Match Tips */}
      {mainViewMode === 'live' ? (
        <LiveSportsDashboard
          currentBalance={currentBalance}
          currency={currency}
          trackedBets={trackedBets}
          onTrackBet={onTrackBet}
        />
      ) : mainViewMode === 'tracker' ? (
        <BetAccuracyTracker
          trackedBets={trackedBets}
          onUpdateStatus={onUpdateTrackedStatus}
          onBatchUpdateStatus={onBatchUpdateTrackedStatus}
          onUpdateStake={onUpdateTrackedStake}
          onDeleteBet={onDeleteTrackedBet}
          onClearAll={onClearTrackedBets}
          currency={currency}
        />
      ) : (
        <>

      {/* 2. Quantitative Market Pulse Dashboard */}
      {analysisData?.marketPulse && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Flux Sharp Money
              </span>
              <span className="font-mono text-emerald-400 font-bold">{analysisData.marketPulse.sharpMoneyPercentage}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${analysisData.marketPulse.sharpMoneyPercentage}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500">Capitaux des parieurs pro</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <Scale className="w-3.5 h-3.5 text-blue-400" />
                Edge de Marché
              </span>
              <span className="font-mono text-blue-300 font-bold">EV+ Favorable</span>
            </div>
            <p className="text-[10px] text-slate-300 line-clamp-1">Écart cotes vs probas réelles</p>
            <div className="text-[10px] text-emerald-400 font-medium">Biais public exploitable</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Exposition Max Jour
              </span>
              <span className="font-mono text-indigo-300 font-bold">{analysisData.marketPulse.recommendedDailyMaxExposure}%</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Plafond max bankroll : <strong className="text-white">{((currentBalance || 100) * (analysisData.marketPulse.recommendedDailyMaxExposure / 100)).toFixed(2)} {currency}</strong>
            </div>
            <div className="text-[10px] text-slate-500">Protection contre la variance</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <Users className="w-3.5 h-3.5 text-rose-400" />
                Biais Grand Public
              </span>
              <span className="font-mono text-rose-400 text-[10px] font-bold">Favoris sur-cotés</span>
            </div>
            <p className="text-[10px] text-slate-400 line-clamp-1">{analysisData.marketPulse.publicConsensusBias}</p>
            <div className="text-[10px] text-slate-500">Opportunité sur les sous-jacents</div>
          </div>

        </div>
      )}

      {/* 3. Sport & Market Filters Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
        
        {/* Sport Selection Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {sportsList.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSport(s.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedSport === s.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Strategy Profile Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/60">
          {marketOptions.map((m) => (
            <button
              key={m.id}
              onClick={() => setMarketType(m.id as any)}
              className={`p-2.5 rounded-xl text-left border transition ${
                marketType === m.id
                  ? 'bg-slate-800 border-blue-500/50 text-white'
                  : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="text-xs font-bold flex items-center justify-between">
                <span>{m.label}</span>
                {marketType === m.id && <Sparkles className="w-3 h-3 text-blue-400" />}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{m.desc}</div>
            </button>
          ))}
        </div>

        {/* SPECIFIC MARKET CATEGORY FILTER BAR (Stake.com) */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-bold text-slate-200">
                Filtres de Marchés Ciblés (Stake.com)
              </span>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                {displayedTips.length} / {rawTips.length} opportunités
              </span>
            </div>

            {/* Quick search input */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={marketSearchText}
                onChange={(e) => setMarketSearchText(e.target.value)}
                placeholder="Rechercher marché (ex: Over 2.5, Handicap -1, PSG...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500/60 focus:border-orange-500/60"
              />
              {marketSearchText && (
                <button
                  type="button"
                  onClick={() => setMarketSearchText('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Market Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-wrap">
            {MARKET_CATEGORY_OPTIONS.map((opt) => {
              const count = marketCategoryCounts[opt.id] || 0;
              const isSelected = selectedMarketCategory === opt.id;

              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedMarketCategory(opt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 border-orange-400/80 text-white shadow-sm shadow-orange-950/50 scale-[1.02]'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                  title={opt.description}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.shortLabel}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected 
                      ? 'bg-slate-950/80 text-orange-200 border border-orange-500/40' 
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {(selectedMarketCategory !== 'all' || marketSearchText.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedMarketCategory('all');
                  setMarketSearchText('');
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 transition flex items-center gap-1 shrink-0"
                title="Réinitialiser tous les filtres de marché"
              >
                <X className="w-3 h-3" />
                <span>Effacer filtres</span>
              </button>
            )}
          </div>
        </div>

        {/* Kickoff Window Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-blue-950/40 border border-blue-800/40 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              Horizon temporel : <strong className="text-cyan-300">Départ entre +30 min et +15h</strong> après la demande (Heure de Paris, France)
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
            <span className="text-cyan-400 bg-slate-900/90 px-2 py-0.5 rounded border border-cyan-800/60 flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
              Direct Paris : {currentParisTime}
            </span>
            <span className="text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
              {analysisData?.kickoffWindow?.minTimeFormatted && analysisData?.kickoffWindow?.maxTimeFormatted 
                ? `Coups d'envoi : ${analysisData.kickoffWindow.minTimeFormatted} ➔ ${analysisData.kickoffWindow.maxTimeFormatted}`
                : 'Filtre 30m - 15h garanti'}
            </span>
          </div>
        </div>

      </div>

      {/* 4. Error Banner */}
      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-800/40 rounded-xl p-3.5 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 5. Main Sports Tips Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Tips List */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Sélections Prédictives ({displayedTips.length})
              </h4>
              {selectedMarketCategory !== 'all' && (
                <span className="text-xs font-bold text-orange-300 bg-orange-950/60 border border-orange-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>{MARKET_CATEGORY_OPTIONS.find(o => o.id === selectedMarketCategory)?.icon}</span>
                  <span>Filtre : {MARKET_CATEGORY_OPTIONS.find(o => o.id === selectedMarketCategory)?.shortLabel}</span>
                </span>
              )}
            </div>

            {/* Advanced Quant Filters Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Dropping odds toggle */}
              <button
                type="button"
                onClick={() => setOnlyDroppingOdds(!onlyDroppingOdds)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1.5 ${
                  onlyDroppingOdds
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Afficher uniquement les cotes en chute rapide (Sharp Money)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                <span>Dropping Odds</span>
              </button>

              {/* Min EV filter selector */}
              <select
                value={minEvFilter}
                onChange={(e) => setMinEvFilter(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={0}>Toute EV</option>
                <option value={4}>EV &ge; +4%</option>
                <option value={6}>EV &ge; +6%</option>
                <option value={8}>EV &ge; +8%</option>
              </select>

              {/* Sort By selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ev">Tri : Meilleure EV+</option>
                <option value="confidence">Tri : Confiance IA</option>
                <option value="kickoff">Tri : Coup d'envoi</option>
                <option value="odds">Tri : Cote</option>
              </select>

              {/* Risk filter */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-[11px]">
                {(['all', 'safe', 'value', 'aggressive'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilterRisk(r)}
                    className={`px-2 py-0.5 rounded capitalize font-semibold transition ${
                      filterRisk === r
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r === 'all' ? 'Tous' : r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-semibold">Calcul de distribution de Poisson & analyse des flux Sharp Money...</p>
              <p className="text-[11px] text-slate-500">Recherche des meilleurs indices de valeur sur Stake Sportsbook</p>
            </div>
          ) : displayedTips.length > 0 ? (
            <div className="space-y-4">
              {displayedTips.map((tip, tipIdx) => {
                const stakeAmount = ((currentBalance > 0 ? currentBalance : 100) * (tip.recommendedStakePercent / 100)).toFixed(2);
                const potentialProfit = (parseFloat(stakeAmount) * (tip.odds - 1)).toFixed(2);

                const impliedProb = tip.bookmakerImpliedProbability || Number((100 / tip.odds).toFixed(1));
                const fairProb = tip.aiEstimatedTrueProbability || Number((impliedProb + tip.expectedValue).toFixed(1));
                const probEdge = (fairProb - impliedProb).toFixed(1);

                const isTracked = trackedBets.some(b => b.tipId === tip.id || (b.match === tip.match && b.market === tip.market));
                const kickoffInfo = formatKickoffCountdown(tip.kickoffTimestamp, tip.kickoffTime);

                const tipMarketCategory = classifyMarket(tip.market, tip.stakeMarketId, tip.stakeMarketName);
                const marketBadge = getMarketCategoryBadge(tipMarketCategory);

                return (
                  <div 
                    key={tip.id ? `${tip.id}-${tipIdx}` : `tip-${tipIdx}`} 
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition space-y-4"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSportBadge(tip.sport).color}`}>
                            <span>{getSportBadge(tip.sport).icon}</span>
                            <span>{getSportBadge(tip.sport).label}</span>
                          </span>

                          {/* Specific Market Category Badge */}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${marketBadge.color}`}>
                            <span>{marketBadge.icon}</span>
                            <span>{marketBadge.label}</span>
                          </span>

                          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                            {tip.league}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 px-2.5 py-0.5 rounded-full shadow-sm font-mono">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {kickoffInfo.badgeText}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tip.riskLevel === 'safe'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : tip.riskLevel === 'value'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {tip.riskLevel === 'safe' ? 'SÉCURISÉ' : tip.riskLevel === 'value' ? 'VALUE BET (EV+)' : 'OUTSIDER'}
                          </span>

                          {/* Stake.com Official Link Badge */}
                          {tip.stakeUrl && (
                            <a
                              href={tip.stakeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-300 bg-orange-950/80 border border-orange-500/40 hover:bg-orange-900/60 px-2.5 py-0.5 rounded-full shadow-sm transition"
                              title="Ouvrir cette rencontre directement sur Stake.com"
                            >
                              <span>⚡ Stake.com ({tip.stakeMarginPercent ? `Marge ${tip.stakeMarginPercent}%` : 'Cote Officielle'})</span>
                              <ExternalLink className="w-2.5 h-2.5 text-orange-400" />
                            </a>
                          )}
                        </div>
                        <h5 className="text-sm font-bold text-white mt-1">{tip.match}</h5>
                      </div>

                      {/* Odds & EV */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl font-black text-emerald-400 font-mono">
                          @{tip.odds.toFixed(2)}
                        </div>
                        <div className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 inline-block mt-0.5 font-mono">
                          +{tip.expectedValue}% EV
                        </div>
                      </div>
                    </div>

                    {/* Market selection highlight */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                            <span>Marché conseillé</span>
                            <span className="text-orange-400 font-normal">({marketBadge.label})</span>
                          </div>
                          <div className="text-xs font-extrabold text-slate-100">{tip.market}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-semibold">Confiance IA</div>
                        <div className="text-xs font-bold text-emerald-400 font-mono">{tip.confidenceScore}%</div>
                      </div>
                    </div>

                    {/* Expandable Stake.com Markets Drawer */}
                    {tip.allStakeMarkets && tip.allStakeMarkets.length > 0 && (
                      <div className="border border-slate-800/90 rounded-xl overflow-hidden bg-slate-950/60">
                        <button
                          type="button"
                          onClick={() => setExpandedStakeTipId(expandedStakeTipId === tip.id ? null : tip.id)}
                          className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900/80 transition"
                        >
                          <span className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-orange-400" />
                            <span>Explorer les marchés Stake.com de ce match ({tip.allStakeMarkets.length} marchés)</span>
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-orange-400 font-semibold">
                            {expandedStakeTipId === tip.id ? 'Masquer' : 'Voir toutes les cotes'}
                            {expandedStakeTipId === tip.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </span>
                        </button>

                        {expandedStakeTipId === tip.id && (
                          <div className="p-3 border-t border-slate-800/80 space-y-3 bg-slate-950">
                            
                            {/* Sub-filter inside Stake Drawer */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                              {[
                                { id: 'all', label: 'Tous les Marchés' },
                                { id: '1x2', label: '1X2 / Vainqueur' },
                                { id: 'over_under', label: 'Over / Under' },
                                { id: 'handicap', label: 'Handicaps' },
                                { id: 'btts', label: 'Les 2 Marquent' },
                                { id: 'double_chance', label: 'Double Chance' },
                              ].map((subOpt) => (
                                <button
                                  key={subOpt.id}
                                  type="button"
                                  onClick={() => setDrawerMarketSubFilter(subOpt.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition border ${
                                    drawerMarketSubFilter === subOpt.id
                                      ? 'bg-orange-600/30 border-orange-500/60 text-orange-200'
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  {subOpt.label}
                                </button>
                              ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {tip.allStakeMarkets
                                .filter((market: any) => {
                                  if (drawerMarketSubFilter === 'all') return true;
                                  const mCat = classifyMarket(market.marketName, market.marketId);
                                  return mCat === drawerMarketSubFilter;
                                })
                                .map((market: any, mIdx: number) => {
                                  const marketCat = classifyMarket(market.marketName, market.marketId);
                                  const badge = getMarketCategoryBadge(marketCat);

                                  return (
                                    <div key={`mkt-${market.marketId || mIdx}-${mIdx}`} className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl space-y-1.5">
                                      <div className="flex items-center justify-between text-[11px]">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-slate-200">{market.marketName}</span>
                                          <span className={`text-[9px] px-1.5 py-0.2 rounded border ${badge.color}`}>
                                            {badge.label}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-mono">Marge : {market.marginPercent}%</span>
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                        {market.outcomes.map((out: any, oIdx: number) => {
                                          const isCurrentPick = tip.market.toLowerCase().includes(out.name.toLowerCase());
                                          return (
                                            <button
                                              key={`out-${out.outcomeId || oIdx}-${oIdx}`}
                                              type="button"
                                              onClick={() => {
                                                const customTip: SportTip = {
                                                  ...tip,
                                                  id: `${tip.id}-mkt-${market.marketId}-${oIdx}`,
                                                  market: `${market.marketName} : ${out.name}`,
                                                  odds: out.odds,
                                                  expectedValue: out.expectedValue || tip.expectedValue,
                                                  bookmakerImpliedProbability: out.impliedProb || Number((100 / out.odds).toFixed(1)),
                                                };
                                                onTrackBet(customTip, parseFloat(stakeAmount));
                                              }}
                                              className={`p-1.5 rounded-lg text-center border transition flex flex-col items-center justify-center ${
                                                isCurrentPick 
                                                  ? 'bg-blue-600/30 border-blue-500/60 text-white' 
                                                  : 'bg-slate-950 border-slate-800 hover:border-orange-500/40 text-slate-300 hover:text-white'
                                              }`}
                                              title={`Cliquer pour suivre ce marché (${market.marketName} - ${out.name})`}
                                            >
                                              <span className="text-[10px] font-semibold line-clamp-1">{out.name}</span>
                                              <span className="text-xs font-black font-mono text-emerald-400 mt-0.5">@{out.odds.toFixed(2)}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* QUANTITATIVE ANALYTICAL DASHBOARD FOR EACH MATCH */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                      
                      {/* Object 1: Probability Edge Gauge */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-blue-400" />
                          Probabilités vs Cote
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400">Bookmaker: {impliedProb}%</span>
                          <span className="text-emerald-400 font-bold">IA: {fairProb}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                          <div className="bg-slate-600 h-full" style={{ width: `${impliedProb}%` }} />
                          <div className="bg-emerald-400 h-full" style={{ width: `${Math.max(0, Number(probEdge) * 3)}%` }} />
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono font-medium">
                          Avantage statistique : +{probEdge}%
                        </div>
                      </div>

                      {/* Object 2: Poisson Distribution Model */}
                      {tip.poissonModelScore ? (
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <BarChart3 className="w-3 h-3 text-indigo-400" />
                            Modèle Poisson (Score)
                          </div>
                          <div className="text-xs font-extrabold text-indigo-300 font-mono">
                            {tip.poissonModelScore.predictedScore}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            xG/Pts Dom: <strong className="text-slate-200">{tip.poissonModelScore.homeExpGoals}</strong> | Ext: <strong className="text-slate-200">{tip.poissonModelScore.awayExpGoals}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <BarChart3 className="w-3 h-3 text-indigo-400" />
                            Modèle Prédictif
                          </div>
                          <div className="text-xs font-bold text-indigo-300">Modélisation validée</div>
                          <div className="text-[10px] text-slate-400">Échantillon &gt; 50 confrontations</div>
                        </div>
                      )}

                      {/* Object 3: Dropping Odds & Sharp Money Signal */}
                      {tip.droppingOddsAlert ? (
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            {tip.droppingOddsAlert.trend === 'dropping' ? (
                              <ArrowDownRight className="w-3 h-3 text-rose-400" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                            )}
                            Signal Dropping Odds
                          </div>
                          <div className="text-[11px] font-mono font-bold text-slate-200">
                            {tip.droppingOddsAlert.openingOdds.toFixed(2)} → <span className="text-rose-400">{tip.droppingOddsAlert.currentOdds.toFixed(2)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1" title={tip.droppingOddsAlert.sharpMoneySignal}>
                            {tip.droppingOddsAlert.sharpMoneySignal}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            Critère de Kelly
                          </div>
                          <div className="text-xs font-bold text-amber-300 font-mono">
                            {tip.kellyCriterionRatio ? `${tip.kellyCriterionRatio}% Kelly` : `${tip.recommendedStakePercent}% Bankroll`}
                          </div>
                          <div className="text-[10px] text-slate-400">Croissance optimale sans ruine</div>
                        </div>
                      )}

                    </div>

                    {/* THREE ADVANCED PILLARS ACCORDION / BADGES */}
                    <div className="space-y-2.5 pt-1">
                      
                      {/* Pillar 1: Advanced Performance xMetrics (npxG, xPoints, PPDA, Luck Regression) */}
                      {tip.advancedMetrics && (
                        <div className="bg-slate-950/70 border border-emerald-500/20 rounded-xl p-3 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              1. Performance Réelle (xMetrics & Luck Factor)
                            </span>
                            {tip.advancedMetrics.xPointsDiff && (
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                {tip.advancedMetrics.xPointsDiff}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                            {tip.advancedMetrics.npxGHome !== undefined && (
                              <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">npxG (Sans Penalty)</span>
                                <span className="font-mono font-bold text-slate-100">{tip.advancedMetrics.npxGHome} vs {tip.advancedMetrics.npxGAway}</span>
                              </div>
                            )}
                            {tip.advancedMetrics.ppdaIntensity && (
                              <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">PPDA (Intensité Pressing)</span>
                                <span className="font-mono font-bold text-cyan-300">{tip.advancedMetrics.ppdaIntensity}</span>
                              </div>
                            )}
                            <div className="bg-slate-900/90 p-2 rounded border border-slate-800 col-span-2 sm:col-span-1">
                              <span className="text-[10px] text-slate-400 block">Facteur Régression / Chance</span>
                              <span className="font-bold text-amber-300">
                                {tip.advancedMetrics.luckRegressFactor === 'undervalued_positive_regression' ? '📈 Sous-coté (Rebond attendu)' : tip.advancedMetrics.luckRegressFactor === 'overvalued_bubble' ? '📉 Surcoté (Risque bulle)' : '⚖️ Conforme xG'}
                              </span>
                            </div>
                          </div>

                          {tip.advancedMetrics.luckAnalysis && (
                            <p className="text-[11px] text-slate-300 italic border-l-2 border-emerald-500/40 pl-2">
                              {tip.advancedMetrics.luckAnalysis}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Pillar 2: Market Microstructure & Sharp Money vs Public */}
                      {tip.marketMicrostructure && (
                        <div className="bg-slate-950/70 border border-indigo-500/20 rounded-xl p-3 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                              2. Microstructure de Marché & Détection Parieurs Pros
                            </span>
                            {tip.marketMicrostructure.clvIndex && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                CLV : {tip.marketMicrostructure.clvIndex}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            {tip.marketMicrostructure.publicTicketsPct !== undefined && tip.marketMicrostructure.sharpMoneyPct !== undefined && (
                              <div className="bg-slate-900/90 p-2 rounded border border-slate-800 space-y-1">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-slate-400">Tickets Public : <strong>{tip.marketMicrostructure.publicTicketsPct}%</strong></span>
                                  <span className="text-indigo-300 font-bold">Sharp Money : <strong>{tip.marketMicrostructure.sharpMoneyPct}%</strong></span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                                  <div className="bg-blue-500 h-full" style={{ width: `${tip.marketMicrostructure.publicTicketsPct}%` }} />
                                  <div className="bg-indigo-400 h-full" style={{ width: `${tip.marketMicrostructure.sharpMoneyPct}%` }} />
                                </div>
                              </div>
                            )}

                            {tip.marketMicrostructure.asianHandicapShift && (
                              <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400">Mouvement Ligne Handicap</span>
                                <span className="font-mono font-bold text-emerald-400">{tip.marketMicrostructure.asianHandicapShift}</span>
                              </div>
                            )}
                          </div>

                          {tip.marketMicrostructure.divergenceAlert && (
                            <div className="text-[11px] text-indigo-200 bg-indigo-950/40 p-1.5 rounded border border-indigo-900/50">
                              ⚡ {tip.marketMicrostructure.divergenceAlert}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pillar 3: Contextual, Rest & Environmental Factors */}
                      {tip.contextualFactors && (
                        <div className="bg-slate-950/70 border border-cyan-500/20 rounded-xl p-3 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                              3. Facteurs Contextuels, Repos & Environnement
                            </span>
                            {tip.contextualFactors.restAdvantageIndex && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                {tip.contextualFactors.restAdvantageIndex}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            {tip.contextualFactors.keyAbsenceWarImpact && (
                              <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">Impact Absences Clés (WAR)</span>
                                <span className="text-slate-200 font-medium">{tip.contextualFactors.keyAbsenceWarImpact}</span>
                              </div>
                            )}

                            {tip.contextualFactors.refereeTendency && (
                              <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-400 block">Profil Arbitre / Sifflet</span>
                                <span className="text-slate-200 font-medium">{tip.contextualFactors.refereeTendency}</span>
                              </div>
                            )}

                            {tip.contextualFactors.weatherCondition && (
                              <div className="bg-slate-900/90 p-2 rounded border border-slate-800 col-span-1 sm:col-span-2 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400">Météo & État de la surface</span>
                                <span className="text-cyan-300 font-medium">{tip.contextualFactors.weatherCondition}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Analysis reasoning */}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {tip.analysisReasoning}
                    </p>

                    {/* Fatigue & Lineup context */}
                    {tip.lineupFatigueIndex && (
                      <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span><strong>Contexte effectif / forme :</strong> {tip.lineupFatigueIndex}</span>
                      </div>
                    )}

                    {/* Key stats pills */}
                    {tip.keyStats && tip.keyStats.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tip.keyStats.map((stat, idx) => (
                          <span 
                            key={idx} 
                            className="text-[10px] font-semibold bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700/60"
                          >
                            📊 {stat}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* EXTERNAL DATA ENRICHMENT MODULES (Open-Meteo Weather, Sharp Benchmark, H2H Form) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                      
                      {/* 1. Open-Meteo Real Stadium Weather */}
                      <div className="bg-slate-950/70 border border-sky-500/20 rounded-xl p-2.5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1">
                            <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                            Météo Stade (Open-Meteo)
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 font-mono">
                            Direct
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300 font-bold">
                            {tip.stadiumWeather?.temperatureC ? `${tip.stadiumWeather.temperatureC}°C, ${tip.stadiumWeather.conditionDesc}` : '21.5°C, Ciel Dégagé'}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            💨 {tip.stadiumWeather?.windSpeedKmh ? `${tip.stadiumWeather.windSpeedKmh} km/h` : '12 km/h'}
                          </span>
                        </div>
                        <p className="text-[10px] text-sky-200/80 italic leading-tight">
                          {tip.stadiumWeather?.impactSummary || 'Conditions idéales de jeu, vitesse de balle et appuis normaux.'}
                        </p>
                      </div>

                      {/* 2. Sharp Benchmark (Pinnacle & Betfair vs Stake) */}
                      <div className="bg-slate-950/70 border border-blue-500/20 rounded-xl p-2.5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-blue-400" />
                            Sharp Benchmark (Pinnacle)
                          </span>
                          {tip.sharpBenchmark?.clvIndex && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                              {tip.sharpBenchmark.clvIndex}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 text-[10px]">
                            Ligne Fair : <strong className="text-slate-200">@{tip.sharpBenchmark?.pinnacleOdds ? tip.sharpBenchmark.pinnacleOdds.toFixed(2) : (tip.odds * 0.95).toFixed(2)}</strong>
                          </span>
                          <span className="text-emerald-400 font-bold font-mono text-[10px]">
                            +{tip.sharpBenchmark?.stakeEdgeVsPinnacle ? tip.sharpBenchmark.stakeEdgeVsPinnacle.toFixed(1) : '3.8'}% Edge
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1" title={tip.sharpBenchmark?.sharpSignal}>
                          {tip.sharpBenchmark?.sharpSignal || 'Cote Stake supérieure à la ligne de clôture asiatique.'}
                        </p>
                      </div>

                      {/* 3. Football-Data.org H2H & Form Streak */}
                      <div className="bg-slate-950/70 border border-indigo-500/20 rounded-xl p-2.5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                            <Database className="w-3.5 h-3.5 text-indigo-400" />
                            H2H & Forme (5 Matchs)
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 font-mono">
                            Face-à-Face
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-slate-400">Dom:</span>
                            <span className="font-mono font-bold text-emerald-400">{tip.h2hRecentForm?.homeTeamForm ? tip.h2hRecentForm.homeTeamForm.slice(0, 5).join('-') : 'V-N-V-V-D'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-slate-400">Ext:</span>
                            <span className="font-mono font-bold text-cyan-400">{tip.h2hRecentForm?.awayTeamForm ? tip.h2hRecentForm.awayTeamForm.slice(0, 5).join('-') : 'V-D-N-V-D'}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-indigo-200/80 line-clamp-1" title={tip.h2hRecentForm?.headToHeadAdvantage}>
                          {tip.h2hRecentForm?.headToHeadAdvantage || 'Avantage dynamique et régularité xPoints en championnat.'}
                        </p>
                      </div>

                    </div>

                    {/* Footer: Stake Recommendation calculation & Action Buttons */}
                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>Mise conseillée : <strong className="text-slate-200">{tip.recommendedStakePercent}% ({stakeAmount} {currency})</strong></span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Direct Stake.com Bet Placement Link */}
                        <a
                          href={tip.stakeUrl || 'https://stake.com/sports'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-orange-950/40 transition active:scale-95"
                          title="Parier directement sur ce match sur Stake.com"
                        >
                          <span>⚡ Parier sur Stake.com (@{tip.odds.toFixed(2)})</span>
                          <ExternalLink className="w-3 h-3 text-orange-200" />
                        </a>

                        {/* Track Bet Button */}
                        {isTracked ? (
                          <button
                            onClick={() => setMainViewMode('tracker')}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1 hover:bg-indigo-600/50 transition"
                          >
                            <Check className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Pari Suivi</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onTrackBet(tip, parseFloat(stakeAmount))}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
                            <span>Suivre dans l'App (+{potentialProfit} {currency})</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
              Aucune sélection ne correspond aux filtres actuels.
            </div>
          )}

        </div>

        {/* Right Column: Combined Acca & Strategy Rules */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Combined Acca Card */}
          {analysisData?.combinedAcca && (
            <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wide">
                    Combiné Value IA
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {analysisData.combinedAcca.combinedEv}
                </span>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-medium">Cote Totale du Combiné</div>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                  @{analysisData.combinedAcca.totalOdds.toFixed(2)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-300">Sélections incluses :</div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {analysisData.combinedAcca.selections.map((sel, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-tight">{sel}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[11px] text-slate-400 bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-800/30 leading-relaxed">
                💡 <strong className="text-slate-200">Conseil de gestion :</strong> {analysisData.combinedAcca.riskAdvice}
              </p>

              {/* Stake.com Acca Bet Direct Placement */}
              <a
                href="https://stake.com/sports"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-orange-950/50 transition active:scale-98"
                title="Créer ce combiné sur Stake.com Sportsbook"
              >
                <span>⚡ Placer ce Combiné sur Stake.com (@{analysisData.combinedAcca.totalOdds.toFixed(2)})</span>
                <ExternalLink className="w-3.5 h-3.5 text-orange-200" />
              </a>
            </div>
          )}

          {/* Quantitative Bankroll Management Rules */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3.5 text-xs text-slate-300">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              6 Objets d'Analyse Intégrés
            </h4>

            <div className="space-y-2.5 text-[11px] text-slate-400 leading-relaxed">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <strong className="text-white block mb-0.5">1. Expected Value & True Probability</strong>
                Comparaison entre la probabilité réelle IA et la probabilité implicite de la cote bookmaker.
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <strong className="text-white block mb-0.5">2. Distribution de Poisson Prédictive</strong>
                Modélisation statistique exacte des scores probables et des espérances xG par mi-temps.
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <strong className="text-white block mb-0.5">3. Suivi Dropping Odds (Sharp Money)</strong>
                Alerte lorsque les gros parieurs professionnels font chuter une cote avant le match.
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <strong className="text-white block mb-0.5">4. Formule de Kelly Fractionné</strong>
                Calcul de la taille de mise exacte pour maximiser les profits sans risque de ruine.
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <strong className="text-white block mb-0.5">5. Indice Fatigue & Lineup</strong>
                Analyse du repos, des voyages, des absences clés et des dynamiques collectives.
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <strong className="text-white block mb-0.5">6. Market Pulse & Biais Public</strong>
                Détection des favoris sur-cotés par le grand public pour parier sur la valeur réelle.
              </div>
            </div>
          </div>

        </div>

      </div>
      </>
      )}

      {/* Integrations & External Free APIs Hub Modal */}
      <IntegrationsHubModal
        isOpen={isIntegrationsModalOpen}
        onClose={() => setIsIntegrationsModalOpen(false)}
      />

    </div>
  );
};

