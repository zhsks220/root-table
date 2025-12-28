import {
    Navbar,
    Hero,
    SocialProof,
    Features,
    Process,
    WhyNotStock,
    ReaderReactions,
    WhoWeWorkWith,
    FinalCTA,
    Contact
} from '../components/landing';

const LandingPage = () => {
    return (
        <div className="bg-black text-white min-h-screen">
            <Navbar />
            <Hero />
            <SocialProof />
            <Features />
            <Process />
            <WhyNotStock />
            <ReaderReactions />
            <WhoWeWorkWith />
            <FinalCTA />
            <Contact />
        </div>
    );
};

export default LandingPage;
