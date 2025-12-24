
import React, { useState, useEffect, useRef } from 'react';
import { LiveServerMessage } from '@google/genai';
import Auth from './components/Auth';
import HUD from './components/HUD';
import ChatPanel from './components/ChatPanel';
import AdminPanel from './components/AdminPanel';
import ManageAccountsModal from './components/ManageAccountsModal';
import { UserProfile, UserRole, HUDState, ChatMessage, AppConfig, StoredUser } from './types';
import { generateTextResponse, generateSpeech, ERROR_MESSAGES, LiveSessionManager, arrayBufferToBase64, base64ToUint8Array, float32ToInt16 } from './services/geminiService';
import { getAdminHistory, saveAdminHistory, getUserHistory, saveUserHistory } from './services/memoryService';
import { playReactorActiveSound, playReactorDeactiveSound, playSecurityAlertSound } from './services/soundService';

// --- ICONS ---

const LogoutIcon = () => (
  <svg className="w-5 h-5 text-nexa-cyan/80 hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const SettingsIcon = () => (
    <svg className="w-5 h-5 text-nexa-cyan/80 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
    
    useEffect(() => {
        if (isOpen) setInput('');
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
            <div className="w-full max-w-sm bg-black border-2 border-red-500/50 rounded-lg p-6 shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                <h2 className="text-red-500 text-lg font-mono tracking-wider mb-4 border-b border-red-500/20 pb-2">{title}</h2>
                <p className="text-zinc-300 text-sm mb-6">{promptText}</p>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value.toUpperCase())}
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

interface StatusBarProps {
    onLogout: () => void;
    isAdmin: boolean;
    onSettings?: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ onLogout, onSettings, isAdmin }) => (
  <div className="w-full h-12 shrink-0 flex justify-between items-center px-4 border-b border-nexa-cyan/20 bg-black/50 backdrop-blur-sm z-40 relative">
    <div className="flex items-center gap-2">
      <div className="text-[10px] text-nexa-cyan font-mono tracking-widest uppercase">System Online</div>
      <div className="flex gap-1 items-center">
        <div className="w-6 h-1 bg-nexa-cyan shadow-[0_0_5px_currentColor]"></div>
        <div className="w-2 h-1 bg-nexa-cyan/50"></div>
      </div>
    </div>
    
    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none">
       <div className="text-xl font-bold tracking-[0.4em] text-white/90 drop-shadow-[0_0_10px_rgba(41,223,255,0.5)]">NEXA</div>
    </div>

    <div className="flex items-center gap-2">
       {isAdmin && (
           <button onClick={onSettings} className="p-2 bg-zinc-900/50 hover:bg-nexa-cyan/20 rounded-full transition-colors border border-transparent hover:border-nexa-cyan/30">
               <SettingsIcon />
           </button>
       )}
       <button onClick={onLogout} className="p-2 hover:bg-red-500/10 rounded-full transition-colors group">
           <LogoutIcon />
       </button>
    </div>
  </div>
);

