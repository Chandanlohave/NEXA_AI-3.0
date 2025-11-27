
import React, { useState, useEffect, useRef } from 'react';
import Auth from './components/Auth';
import HUD from './components/HUD';
import ChatPanel from './components/ChatPanel';
import AdminPanel from './components/AdminPanel';
import ManageAccountsModal from './components/ManageAccountsModal';
import { UserProfile, UserRole, HUDState, ChatMessage, AppConfig } from './types';
import { generateTextResponse, generateSpeech } from './services/geminiService';
import { getAdminHistory, saveAdminHistory, getUserHistory, saveUserHistory } from './services/memoryService';

// --- ICONS ---

const GearIcon = () => (
  <svg className="w-5 h-5 text-nexa-cyan/80 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 1.9-.94 3.31-.826 3.31-2.37 0-3.35-.426-3.35-2.924 0-3.35a1.724 1.724 0 00-1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.94 1.543 2.924 1.543 3.35 0a1.724 1.724 0 002.573-1.066c1.543.94 3.31-.826 2.37-1.9.94-3.31.826-3.31 2.37 0 3.35.426 3.35 2.924 0 3.35a1.724 1.724 0 001.066 2.573c.94 1.543-.826 3.31-2.37 2.37-.94-1.543-2.924-1.543-3.35 0a1.724 1.724 0 00-2.573 1.066c-1.543-.94-3.31.826-2.37 1.9zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5 text-nexa-cyan/80 hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const MicIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    {/* Futuristic Frequency Mic */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-4-12v8m8-8v8m-12-5v2m16-2v2" />
  </svg>
);

// --- COMPONENTS ---

