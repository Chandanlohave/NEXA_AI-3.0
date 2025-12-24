
import React, { useEffect, useState } from 'react';

interface ChatBubbleProps {
  text: string;
  isVisible: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ text, isVisible }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  useEffect(() => {
    if (!isVisible) {
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    
    // Slower speed to better match spoken audio
    const speed = 80; 

    const intervalId = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(intervalId);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, isVisible]);

  return (
    <div className={`w-[85%] mx-auto p-4 bg-black/60 border border-nexa-cyan/50 rounded-lg backdrop-blur-sm shadow-[0_0_15px_rgba(41,223,255,0.2)] transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <p className="font-mono text-nexa-cyan text-lg leading-relaxed shadow-black drop-shadow-md">
        {displayedText}
        {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-nexa-cyan animate-blink align-middle"></span>}
      </p>
    </div>
  );
};

export default ChatBubble;
