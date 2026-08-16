import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Flame, 
  Settings, 
  Send, 
  RotateCcw, 
  Wallet, 
  TrendingUp, 
  Cpu, 
  BookOpen,
  Sparkles,
  Coins,
  Cloud,
  Edit2,
  Check,
  X,
  Search,
  Trophy
} from 'lucide-react';
import { StakeApiCredentials } from '../types';

export type AppTab = 
  | 'manual-sessions' 
  | 'sports'
  | 'advanced-games' 
  | 'engine' 
  | 'telegram' 
  | 'analytics' 
  | 'cloud-sync' 
  | 'scripts'
  | 'seed-analysis';

interface HeaderProps {
  balance: number;
  currency: string;
  onCurrencyChange: (curr: string) => void;
  onUpdateBalance: (newBal: number) => void;
  onResetBalance: () => void;
  credentials: StakeApiCredentials;
  onOpenSettings: () => void;
  onOpenAssistant?: () => void;
  isTelegramConnected: boolean;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isAutobetting: boolean;
  manualSessionsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  balance,
  currency,
  onCurrencyChange,
  onUpdateBalance,
  onResetBalance,
  credentials,
  onOpenSettings,
  onOpenAssistant,
  isTelegramConnected,
  activeTab,
  setActiveTab,
  isAutobetting,
  manualSessionsCount = 0,
}) => {
  const currencies = ['USDT', 'USD', 'BTC', 'ETH', 'SOL', 'EUR', 'LTC', 'DOGE', 'TRX'];

  // Inline Balance Editor State
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [editBalanceValue, setEditBalanceValue] = useState<string>(balance.toString());

  useEffect(() => {
    if (!isEditingBalance) {
      setEditBalanceValue(balance.toString());
    }
  }, [balance, isEditingBalance]);

  const handleSaveBalance = () => {
    const parsed = parseFloat(editBalanceValue.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateBalance(parsed);
    }
    setIsEditingBalance(false);
  };

  const handleCancelBalance = () => {
    setEditBalanceValue(balance.toString());
    setIsEditingBalance(false);
  };

  const navItems: Array<{ id: AppTab; label: string; icon: React.ReactNode; badge?: string | number; color?: string }> = [
    { id: 'manual-sessions', label: 'Journal (+/-)', icon: <BookOpen className="w-4 h-4" />, badge: manualSessionsCount > 0 ? manualSessionsCount : undefined, color: 'text-emerald-400' },
    { id: 'sports', label: 'Paris Sportifs IA', icon: <Trophy className="w-4 h-4" />, color: 'text-blue-400' },
    { id: 'advanced-games', label: 'Blackjack & Cotes', icon: <Sparkles className="w-4 h-4" />, color: 'text-indigo-400' },
    { id: 'engine', label: 'Stratégies IA', icon: <Flame className="w-4 h-4" />, color: 'text-orange-400' },
    { id: 'telegram', label: 'Bot Telegram', icon: <Send className="w-4 h-4" />, badge: isTelegramConnected ? 'ON' : undefined, color: 'text-sky-400' },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" />, color: 'text-amber-400' },
    { id: 'cloud-sync', label: 'Cloud & Profils', icon: <Cloud className="w-4 h-4" />, color: 'text-cyan-400' },
    { id: 'scripts', label: 'Scripts', icon: <Cpu className="w-4 h-4" />, color: 'text-violet-400' },
    { id: 'seed-analysis', label: 'Analyse Seed & Cibles', icon: <Search className="w-4 h-4" />, color: 'text-teal-400' },
  ];

  return (
    <>
      <header id="app-header" className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/90 text-slate-100 sticky top-0 z-40 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Logo & Title */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-orange-500 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-orange-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span translate="no" className="notranslate font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-blue-100 to-orange-300 bg-clip-text text-transparent">
                    BNZSTRATS IA
                  </span>
                  <span translate="no" className="notranslate text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30 uppercase tracking-wider">
                    v3.7
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block">
                  Stratégies Constructives & Journal Quantitatif
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 gap-0.5 overflow-x-auto max-w-2xl">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-slate-800 to-slate-850 text-white border border-blue-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/90'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : item.color}>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-orange-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-orange-300 border border-orange-500/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Controls: Balance & Mode */}
            <div className="flex items-center gap-2">
              
              {/* Balance Badge with Direct Edition */}
              <div className="flex items-center bg-slate-850 border border-slate-700/90 hover:border-orange-500/40 rounded-xl px-2.5 py-1.5 gap-2 shadow-inner transition-colors">
                <Wallet className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                
                {isEditingBalance ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={editBalanceValue}
                      onChange={(e) => setEditBalanceValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveBalance();
                        if (e.key === 'Escape') handleCancelBalance();
                      }}
                      autoFocus
                      className="w-20 sm:w-24 bg-slate-950 border border-orange-500 text-slate-100 text-xs font-mono font-bold rounded px-1.5 py-0.5 focus:outline-none"
                    />
                    <button
                      onClick={handleSaveBalance}
                      className="p-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs"
                      title="Valider la nouvelle balance"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleCancelBalance}
                      className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs"
                      title="Annuler"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => setIsEditingBalance(true)}
                    className="text-right cursor-pointer group flex items-center gap-1.5"
                    title="Cliquez pour modifier votre solde"
                  >
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium leading-tight flex items-center justify-end gap-1">
                        <span>Solde</span>
                        <Edit2 className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 text-orange-400 transition" />
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-slate-100 font-mono tracking-tight leading-tight group-hover:text-orange-300 transition">
                        {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{' '}
                        <span className="text-blue-400 text-[10px] font-semibold">{currency}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  id="btn-reset-balance"
                  onClick={onResetBalance}
                  title="Réinitialiser le solde à 100.00"
                  className="p-1 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-slate-700/60 transition flex-shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              {/* Currency Selector */}
              <select
                id="currency-selector"
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="bg-slate-800 border border-slate-700 hover:border-blue-500 text-slate-200 text-xs font-bold rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors cursor-pointer"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* AI Assistant Copilot Trigger with Blue/Orange Glow */}
              {onOpenAssistant && (
                <button
                  id="btn-header-open-assistant"
                  onClick={onOpenAssistant}
                  className="group relative px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 hover:from-blue-500 hover:to-orange-400 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                  title="Ouvrir l'Assistant IA & Dépannage"
                >
                  <Bot className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  <span className="hidden md:inline text-xs font-bold text-white">
                    Assistant IA
                  </span>
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping absolute -top-0.5 -right-0.5" />
                  <span className="w-2 h-2 rounded-full bg-orange-400 absolute -top-0.5 -right-0.5 border border-slate-900" />
                </button>
              )}

              {/* Settings Trigger */}
              <button
                id="btn-open-settings"
                onClick={onOpenSettings}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-orange-300 text-slate-300 border border-slate-700 hover:border-orange-500/40 transition shadow-sm"
                title="Paramètres API Stake & Telegram"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Medium Screen Horizontal Scroll Navigation */}
          <div className="flex lg:hidden overflow-x-auto py-2 border-t border-slate-800/60 gap-1 scrollbar-none">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 bg-slate-950/60 hover:text-slate-200'
                  }`}
                >
                  <span className={isActive ? 'text-white' : item.color}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Mobile Sticky Bottom Navigation Bar for ultra-fast thumb navigation */}
      <div className="fixed sm:hidden bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('manual-sessions')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-bold ${
            activeTab === 'manual-sessions' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Journal</span>
        </button>

        <button
          onClick={() => setActiveTab('sports')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-bold ${
            activeTab === 'sports' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Sport IA</span>
        </button>

        <button
          onClick={() => setActiveTab('engine')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-bold ${
            activeTab === 'engine' ? 'text-orange-400' : 'text-slate-400'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Stratégie</span>
        </button>

        <button
          onClick={() => setActiveTab('advanced-games')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-bold ${
            activeTab === 'advanced-games' ? 'text-indigo-400' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Jeux</span>
        </button>

        <button
          onClick={() => setActiveTab('telegram')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-bold ${
            activeTab === 'telegram' ? 'text-sky-400' : 'text-slate-400'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Telegram</span>
        </button>

        <button
          onClick={() => setActiveTab('cloud-sync')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-bold ${
            activeTab === 'cloud-sync' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Cloud</span>
        </button>
      </div>
    </>
  );
};