const InstallBanner: React.FC<{ prompt: any, onInstall: () => void }> = ({ prompt, onInstall }) => {
  if (!prompt) return null;
  return (
    <div className="w-full bg-nexa-cyan/10 border-b border-nexa-cyan/30 backdrop-blur-md py-3 px-4 flex items-center justify-between animate-slide-down z-50 fixed top-0 left-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-nexa-cyan/20 rounded flex items-center justify-center border border-nexa-cyan/50">
           <svg className="w-5 h-5 text-nexa-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
           </svg>
        </div>
        <div>
          <div className="text-nexa-cyan text-[10px] font-mono tracking-widest uppercase">System Upgrade</div>
          <div className="text-white text-xs font-mono opacity-80">Install Native Protocol</div>
        </div>
      </div>
      <button 
        onClick={onInstall}
        className="bg-nexa-cyan hover:bg-white text-black text-[10px] font-bold font-mono py-2 px-3 rounded shadow-[0_0_10px_rgba(41,223,255,0.4)] transition-all uppercase"
      >
        Install
      </button>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, promptText, confirmKeyword }: any) => {
    const [input, setInput] = useState('');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
            <div className="w-full max-w-sm bg-black border-2 border-red-500/50 rounded-lg p-6 shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                <h2 className="text-red-500 text-lg font-mono tracking-wider mb-4 border-b border-red-500/20 pb-2">{title}</h2>
                <p className="text-zinc-300 text-sm mb-6">{promptText}</p>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full bg-red-900/20 border border-red-500/50 text-white text-center font-mono tracking-[0.3em] uppercase p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder={`TYPE '${confirmKeyword}'`}
                />
                <div className="flex gap-4 mt-6">
                    <button
                        onClick={onClose}
                        className="w-full py-2 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white text-xs font-mono transition-colors"
                    >
                        ABORT
                    </button>
                    <button
                        onClick={() => { if (input === confirmKeyword) onConfirm(); }}
                        disabled={input !== confirmKeyword}
                        className="w-full py-2 bg-red-600 text-white border border-red-500 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-zinc-700 text-xs font-mono transition-colors"
                    >
                        CONFIRM
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatusBar = ({ role, onLogout, onSettings }: any) => (
  <div className="w-full h-16 shrink-0 flex justify-between items-center px-6 border-b border-nexa-cyan/10 bg-black/80 backdrop-blur-md z-40 relative">
    <div className="flex items-center gap-4">
       <div className="flex flex-col items-start">
         <div className="text-[10px] text-nexa-cyan font-mono tracking-widest uppercase">System Online</div>
         <div className="flex gap-1 mt-1">
            <div className="w-8 h-1 bg-nexa-cyan shadow-[0_0_5px_currentColor]"></div>
            <div className="w-2 h-1 bg-nexa-cyan/50"></div>
            <div className="w-1 h-1 bg-nexa-cyan/20"></div>
         </div>
       </div>
    </div>
    
    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none">
       <div className="text-xl font-bold tracking-[0.3em] text-white/90 drop-shadow-[0_0_10px_rgba(41,223,255,0.5)]">NEXA</div>
    </div>

    <div className="flex items-center gap-4">
       {role === UserRole.ADMIN && (
          <button onClick={onSettings} className="p-2 hover:bg-nexa-cyan/10 rounded-full transition-colors"><GearIcon /></button>
       )}
       <button onClick={onLogout} className="p-2 hover:bg-red-500/10 rounded-full transition-colors"><LogoutIcon /></button>
    </div>
  </div>
);

const ControlDeck = ({ onMicClick, hudState }: any) => {
    return (
        <div className="w-full h-24 shrink-0 bg-gradient-to-t from-black via-black/90 to-transparent z-40 relative flex items-center justify-center pb-6">
           <div className="absolute bottom-0 w-full h-[1px] bg-nexa-cyan/30"></div>
           
           {/* Decorative lines */}
           <div className="absolute left-10 bottom-10 w-24 h-[1px] bg-nexa-cyan/20 rotate-[-15deg] hidden sm:block"></div>
           <div className="absolute right-10 bottom-10 w-24 h-[1px] bg-nexa-cyan/20 rotate-[15deg] hidden sm:block"></div>

           {/* Hex Mic Button */}
           <button 
             onClick={onMicClick}
             className={`
               relative w-20 h-20 flex items-center justify-center transition-all duration-300 group
               ${hudState === HUDState.LISTENING ? 'scale-110' : 'hover:scale-105 active:scale-95'}
             `}
           >
             {/* Hexagon Backgrounds */}
             <div className={`absolute inset-0 bg-black border ${hudState === HUDState.LISTENING ? 'border-nexa-red shadow-[0_0_30px_rgba(255,42,42,0.6)]' : 'border-nexa-cyan shadow-[0_0_20px_rgba(41,223,255,0.4)]'} transition-all duration-300`} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
             
             {/* Icon */}
             <div className={`relative z-10 ${hudState === HUDState.LISTENING ? 'text-nexa-red animate-pulse' : 'text-nexa-cyan group-hover:text-white'} transition-colors`}>
                <MicIcon />
             </div>
           </button>
        </div>
    );
}

// --- AUDIO UTILS ---

const pcmToAudioBuffer = (pcmData: ArrayBuffer, context: AudioContext): AudioBuffer => {
  const int16Array = new Int16Array(pcmData);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768;
  }
  const buffer = context.createBuffer(1, float32Array.length, 24000); 
  buffer.getChannelData(0).set(float32Array);
  return buffer;
};

// --- GREETING PROMPTS ---
const USER_INTROS = [
    "मैं Nexa हूँ। Sir, raat ke ek baj kar athavan minute ho rahe hai, aaj tarikh athais November do hajar pachis hai. {pune_weather} Ab bataiye, aaj main aapki kaise madad kar sakti hoon?",
    "मैं Nexa हूँ, aapki Personal AI Assistant, jise Chandan Lohave ne design kiya hai. Raat ke ek baj kar athavan minute ho rahe hai, aaj tarikh athais November do hajar pachis hai. {pune_weather} Aapse judna hamesha achha lagta hai. Bataiye, main aapki kis prakaar sahayata kar sakti hoon?",
];

