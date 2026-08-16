import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  CheckCircle2, 
  Radio, 
  Terminal, 
  ShieldAlert, 
  ExternalLink, 
  Copy, 
  Check, 
  Play, 
  Square, 
  TrendingUp, 
  Sparkles,
  Smartphone,
  Layers,
  Settings,
  Shuffle,
  BookOpen,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';
import { TelegramMessage, TelegramBotConfig, BettingStrategy, BotStatistics, ManualSession } from '../types';
import { generateRandomConstructiveStrategy } from '../utils/constructiveStrategies';

interface TelegramBotControllerProps {
  strategy: BettingStrategy;
  onSelectStrategy: (strat: BettingStrategy) => void;
  stats: BotStatistics;
  currency: string;
  isAutobetting: boolean;
  onStartAutoBet: () => void;
  onStopAutoBet: () => void;
  telegramConfig: TelegramBotConfig;
  onUpdateTelegramConfig: (cfg: Partial<TelegramBotConfig>) => void;
  onAddManualSession?: (session: Omit<ManualSession, 'id' | 'timestamp'>) => void;
  manualSessions?: ManualSession[];
}

export const TelegramBotController: React.FC<TelegramBotControllerProps> = ({
  strategy,
  onSelectStrategy,
  stats,
  currency,
  isAutobetting,
  onStartAutoBet,
  onStopAutoBet,
  telegramConfig,
  onUpdateTelegramConfig,
  onAddManualSession,
  manualSessions = [],
}) => {
  const [messages, setMessages] = useState<TelegramMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: `👋 *Bienvenue sur Stake Constructive Bot !*\n\nJe génère des stratégies intelligentes et probabilités optimisées (sans Martingale) et j'enregistre vos bilans manuels de session (+/-).\n\nCommandes rapides :\n• \`/random\` : Générer une stratégie constructive aléatoire\n• \`/session +15\` ou \`/session -10\` : Enregistrer le résultat d'une session\n• \`/bilan\` : Consulter votre historique et rentabilité manuelle\n• \`/coach\` : Analyse et conseils IA sur vos résultats`,
      timestamp: Date.now() - 60000,
      quickActions: [
        { label: '🎲 Stratégie Aléatoire', command: '/random' },
        { label: '➕ Noter Gain (+10)', command: '/session +10' },
        { label: '➖ Noter Perte (-5)', command: '/session -5' },
        { label: '📊 Mon Bilan', command: '/bilan' },
      ],
    },
  ]);

  const [inputCommand, setInputCommand] = useState('');
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper to safely get profit
  const getSessProfit = (s: ManualSession): number => {
    if (typeof s.profit === 'number' && !isNaN(s.profit)) return s.profit;
    if (typeof s.profitOrLoss === 'number' && !isNaN(s.profitOrLoss)) return s.profitOrLoss;
    return 0;
  };

  // Calculate manual sessions stats
  const totalManualProfit = manualSessions.reduce((acc, s) => acc + getSessProfit(s), 0);
  const manualWins = manualSessions.filter((s) => getSessProfit(s) > 0).length;
  const manualWinRate = manualSessions.length > 0 ? ((manualWins / manualSessions.length) * 100).toFixed(1) : '0.0';

  // Execute Telegram command in Simulator
  const handleSendCommand = async (cmdText: string) => {
    const rawCmd = cmdText.trim();
    if (!rawCmd) return;

    const userMsg: TelegramMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: rawCmd,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputCommand('');

    // Simulate Bot response processing
    setTimeout(() => {
      const lower = rawCmd.toLowerCase();
      let botResponseText = '';
      let quickActions: Array<{ label: string; command: string }> | undefined;

      // Handle Manual Session Logging via Telegram: /session +15 or /session -8 or /gain 10 or /perte 5
      const sessionMatch = rawCmd.match(/^\/(?:session|gain|perte|resultat|record)\s+([+-]?\d+(?:\.\d+)?)/i);
      
      if (sessionMatch) {
        const amount = parseFloat(sessionMatch[1]);
        if (!isNaN(amount)) {
          if (onAddManualSession) {
            onAddManualSession({
              game: strategy.game,
              strategyName: strategy.name,
              profitOrLoss: amount,
              profit: amount,
              currency,
              durationMinutes: 15,
              mood: amount >= 0 ? 'disciplined' : 'tilted',
              notes: `Enregistré via commande Telegram : "${rawCmd}"`,
            });
          }

          const isWin = amount >= 0;
          botResponseText = `${isWin ? '🟢 *Gain Enregistré !*' : '🔴 *Perte Enregistrée !*'}\n\n• Montant: *${amount >= 0 ? '+' : ''}${amount.toFixed(2)} ${currency}*\n• Jeu: *${strategy.game.toUpperCase()}*\n• Stratégie: *${strategy.name}*\n\n📊 *Nouveau P&L Global :* ${totalManualProfit + amount >= 0 ? '+' : ''}${(totalManualProfit + amount).toFixed(2)} ${currency}\n\n💡 Tapez \`/bilan\` pour voir tout l'historique ou \`/coach\` pour un conseil.`;
          quickActions = [
            { label: '📊 Voir le Bilan', command: '/bilan' },
            { label: '🎲 Nouvelle Stratégie', command: '/random' },
            { label: '🧠 Conseils Coach IA', command: '/coach' },
          ];
        } else {
          botResponseText = `⚠️ Format invalide. Exemple d'utilisation : \`/session +15\` ou \`/session -10\``;
        }
      } else if (lower.startsWith('/random') || lower.startsWith('/alea') || lower === 'random') {
        const randomStrat = generateRandomConstructiveStrategy(strategy.game, 100, currency);
        onSelectStrategy(randomStrat);
        botResponseText = `🎲 *Nouvelle Stratégie Constructive Générée !*\n\n• Nom: *${randomStrat.name}*\n• Jeu: *${randomStrat.game.toUpperCase()}*\n• Multiplicateur: *${randomStrat.targetMultiplier}x* (Win: ${randomStrat.winChance}%)\n• Risque: *${randomStrat.riskLevel}*\n• Mise base: *${randomStrat.baseBet} ${currency}*\n• Take Profit: *+${randomStrat.stopOnProfit} ${currency}*\n• Stop Loss: *-${randomStrat.stopOnLoss} ${currency}*\n\n🧠 *Principe Mathématique :*\n${randomStrat.aiRationale}\n\n🛡️ *Zéro Martingale :* Gestion saine du capital par cycles d'unités.`;
        quickActions = [
          { label: '🎲 Autre Stratégie', command: '/random' },
          { label: '➕ Valider Gain (+15)', command: '/session +15' },
          { label: '➖ Valider Perte (-10)', command: '/session -10' },
        ];
      } else if (lower === '/start' || lower === 'start') {
        botResponseText = `🤖 *Stake Constructive Bot En Ligne & Prêt !*\n\n• Stratégie active : *${strategy.name}*\n• Sessions manuelles enregistrées : *${manualSessions.length}*\n• P&L Cumulé : *${totalManualProfit >= 0 ? '+' : ''}${totalManualProfit.toFixed(2)} ${currency}*\n\nChoisissez une action :`;
        quickActions = [
          { label: '🎲 Stratégie Aléatoire', command: '/random' },
          { label: '➕ Enregistrer Gain (+)', command: '/session +10' },
          { label: '➖ Enregistrer Perte (-)', command: '/session -5' },
          { label: '📊 Consulter Bilan', command: '/bilan' },
        ];
      } else if (lower === '/bilan' || lower === '/journal' || lower === '/history') {
        if (manualSessions.length === 0) {
          botResponseText = `📝 *Aucune session manuelle enregistrée pour l'instant.*\n\nPour enregistrer votre premier bilan après avoir joué sur Stake, tapez par exemple :\n• \`/session +12.5\` (si session positive)\n• \`/session -8.0\` (si session négative)`;
          quickActions = [
            { label: '➕ Entrer Gain (+10)', command: '/session +10' },
            { label: '➖ Entrer Perte (-5)', command: '/session -5' },
          ];
        } else {
          const recentList = manualSessions.slice(-3).map((s, i) => {
            const p = getSessProfit(s);
            return `  ${i+1}. ${p >= 0 ? '🟢 +' : '🔴 '}${p.toFixed(2)} ${s.currency || currency} (${(s.game || 'DICE').toUpperCase()} - ${s.strategyName || 'Session'})`;
          }).join('\n');

          botResponseText = `📊 *Bilan du Journal de Sessions Stake*\n\n💰 *P&L Total :* ${totalManualProfit >= 0 ? '🟢 +' : '🔴 '}${totalManualProfit.toFixed(2)} ${currency}\n🎯 *Taux de Sessions Gagnantes :* ${manualWinRate}% (${manualWins}/${manualSessions.length})\n\n📜 *Dernières sessions :*\n${recentList}\n\n💡 Tapez \`/coach\` pour une analyse psychologique & mathématique.`;
          quickActions = [
            { label: '➕ Noter Session (+)', command: '/session +10' },
            { label: '➖ Noter Session (-)', command: '/session -5' },
            { label: '🧠 Analyse Coach IA', command: '/coach' },
          ];
        }
      } else if (lower === '/coach' || lower === '/conseil' || lower === '/analyse') {
        if (manualSessions.length === 0) {
          botResponseText = `🧠 *Conseil du Coach IA :*\n\nPour obtenir un diagnostic précis, enregistrez d'abord 2 ou 3 sessions manuelles avec la commande \`/session +X\` ou \`/session -X\`. En attendant : fixez toujours un Take Profit de +15% max par session pour protéger vos gains !`;
        } else {
          botResponseText = `🧠 *Diagnostic Coach IA (Discipline & Probabilités) :*\n\n• P&L Global : *${totalManualProfit >= 0 ? '+' : ''}${totalManualProfit.toFixed(2)} ${currency}*\n• Sessions analysées : *${manualSessions.length}*\n\n📌 *Recommandations :*\n1. Continuez d'éviter le doublement sur perte (Martingale) pour éliminer le risque de ruine.\n2. Si vous êtes en gain de plus de 20%, arrêtez la session et prenez une pause.\n3. Utilisez des stratégies à cycles comme Oscar's Grind ou Paroli 1-2-4.`;
        }
        quickActions = [
          { label: '🎲 Nouvelle Stratégie', command: '/random' },
          { label: '📊 Mon Bilan', command: '/bilan' },
        ];
      } else if (lower.startsWith('/strategy') || lower.startsWith('/strategie')) {
        const game = lower.includes('mines') ? 'mines' : lower.includes('limbo') ? 'limbo' : lower.includes('plinko') ? 'plinko' : 'dice';
        botResponseText = `🎯 *Stratégie Constructive pour ${game.toUpperCase()}*\n\n• Nom: *${strategy.name}*\n• Multiplicateur: *${strategy.targetMultiplier}x* (Chance: ${strategy.winChance}%)\n• Stop-loss: *${strategy.stopOnLoss} ${currency}*\n• Take-profit: *${strategy.stopOnProfit} ${currency}*\n\n💡 *Action:* Jouez sur Stake puis enregistrez votre résultat ici : \`/session +10\``;
        quickActions = [
          { label: '🎲 Stratégie Aléatoire', command: '/random' },
          { label: '➕ Enregistrer Résultat (+10)', command: '/session +10' },
        ];
      } else if (lower === '/autobet start' || lower === '/play') {
        if (!isAutobetting) {
          onStartAutoBet();
          botResponseText = `🟢 *Test Sandbox Démarré !*\n\n• Jeu: *${strategy.game.toUpperCase()}*\n• Mise de base: *${strategy.baseBet} ${currency}*\n• Cible: *${strategy.targetMultiplier}x*`;
        } else {
          botResponseText = `⚠️ Le test Sandbox est déjà en cours.`;
        }
        quickActions = [
          { label: '🛑 Arrêter (/stop)', command: '/stop' },
          { label: '📊 Voir Stats', command: '/stats' },
        ];
      } else if (lower === '/stop') {
        onStopAutoBet();
        botResponseText = `🛑 *Test Interrompu.*\n\n• Profit Sandbox : *${stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toFixed(4)} ${currency}*`;
        quickActions = [
          { label: '🎲 Autre Stratégie', command: '/random' },
          { label: '📊 Bilan Manuel', command: '/bilan' },
        ];
      } else if (lower === '/stats') {
        botResponseText = `📊 *Stats Sandbox Automatisé :*\n\n• Profit Sandbox: *${stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toFixed(2)} ${currency}*\n• Taux de réussite: *${stats.winRate}%*\n\nPour vos vraies sessions de jeu, utilisez \`/bilan\`.`;
        quickActions = [
          { label: '📊 Mon Bilan Réel', command: '/bilan' },
          { label: '🎲 Stratégie Aléatoire', command: '/random' },
        ];
      } else {
        botResponseText = `❓ Commande non reconnue : "${rawCmd}".\nEssayez :\n• \`/random\` (générer stratégie constructive)\n• \`/session +15\` (enregistrer gain)\n• \`/session -10\` (enregistrer perte)\n• \`/bilan\` (historique et profits)\n• \`/coach\` (conseils IA)`;
        quickActions = [
          { label: '🎲 /random', command: '/random' },
          { label: '➕ /session +10', command: '/session +10' },
          { label: '📊 /bilan', command: '/bilan' },
        ];
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botResponseText,
          timestamp: Date.now(),
          quickActions,
        },
      ]);
    }, 350);
  };

  // Test real Telegram Bot token
  const handleTestTelegramConnection = async () => {
    setIsTestingToken(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/telegram/test-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramConfig.botToken,
          chatId: telegramConfig.chatId,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        onUpdateTelegramConfig({
          isActive: true,
          botUsername: data.botUser?.username || 'StakeBot',
        });
        setTestResult({
          ok: true,
          message: `Connecté à @${data.botUser?.username} ! Message de test envoyé avec succès.`,
        });
      } else {
        setTestResult({
          ok: false,
          message: data.error || 'Impossible de se connecter au bot Telegram.',
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || 'Erreur de connexion réseau.',
      });
    } finally {
      setIsTestingToken(false);
    }
  };

  return (
    <div id="telegram-controller-panel" className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-800/40 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Contrôleur de Bot Telegram & Webhook
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                telegramConfig.isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {telegramConfig.isActive ? 'Bridge Connecté' : 'Mode Simulateur Actif'}
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Générez des stratégies, recevez des alertes en direct et pilotez l'auto-betting directement depuis Telegram.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAutobetting ? (
            <button
              onClick={onStopAutoBet}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/40 flex items-center gap-1.5 transition"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Arrêter Autobet (/stop)</span>
            </button>
          ) : (
            <button
              onClick={onStartAutoBet}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Lancer Autobet (/start)</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Telegram Chat UI */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col h-[580px]">
          
          {/* Telegram App Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-100">
                    {telegramConfig.botUsername ? `@${telegramConfig.botUsername}` : 'Stake Strategy Bot'}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-current" />
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">bot • en ligne</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                P&L: <strong className={stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit.toFixed(2)} {currency}
                </strong>
              </span>
            </div>
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/70">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-md ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">
                      {msg.text.split('\n').map((line, lIdx) => (
                        <p key={lIdx} className={line.startsWith('•') || line.startsWith('👋') || line.startsWith('🤖') ? 'my-0.5' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                    <span className={`text-[9px] block text-right mt-1 opacity-60`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Inline Quick Action Buttons */}
                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.quickActions.map((qa, qaIdx) => (
                        <button
                          key={qaIdx}
                          onClick={() => handleSendCommand(qa.command)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-blue-300 hover:text-white text-[11px] font-semibold transition shadow-sm"
                        >
                          {qa.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Command Bar */}
          <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-500 font-semibold flex-shrink-0">Raccourcis :</span>
            {[
              { label: '/start', cmd: '/start' },
              { label: '/strategy dice', cmd: '/strategy dice' },
              { label: '/strategy mines', cmd: '/strategy mines' },
              { label: '/autobet start', cmd: '/autobet start' },
              { label: '/stats', cmd: '/stats' },
              { label: '/stop', cmd: '/stop' },
              { label: '/alert', cmd: '/alert' },
            ].map((shortcut) => (
              <button
                key={shortcut.cmd}
                onClick={() => handleSendCommand(shortcut.cmd)}
                className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex-shrink-0 transition font-mono"
              >
                {shortcut.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputCommand}
              onChange={(e) => setInputCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendCommand(inputCommand)}
              placeholder="Tapez une commande (ex: /strategy, /autobet start, /stats)..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={() => handleSendCommand(inputCommand)}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/40 transition"
              title="Envoyer la commande"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Right Column: Real Telegram Bot API Bridge & Setup Guide */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Telegram Credentials Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Settings className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-bold text-white">
                Configuration Bot Telegram Réel
              </h4>
            </div>

            {/* Token */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Telegram Bot Token (depuis @BotFather)
              </label>
              <input
                type="password"
                value={telegramConfig.botToken}
                onChange={(e) => onUpdateTelegramConfig({ botToken: e.target.value })}
                placeholder="1234567890:ABCdefGhIJKlmNoPQRstuVWXyz..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Chat ID */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Votre Telegram Chat ID
              </label>
              <input
                type="text"
                value={telegramConfig.chatId}
                onChange={(e) => onUpdateTelegramConfig({ chatId: e.target.value })}
                placeholder="Ex: 987654321 (obtenu via @userinfobot)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testResult.ok 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {testResult.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Test Connection Button */}
            <button
              id="btn-test-telegram-token"
              onClick={handleTestTelegramConnection}
              disabled={isTestingToken || !telegramConfig.botToken}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-900/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isTestingToken ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Vérification du Bot Telegram...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Tester & Activer la Connexion Telegram</span>
                </>
              )}
            </button>
          </div>

          {/* 3-Step Setup Instructions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Comment créer votre Bot en 2 minutes :
            </h4>

            <ol className="space-y-2.5 text-xs text-slate-400 list-decimal list-inside">
              <li>
                Ouvrez Telegram et cherchez le bot officiel <strong className="text-blue-400">@BotFather</strong>.
              </li>
              <li>
                Envoyez <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-200">/newbot</code>, donnez un nom et copiez le <strong className="text-slate-200">Token API HTTP</strong> généré.
              </li>
              <li>
                Ouvrez <strong className="text-blue-400">@userinfobot</strong> pour copier votre <strong className="text-slate-200">Chat ID</strong> personnel.
              </li>
              <li>
                Collez ces identifiants ci-dessus et cliquez sur <strong className="text-emerald-400">Tester & Activer</strong> !
              </li>
            </ol>
          </div>

        </div>

      </div>

    </div>
  );
};
