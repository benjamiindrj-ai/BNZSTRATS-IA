export type StakeGameType = 
  | 'dice'
  | 'limbo'
  | 'mines'
  | 'plinko'
  | 'keno'
  | 'hilo'
  | 'roulette'
  | 'wheel'
  | 'blackjack'
  | 'crash'
  | 'sports';

export type RiskLevel = 'ultra_safe' | 'low' | 'medium' | 'high' | 'extreme_moonshot';

export type StrategyTriggerType = 
  | 'every_loss'
  | 'every_win'
  | 'every_bets'
  | 'loss_streak_of'
  | 'win_streak_of'
  | 'first_win_after_losses'
  | 'first_loss_after_wins'
  | 'profit_greater_than'
  | 'loss_greater_than'
  | 'bet_greater_than';

export type StrategyActionType = 
  | 'multiply_bet'
  | 'increase_bet_fixed'
  | 'increase_bet_pct'
  | 'decrease_bet_pct'
  | 'reset_bet'
  | 'set_bet_fixed'
  | 'change_multiplier'
  | 'increase_multiplier_pct'
  | 'decrease_multiplier_pct'
  | 'switch_direction'
  | 'set_dice_target'
  | 'stop_autobet';

export interface StrategyCondition {
  id: string;
  order?: number;
  triggerType: StrategyTriggerType;
  triggerValue?: number;
  actionType: StrategyActionType;
  actionValue?: number;
  description?: string;
  stakeUiCode?: string;
  isActive?: boolean;
}

export interface BettingStrategy {
  id: string;
  name: string;
  game: StakeGameType;
  description: string;
  riskLevel: RiskLevel;
  baseBet: number;
  currency: string;
  targetMultiplier: number;
  winChance: number; // e.g. 49.5% for dice 2x
  // Wager & VIP volume attributes
  isWagerStrategy?: boolean;
  wagerTargetVolume?: number; // Target volume in currency e.g. 10000
  estimatedWagerTurnover?: number; // Estimated turnover multiplier of bankroll e.g. 250x
  estimatedRakebackPercent?: number; // e.g. 10%
  vipTierTarget?: string; // 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
  // Wager Recovery & Stop-Loss Recovery attributes
  isRecoveryStrategy?: boolean;
  recoveryTargetType?: 'wager_drawdown' | 'stop_loss_recoup' | 'bankroll_rebuild';
  recoveryDeficitTarget?: number; // Expected deficit to recover in units/currency
  linkedRecoveryStrategyId?: string; // ID of fallback strategy if stop loss is hit
  recoveryPhaseNotes?: string;
  // Game specific config
  gameConfig?: {
    diceCondition?: 'above' | 'below';
    diceTarget?: number; // 50.49 for 2x
    minesCount?: number; // 1-24
    minesGemsToCashout?: number; // 1-24
    minesChosenTiles?: number[]; // indices 0-24
    plinkoRows?: 8 | 10 | 12 | 14 | 16;
    plinkoRisk?: 'low' | 'medium' | 'high';
    kenoNumbers?: number[]; // 1-10 numbers selected from 1-40
    kenoRisk?: 'classic' | 'low' | 'medium' | 'high';
    hiloStartCard?: number;
    limboTarget?: number;
    rouletteSector?: 'voisins' | 'tiers' | 'orphelins' | 'zero' | 'dozens' | 'corner' | 'sixain' | 'straight' | 'split';
    rouletteDozens?: number[];
    rouletteNumbers?: number[];
    blackjackRule?: string;
    crashAutoCashout?: number;
    wheelSegments?: 10 | 20 | 30 | 40 | 50;
    wheelRisk?: 'low' | 'medium' | 'high';
  };
  onWinAction: 'reset' | 'increase_pct' | 'increase_fixed' | 'custom';
  onWinValue?: number;
  onLossAction: 'multiply' | 'increase_fixed' | 'increase_pct' | 'reset' | 'fibonacci' | 'custom';
  onLossValue?: number; // e.g. 2 for 100% increase (Martingale), 1.5 for 50%
  // Safety controls
  stopOnProfit?: number; // Take profit in currency
  stopOnLoss?: number; // Stop loss in currency
  trailingStopLoss?: {
    enabled: boolean;
    activationProfit: number; // Profit at which trailing stop triggers (e.g. +10 USDT)
    trailDistance: number; // Max pullback allowed from peak profit (e.g. 5 USDT)
  };
  maxDrawdownLimit?: number; // Hard drawdown threshold in currency or %
  maxBetLimit?: number; // Hard cap on single bet
  maxConsecutiveLosses?: number;
  customConditions?: StrategyCondition[];
  evEstimate?: number; // Expected Value per bet (e.g. -0.01 for 1% house edge)
  author?: 'ai' | 'system' | 'user';
  createdAt?: string;
  aiRationale?: string;
}

