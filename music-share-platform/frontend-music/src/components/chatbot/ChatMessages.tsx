import { useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../../types/chatbot';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';

interface ChatMessagesProps {
  messages: ChatMessageType[];
  isTyping: boolean;
}

export const ChatMessages = ({ messages, isTyping }: ChatMessagesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      style={{ scrollBehavior: 'smooth' }}
    >
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {isTyping && <TypingIndicator />}
    </div>
  );
};
