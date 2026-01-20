import { useState } from 'react';
import { Music, Link as LinkIcon, Users, Upload, BarChart3, Settings, Film } from 'lucide-react';
import { TracksView } from '../components/admin/TracksView';
import { InvitationsView } from '../components/admin/InvitationsView';
import { UsersView } from '../components/admin/UsersView';
import { UploadView } from '../components/admin/UploadView';
import { WebToonProjectsView } from '../components/admin/WebToonProjectsView';
import { MobileLayout, MenuItem, QuickLink } from '../components/layout/MobileLayout';
import { useThemeStore } from '../store/themeStore';
import { usePlayerStore } from '../store/playerStore';
import { AnimatePresence } from 'framer-motion';

type Tab = 'tracks' | 'invitations' | 'users' | 'upload' | 'webtoon-projects';

const menuItems: MenuItem[] = [
  { id: 'tracks', label: '트랙 목록', icon: Music },
  { id: 'invitations', label: '초대 링크', icon: LinkIcon },
  { id: 'users', label: '사용자 관리', icon: Users },
  { id: 'upload', label: '트랙 업로드', icon: Upload },
  { id: 'webtoon-projects', label: '웹툰 프로젝트', icon: Film },
];

const quickLinks: QuickLink[] = [
  { label: '음원 라이브러리', path: '/admin', icon: Music },
  { label: 'CMS 대시보드', path: '/cms', icon: BarChart3 },
  { label: '파트너 페이지', path: '/partner-admin', icon: Users },
  { label: '설정', path: '/admin/settings', icon: Settings },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('tracks');
  const { theme } = useThemeStore();
  const { unlockAudio } = usePlayerStore();
  const isDark = theme === 'dark';

  // 탭 변경 핸들러 - 웹툰 프로젝트 선택 시 오디오 잠금 해제
  const handleTabChange = (tab: string) => {
    if (tab === 'webtoon-projects') {
      unlockAudio();
    }
    setActiveTab(tab as Tab);
  };

  return (
    <MobileLayout
      title="관리자 콘솔"
      subtitle="관리자 콘솔"
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
          {activeTab === 'tracks' && <TracksView key="tracks" />}
          {activeTab === 'invitations' && <InvitationsView key="invitations" />}
          {activeTab === 'users' && <UsersView key="users" />}
          {activeTab === 'upload' && <UploadView key="upload" />}
          {activeTab === 'webtoon-projects' && <WebToonProjectsView key="webtoon-projects" />}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