export interface BetResult {
  id: string;
  betNumber: number;
  timestamp: number;
  game: StakeGameType;
  currency: string;
  betAmount: number;
  targetMultiplier: number;
  payoutMultiplier: number;
  won: boolean;
  profit: number; // Positive if won, negative if lost
  runningBalance: number;
  runningProfit: number;
  serverSeedHash?: string;
  clientSeed?: string;
  nonce?: number;
  gameDetails?: {
    roll?: number;
    limboMultiplier?: number;
    minesRevealed?: number;
    minesHitMine?: boolean;
    minesGrid?: boolean[]; // 25 booleans: true = gem, false = mine
    plinkoSlot?: number;
    kenoMatches?: number;
    kenoDrawn?: number[];
    hiloCards?: string[];
  };
  isLiveApi?: boolean;
}

export interface BotStatistics {
  totalBets: number;
  totalWon: number;
  totalLost: number;
  winRate: number;
  totalWagered: number;
  netProfit: number;
  peakProfit: number;
  maxDrawdown: number;
  currentStreak: number; // positive for win streak, negative for loss streak
  maxWinStreak: number;
  maxLossStreak: number;
  averageBet: number;
  largestBet: number;
  largestWin: number;
  profitFactor: number;
}

export interface TelegramBotConfig {
  botToken: string;
  chatId: string;
  botUsername?: string;
  isActive: boolean;
  notifyOnBigWin: boolean;
  bigWinThresholdMultiplier: number;
  notifyOnStopLoss: boolean;
  notifyOnTakeProfit: boolean;
  dailyReportEnabled: boolean;
  allowedUserIds: string[];
}

export interface TelegramMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: number;
  quickActions?: Array<{ label: string; command: string; style?: 'primary' | 'danger' | 'default' }>;
  data?: any;
}

export interface StakeApiCredentials {
  apiKey: string;
  domain: 'stake.com' | 'stake.us' | 'stake.bet';
  currency: string;
  isLiveMode: boolean; // false = Provably Fair Sandbox simulation, true = Live GraphQL API
  clientSeed: string;
  serverSeedHash: string;
  nonce: number;
}

export interface ManualSession {
  id: string;
  timestamp: number;
  game: StakeGameType;
  strategyName: string;
  profitOrLoss: number; // Positive if gain (+), negative if loss (-)
  profit?: number;
  currency: string;
  startingBalance?: number;
  endingBalance?: number;
  durationMinutes?: number;
  estimatedBets?: number;
  estimatedBetsCount?: number;
  notes?: string;
  mood?: 'disciplined' | 'calm' | 'tilted' | 'target_hit';

  // Section Paris Sportifs
  category?: 'casino' | 'sports';
  sport?: 'football' | 'basketball' | 'tennis' | 'mma' | 'esports' | 'hockey' | 'baseball' | 'rugby' | 'other';
  match?: string;
  league?: string;
  market?: string;
  odds?: number;
  stakeAmount?: number;
  betType?: 'single' | 'parlay' | 'live' | 'future';
  bookmaker?: string;
  finalScore?: string;
}

export interface ManualSessionStats {
  totalSessions: number;
  winningSessions: number;
  losingSessions: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  bestSession: number;
  worstSession: number;
  averageSession: number;
  profitFactor: number;
  currentStreak?: number;
}

export interface WalletBalance {
  currency: string;
  amount: number;
  usdRate: number;
  symbol: string;
  iconColor: string;
}

export interface UserProfile {
  id: string;
  name: string;
  description: string;
  createdDate: number;
  color: string;
  isActive: boolean;
}