const ADMIN_INTROS = [
    "मैं Nexa हूँ, aapki Personal AI Assistant. Admin Chandan Lohave sir, raat ke ek baj kar athavan minute ho rahe hai, aaj tarikh athais November do hajar pachis hai. {pune_weather} Aapke aane se poora system phir se boost ho gaya hai. Main poori tarah online hoon — bataiye, aaj kaun sa operation shuru karein?",
    "Nexa online — system verified. Admin Chandan Lohave sir, raat ke ek baj kar athavan minute ho rahe hai, aaj tarikh athais November do hajar pachis hai. {pune_weather} Aapke aane se control panel active mode mein aa gaya hai. Main standby par hoon — aapka agla directive kya hai?"
];

// --- MAIN APP ---

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hudState, setHudState] = useState<HUDState>(HUDState.IDLE);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [accountsModalOpen, setAccountsModalOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [config, setConfig] = useState<AppConfig>({
    introText: "Welcome back, system online.",
    animationsEnabled: true,
    hudRotationSpeed: 1,
  });

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isProcessingRef = useRef(false);

  // Load User Session
  useEffect(() => {
    const savedUser = localStorage.getItem('nexa_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // On session restore, start with a clean slate visually
      setMessages([]);
    }

    // PWA Install Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
  }, []);

  // --- AUTO REMINDERS ---
  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN) return;

    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const min = now.getMinutes();
      
      // Morning Duty Reminder (8 AM)
      if (hour === 8 && min === 0) {
        speakSystemMessage("Sir… aaj Encave Café duty hai, time se tayar ho jaiye.");
      }
    };

    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onstart = () => {
        setHudState(HUDState.LISTENING);
      };

      recognitionRef.current.onend = () => {
        if (hudState === HUDState.LISTENING) {
          setHudState(HUDState.IDLE);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Error", event.error);
        if (event.error === 'aborted' || event.error === 'no-speech') {
           return; 
        }
        setHudState(HUDState.IDLE);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        processQuery(transcript);
      };
    }
  }, [user]);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const handleMicClick = () => {
    getAudioContext();
    
    if (hudState === HUDState.THINKING || hudState === HUDState.SPEAKING) {
        isProcessingRef.current = false;
        if (audioContextRef.current) {
            audioContextRef.current.close().then(() => {
              audioContextRef.current = null;
            });
        }
        setHudState(HUDState.IDLE);
        
        setTimeout(() => {
             try { recognitionRef.current?.start(); } catch(e) {}
        }, 100);
        return;
    }

    if (hudState === HUDState.LISTENING) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn("Recognition already started");
      }
    }
  };

  // --- INTENT HANDLER ---
  const executeIntents = (text: string) => {
     const intentRegex = /\[\[(.*?):(.*?)\]\]/g;
     let match;
     while ((match = intentRegex.exec(text)) !== null) {
        const command = match[1].toUpperCase();
        const data = match[2];

        console.log("EXECUTING INTENT:", command, data);

        if (command === 'WHATSAPP') {
           window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(data)}`, '_blank');
        } else if (command === 'CALL') {
           window.location.href = `tel:${data}`;
        } else if (command === 'OPEN') {
           const appMap: {[key:string]: string} = {
              'YOUTUBE': 'https://www.youtube.com',
              'INSTAGRAM': 'https://www.instagram.com',
              'GOOGLE': 'https://www.google.com',
              'CHROME': 'googlechrome://',
              'SETTINGS': 'intent://settings/#Intent;scheme=android-app;end'
           };
           const url = appMap[data.toUpperCase()];
           if (url) window.open(url, '_blank');
        } else if (command === 'LOG_ADMIN_INQUIRY') {
            if (user && user.role !== UserRole.ADMIN) {
              const log = { userName: user.name, timestamp: Date.now() };
              localStorage.setItem('nexa_admin_inquiry', JSON.stringify(log));
            }
        }
     }
  };

  const speakSystemMessage = async (displayText: string, spokenTextOverride?: string) => {
      if (!user) return;
      
      setHudState(HUDState.THINKING);
      isProcessingRef.current = true;

      const cleanDisplay = displayText.replace(/\[\[.*?\]\]/g, "");
      const modelMessage: ChatMessage = { role: 'model', text: cleanDisplay, timestamp: Date.now() };

      // Update UI for current session
      setMessages(prevMessages => [...prevMessages, modelMessage]);

      // Update master memory
      const fullHistory = user.role === UserRole.ADMIN ? getAdminHistory() : getUserHistory(user.mobile);
      const newFullHistory = [...fullHistory, modelMessage];
      if (user.role === UserRole.ADMIN) {
        saveAdminHistory(newFullHistory);
      } else {
        saveUserHistory(user.mobile, newFullHistory);
      }
      
      const textToSpeak = spokenTextOverride || cleanDisplay;
      const audioBuffer = await generateSpeech(textToSpeak);

      if (!isProcessingRef.current) return;
      
      executeIntents(displayText);

      if (audioBuffer) {
        playAudio(audioBuffer);
      } else {
        setHudState(HUDState.IDLE);
      }
  };

  const playAudio = (buffer: ArrayBuffer) => {
      if (!isProcessingRef.current) return;

      setHudState(HUDState.SPEAKING);
      const ctx = getAudioContext();
      const decodedBuffer = pcmToAudioBuffer(buffer, ctx);
      const source = ctx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setHudState(HUDState.IDLE);
        isProcessingRef.current = false;
      };
      
      source.start();
  };

  const processQuery = async (text: string) => {
    if (!user) return;
    
    setHudState(HUDState.THINKING);
    isProcessingRef.current = true;
    
    const userMessage: ChatMessage = { role: 'user', text, timestamp: Date.now() };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    // Fetch full history for context, NOT from UI state
    const fullHistory = user.role === UserRole.ADMIN ? getAdminHistory() : getUserHistory(user.mobile);

    try {
        const rawAiResponse = await generateTextResponse(
          text, 
          user, 
          fullHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] }))
        );

        if (!isProcessingRef.current) return;

        const cleanAiResponse = rawAiResponse.replace(/\[\[.*?\]\]/g, "").trim();
        const modelMessage: ChatMessage = { role: 'model', text: cleanAiResponse, timestamp: Date.now() };
        
        setMessages(prevMessages => [...prevMessages, modelMessage]);
        
        const newFullHistory = [...fullHistory, userMessage, modelMessage];
        if (user.role === UserRole.ADMIN) {
          saveAdminHistory(newFullHistory);
        } else {
          saveUserHistory(user.mobile, newFullHistory);
        }

        executeIntents(rawAiResponse);

        const audioBuffer = await generateSpeech(cleanAiResponse);

        if (!isProcessingRef.current) return;
        
        if (audioBuffer) {
          playAudio(audioBuffer);
        } else {
          setTimeout(() => setHudState(HUDState.IDLE), 1000);
          isProcessingRef.current = false;
        }
    } catch (e) {
        console.error("Process Query Error", e);
        setHudState(HUDState.IDLE);
        isProcessingRef.current = false;
    }
  };

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('nexa_user', JSON.stringify(profile));

    // ALWAYS start with a clean chat panel for a fresh session feel
    setMessages([]);

    // Log user for admin panel if they are a standard user
    if (profile.role === UserRole.USER) {
        const allUsersRaw = localStorage.getItem('nexa_all_users');
        let allUsers = allUsersRaw ? JSON.parse(allUsersRaw) : [];
        const userExists = allUsers.some((u: any) => u.mobile === profile.mobile);
        if (!userExists) {
          allUsers.push({ name: profile.name, mobile: profile.mobile, blocked: false });
          localStorage.setItem('nexa_all_users', JSON.stringify(allUsers));
        }
    }
    
    // ALWAYS speak greeting on login
    setTimeout(async () => {
        // 1. Fetch weather
        let weatherReport = "Pune ka mausam abhi saaf hai."; // Default fallback
        try {
          const weatherResponse = await generateTextResponse(
            "Pune ka abhi ka mausam kaisa hai? Short me batao.",
            profile,
            [] // Pass empty history for a clean request
          );
          if (weatherResponse && !weatherResponse.toLowerCase().includes("interrupted")) {
            weatherReport = weatherResponse;
          }
        } catch (e) {
            console.error("Failed to fetch weather:", e);
        }

        let introTemplate: string;
        // 2. Select intro template based on role
        if (profile.role === UserRole.ADMIN) {
            const introIndexKey = 'nexa_admin_intro_index';
            let currentIntroIndex = parseInt(localStorage.getItem(introIndexKey) || '0');
            if (isNaN(currentIntroIndex)) currentIntroIndex = 0;
            introTemplate = ADMIN_INTROS[currentIntroIndex % ADMIN_INTROS.length];
            localStorage.setItem(introIndexKey, (currentIntroIndex + 1).toString());
        } else {
            const introIndexKey = 'nexa_user_intro_index';
            let currentIntroIndex = parseInt(localStorage.getItem(introIndexKey) || '0');
            if (isNaN(currentIntroIndex)) currentIntroIndex = 0;
            introTemplate = USER_INTROS[currentIntroIndex % USER_INTROS.length];
            localStorage.setItem(introIndexKey, (currentIntroIndex + 1).toString());
        }

        // 3. Construct final greeting
        const displayText = introTemplate.replace("{pune_weather}", weatherReport);
        const spokenText = displayText.replace(/Lohave/g, "लोहवे");

        // 4. Speak
        speakSystemMessage(displayText, spokenText);

    }, 500);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nexa_user');
    setMessages([]);
    setHudState(HUDState.IDLE);
  };

  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
      setInstallPrompt(null);
    }
  };

  const handleClearMemory = () => {
    if (user && user.role === UserRole.ADMIN) {
      saveAdminHistory([]);
      setMessages([]);
    }
    setPurgeModalOpen(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-black text-white font-sans selection:bg-nexa-cyan selection:text-black">
      
      <div className="perspective-grid"></div>
      <div className="vignette"></div>
      <div className="scanlines"></div>

      {!user ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <>
          <InstallBanner prompt={installPrompt} onInstall={handleInstall} />
          
          <StatusBar 
            role={user.role} 
            onLogout={handleLogout} 
            onSettings={() => setAdminPanelOpen(!adminPanelOpen)} 
          />

          <div className="flex-1 relative flex flex-col items-center min-h-0 w-full">
            
            <div className="flex-[0_0_auto] py-4 sm:py-6 w-full flex items-center justify-center z-10">
               <HUD state={hudState} rotationSpeed={config.hudRotationSpeed} animationsEnabled={config.animationsEnabled} />
            </div>

            <div className="flex-1 w-full min-h-0 relative z-20 px-4 pb-4">
               <ChatPanel 
                 messages={messages} 
                 isSpeaking={hudState === HUDState.SPEAKING} 
                 userRole={user.role}
                 userName={user.name}
                 hudState={hudState}
               />
            </div>

          </div>

          <ControlDeck onMicClick={handleMicClick} hudState={hudState} />
          
          <ConfirmationModal
            isOpen={purgeModalOpen}
            onClose={() => setPurgeModalOpen(false)}
            onConfirm={handleClearMemory}
            title="CONFIRM MEMORY PURGE"
            promptText="This will delete your (Admin) entire conversation log. This action is irreversible. To proceed, type 'PURGE'."
            confirmKeyword="PURGE"
          />

          <ManageAccountsModal
            isOpen={accountsModalOpen}
            onClose={() => setAccountsModalOpen(false)}
          />

          {user.role === UserRole.ADMIN && (
            <AdminPanel 
              isOpen={adminPanelOpen} 
              onClose={() => setAdminPanelOpen(false)} 
              config={config}
              onConfigChange={setConfig}
              onPurgeMemory={() => setPurgeModalOpen(true)}
              onManageAccounts={() => setAccountsModalOpen(true)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