const ArcReactor = ({ state, config }: { state: HUDState; config: AppConfig }) => {
  const isSpeakingOrListening = state === HUDState.LISTENING || state === HUDState.SPEAKING;
  
  let coreColor = 'text-nexa-cyan';
  let glowColor = 'shadow-nexa-cyan';
  let borderColor = 'border-nexa-cyan';
  let bgColor = 'bg-nexa-cyan';
  
  if (state === HUDState.LISTENING) {
      coreColor = 'text-red-500';
      glowColor = 'shadow-red-500';
      borderColor = 'border-red-500';
      bgColor = 'bg-red-500';
  } else if (state === HUDState.THINKING) {
      coreColor = 'text-nexa-yellow';
      glowColor = 'shadow-nexa-yellow';
      borderColor = 'border-nexa-yellow';
      bgColor = 'bg-nexa-yellow';
  }

  return (
    // Outer Container scales but does NOT rotate
    <div 
        className={`relative w-16 h-16 flex items-center justify-center transition-all duration-300 ${isSpeakingOrListening ? 'scale-110' : 'scale-100'}`}
    >
        {/* Rotation Wrapper - FORCED ANIMATION VIA STYLE */}
        <div 
            className="absolute inset-0 w-full h-full" 
            style={{ 
                animation: config.micRotationEnabled ? `spin ${5 / config.micRotationSpeed}s linear infinite` : 'none' 
            }}
        >
             <div className="absolute inset-0 rounded-full border-[3px] border-zinc-800 bg-black shadow-[0_0_15px_rgba(0,0,0,0.8)] z-0"></div>
             <div className={`absolute inset-1 rounded-full border-2 ${borderColor} opacity-80 ${glowColor} shadow-[0_0_10px_currentColor] z-10 ${isSpeakingOrListening ? 'animate-pulse' : ''}`}></div>
        </div>

        {/* Core elements that don't rotate with the outer ring */}
        <div 
            className={`absolute inset-0 z-20`}
            style={config.micRotationEnabled ? { 
              animation: `spin-reverse ${state === HUDState.THINKING ? 1.5 / config.micRotationSpeed : 4 / config.micRotationSpeed}s linear infinite` 
            } : {}}
        >
             <svg viewBox="0 0 100 100" className={`w-full h-full ${coreColor}`}>
                {Array.from({ length: 10 }).map((_, i) => (
                    <rect 
                        key={i} 
                        x="46" 
                        y="6" 
                        width="8" 
                        height="14" 
                        rx="1"
                        transform={`rotate(${i * 36} 50 50)`} 
                        fill="currentColor"
                        className="drop-shadow-[0_0_2px_currentColor]"
                        opacity="0.9"
                    />
                ))}
                <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
             </svg>
        </div>
        <div className="absolute w-8 h-8 rounded-full bg-black border border-zinc-700 z-30 flex items-center justify-center">
            <div className={`w-4 h-4 rounded-full ${bgColor} ${glowColor} shadow-[0_0_15px_currentColor] animate-pulse`}></div>
            <div className="absolute w-full h-full rounded-full border border-white/20 opacity-50"></div>
        </div>
        <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-white/10 to-transparent opacity-40 z-40 pointer-events-none"></div>
    </div>
  );
};

const ControlDeck = ({ onMicClick, hudState, config }: any) => {
    return (
        <div 
          onClick={onMicClick}
          className="w-full h-24 shrink-0 bg-gradient-to-t from-black via-black/90 to-transparent z-40 relative flex items-center justify-center cursor-pointer group pb-4"
        >
           <div className="absolute bottom-1/2 left-0 w-[calc(50%-40px)] h-[1px] bg-gradient-to-r from-transparent via-nexa-cyan/20 to-nexa-cyan/50"></div>
           <div className="absolute bottom-1/2 right-0 w-[calc(50%-40px)] h-[1px] bg-gradient-to-l from-transparent via-nexa-cyan/20 to-nexa-cyan/50"></div>
           <ArcReactor state={hudState} config={config} />
        </div>
    );
}

// Helper to decode PCM for the playback queue
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

