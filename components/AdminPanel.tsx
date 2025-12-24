
import React from 'react';
import { AppConfig } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onConfigChange: (newConfig: AppConfig) => void;
  onPurgeMemory: () => void;
  onManageAccounts: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, config, onConfigChange, onPurgeMemory, onManageAccounts }) => {
  if (!isOpen) return null;

  const handleExportLogs = () => {
    const logs = {
      system: 'NEXA V9.0',
      timestamp: new Date().toISOString(),
      config: config,
      status: 'OPTIMAL'
    };
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NEXA_LOGS_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute top-16 right-4 w-80 bg-black border border-nexa-cyan rounded-lg shadow-[0_0_20px_rgba(41,223,255,0.3)] z-50 animate-fade-in overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-nexa-cyan/20">
        <h2 className="text-nexa-cyan font-mono text-sm tracking-[0.1em] uppercase">
          ADMIN CONTROL
        </h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-white text-lg leading-none">&times;</button>
      </div>

      <div className="p-4 space-y-6">
        
        {/* HUD Rotation Speed */}
        <div>
           <label className="block text-zinc-400 text-[10px] font-mono mb-3 tracking-wider">HUD Rotation Speed</label>
           <div className="relative flex items-center h-4">
             <input 
                type="range" 
                min="0.2" 
                max="5" 
                step="0.1"
                value={config.hudRotationSpeed}
                onChange={(e) => onConfigChange({...config, hudRotationSpeed: parseFloat(e.target.value)})}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer z-20 relative accent-nexa-cyan" 
                style={{
                    background: `linear-gradient(to right, #29dfff 0%, #29dfff ${(config.hudRotationSpeed / 5) * 100}%, #3f3f46 ${(config.hudRotationSpeed / 5) * 100}%, #3f3f46 100%)`
                }}
              />
           </div>
        </div>
        
        {/* Mic Reactor Rotation Speed */}
        <div>
           <label className="block text-zinc-400 text-[10px] font-mono mb-3 tracking-wider">Mic Reactor Rotation Speed</label>
           <div className="relative flex items-center h-4">
             <input 
                type="range" 
                min="0.2" 
                max="5" 
                step="0.1"
                value={config.micRotationSpeed}
                onChange={(e) => onConfigChange({...config, micRotationSpeed: parseFloat(e.target.value)})}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer z-20 relative accent-nexa-cyan" 
                style={{
                    background: `linear-gradient(to right, #29dfff 0%, #29dfff ${(config.micRotationSpeed / 5) * 100}%, #3f3f46 ${(config.micRotationSpeed / 5) * 100}%, #3f3f46 100%)`
                }}
              />
           </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-4">
            {/* Animations Toggle */}
            <div>
              <label className="block text-zinc-400 text-[10px] font-mono mb-2 tracking-wider">Animations</label>
              <button 
                onClick={() => onConfigChange({...config, animationsEnabled: !config.animationsEnabled})}
                className={`w-full py-2 text-xs font-mono tracking-widest border transition-all uppercase ${
                    config.animationsEnabled 
                    ? 'border-nexa-cyan text-nexa-cyan bg-nexa-cyan/5 shadow-[0_0_10px_rgba(41,223,255,0.2)]' 
                    : 'border-zinc-700 text-zinc-500 bg-transparent'
                }`}
              >
                {config.animationsEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
            {/* Mic Rotation Toggle */}
            <div>
              <label className="block text-zinc-400 text-[10px] font-mono mb-2 tracking-wider">Mic Rotation</label>
              <button 
                onClick={() => onConfigChange({...config, micRotationEnabled: !config.micRotationEnabled})}
                className={`w-full py-2 text-xs font-mono tracking-widest border transition-all uppercase ${
                    config.micRotationEnabled
                    ? 'border-nexa-cyan text-nexa-cyan bg-nexa-cyan/5 shadow-[0_0_10px_rgba(41,223,255,0.2)]' 
                    : 'border-zinc-700 text-zinc-500 bg-transparent'
                }`}
              >
                {config.micRotationEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
           <button 
             onClick={handleExportLogs}
             className="w-full py-3 border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:border-zinc-600 text-[10px] font-mono tracking-widest transition-all uppercase"
           >
             EXPORT SYSTEM LOGS
           </button>
           
           <button 
             onClick={onManageAccounts}
             className="w-full py-3 border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:border-zinc-600 text-[10px] font-mono tracking-widest transition-all uppercase"
           >
             MANAGE ACCOUNTS
           </button>
           
           <button 
             onClick={onPurgeMemory}
             className="w-full py-3 border border-red-900/50 bg-red-900/10 text-red-500 hover:bg-red-900/30 hover:border-red-500 text-[10px] font-mono tracking-widest transition-all uppercase mt-2"
           >
             PURGE MEMORY BANKS
           </button>
        </div>
      </div>
       <style>{`
          input[type=range]::-webkit-slider-thumb {
              -webkit-appearance: none;
              height: 16px;
              width: 16px;
              border-radius: 50%;
              background: #29dfff;
              box-shadow: 0 0 10px rgba(41,223,255,0.8);
              margin-top: -7px;
              cursor: grab;
          }
          input[type=range]:active::-webkit-slider-thumb {
              cursor: grabbing;
          }
          input[type=range]::-moz-range-thumb {
              height: 16px;
              width: 16px;
              border-radius: 50%;
              background: #29dfff;
              box-shadow: 0 0 10px rgba(41,223,255,0.8);
              border: none;
              cursor: grab;
          }
          input[type=range]:active::-moz-range-thumb {
              cursor: grabbing;
          }
        `}</style>
    </div>
  );
};

export default AdminPanel;