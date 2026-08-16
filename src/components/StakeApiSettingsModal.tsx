import React from 'react';
import { 
  X, 
  Key, 
  ShieldCheck, 
  Globe, 
  Lock, 
  Shuffle, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { StakeApiCredentials } from '../types';
import { generateRandomSeed } from '../utils/provablyFair';

interface StakeApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: StakeApiCredentials;
  onSaveCredentials: (creds: StakeApiCredentials) => void;
}

export const StakeApiSettingsModal: React.FC<StakeApiSettingsModalProps> = ({
  isOpen,
  onClose,
  credentials,
  onSaveCredentials,
}) => {
  if (!isOpen) return null;

  const handleRandomizeSeeds = () => {
    onSaveCredentials({
      ...credentials,
      clientSeed: generateRandomSeed(),
      serverSeedHash: generateRandomSeed(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Paramètres API & Provably Fair Stake
              </h3>
              <p className="text-xs text-slate-400">
                Configuration de session et graines cryptographiques
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Domain Selection */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              Domaine Stake
            </label>
            <select
              value={credentials.domain}
              onChange={(e) => onSaveCredentials({ ...credentials, domain: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="stake.com">Stake.com (International / Crypto)</option>
              <option value="stake.us">Stake.us (US Social Casino)</option>
              <option value="stake.bet">Stake.bet (Miroir)</option>
            </select>
          </div>

          {/* Stake API Key / Token */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              Stake API Token / Session Token (Optionnel pour Live API)
            </label>
            <input
              type="password"
              value={credentials.apiKey}
              onChange={(e) => onSaveCredentials({ ...credentials, apiKey: e.target.value })}
              placeholder="session_token_stake_..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              En mode Bac à Sable Provably Fair, les paris sont simulés avec l'exacte formule mathématique Stake.
            </span>
          </div>

          {/* Client Seed & Server Seed */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Graines Provably Fair (HMAC-SHA256)
              </span>
              <button
                type="button"
                onClick={handleRandomizeSeeds}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Shuffle className="w-3 h-3" />
                Régénérer
              </button>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Graine Client (Client Seed) :</span>
              <input
                type="text"
                value={credentials.clientSeed}
                onChange={(e) => onSaveCredentials({ ...credentials, clientSeed: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-300"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Hachage Graine Serveur (Server Seed Hash) :</span>
              <input
                type="text"
                value={credentials.serverSeedHash}
                onChange={(e) => onSaveCredentials({ ...credentials, serverSeedHash: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-300"
              />
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
          >
            Enregistrer & Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
