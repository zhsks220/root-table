import { useChatbot } from '../../hooks/useChatbot';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatProgress } from './ChatProgress';
import { ChatOptions } from './ChatOptions';
import { ChatTextInput } from './ChatTextInput';
import { ChatContactForm } from './ChatContactForm';
import { ChatSummary } from './ChatSummary';

interface ChatWindowProps {
  onClose: () => void;
}

export const ChatWindow = ({ onClose }: ChatWindowProps) => {
  const {
    status,
    currentStep,
    totalSteps,
    messages,
    isTyping,
    error,
    startChat,
    selectOption,
    submitText,
    submitContactForm,
    skipQuestion,
    reset,
    currentQuestion,
    inquiryData,
  } = useChatbot();

  // 채팅 시작
  if (status === 'idle') {
    startChat();
  }

  // 완료 시 요약 화면
  if (status === 'success' && inquiryData) {
    return (
      <div className="flex flex-col h-full bg-[#0a0a0a]">
        <ChatHeader onClose={onClose} />
        <ChatSummary
          data={inquiryData}
          onClose={() => {
            reset();
            onClose();
          }}
        />
      </div>
    );
  }

  // 현재 질문에 맞는 입력 컴포넌트 렌더링
  const renderInput = () => {
    if (!currentQuestion || isTyping) return null;

    switch (currentQuestion.type) {
      case 'single-select':
        return (
          <ChatOptions
            options={currentQuestion.options || []}
            type="single-select"
            onSelect={selectOption}
            skipLabel={currentQuestion.skipLabel}
            onSkip={!currentQuestion.required ? skipQuestion : undefined}
          />
        );

      case 'multi-select':
        return (
          <ChatOptions
            options={currentQuestion.options || []}
            type="multi-select"
            onSelect={selectOption}
            skipLabel={currentQuestion.skipLabel}
            onSkip={!currentQuestion.required ? skipQuestion : undefined}
          />
        );

      case 'text-input':
        return (
          <ChatTextInput
            placeholder={currentQuestion.placeholder}
            type="text"
            required={currentQuestion.required}
            onSubmit={submitText}
            skipLabel={currentQuestion.skipLabel}
            onSkip={!currentQuestion.required ? skipQuestion : undefined}
            error={error}
          />
        );

      case 'url-input':
        return (
          <ChatTextInput
            placeholder={currentQuestion.placeholder}
            type="url"
            required={currentQuestion.required}
            onSubmit={submitText}
            skipLabel={currentQuestion.skipLabel}
            onSkip={!currentQuestion.required ? skipQuestion : undefined}
            error={error}
          />
        );

      case 'email-input':
        return (
          <ChatTextInput
            placeholder={currentQuestion.placeholder}
            type="email"
            required={currentQuestion.required}
            onSubmit={submitText}
            skipLabel={currentQuestion.skipLabel}
            onSkip={!currentQuestion.required ? skipQuestion : undefined}
            error={error}
          />
        );

      case 'contact-form':
        return (
          <ChatContactForm
            onSubmit={submitContactForm}
            error={error}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* 헤더 */}
      <ChatHeader onClose={onClose} />

      {/* 진행률 */}
      {currentStep > 0 && (
        <ChatProgress current={currentStep} total={totalSteps} />
      )}

      {/* 메시지 영역 */}
      <ChatMessages messages={messages} isTyping={isTyping} />

      {/* 입력 영역 */}
      <div className="px-4 pb-4">
        {renderInput()}
      </div>
    </div>
  );
};
