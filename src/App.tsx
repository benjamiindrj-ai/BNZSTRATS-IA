import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header, AppTab } from './components/Header';
import { StrategyGenerator } from './components/StrategyGenerator';
import { AutoBetEngine } from './components/AutoBetEngine';
import { TelegramBotController } from './components/TelegramBotController';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ScriptExporter } from './components/ScriptExporter';
import { StakeApiSettingsModal } from './components/StakeApiSettingsModal';
import { ManualSessionTracker } from './components/ManualSessionTracker';
import { AdvancedGamesSuite } from './components/AdvancedGamesSuite';
import { CloudSyncManager } from './components/CloudSyncManager';
import { SeedAnalysis } from './components/SeedAnalysis';
import { SportsAnalysis } from './components/SportsAnalysis';
import { AppAiAssistant } from './components/AppAiAssistant';
import { 
  BettingStrategy, 
  BetResult, 
  BotStatistics, 
  TelegramBotConfig, 
  StakeApiCredentials,
  ManualSession,
  UserProfile,
  AppBackupData,
  TrackedSportBet,
  SportTip
} from './types';
import { PREDEFINED_STRATEGIES } from './utils/predefinedStrategies';
import { simulateGameOutcome, generateRandomSeed } from './utils/provablyFair';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<AppTab>('manual-sessions');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Multi-Wallet Balances
  const [wallets, setWallets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('stake_bot_wallets');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse local wallets:', e);
    }
    return {
      USDT: 100.00,
      USD: 100.00,
      EUR: 92.50,
      BTC: 0.0045,
      ETH: 0.065,
      SOL: 1.25,
      LTC: 1.40,
      DOGE: 450.0,
      TRX: 680.0,
    };
  });

  // Save wallets
  useEffect(() => {
    try {
      localStorage.setItem('stake_bot_wallets', JSON.stringify(wallets));
    } catch (e) {
      console.warn('Failed to save wallets:', e);
    }
  }, [wallets]);

  // Current active currency and balance
  const [currency, setCurrency] = useState('USDT');
  const balance = wallets[currency] !== undefined ? wallets[currency] : 100.00;

  const handleUpdateWallet = (curr: string, newAmt: number) => {
    setWallets((prev) => ({
      ...prev,
      [curr]: newAmt,
    }));
  };

  const handleSetBalanceForCurrentCurrency = (newBal: number) => {
    handleUpdateWallet(currency, newBal);
  };

  // Multi-Profiles state
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('stake_bot_profiles');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse profiles:', e);
    }
    return [
      {
        id: 'prof-main',
        name: 'Compte Stake Principal',
        description: 'Bankroll principale & Stratégies constructives',
        createdDate: Date.now() - 3600 * 1000 * 48,
        color: 'bg-emerald-500',
        isActive: true,
      },
      {
        id: 'prof-challenge',
        name: 'Défi Bankroll Scalping',
        description: 'Objectif +20% par semaine sans Martingale',
        createdDate: Date.now() - 3600 * 1000 * 24,
        color: 'bg-indigo-500',
        isActive: false,
      }
    ];
  });

  const [activeProfileId, setActiveProfileId] = useState<string>('prof-main');

  useEffect(() => {
    try {
      localStorage.setItem('stake_bot_profiles', JSON.stringify(profiles));
    } catch (e) {
      console.warn('Failed to save profiles:', e);
    }
  }, [profiles]);

  // Manual Sessions History (Stored in localStorage)
  const [manualSessions, setManualSessions] = useState<ManualSession[]>(() => {
    try {
      const saved = localStorage.getItem('stake_bot_manual_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((s: any) => {
            const p = typeof s.profit === 'number' ? s.profit : (typeof s.profitOrLoss === 'number' ? s.profitOrLoss : 0);
            return {
              ...s,
              profit: p,
              profitOrLoss: p,
              endingBalance: typeof s.endingBalance === 'number' ? s.endingBalance : 100,
            };
          });
        }
      }
    } catch (e) {
      console.warn('Failed to parse local sessions:', e);
    }
    return [
      {
        id: 'session-seed-1',
        timestamp: Date.now() - 3600 * 1000 * 24,
        game: 'dice',
        strategyName: "Oscar's Grind Constructif (2.0x)",
        profitOrLoss: 12.50,
        profit: 12.50,
        currency: 'USDT',
        durationMinutes: 20,
        estimatedBets: 45,
        mood: 'disciplined',
        notes: 'Objectif Take Profit atteint calmement sans aucune Martingale.',
        startingBalance: 100.00,
        endingBalance: 112.50,
      },
      {
        id: 'session-seed-2',
        timestamp: Date.now() - 3600 * 1000 * 12,
        game: 'mines',
        strategyName: 'Mines 1-Mine Safe Hunter (88%)',
        profitOrLoss: 8.20,
        profit: 8.20,
        currency: 'USDT',
        durationMinutes: 15,
        estimatedBets: 30,
        mood: 'target_hit',
        notes: 'Très bonne régularité sur les diamants.',
        startingBalance: 112.50,
        endingBalance: 120.70,
      }
    ];
  });

  // Persist manual sessions
  useEffect(() => {
    try {
      localStorage.setItem('stake_bot_manual_sessions', JSON.stringify(manualSessions));
    } catch (e) {
      console.warn('Failed to save manual sessions:', e);
    }
  }, [manualSessions]);

  // Tracked Sports Bets (AI Reliability Tracker)
  const [trackedSportBets, setTrackedSportBets] = useState<TrackedSportBet[]>(() => {
    try {
      const saved = localStorage.getItem('stake_bot_tracked_sports_bets');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse tracked sports bets:', e);
    }
    // Default initial seeded tracking history to demonstrate immediately
    return [
      {
        id: 'bet-hist-1',
        tipId: 'seed-tip-1',
        sport: 'football',
        match: 'Real Madrid vs Borussia Dortmund',
        league: 'UEFA Champions League',
        market: 'Plus de 2.5 Buts & Les 2 équipes marquent',
        odds: 1.95,
        expectedValue: 6.8,
        confidenceScore: 84,
        stakePercent: 1.5,
        stakeAmount: 1.50,
        currency: 'USDT',
        status: 'won',
        profit: 1.43,
        createdAt: Date.now() - 3600 * 1000 * 48,
        resolvedAt: Date.now() - 3600 * 1000 * 46,
        finalScore: '3 - 2 (Validé)',
      },
      {
        id: 'bet-hist-2',
        tipId: 'seed-tip-2',
        sport: 'basketball',
        match: 'Boston Celtics vs Dallas Mavericks',
        league: 'NBA',
        market: 'Total Points Plus de 222.5',
        odds: 1.86,
        expectedValue: 5.4,
        confidenceScore: 82,
        stakePercent: 1.5,
        stakeAmount: 1.50,
        currency: 'USDT',
        status: 'won',
        profit: 1.29,
        createdAt: Date.now() - 3600 * 1000 * 24,
        resolvedAt: Date.now() - 3600 * 1000 * 22,
        finalScore: '118 - 110 (Total 228 pts)',
      },
      {
        id: 'bet-hist-3',
        tipId: 'seed-tip-3',
        sport: 'tennis',
        match: 'Alcaraz vs Sinner',
        league: 'ATP Finals',
        market: 'Plus de 22.5 Jeux',
        odds: 1.78,
        expectedValue: 5.1,
        confidenceScore: 86,
        stakePercent: 2.0,
        stakeAmount: 2.00,
        currency: 'USDT',
        status: 'pending',
        profit: 0,
        createdAt: Date.now() - 3600 * 1000 * 2,
      }
    ];
  });

  // Persist tracked sports bets
  useEffect(() => {
    try {
      localStorage.setItem('stake_bot_tracked_sports_bets', JSON.stringify(trackedSportBets));
    } catch (e) {
      console.warn('Failed to save tracked sports bets:', e);
    }
  }, [trackedSportBets]);

  const handleTrackSportBet = (tip: SportTip, stakeAmount: number) => {
    const newBet: TrackedSportBet = {
      id: `tracked-${Date.now()}`,
      tipId: tip.id,
      sport: tip.sport,
      match: tip.match,
      league: tip.league,
      market: tip.market,
      odds: tip.odds,
      expectedValue: tip.expectedValue,
      confidenceScore: tip.confidenceScore,
      stakePercent: tip.recommendedStakePercent,
      stakeAmount: stakeAmount > 0 ? stakeAmount : 1.0,
      currency,
      status: 'pending',
      profit: 0,
      createdAt: Date.now(),
      kickoffTime: tip.kickoffTime,
      kickoffTimestamp: tip.kickoffTimestamp || (Date.now() + (tip.minutesUntilKickoff || 60) * 60 * 1000),
      minutesUntilKickoff: tip.minutesUntilKickoff,
      stakeFixtureId: tip.stakeFixtureId,
      stakeUrl: tip.stakeUrl,
      stakeMarketName: tip.stakeMarketName || tip.market,
    };
    setTrackedSportBets((prev) => [newBet, ...prev]);
  };

  const handleUpdateTrackedSportBetStatus = (
    id: string, 
    status: 'won' | 'lost' | 'void' | 'pending', 
    finalScore?: string,
    notes?: string
  ) => {
    setTrackedSportBets((prev) =>
      prev.map((bet) => {
        if (bet.id !== id) return bet;
        let profit = 0;
        if (status === 'won') {
          profit = Number((bet.stakeAmount * (bet.odds - 1)).toFixed(2));
        } else if (status === 'lost') {
          profit = -bet.stakeAmount;
        }
        return {
          ...bet,
          status,
          profit,
          resolvedAt: status !== 'pending' ? Date.now() : undefined,
          finalScore: finalScore !== undefined ? finalScore : bet.finalScore,
          resolutionNotes: notes !== undefined ? notes : bet.resolutionNotes,
        };
      })
    );
  };

  const handleBatchUpdateTrackedSportBets = (
    updates: Array<{
      id: string;
      status: 'won' | 'lost' | 'void' | 'pending';
      finalScore?: string;
      resolutionNotes?: string;
      autoResolved?: boolean;
    }>
  ) => {
    setTrackedSportBets((prev) =>
      prev.map((bet) => {
        const update = updates.find((u) => u.id === bet.id);
        if (!update) return bet;
        let profit = 0;
        if (update.status === 'won') {
          profit = Number((bet.stakeAmount * (bet.odds - 1)).toFixed(2));
        } else if (update.status === 'lost') {
          profit = -bet.stakeAmount;
        }
        return {
          ...bet,
          status: update.status,
          profit,
          resolvedAt: update.status !== 'pending' ? (bet.resolvedAt || Date.now()) : undefined,
          finalScore: update.finalScore !== undefined ? update.finalScore : bet.finalScore,
          resolutionNotes: update.resolutionNotes !== undefined ? update.resolutionNotes : bet.resolutionNotes,
          autoResolved: update.autoResolved !== undefined ? update.autoResolved : true,
          lastCheckedAt: Date.now(),
        };
      })
    );
  };

  const handleDeleteTrackedSportBet = (id: string) => {
    setTrackedSportBets((prev) => prev.filter((b) => b.id !== id));
  };

  const handleClearTrackedSportBets = () => {
    setTrackedSportBets([]);
  };

  const handleUpdateTrackedSportBetStake = (
    id: string,
    stakePercent: number,
    stakeAmount: number
  ) => {
    setTrackedSportBets((prev) =>
      prev.map((bet) => {
        if (bet.id !== id) return bet;
        let profit = bet.profit;
        if (bet.status === 'won') {
          profit = Number((stakeAmount * (bet.odds - 1)).toFixed(2));
        } else if (bet.status === 'lost') {
          profit = -stakeAmount;
        }
        return {
          ...bet,
          stakePercent,
          stakeAmount,
          profit,
        };
      })
    );
  };

  // Handle adding manual session
  const handleAddManualSession = (newSessionData: Omit<ManualSession, 'id' | 'timestamp' | 'startingBalance' | 'endingBalance'>) => {
    const profitVal = typeof newSessionData.profitOrLoss === 'number'
      ? newSessionData.profitOrLoss
      : (typeof newSessionData.profit === 'number' ? newSessionData.profit : 0);
    
    const sessCurrency = newSessionData.currency || currency;
    const currentCurrBalance = wallets[sessCurrency] || 100.00;
    const newEnding = Number((currentCurrBalance + profitVal).toFixed(4));
    
    const newSession: ManualSession = {
      ...newSessionData,
      currency: sessCurrency,
      profitOrLoss: profitVal,
      profit: profitVal,
      id: `session-${Date.now()}`,
      timestamp: Date.now(),
      startingBalance: currentCurrBalance,
      endingBalance: newEnding,
    };

    setManualSessions((prev) => [...prev, newSession]);
    handleUpdateWallet(sessCurrency, newEnding);
  };

  const handleDeleteManualSession = (id: string) => {
    const sessionToDelete = manualSessions.find((s) => s.id === id);
    if (sessionToDelete) {
      const sessCurr = sessionToDelete.currency || currency;
      const currentCurrBalance = wallets[sessCurr] || 100.00;
      const profitVal = typeof sessionToDelete.profitOrLoss === 'number'
        ? sessionToDelete.profitOrLoss
        : (typeof sessionToDelete.profit === 'number' ? sessionToDelete.profit : 0);
      const revertedBalance = Number((currentCurrBalance - profitVal).toFixed(4));
      handleUpdateWallet(sessCurr, Math.max(0, revertedBalance));
    }
    setManualSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearManualSessions = () => {
    setManualSessions([]);
    try {
      localStorage.removeItem('stake_bot_manual_sessions');
    } catch (e) {}
  };

  const handleRefreshManualSessions = () => {
    try {
      const saved = localStorage.getItem('stake_bot_manual_sessions');
      if (saved) {
        setManualSessions(JSON.parse(saved));
      }
    } catch (e) {}
  };

  // Profile operations
  const handleCreateProfile = (name: string, description: string) => {
    const newProf: UserProfile = {
      id: `prof-${Date.now()}`,
      name,
      description,
      createdDate: Date.now(),
      color: 'bg-teal-500',
      isActive: false,
    };
    setProfiles((prev) => [...prev, newProf]);
    setActiveProfileId(newProf.id);
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (activeProfileId === id && profiles.length > 0) {
      setActiveProfileId(profiles[0].id);
    }
  };

  // Restore backup
  const handleRestoreBackup = (backup: AppBackupData) => {
    if (Array.isArray(backup.sessions)) {
      setManualSessions(backup.sessions);
    }
    if (backup.wallets && typeof backup.wallets === 'object') {
      setWallets(backup.wallets);
    }
    if (backup.telegramConfig) {
      setTelegramConfig(backup.telegramConfig);
    }
    if (backup.apiCredentials) {
      setCredentials(backup.apiCredentials);
    }
    if (Array.isArray(backup.strategies) && backup.strategies.length > 0) {
      setCurrentStrategy(backup.strategies[0]);
    }
  };

  const handleResetAllData = () => {
    try {
      localStorage.removeItem('stake_bot_manual_sessions');
      localStorage.removeItem('stake_bot_wallets');
      localStorage.removeItem('stake_bot_profiles');
      localStorage.removeItem('stake_bot_tracked_sports_bets');
    } catch (e) {
      console.warn('Local storage error:', e);
    }
    window.location.reload();
  };

  // Credentials & Config
  const [credentials, setCredentials] = useState<StakeApiCredentials>({
    apiKey: '',
    domain: 'stake.com',
    currency: 'USDT',
    isLiveMode: false,
    clientSeed: generateRandomSeed(),
    serverSeedHash: generateRandomSeed(),
    nonce: 1,
  });

  const [telegramConfig, setTelegramConfig] = useState<TelegramBotConfig>({
    botToken: '',
    chatId: '',
    botUsername: '',
    isActive: false,
    notifyOnBigWin: true,
    bigWinThresholdMultiplier: 5.0,
    notifyOnStopLoss: true,
    notifyOnTakeProfit: true,
    dailyReportEnabled: true,
    allowedUserIds: [],
  });

  // Strategy State
  const [currentStrategy, setCurrentStrategy] = useState<BettingStrategy>(PREDEFINED_STRATEGIES[0]);

  // Betting & Execution State
  const [isAutobetting, setIsAutobetting] = useState(false);
  const [currentBetAmount, setCurrentBetAmount] = useState<number>(PREDEFINED_STRATEGIES[0].baseBet);
  const [betSpeedMs, setBetSpeedMs] = useState(300);
  const [stopReason, setStopReason] = useState<string | null>(null);
  const [sessionProfit, setSessionProfit] = useState(0);
  const [peakSessionProfit, setPeakSessionProfit] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // History & Statistics
  const [bets, setBets] = useState<BetResult[]>([]);
  const [stats, setStats] = useState<BotStatistics>({
    totalBets: 0,
    totalWon: 0,
    totalLost: 0,
    winRate: 0,
    totalWagered: 0,
    netProfit: 0,
    peakProfit: 0,
    maxDrawdown: 0,
    currentStreak: 0,
    maxWinStreak: 0,
    maxLossStreak: 0,
    averageBet: 0,
    largestBet: 0,
    largestWin: 0,
    profitFactor: 0,
  });

  // Simulated / Virtual Strategy Bankroll (Used exclusively for casino strategy testing)
  const [simulatedBalance, setSimulatedBalance] = useState<number>(100.00);

  // Sync refs for live loops
  const balanceRef = useRef(balance);
  const simulatedBalanceRef = useRef(simulatedBalance);
  const isAutobettingRef = useRef(isAutobetting);
  const currentStrategyRef = useRef(currentStrategy);
  const currentBetAmountRef = useRef(currentBetAmount);

  useEffect(() => {
    balanceRef.current = balance;
    simulatedBalanceRef.current = simulatedBalance;
    isAutobettingRef.current = isAutobetting;
    currentStrategyRef.current = currentStrategy;
    currentBetAmountRef.current = currentBetAmount;
  }, [balance, simulatedBalance, isAutobetting, currentStrategy, currentBetAmount]);

  const handleSelectStrategy = (strat: BettingStrategy) => {
    setCurrentStrategy(strat);
    setCurrentBetAmount(strat.baseBet);
    setSessionProfit(0);
    setStopReason(null);
  };

  const handleUpdateStrategy = (updated: Partial<BettingStrategy>) => {
    setCurrentStrategy((prev) => {
      const next = { ...prev, ...updated };
      if (updated.baseBet !== undefined) {
        setCurrentBetAmount(updated.baseBet);
      }
      return next;
    });
  };

  const handleResetBalance = () => {
    handleSetBalanceForCurrentCurrency(100.00);
  };

  const handleResetSimulationStats = () => {
    setSimulatedBalance(100.00);
    setSessionProfit(0);
    setPeakSessionProfit(0);
    setCurrentStreak(0);
    setBets([]);
    setStats({
      totalBets: 0,
      totalWon: 0,
      totalLost: 0,
      winRate: 0,
      totalWagered: 0,
      netProfit: 0,
      peakProfit: 0,
      maxDrawdown: 0,
      currentStreak: 0,
      maxWinStreak: 0,
      maxLossStreak: 0,
      averageBet: 0,
      largestBet: 0,
      largestWin: 0,
      profitFactor: 0,
    });
    setStopReason(null);
  };

  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    setCurrentStrategy((prev) => ({ ...prev, currency: newCurr }));
    setCredentials((prev) => ({ ...prev, currency: newCurr }));
  };

  // Send real Telegram notification if enabled
  const sendTelegramAlert = useCallback(async (text: string) => {
    if (!telegramConfig.isActive || !telegramConfig.botToken || !telegramConfig.chatId) return;

    try {
      await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramConfig.chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });
    } catch (err) {
      console.error('Failed to send Telegram alert:', err);
    }
  }, [telegramConfig]);

  // Execute a single simulated bet
  const executeBet = useCallback(async (): Promise<BetResult | null> => {
    const strat = currentStrategyRef.current;
    const currentBet = currentBetAmountRef.current;
    const currentSimBal = simulatedBalanceRef.current;

    // Check simulated test balance
    if (currentSimBal < currentBet) {
      setIsAutobetting(false);
      setStopReason('Solde de test insuffisant pour placer la mise');
      return null;
    }

    // Simulate Provably Fair outcome
    const gameResult = simulateGameOutcome(strat.game, strat.targetMultiplier, strat.gameConfig);
    const won = gameResult.won;
    const payoutMultiplier = won ? strat.targetMultiplier : 0;
    const profit = won ? Number((currentBet * (payoutMultiplier - 1)).toFixed(4)) : -currentBet;

    // Update Virtual Simulation Bankroll (DOES NOT TOUCH REAL WALLET/HEADER BALANCE)
    const newSimBalance = Number((currentSimBal + profit).toFixed(4));
    setSimulatedBalance(newSimBalance);

    // Update Session Profit & Peak Profit for Trailing Stop-Loss
    const newSessionProfit = Number((sessionProfit + profit).toFixed(4));
    setSessionProfit(newSessionProfit);
    const updatedPeakProfit = Math.max(peakSessionProfit, newSessionProfit);
    setPeakSessionProfit(updatedPeakProfit);

    // Update Streak
    let newStreak = 0;
    if (won) {
      newStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
    } else {
      newStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
    }
    setCurrentStreak(newStreak);

    // Telegram Big Win Alert
    if (won && payoutMultiplier >= 5.0 && telegramConfig.notifyOnBigWin) {
      sendTelegramAlert(
        `🎉 *GROS GAIN STAKE SIMULÉ !*\n\n• Jeu: *${strat.game.toUpperCase()}*\n• Cote: *${payoutMultiplier.toFixed(2)}x*\n• Mise: *${currentBet} ${strat.currency}*\n• Profit: *+${profit.toFixed(4)} ${strat.currency}*`
      );
    }

    const betResult: BetResult = {
      id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      betNumber: bets.length + 1,
      timestamp: Date.now(),
      game: strat.game,
      currency: strat.currency,
      betAmount: currentBet,
      targetMultiplier: strat.targetMultiplier,
      payoutMultiplier,
      won,
      profit,
      runningBalance: newSimBalance,
      runningProfit: newSessionProfit,
      gameDetails: gameResult.gameDetails,
    };

    // Update Bets & Stats
    setBets((prev) => [betResult, ...prev.slice(0, 199)]);

    setStats((prev) => {
      const newTotalBets = prev.totalBets + 1;
      const newTotalWon = won ? prev.totalWon + 1 : prev.totalWon;
      const newTotalLost = !won ? prev.totalLost + 1 : prev.totalLost;
      const newNetProfit = Number((prev.netProfit + profit).toFixed(4));
      const newTotalWagered = Number((prev.totalWagered + currentBet).toFixed(4));
      const newPeakProfit = Math.max(prev.peakProfit, newNetProfit);
      const newDrawdown = Math.max(prev.maxDrawdown, Number((newPeakProfit - newNetProfit).toFixed(4)));

      const totalWinAmounts = won ? (prev.totalWon * (prev.averageBet || currentBet) * (strat.targetMultiplier - 1)) + profit : 0;
      const totalLossAmounts = !won ? (prev.totalLost * (prev.averageBet || currentBet)) + currentBet : 1;

      return {
        totalBets: newTotalBets,
        totalWon: newTotalWon,
        totalLost: newTotalLost,
        winRate: Number(((newTotalWon / newTotalBets) * 100).toFixed(2)),
        totalWagered: newTotalWagered,
        netProfit: newNetProfit,
        peakProfit: newPeakProfit,
        maxDrawdown: newDrawdown,
        currentStreak: newStreak,
        maxWinStreak: Math.max(prev.maxWinStreak, newStreak > 0 ? newStreak : 0),
        maxLossStreak: Math.max(prev.maxLossStreak, newStreak < 0 ? Math.abs(newStreak) : 0),
        averageBet: Number((newTotalWagered / newTotalBets).toFixed(4)),
        largestBet: Math.max(prev.largestBet, currentBet),
        largestWin: won ? Math.max(prev.largestWin, profit) : prev.largestWin,
        profitFactor: totalLossAmounts > 0 ? Number((totalWinAmounts / totalLossAmounts).toFixed(2)) : 1.0,
      };
    });

    // Next Bet Calculation
    let nextBet = strat.baseBet;
    if (won) {
      if (strat.onWinAction === 'reset') {
        nextBet = strat.baseBet;
      } else if (strat.onWinAction === 'increase_pct') {
        nextBet = Number((currentBet * (1 + (strat.onWinValue || 10) / 100)).toFixed(4));
      } else if (strat.onWinAction === 'increase_fixed') {
        nextBet = Number((currentBet + (strat.onWinValue || 0.1)).toFixed(4));
      }
    } else {
      if (strat.onLossAction === 'multiply') {
        nextBet = Number((currentBet * (strat.onLossValue || 2.0)).toFixed(4));
      } else if (strat.onLossAction === 'increase_fixed') {
        nextBet = Number((currentBet + (strat.onLossValue || strat.baseBet)).toFixed(4));
      } else if (strat.onLossAction === 'fibonacci') {
        nextBet = Number((currentBet * 1.618).toFixed(4));
      } else if (strat.onLossAction === 'reset') {
        nextBet = strat.baseBet;
      }
    }

    // Process Custom Automated Conditions (e.g. Stake.com 4 to 30 Dice Conditions)
    if (strat.customConditions && strat.customConditions.length > 0) {
      const activeConditions = strat.customConditions.filter(c => c.isActive !== false);
      const totalBetsCount = bets.length + 1;
      const winStreak = newStreak > 0 ? newStreak : 0;
      const lossStreak = newStreak < 0 ? Math.abs(newStreak) : 0;
      const previousStreak = currentStreak;
      const prevWinStreak = previousStreak > 0 ? previousStreak : 0;
      const prevLossStreak = previousStreak < 0 ? Math.abs(previousStreak) : 0;

      for (const cond of activeConditions) {
        let isTriggered = false;
        const triggerVal = cond.triggerValue || 1;

        switch (cond.triggerType) {
          case 'every_loss':
            if (!won && lossStreak > 0 && lossStreak % triggerVal === 0) isTriggered = true;
            break;
          case 'every_win':
            if (won && winStreak > 0 && winStreak % triggerVal === 0) isTriggered = true;
            break;
          case 'every_bets':
            if (totalBetsCount > 0 && totalBetsCount % triggerVal === 0) isTriggered = true;
            break;
          case 'loss_streak_of':
            if (!won && lossStreak >= triggerVal) isTriggered = true;
            break;
          case 'win_streak_of':
            if (won && winStreak >= triggerVal) isTriggered = true;
            break;
          case 'first_win_after_losses':
            if (won && prevLossStreak >= triggerVal) isTriggered = true;
            break;
          case 'first_loss_after_wins':
            if (!won && prevWinStreak >= triggerVal) isTriggered = true;
            break;
          case 'profit_greater_than':
            if (newSessionProfit >= triggerVal) isTriggered = true;
            break;
          case 'loss_greater_than':
            if (newSessionProfit <= -triggerVal) isTriggered = true;
            break;
          case 'bet_greater_than':
            if (currentBet >= triggerVal) isTriggered = true;
            break;
        }

        if (isTriggered) {
          const actionVal = cond.actionValue ?? 0;
          switch (cond.actionType) {
            case 'multiply_bet':
              nextBet = Number((nextBet * (actionVal || 2)).toFixed(4));
              break;
            case 'increase_bet_pct':
              nextBet = Number((nextBet * (1 + actionVal / 100)).toFixed(4));
              break;
            case 'decrease_bet_pct':
              nextBet = Number((nextBet * Math.max(0.01, 1 - actionVal / 100)).toFixed(4));
              break;
            case 'increase_bet_fixed':
              nextBet = Number((nextBet + actionVal).toFixed(4));
              break;
            case 'reset_bet':
              nextBet = strat.baseBet;
              break;
            case 'set_bet_fixed':
              nextBet = Math.max(0.0001, actionVal || strat.baseBet);
              break;
            case 'change_multiplier':
              if (actionVal > 1.01) {
                setCurrentStrategy(s => ({ ...s, targetMultiplier: actionVal, winChance: Number((99 / actionVal).toFixed(2)) }));
              }
              break;
            case 'increase_multiplier_pct':
              if (strat.targetMultiplier) {
                const newMult = Number((strat.targetMultiplier * (1 + actionVal / 100)).toFixed(2));
                setCurrentStrategy(s => ({ ...s, targetMultiplier: newMult, winChance: Number((99 / newMult).toFixed(2)) }));
              }
              break;
            case 'decrease_multiplier_pct':
              if (strat.targetMultiplier) {
                const newMult = Math.max(1.01, Number((strat.targetMultiplier * (1 - actionVal / 100)).toFixed(2)));
                setCurrentStrategy(s => ({ ...s, targetMultiplier: newMult, winChance: Number((99 / newMult).toFixed(2)) }));
              }
              break;
            case 'switch_direction':
              if (strat.game === 'dice') {
                const currentCond = strat.gameConfig?.diceCondition || 'above';
                const newCond = currentCond === 'above' ? 'below' : 'above';
                const currentTarget = strat.gameConfig?.diceTarget || 50.49;
                const newTarget = Number((100 - currentTarget).toFixed(2));
                setCurrentStrategy(s => ({
                  ...s,
                  gameConfig: { ...s.gameConfig, diceCondition: newCond, diceTarget: newTarget }
                }));
              }
              break;
            case 'set_dice_target':
              if (actionVal > 0 && actionVal < 100) {
                setCurrentStrategy(s => ({
                  ...s,
                  gameConfig: { ...s.gameConfig, diceTarget: actionVal }
                }));
              }
              break;
            case 'stop_autobet':
              setIsAutobetting(false);
              setStopReason(`Condition d'arrêt exécutée: ${cond.description || cond.stakeUiCode || 'Sécurité'}`);
              break;
          }
        }
      }
    }

    // Cap at maxBetLimit
    if (strat.maxBetLimit && nextBet > strat.maxBetLimit) {
      nextBet = strat.maxBetLimit;
    }

    setCurrentBetAmount(Math.max(0.0001, nextBet));

    // Check Safety Stop Loss & Take Profit Triggers
    if (strat.stopOnLoss && newSessionProfit <= -strat.stopOnLoss) {
      setIsAutobetting(false);
      const reason = `Stop Loss Atteint (-${strat.stopOnLoss} ${strat.currency})`;
      setStopReason(reason);
      if (telegramConfig.notifyOnStopLoss) {
        sendTelegramAlert(`🛑 *STOP LOSS DECLENCHE*\n\nPerte atteinte : *${newSessionProfit.toFixed(2)} ${strat.currency}*. L'auto-betting a été arrêté par sécurité.`);
      }
      return betResult;
    }

    // Trailing Stop Loss: Lock in profit after a run-up
    if (
      strat.trailingStopLoss?.enabled && 
      updatedPeakProfit >= (strat.trailingStopLoss.activationProfit || 5) &&
      (updatedPeakProfit - newSessionProfit) >= (strat.trailingStopLoss.trailDistance || 3)
    ) {
      setIsAutobetting(false);
      const reason = `Trailing Stop-Loss Déclenché : Retrait de ${strat.trailingStopLoss.trailDistance} ${strat.currency} depuis le pic (+${updatedPeakProfit.toFixed(2)} ${strat.currency})`;
      setStopReason(reason);
      if (telegramConfig.notifyOnTakeProfit) {
        sendTelegramAlert(`🛡️ *TRAILING STOP-LOSS DECLENCHE*\n\nGains verrouillés à *+${newSessionProfit.toFixed(2)} ${strat.currency}* (Pic: +${updatedPeakProfit.toFixed(2)}). Session sécurisée.`);
      }
      return betResult;
    }

    // Max Drawdown Hard Cap
    if (strat.maxDrawdownLimit && (updatedPeakProfit - newSessionProfit) >= strat.maxDrawdownLimit) {
      setIsAutobetting(false);
      const reason = `Plafond de Drawdown Atteint (-${strat.maxDrawdownLimit} ${strat.currency} depuis pic)`;
      setStopReason(reason);
      return betResult;
    }

    if (strat.stopOnProfit && newSessionProfit >= strat.stopOnProfit) {
      setIsAutobetting(false);
      const reason = `Take Profit Atteint (+${strat.stopOnProfit} ${strat.currency})`;
      setStopReason(reason);
      if (telegramConfig.notifyOnTakeProfit) {
        sendTelegramAlert(`🎯 *TAKE PROFIT ATTEINT !*\n\nGain session : *+${newSessionProfit.toFixed(2)} ${strat.currency}*. Encaissement réussi.`);
      }
      return betResult;
    }

    if (!won && strat.maxConsecutiveLosses && Math.abs(newStreak) >= strat.maxConsecutiveLosses) {
      setIsAutobetting(false);
      const reason = `Coupe-circuit : ${strat.maxConsecutiveLosses} pertes consécutives atteintes`;
      setStopReason(reason);
      return betResult;
    }

    return betResult;
  }, [currentStreak, telegramConfig, sendTelegramAlert, sessionProfit, bets.length]);

  // Execute Batch of Bets for Instant Backtesting
  const handleExecuteBatchBets = async (count: number) => {
    setStopReason(null);
    for (let i = 0; i < count; i++) {
      const res = await executeBet();
      if (!res) break;
    }
  };

  // Autobet Timer Loop
  useEffect(() => {
    if (!isAutobetting) return;

    const timer = setInterval(async () => {
      if (!isAutobettingRef.current) return;
      await executeBet();
    }, betSpeedMs);

    return () => clearInterval(timer);
  }, [isAutobetting, betSpeedMs, executeBet]);

  const handleStartAutoBet = () => {
    setStopReason(null);
    setIsAutobetting(true);
  };

  const handleStopAutoBet = () => {
    setIsAutobetting(false);
  };

  const lastBet = bets.length > 0 ? bets[0] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-slate-950 pb-16 sm:pb-0 relative overflow-x-hidden">
      
      {/* Dynamic Ambient Color Mesh Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-orange-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[28rem] h-[28rem] bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-2/3 left-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <Header
        balance={balance}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        onUpdateBalance={handleSetBalanceForCurrentCurrency}
        onResetBalance={handleResetBalance}
        credentials={credentials}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        isTelegramConnected={telegramConfig.isActive}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAutobetting={isAutobetting}
        manualSessionsCount={manualSessions.length}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        
        {/* Tab 1: Manual Session Tracker (+ / - Journal & AI Coach) */}
        {activeTab === 'manual-sessions' && (
          <ManualSessionTracker
            sessions={manualSessions}
            onAddSession={handleAddManualSession}
            onDeleteSession={handleDeleteManualSession}
            onClearSessions={handleClearManualSessions}
            onRefreshSessions={handleRefreshManualSessions}
            currentBalance={balance}
            currency={currency}
            currentStrategy={currentStrategy}
            trackedSportBets={trackedSportBets}
          />
        )}

        {/* Tab: AI Sportsbook & Value Bets + Reliability Tracker */}
        {activeTab === 'sports' && (
          <SportsAnalysis
            currentBalance={balance}
            currency={currency}
            trackedBets={trackedSportBets}
            onTrackBet={handleTrackSportBet}
            onUpdateTrackedStatus={handleUpdateTrackedSportBetStatus}
            onBatchUpdateTrackedStatus={handleBatchUpdateTrackedSportBets}
            onUpdateTrackedStake={handleUpdateTrackedSportBetStake}
            onDeleteTrackedBet={handleDeleteTrackedSportBet}
            onClearTrackedBets={handleClearTrackedSportBets}
          />
        )}

        {/* Tab: Seed Analysis & Target Probabilities */}
        {activeTab === 'seed-analysis' && (
          <SeedAnalysis
            currentBalance={balance}
            currency={currency}
          />
        )}

        {/* Tab 2: Advanced Games (Blackjack Basic Strategy, French Roulette, Crash EV) */}
        {activeTab === 'advanced-games' && (
          <AdvancedGamesSuite
            currency={currency}
          />
        )}

        {/* Tab 3: Strategy Generator & Sandbox Testing */}
        {activeTab === 'engine' && (
          <div className="space-y-6">
            <StrategyGenerator
              currentStrategy={currentStrategy}
              onSelectStrategy={handleSelectStrategy}
              onUpdateStrategy={handleUpdateStrategy}
              currency={currency}
              balance={simulatedBalance}
              onStartAutoBet={handleStartAutoBet}
              isAutobetting={isAutobetting}
            />

            <AutoBetEngine
              strategy={currentStrategy}
              balance={simulatedBalance}
              currency={currency}
              isAutobetting={isAutobetting}
              onStartAutoBet={handleStartAutoBet}
              onStopAutoBet={handleStopAutoBet}
              onExecuteSingleBet={executeBet}
              onExecuteBatchBets={handleExecuteBatchBets}
              lastBet={lastBet}
              currentStreak={currentStreak}
              betSpeedMs={betSpeedMs}
              setBetSpeedMs={setBetSpeedMs}
              stopReason={stopReason}
              sessionProfit={sessionProfit}
              bets={bets}
              stats={stats}
              onClearHistory={handleResetSimulationStats}
            />
          </div>
        )}

        {/* Tab 5: Telegram Bot Controller */}
        {activeTab === 'telegram' && (
          <TelegramBotController
            strategy={currentStrategy}
            onSelectStrategy={handleSelectStrategy}
            stats={stats}
            currency={currency}
            isAutobetting={isAutobetting}
            onStartAutoBet={handleStartAutoBet}
            onStopAutoBet={handleStopAutoBet}
            telegramConfig={telegramConfig}
            onUpdateTelegramConfig={(cfg) => setTelegramConfig((prev) => ({ ...prev, ...cfg }))}
            onAddManualSession={handleAddManualSession}
            manualSessions={manualSessions}
          />
        )}

        {/* Tab 6: Analytics & Gain History */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            stats={stats}
            bets={bets}
            currency={currency}
            strategy={currentStrategy}
          />
        )}

        {/* Tab 7: Cloud & Multi-Profiles Sync Manager */}
        {activeTab === 'cloud-sync' && (
          <CloudSyncManager
            sessions={manualSessions}
            wallets={wallets}
            strategies={PREDEFINED_STRATEGIES}
            telegramConfig={telegramConfig}
            apiCredentials={credentials}
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelectProfile={(id) => setActiveProfileId(id)}
            onCreateProfile={handleCreateProfile}
            onDeleteProfile={handleDeleteProfile}
            onRestoreBackup={handleRestoreBackup}
            onResetAllData={handleResetAllData}
          />
        )}

        {/* Tab 8: Standalone Script Exporter */}
        {activeTab === 'scripts' && (
          <ScriptExporter
            strategy={currentStrategy}
            credentials={credentials}
            currency={currency}
          />
        )}

      </main>

      {/* Settings Modal */}
      <StakeApiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        credentials={credentials}
        onSaveCredentials={(creds) => setCredentials(creds)}
      />

      {/* AI Assistant Support & Copilot Drawer */}
      <AppAiAssistant
        isOpen={isAssistantOpen}
        onOpen={() => setIsAssistantOpen(true)}
        onClose={() => setIsAssistantOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        balance={balance}
        currency={currency}
        wallets={wallets}
        isTelegramConnected={telegramConfig.isActive}
        manualSessionsCount={manualSessions.length}
        trackedBetsCount={trackedSportBets.length}
      />

    </div>
  );
}