const App: React.FC = () => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [hudState, setHudState] = useState<HUDState>(HUDState.IDLE);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isRequestPending, setIsRequestPending] = useState(false);
    const [config, setConfig] = useState<AppConfig>({
        introText: "Welcome",
        animationsEnabled: true,
        hudRotationSpeed: 1,
        micRotationEnabled: true,
        micRotationSpeed: 1,
    });
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
    const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);

    // --- MEMORY BANK REFERENCE ---
    const memoryBankRef = useRef<ChatMessage[]>([]);

    // --- AUDIO & LIVE API REFERENCES ---
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null); // Separate context for mic input
    const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
    const nextStartTimeRef = useRef<number>(0);
    
    // Live Client Logic
    const liveClientRef = useRef<LiveSessionManager | null>(null);
    const isLiveConnectedRef = useRef(false);
    const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    // Transcription Buffers for Live API
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    
    const isMountedRef = useRef(true);
    const isProcessingRef = useRef(false);

    // Initial load check
    useEffect(() => {
        const storedUser = sessionStorage.getItem('nexa_user');
        if (storedUser) {
            handleLogin(JSON.parse(storedUser));
        }
    }, []);

    // Setup Audio
    useEffect(() => {
        isMountedRef.current = true;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        });

        // Initialize LiveClient wrapper
        liveClientRef.current = new LiveSessionManager(
            handleLiveMessage,
            handleLiveClose,
            handleLiveError
        );

        return () => {
            isMountedRef.current = false;
            stopLiveSession();
        };
    }, []);

    const handleInstall = () => {
        if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice.then(() => setInstallPrompt(null));
        }
    };

    const getLocation = (): Promise<{latitude: number, longitude: number} | null> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                console.warn("Geolocation is not supported by this browser.");
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.warn("Geolocation permission denied or error:", error.message);
                    resolve(null);
                },
                { timeout: 10000, maximumAge: 60000 }
            );
        });
    };
    
    // --- LIVE API HANDLERS ---

    const handleLiveMessage = async (message: LiveServerMessage) => {
        // 1. Handle Transcriptions
        if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
            currentOutputTranscriptionRef.current += text;
        } else if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            currentInputTranscriptionRef.current += text;
        }

        if (message.serverContent?.turnComplete) {
            // Commit transcripts to chat history
            const userText = currentInputTranscriptionRef.current.trim();
            const modelText = currentOutputTranscriptionRef.current.trim();

            if (userText && modelText) {
                const newHistory = [
                    ...chatHistory, 
                    { role: 'user' as const, text: userText, timestamp: Date.now() },
                    { role: 'model' as const, text: modelText, timestamp: Date.now() }
                ];
                setChatHistory(prev => [
                    ...prev, 
                    { role: 'user', text: userText, timestamp: Date.now() },
                    { role: 'model', text: modelText, timestamp: Date.now() }
                ]);

                // Save to memory
                if (userProfile?.role === UserRole.ADMIN) {
                    saveAdminHistory([...memoryBankRef.current, ...newHistory]);
                } else if (userProfile) {
                    saveUserHistory(userProfile.mobile, [...memoryBankRef.current, ...newHistory]);
                }
            }

            currentInputTranscriptionRef.current = '';
            currentOutputTranscriptionRef.current = '';
        }

        // 2. Handle Audio Output (Speaking)
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio) {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            }
            const ctx = audioContextRef.current;
            
            // Sync logic
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

            const audioBytes = base64ToUint8Array(base64Audio);
            const audioBuffer = await decodeAudioData(audioBytes, ctx);
            
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            
            setIsSpeaking(true);
            setHudState(HUDState.SPEAKING);

            source.onended = () => {
                // Approximate check if queue is empty (could be more robust)
                if (ctx.currentTime >= nextStartTimeRef.current - 0.1) {
                    setIsSpeaking(false);
                    if (isLiveConnectedRef.current) {
                        setHudState(HUDState.LISTENING);
                    } else {
                        setHudState(HUDState.IDLE);
                    }
                }
            };
        }

        // 3. Handle Interruption
        if (message.serverContent?.interrupted) {
             // Stop playback
             if (audioContextRef.current) {
                 audioContextRef.current.suspend().then(() => audioContextRef.current?.resume());
                 nextStartTimeRef.current = 0;
             }
             setIsSpeaking(false);
             currentOutputTranscriptionRef.current = ''; // Clear stale transcription
             setHudState(HUDState.LISTENING);
        }
    };

    const handleLiveClose = () => {
        isLiveConnectedRef.current = false;
        setHudState(HUDState.IDLE);
        playReactorDeactiveSound();
    };

    const handleLiveError = (err: any) => {
        console.error("Live Error", err);
        setHudState(HUDState.IDLE);
        isLiveConnectedRef.current = false;
        playSecurityAlertSound();
    };

    const startLiveSession = async () => {
        if (!userProfile || !liveClientRef.current) return;

        try {
            playReactorActiveSound();
            setHudState(HUDState.THINKING); // Brief transition
            
            // 1. Establish Gemini Connection
            await liveClientRef.current.connect(userProfile, location);
            isLiveConnectedRef.current = true;
            setHudState(HUDState.LISTENING);

            // 2. Setup Input Audio Stream (Mic -> Processor -> Gemini)
            if (!inputContextRef.current) {
                inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            }
            const ctx = inputContextRef.current;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000
            }});
            mediaStreamRef.current = stream;

            const source = ctx.createMediaStreamSource(stream);
            // 4096 buffer size for reasonable latency/performance balance
            const processor = ctx.createScriptProcessor(4096, 1, 1);
            inputProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
                if (!isLiveConnectedRef.current) return;

                const inputData = e.inputBuffer.getChannelData(0);
                // Downsample/Convert Float32 to Int16
                const int16Data = float32ToInt16(inputData);
                const base64Data = arrayBufferToBase64(int16Data.buffer);

                // Send chunk
                liveClientRef.current?.sendAudioChunk(base64Data);
            };

            source.connect(processor);
            processor.connect(ctx.destination);

        } catch (error) {
            console.error("Failed to start Live Session", error);
            setHudState(HUDState.IDLE);
            speakText("Unable to establish neural link.");
        }
    };

    const stopLiveSession = () => {
        if (liveClientRef.current) {
            liveClientRef.current.disconnect();
        }
        
        // Stop Mic Tracks
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        // Disconnect processor
        if (inputProcessorRef.current) {
            inputProcessorRef.current.disconnect();
            inputProcessorRef.current = null;
        }
        
        isLiveConnectedRef.current = false;
        setHudState(HUDState.IDLE);
    };


    const handleMicClick = () => {
        if (isLiveConnectedRef.current) {
            stopLiveSession();
        } else {
            startLiveSession();
        }
    };

    // --- LEGACY/TEXT LOGIN HANDLER ---

    const handleLogin = async (user: UserProfile) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        try {
            setIsRequestPending(true);
            setHudState(HUDState.THINKING);
            setUserProfile(user);
            sessionStorage.setItem('nexa_user', JSON.stringify(user));
    
            const storedHistory = user.role === UserRole.ADMIN
                ? getAdminHistory()
                : getUserHistory(user.mobile);
            
            memoryBankRef.current = storedHistory;
            setChatHistory([]); // Clear visual chat on reload
    
            if (user.role === UserRole.USER && storedHistory.length === 0) {
                const allUsersRaw = localStorage.getItem('nexa_all_users');
                let allUsers: StoredUser[] = allUsersRaw ? JSON.parse(allUsersRaw) : [];
                if (!allUsers.find(u => u.mobile === user.mobile)) {
                    allUsers.push({ name: user.name, mobile: user.mobile, blocked: false });
                    localStorage.setItem('nexa_all_users', JSON.stringify(allUsers));
                }
            }
            
            const userLocation = await getLocation();
            if (isMountedRef.current) {
                setLocation(userLocation);
            }
    
            const greetingPrompt = storedHistory.length > 0 ? "[RETURNING_GREETING]" : "[INITIAL_GREETING]";

            const greetingText = await generateTextResponse(
                greetingPrompt,
                user,
                [], 
                userLocation
            );
    
            // PRE-FETCH AUDIO (Legacy TTS)
            let audioBuffer = null;
            if (greetingText) {
                audioBuffer = await generateSpeech(greetingText);
            }

            if (greetingText && isMountedRef.current) {
                setIsSpeaking(true);
                setHudState(HUDState.SPEAKING);

                const greetingMessage: ChatMessage = { role: 'model', text: greetingText, timestamp: Date.now() };
                setChatHistory([greetingMessage]);
                
                if (audioBuffer) {
                    playAudio(audioBuffer);
                } else {
                    setTimeout(() => {
                         setIsSpeaking(false);
                         setHudState(HUDState.IDLE);
                    }, 3000);
                }

                // Save to history
                const fullHistory = [...memoryBankRef.current, greetingMessage];
                if (user.role === UserRole.ADMIN) {
                    saveAdminHistory(fullHistory);
                } else {
                    saveUserHistory(user.mobile, fullHistory);
                }
            } else if (isMountedRef.current) {
                const fallbackGreeting = "Systems online.";
                const fallbackMessage: ChatMessage = { role: 'model', text: fallbackGreeting, timestamp: Date.now() };
                setChatHistory([fallbackMessage]);
                setIsSpeaking(false);
                setHudState(HUDState.IDLE);
            }
            
            if(isMountedRef.current) {
                 setIsRequestPending(false);
            }

        } catch (error) {
            console.error("Login process failed:", error);
            if (isMountedRef.current) {
                setHudState(HUDState.IDLE);
                setIsRequestPending(false);
                isProcessingRef.current = false;
            }
        }
    };

    const handleLogout = () => {
        stopLiveSession();
        if (audioQueueRef.current.length > 0) {
            audioQueueRef.current.forEach(source => source.stop());
            audioQueueRef.current = [];
        }
        setIsSpeaking(false);
        setUserProfile(null);
        setChatHistory([]);
        memoryBankRef.current = [];
        setHudState(HUDState.IDLE);
        sessionStorage.removeItem('nexa_user');
    };

    const handlePurgeMemory = () => {
        setIsPurgeModalOpen(false);
        localStorage.removeItem('nexa_all_users');
        localStorage.removeItem('nexa_memory_user_logs');
        localStorage.removeItem('nexa_memory_admin_log');
        if (userProfile?.role === UserRole.ADMIN) {
            setChatHistory([]);
            memoryBankRef.current = [];
            saveAdminHistory([]);
        }
        alert('All user data and memory logs have been purged.');
    };

    const playAudio = async (buffer: ArrayBuffer) => {
        if (!audioContextRef.current) {
             audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        }
        const ctx = audioContextRef.current;

        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
        
        try {
            // Manual decoding of raw PCM data
            // Create Uint8Array view of the ArrayBuffer for the helper
            const uint8Data = new Uint8Array(buffer);
            const decoded = await decodeAudioData(uint8Data, ctx, 24000);

            const source = ctx.createBufferSource();
            source.buffer = decoded;
            source.connect(ctx.destination);
            source.onended = () => {
               if (!isMountedRef.current) return;
               setIsSpeaking(false);
               setHudState(HUDState.IDLE);
               setIsRequestPending(false);
               isProcessingRef.current = false;
            };
            source.start();
        } catch (e) {
            console.error("Audio playback error:", e);
            // Fallback or cleanup
            setIsSpeaking(false);
            setHudState(HUDState.IDLE);
            setIsRequestPending(false);
            isProcessingRef.current = false;
        }
    };

    // Legacy speakText (for System Alerts)
    const speakText = async (text: string) => {
        if (isLiveConnectedRef.current) stopLiveSession(); // Priority override
        setHudState(HUDState.IDLE);

        if (!text) return;

        if (Object.values(ERROR_MESSAGES).includes(text)) {
             if (isMountedRef.current) {
                 playSecurityAlertSound();
                 setIsSpeaking(false);
                 setHudState(HUDState.IDLE);
             }
             return;
        }

        const audioBuffer = await generateSpeech(text);
        if (audioBuffer && isMountedRef.current) {
            setIsSpeaking(true);
            setHudState(HUDState.SPEAKING);
            playAudio(audioBuffer);
        }
    };

    if (!userProfile) {
        return <Auth onLogin={handleLogin} />;
    }

    return (
        <div className="h-[100dvh] w-screen bg-black font-sans flex flex-col items-center overflow-hidden relative">
            <div className="perspective-grid"></div>
            <div className="vignette"></div>
            <div className="scanlines"></div>

            <ConfirmationModal
                isOpen={isPurgeModalOpen}
                onClose={() => setIsPurgeModalOpen(false)}
                onConfirm={handlePurgeMemory}
                title="!!! MEMORY PURGE WARNING !!!"
                promptText="This is an irreversible action. ALL user accounts will be permanently deleted."
                confirmKeyword="PURGE"
            />
            {userProfile.role === UserRole.ADMIN && (
                <>
                    <AdminPanel
                        isOpen={isAdminPanelOpen}
                        onClose={() => setIsAdminPanelOpen(false)}
                        config={config}
                        onConfigChange={setConfig}
                        onPurgeMemory={() => setIsPurgeModalOpen(true)}
                        onManageAccounts={() => { setIsAdminPanelOpen(false); setIsAccountsModalOpen(true); }}
                    />
                    <ManageAccountsModal isOpen={isAccountsModalOpen} onClose={() => setIsAccountsModalOpen(false)} />
                </>
            )}

            <InstallBanner prompt={installPrompt} onInstall={handleInstall} />

            <div className={`w-full h-full flex flex-col items-center transition-all duration-500 ${installPrompt ? 'pt-16' : ''}`}>
                <StatusBar
                    onLogout={handleLogout}
                    onSettings={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
                    isAdmin={userProfile.role === UserRole.ADMIN}
                />

                <main className="flex-1 flex flex-col w-full relative px-4 pb-4 pt-2 overflow-hidden">
                    <div className="h-[32%] min-h-[220px] w-full shrink-0 flex items-center justify-center relative z-20">
                        <HUD 
                            state={hudState} 
                            rotationSpeed={config.hudRotationSpeed}
                            animationsEnabled={config.animationsEnabled}
                        />
                    </div>
                    
                    <div className="flex-1 w-full relative z-20 min-h-0 flex flex-col pb-4">
                        <ChatPanel
                            messages={chatHistory}
                            isSpeaking={isSpeaking}
                            userRole={userProfile.role}
                            userName={userProfile.name}
                            hudState={hudState}
                        />
                    </div>
                </main>

                <ControlDeck onMicClick={handleMicClick} hudState={hudState} config={config} />
            </div>
        </div>
    );
};

export default App;
