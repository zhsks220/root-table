import { useState, useMemo } from 'react';
import { Film, Music2, Library, Settings } from 'lucide-react';
import { MobileLayout, MenuItem, QuickLink } from '../components/layout/MobileLayout';
import { useThemeStore } from '../store/themeStore';
import { usePlayerStore } from '../store/playerStore';
import { AnimatePresence } from 'framer-motion';
import { PartnerProjectsView, PartnerTracksView, PartnerLibraryView } from '../components/partner';

type Tab = 'projects' | 'library' | 'tracks';

const menuItems: MenuItem[] = [
  { id: 'library', label: '트랙 모음', icon: Library },
  { id: 'tracks', label: '내 트랙', icon: Music2 },
  { id: 'projects', label: '웹툰 프로젝트', icon: Film },
];

export default function PartnerDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const { theme } = useThemeStore();
  const { unlockAudio } = usePlayerStore();
  const isDark = theme === 'dark';

  const quickLinks: QuickLink[] = useMemo(() => {
    return [
      { label: '설정', path: '/partner/settings', icon: Settings },
    ];
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === 'projects') {
      unlockAudio();
    }
    setActiveTab(tab as Tab);
  };

  return (
    <MobileLayout
      title="파트너 대시보드"
      subtitle="파트너"
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      quickLinks={quickLinks}
      logoImage="/images/wordmark_B.png"
      logoImageDark="/images/wordmark_W.png"
      logoTypeImage="/images/typelogo_B.png"
      logoTypeImageDark="/images/typelogo_W.png"
    >
      <div className={isDark ? "bg-black min-h-full" : "bg-white min-h-full"}>
        <AnimatePresence mode="wait">
          {activeTab === 'projects' && <PartnerProjectsView key="projects" />}
          {activeTab === 'library' && <PartnerLibraryView key="library" />}
          {activeTab === 'tracks' && <PartnerTracksView key="tracks" />}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
