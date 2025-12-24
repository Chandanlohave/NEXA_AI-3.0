
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, UserRole, HUDState } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  isSpeaking: boolean;
  userRole?: UserRole;
  userName?: string;
  hudState?: HUDState;
}

interface TypewriterProps {
  text: string;
  onTyping: () => void;
}

const TypewriterText: React.FC<TypewriterProps> = ({ text, onTyping }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    const speed = 40; // Slightly faster for snappier feel

    const intervalId = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
        onTyping();
      } else {
        clearInterval(intervalId);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, onTyping]);

  // Simplified structure to prevent layout issues with absolute positioning.
  // The container will now grow naturally with the text content.
  return (
    <span className="whitespace-pre-wrap break-words">
      {displayedText}
      {isTyping && <span className="inline-block w-2 h-4 bg-nexa-cyan animate-blink align-middle ml-1"></span>}
    </span>
  );
};

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, isSpeaking, userRole = UserRole.USER, userName, hudState }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      // Use 'auto' behavior for immediate scrolling to prevent animation issues
      scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'auto'
      });
    }
  };

  // Scroll immediately when a new message block is added
  useEffect(() => {
    // Small timeout to allow DOM to render
    setTimeout(scrollToBottom, 50);
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="w-full max-w-3xl h-full flex flex-col bg-black/40 border-t border-x border-nexa-cyan/20 rounded-t-lg backdrop-blur-md overflow-hidden relative">
      
      {/* Terminal Header */}
      <div className="w-full h-6 bg-nexa-cyan/5 border-b border-nexa-cyan/20 flex items-center justify-between px-3 shrink-0">
         <div className="text-[9px] text-nexa-cyan/70 font-mono tracking-widest uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-nexa-cyan/70 rounded-full animate-pulse"></span>
            /// CONVERSATION_LOG ///
         </div>
         <div className="text-[8px] text-nexa-cyan/30 font-mono">LIVE_FEED</div>
      </div>

      {/* Message List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isLastModelMessage = !isUser && idx === messages.length - 1;

          let label = 'NEXA';
          if (isUser) {
            label = userRole === UserRole.ADMIN ? 'ADMIN' : (userName || 'USER').toUpperCase();
          }

          return (
            <div 
              key={idx} 
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div 
                className={`
                  relative max-w-[90%] px-3 py-2 font-mono text-sm leading-relaxed
                  break-words
                  ${isUser 
                    ? 'text-right border-r border-nexa-blue/30 bg-gradient-to-l from-nexa-blue/5 to-transparent' 
                    : 'text-left border-l border-nexa-cyan/30 bg-gradient-to-r from-nexa-cyan/5 to-transparent'
                  }
                `}
              >
                <div className={`${isUser ? 'text-nexa-blue' : 'text-nexa-cyan'} w-full`}>
                  {isUser ? (
                    <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                  ) : (
                    <>
                      {isLastModelMessage && hudState === HUDState.THINKING ? (
                        <div className="font-mono text-sm text-nexa-yellow/80 animate-pulse tracking-widest">THINKING...</div>
                      ) : isLastModelMessage && isSpeaking ? (
                        <TypewriterText text={msg.text} onTyping={scrollToBottom} />
                      ) : (
                        <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                      )}
                    </>
                  )}
                </div>
                
                {/* Role Label */}
                <div className={`text-[8px] uppercase tracking-widest mt-1 opacity-50 ${isUser ? 'text-nexa-blue' : 'text-nexa-cyan'}`}>
                   [{label}] {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Extra spacer at bottom to prevent clipping by browser bars */}
        <div className="h-16 w-full shrink-0"></div>
      </div>
    </div>
  );
};

export default ChatPanel;