export interface SportTip {
  id: string;
  sport: 'football' | 'basketball' | 'tennis' | 'mma' | 'esports' | 'hockey';
  match: string;
  league: string;
  kickoffTime: string; // e.g. "Aujourd'hui à 20:45 (Dans 2h15)"
  kickoffTimestamp?: number; // Unix timestamp in ms
  minutesUntilKickoff?: number; // Delay in minutes from request time (30 to 900 min)
  market: string; // e.g. "Plus de 2.5 Buts", "Victoire Réal Madrid & BTTS", "Total Points > 218.5"
  odds: number; // e.g. 1.85, 2.10
  expectedValue: number; // EV % (e.g. +6.5%)
  confidenceScore: number; // 1-100%
  recommendedStakePercent: number; // 1-3% bankroll
  analysisReasoning: string;
  keyStats: string[];
  riskLevel: 'safe' | 'value' | 'aggressive';
  
  // Nouveaux indicateurs quantitatifs d'optimisation de gains
  bookmakerImpliedProbability?: number; // Ex: 54.1% (1/cote)
  aiEstimatedTrueProbability?: number; // Ex: 61.5% (Modèle IA Poisson/Rating)
  droppingOddsAlert?: {
    openingOdds: number;
    currentOdds: number;
    trend: 'dropping' | 'stable' | 'rising';
    sharpMoneySignal: string;
  };
  poissonModelScore?: {
    homeExpGoals: number;
    awayExpGoals: number;
    predictedScore: string;
  };
  kellyCriterionRatio?: number; // Ex: 1.8%
  lineupFatigueIndex?: string; // Ex: "Effectif complet, 5 jours de repos"

  // 1. Indicateurs Avancés de Performance Réelle (xMetrics)
  advancedMetrics?: {
    npxGHome?: number; // Non-penalty xG
    npxGAway?: number;
    xPointsDiff?: string; // Ex: "+4.2 xPts (Sous-coté / Rebond attendu)"
    ppdaIntensity?: string; // Passes Per Defensive Action (Ex: "8.4 (Pressing Haut Agressif)")
    luckRegressFactor?: 'undervalued_positive_regression' | 'overvalued_bubble' | 'fair_value';
    luckAnalysis?: string;
  };

  // 2. Microstructure du Marché & Détection des Parieurs Pros
  marketMicrostructure?: {
    clvIndex?: string; // Closing Line Value beat % (Ex: "+4.8% vs Pinnacle Closing Line")
    publicTicketsPct?: number; // % du grand public sur ce bet (Ex: 78%)
    sharpMoneyPct?: number; // % des fonds et parieurs pros (Ex: 64%)
    divergenceAlert?: string; // Ex: "Divergence Majeure : Le public suit les favoris, les pros misent sur le spread"
    asianHandicapShift?: string; // Ex: "Ligne passée de -0.25 à -0.75"
  };

  // 3. Facteurs Contextuels & Environnementaux
  contextualFactors?: {
    restAdvantageIndex?: string; // Ex: "+3 jours de repos (Avantage Domicile)"
    travelDistanceKm?: number; // Ex: 1200 km
    keyAbsenceWarImpact?: string; // Ex: "Absence Meneur titulaire (-1.4 pts net rating)"
    refereeTendency?: string; // Ex: "Arbitre sévère : 5.4 cartons/m (favorable Over cartons)"
    weatherCondition?: string; // Ex: "Pluie battante & Rafales 45 km/h (Rythme ralenti)"
  };

  // 4. Liaison directe aux marchés Stake.com (Synchronisation Temps Réel)
  stakeFixtureId?: string;
  stakeUrl?: string; // URL directe vers la rencontre sur Stake.com
  stakeMarketId?: string; // Ex: "1x2", "total_goals_2_5", "btts", "asian_handicap"
  stakeMarketName?: string; // Ex: "Vainqueur du Match (1X2)"
  stakeOutcomeName?: string; // Ex: "Real Madrid"
  stakeOdds?: number; // Cote officielle Stake.com
  stakeMarginPercent?: number; // Marge réduite Stake (ex: 3.1%)
  isStakeLive?: boolean; // true si le match est en direct sur Stake In-Play
  availableMarketsCount?: number; // Nombre de marchés Stake disponibles pour ce match
  allStakeMarkets?: StakeSportsMarket[]; // Liste complète des marchés Stake pour cette rencontre

  // 5. Météo Réelle du Stade & Benchmark Multi-Bookmakers & H2H Forme
  stadiumWeather?: {
    city: string;
    temperatureC: number;
    windSpeedKmh: number;
    precipitationProbPct: number;
    isIndoorOrDome: boolean;
    conditionDesc: string;
    impactSummary: string;
  };
  sharpBenchmark?: {
    pinnacleOdds: number;
    consensusOdds: number;
    stakeOdds: number;
    stakeEdgeVsPinnacle: number;
    clvIndex: string;
    bookmakerConsensusCount: number;
    sharpSignal: string;
  };
  h2hRecentForm?: {
    homeTeamForm: ('V' | 'N' | 'D')[];
    awayTeamForm: ('V' | 'N' | 'D')[];
    homeWinRateLast5: number;
    awayWinRateLast5: number;
    lastMeetingsSummary: string[];
    headToHeadAdvantage: string;
  };
}

export interface TrackedSportBet {
  id: string;
  tipId: string;
  sport: 'football' | 'basketball' | 'tennis' | 'mma' | 'esports' | 'hockey';
  match: string;
  league: string;
  market: string;
  odds: number;
  expectedValue: number;
  confidenceScore: number;
  stakePercent: number;
  stakeAmount: number;
  currency: string;
  status: 'pending' | 'won' | 'lost' | 'void';
  profit: number; // calculated when resolved
  createdAt: number;
  resolvedAt?: number;
  finalScore?: string;
  notes?: string;
  kickoffTime?: string;
  kickoffTimestamp?: number;
  minutesUntilKickoff?: number;
  resolutionNotes?: string;
  autoResolved?: boolean;
  lastCheckedAt?: number;
  stakeFixtureId?: string;
  stakeUrl?: string;
  stakeMarketName?: string;
}

export interface LiveMatchTip {
  id: string;
  sport: 'football' | 'basketball' | 'tennis' | 'mma' | 'esports' | 'hockey';
  match: string;
  league: string;
  currentScore: string;
  currentMinute: string;
  elapsedMinutes: number;
  period: string;
  momentumTeam: string;
  inPlayStats: {
    possession?: string;
    shotsOnTarget?: string;
    dangerousAttacks?: string;
    foulsOrCards?: string;
    liveXg?: string;
  };
  liveMarket: string;
  liveOdds: number;
  preMatchOdds?: number;
  liveTrueProbability: number;
  liveImpliedProbability: number;
  liveExpectedValue: number;
  confidenceScore: number;
  recommendedStakePercent: number;
  liveEdgeAnalysis: string;
  urgencyLevel: 'high' | 'medium' | 'moderate';
  recommendedEntryWindow: string;
  riskLevel: 'safe' | 'value' | 'aggressive';
  stakeFixtureId?: string;
  stakeUrl?: string;
  stakeMarginPercent?: number;
  stadiumWeather?: {
    city: string;
    temperatureC: number;
    windSpeedKmh: number;
    precipitationProbPct: number;
    isIndoorOrDome: boolean;
    conditionDesc: string;
    impactSummary: string;
  };
  sharpBenchmark?: {
    pinnacleOdds: number;
    consensusOdds: number;
    stakeOdds: number;
    stakeEdgeVsPinnacle: number;
    clvIndex: string;
    bookmakerConsensusCount: number;
    sharpSignal: string;
  };
}

export interface LiveSportsResponse {
  sportCategory: string;
  liveAnalysisTitle: string;
  liveMarketContext: string;
  activeMatchesCount: number;
  lastUpdatedParisTime: string;
  liveTips: LiveMatchTip[];
  liveOpportunitiesSummary: {
    highValueSignalsCount: number;
    averageLiveEv: number;
    topMomentumPick: string;
    liveStrategyAdvice: string;
  };
}

export interface SportAnalysisResponse {
  sportCategory: string;
  analysisTitle: string;
  globalMarketContext: string;
  kickoffWindow?: {
    minMinutes: number;
    maxMinutes: number;
    minTimeFormatted: string;
    maxTimeFormatted: string;
    currentTimeParis?: string;
    currentFullDateParis?: string;
    timezone?: string;
    description: string;
  };
  tips: SportTip[];
  combinedAcca?: {
    title: string;
    totalOdds: number;
    combinedEv: string;
    selections: string[];
    riskAdvice: string;
  };
  marketPulse?: {
    sharpMoneyPercentage: number;
    publicConsensusBias: string;
    arbitrageDetected: boolean;
    recommendedDailyMaxExposure: number;
  };
}

export interface AppBackupData {
  version: string;
  exportedAt: number;
  profileName: string;
  sessions: ManualSession[];
  wallets: Record<string, number>;
  strategies: BettingStrategy[];
  telegramConfig: TelegramBotConfig;
  apiCredentials: StakeApiCredentials;
}

// ----------------------------------------------------
// STAKE.COM SPORTSBOOK REAL MARKETS & FIXTURES TYPES
// ----------------------------------------------------

export interface StakeMarketOutcome {
  outcomeId: string;
  name: string; // e.g. "Real Madrid", "Match Nul", "Over 2.5", "Handicap (-1.5)"
  odds: number; // Decimal odds e.g. 1.95
  probability: number; // Implied probability %
  isRecommended?: boolean;
  expectedValue?: number; // EV % if positive
  trueProbability?: number; // AI / Poisson true prob %
}

export interface StakeSportsMarket {
  marketId: string; // e.g. "1x2", "asian_handicap", "total_goals_2_5", "btts", "double_chance", "draw_no_bet", "first_half_winner"
  marketCategory: 'match_winner' | 'totals' | 'handicaps' | 'btts' | 'half_time' | 'combos' | 'player_props';
  marketName: string; // e.g. "Vainqueur du Match (1X2)", "Total de Buts Over/Under 2.5"
  status: 'active' | 'suspended' | 'settled';
  outcomes: StakeMarketOutcome[];
  bestValueOutcome?: StakeMarketOutcome;
  marginPercent?: number; // Bookmaker margin % (e.g. 3.2% on Stake vs 5.5% on standard books)
}

export interface StakeSportFixture {
  id: string;
  fixtureId: string;
  sport: 'football' | 'basketball' | 'tennis' | 'mma' | 'esports' | 'hockey' | 'baseball';
  sportName: string;
  slug: string;
  tournament: string;
  countryOrCategory?: string;
  match: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  startTimestamp: number;
  kickoffFormattedParis: string;
  minutesUntilKickoff: number;
  isLive: boolean;
  liveStatus?: {
    period: string;
    score: string;
    clock: string;
    inPlay: boolean;
  };
  stakeUrl: string;
  availableMarketsCount: number;
  markets: StakeSportsMarket[];
  topValueBet?: {
    marketName: string;
    pick: string;
    odds: number;
    expectedValue: number;
    confidenceScore: number;
    reasoning: string;
  };
}

export interface StakeMarketsResponse {
  connected: boolean;
  source: 'stake_graphql_api' | 'stake_feed_sync' | 'real_live_sports_engine';
  totalFixtures: number;
  totalMarkets: number;
  lastUpdated: string;
  sport: string;
  fixtures: StakeSportFixture[];
  stakeSportsbookStats: {
    averageStakeMargin: number; // e.g. 3.5%
    liveFixturesCount: number;
    upcomingFixturesCount: number;
    bestValueCount: number;
    sportsAvailable: string[];
  };
}

export interface IntegrationsStatus {
  openMeteo: {
    name: string;
    enabled: boolean;
    requiresKey: false;
    status: 'online' | 'fallback';
    description: string;
  };
  theOddsApi: {
    name: string;
    enabled: boolean;
    requiresKey: true;
    hasKey: boolean;
    status: 'connected' | 'simulated_quant_benchmark';
    description: string;
  };
  footballData: {
    name: string;
    enabled: boolean;
    requiresKey: true;
    hasKey: boolean;
    status: 'connected' | 'simulated_historical_engine';
    description: string;
  };
  rapidApiFootball: {
    name: string;
    enabled: boolean;
    requiresKey: true;
    hasKey: boolean;
    status: 'connected' | 'statistical_lineup_engine';
    description: string;
  };
}

