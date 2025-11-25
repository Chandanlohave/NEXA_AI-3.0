import React, { useState, useEffect, useRef } from 'react';
import Auth from './components/Auth';
import HUD from './components/HUD';
import ChatPanel from './components/ChatPanel';
import AdminPanel from './components/AdminPanel';
import { UserProfile, UserRole, HUDState, ChatMessage, AppConfig } from './types';
import { generateTextResponse, generateSpeech } from './services/geminiService';

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
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
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
       <button onClick={onSettings} className="p-2 hover:bg-nexa-cyan/10 rounded-full transition-colors"><GearIcon /></button>
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

// --- MAIN APP ---

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hudState, setHudState] = useState<HUDState>(HUDState.IDLE);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [config, setConfig] = useState<AppConfig>({
    introText: "Welcome back, system online.",
    animationsEnabled: true,
    hudRotationSpeed: 1,
  });

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load User Session
  useEffect(() => {
    const savedUser = localStorage.getItem('nexa_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // PWA Install Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
  }, []);

  // --- AUTO REMINDERS (11 PM DUTY) ---
  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN) return;

    const checkTime = () => {
      const now = new Date();
      // Check if it's exactly 11:00 PM (23:00)
      if (now.getHours() === 23 && now.getMinutes() === 0) {
        const reminderText = "Sir… 11 baj chuke hain. Kal aapko Encave Cafe duty bhi karni hai. Please rest kar lijiye… main yahin hoon.";
        speakSystemMessage(reminderText);
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
      recognitionRef.current.lang = 'en-IN'; // Default to Hinglish/Indian English

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
           // Ignore benign errors
           return; 
        }
        setHudState(HUDState.IDLE);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        processQuery(transcript);
      };
    }
  }, [user, messages]); // Dependencies for processQuery access

  // Lazy Audio Context
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
    getAudioContext(); // Wake up audio context
    if (hudState === HUDState.LISTENING) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        // Handle case where it's already started
        console.warn("Recognition already started");
      }
    }
  };

  // Modified to accept optional spoken text override (for pronunciation)
  const speakSystemMessage = async (displayText: string, spokenTextOverride?: string) => {
      // Add to chat (Display Text)
      setMessages(prev => [...prev, { role: 'model', text: displayText, timestamp: Date.now() }]);
      
      // Speak (Spoken Text)
      const textToSpeak = spokenTextOverride || displayText;
      const audioBuffer = await generateSpeech(textToSpeak);
      if (audioBuffer) {
        playAudio(audioBuffer);
      }
  };

  const playAudio = (buffer: ArrayBuffer) => {
      setHudState(HUDState.SPEAKING);
      const ctx = getAudioContext();
      const decodedBuffer = pcmToAudioBuffer(buffer, ctx);
      const source = ctx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setHudState(HUDState.IDLE);
      };
      
      source.start();
  };

  const processQuery = async (text: string) => {
    if (!user) return;
    
    setHudState(HUDState.THINKING);
    
    // 1. Update Chat (User)
    const newHistory: ChatMessage[] = [...messages, { role: 'user', text, timestamp: Date.now() }];
    setMessages(newHistory);

    // 2. Get AI Response
    const aiResponseText = await generateTextResponse(
      text, 
      user, 
      newHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] }))
    );

    // 3. Update Chat (AI)
    setMessages(prev => [...prev, { role: 'model', text: aiResponseText, timestamp: Date.now() }]);

    // 4. TTS
    const audioBuffer = await generateSpeech(aiResponseText);
    
    if (audioBuffer) {
      playAudio(audioBuffer);
    } else {
      setTimeout(() => setHudState(HUDState.IDLE), 3000);
    }
  };

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('nexa_user', JSON.stringify(profile));
    
    // Greeting with specific Hindi prompt
    setTimeout(() => {
       const hour = new Date().getHours();
       let timeGreeting = "Morning";
       if (hour >= 12 && hour < 17) timeGreeting = "Afternoon";
       if (hour >= 17) timeGreeting = "Evening";

       // Construct text for display
       const displayText = `मैं Nexa हूँ — आपकी Personal AI Assistant, जिसे Chandan Lohave ने design किया है.\nGood ${timeGreeting}!\nलगता है आज आपका mood मेरे जैसा perfect है.\nबताइए Chandan sir, मैं आपकी किस प्रकार सहायता कर सकती हूँ?`;
       
       // Construct text for speech (Phonetic fix for Lohave -> लोहवे)
       const spokenText = displayText.replace("Lohave", "लोहवे");

       speakSystemMessage(displayText, spokenText);
    }, 1000);
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

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-black text-white font-sans selection:bg-nexa-cyan selection:text-black">
      
      {/* GLOBAL BACKGROUND LAYERS */}
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
            onSettings={() => setAdminPanelOpen(true)} 
          />

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 relative flex flex-col items-center min-h-0 w-full">
            
            {/* 1. HUD Area - Flexible height */}
            <div className="flex-[0_0_auto] py-4 sm:py-8 w-full flex items-center justify-center z-10">
               <HUD state={hudState} rotationSpeed={config.hudRotationSpeed} />
            </div>

            {/* 2. Chat Area - Takes remaining space, scrolls */}
            <div className="flex-1 w-full min-h-0 relative z-20">
               <ChatPanel 
                 messages={messages} 
                 isSpeaking={hudState === HUDState.SPEAKING} 
                 userRole={user.role}
               />
            </div>

          </div>

          {/* CONTROL DECK (Fixed Bottom) */}
          <ControlDeck onMicClick={handleMicClick} hudState={hudState} />

          {/* ADMIN PANEL */}
          {user.role === UserRole.ADMIN && (
            <AdminPanel 
              isOpen={adminPanelOpen} 
              onClose={() => setAdminPanelOpen(false)} 
              config={config}
              onConfigChange={setConfig}
              onClearMemory={() => setMessages([])}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;