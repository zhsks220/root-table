import { useState } from 'react';
import {
    Navbar,
    Hero,
    SocialProof,
    Process,
    WhyNotStock,
    AlbumPuzzleGrid,
    ReaderReactions,
    WhoWeWorkWith,
    FinalCTA,
    FloatingCTA,
    Footer
} from '../components/landing';
import { ChatbotInquiry } from '../components/chatbot';

const LandingPage = () => {
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);

    const openChatbot = () => setIsChatbotOpen(true);
    const closeChatbot = () => setIsChatbotOpen(false);

    return (
        <div className="bg-black text-white min-h-screen">
            <Navbar />
            <Hero />
            <SocialProof />
            <WhyNotStock />
            <AlbumPuzzleGrid />
            <ReaderReactions />
            <Process />
            <WhoWeWorkWith />
            <FinalCTA />
            <Footer />
            <FloatingCTA onClick={openChatbot} />

            {/* 챗봇 문의 모달 */}
            <ChatbotInquiry isOpen={isChatbotOpen} onClose={closeChatbot} />
        </div>
    );
};

export default LandingPage;
