import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, UserRole } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  isSpeaking: boolean;
  userRole?: UserRole;
}

const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    let index = 0;
    // Faster typewriter effect for long Hindi messages
    const speed = 15; 

    const intervalId = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text]);

  return <span>{displayedText}</span>;
};

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, isSpeaking, userRole = UserRole.USER }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSpeaking]); // Auto-scroll when speaking state changes (typewriter starts)

  if (messages.length === 0) return null;

  return (
    <div 
      ref={scrollRef}
      className="w-full max-w-2xl h-full overflow-y-auto px-6 py-4 space-y-6 scroll-smooth no-scrollbar mask-fade-top"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`
        .mask-fade-top {
          mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 100%);
        }
      `}</style>
      
      {messages.map((msg, idx) => {
        const isUser = msg.role === 'user';
        const isLastModelMessage = !isUser && idx === messages.length - 1;

        // Determine Labels
        let label = 'NEXA';
        if (isUser) {
          label = userRole === UserRole.ADMIN ? 'ADMIN' : 'USER';
        }

        return (
          <div 
            key={idx} 
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div 
              className={`
                relative max-w-[85%] px-4 py-2 font-mono text-sm leading-relaxed backdrop-blur-sm
                ${isUser 
                  ? 'text-right' 
                  : 'text-left'
                }
              `}
            >
              {/* Message Decoration Line */}
              <div className={`absolute top-0 w-full h-[1px] opacity-20 ${isUser ? 'right-0 bg-gradient-to-l from-nexa-blue to-transparent' : 'left-0 bg-gradient-to-r from-nexa-cyan to-transparent'}`}></div>

              <div className={`${isUser ? 'text-nexa-blue drop-shadow-[0_0_5px_rgba(0,119,255,0.5)]' : 'text-nexa-cyan drop-shadow-[0_0_5px_rgba(41,223,255,0.5)]'}`}>
                {isUser ? (
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                ) : (
                  <>
                    {/* Only show typewriter on the very last message if NEXA is currently speaking/processing */}
                    {isLastModelMessage && isSpeaking ? (
                      <TypewriterText text={msg.text} />
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.text}</span>
                    )}
                  </>
                )}
              </div>
              
              {/* Role Label */}
              <div className={`text-[9px] uppercase tracking-widest mt-1 opacity-40 ${isUser ? 'text-nexa-blue' : 'text-nexa-cyan'}`}>
                 {label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatPanel;