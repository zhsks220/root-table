import { useState } from 'react';
import { Music, Link as LinkIcon, Users, Upload, BarChart3, Settings } from 'lucide-react';
import { TracksView } from '../components/admin/TracksView';
import { InvitationsView } from '../components/admin/InvitationsView';
import { UsersView } from '../components/admin/UsersView';
import { UploadView } from '../components/admin/UploadView';
import { MobileLayout, MenuItem, QuickLink } from '../components/layout/MobileLayout';
import { AnimatePresence } from 'framer-motion';

type Tab = 'tracks' | 'invitations' | 'users' | 'upload';

const menuItems: MenuItem[] = [
  { id: 'tracks', label: '트랙 목록', icon: Music },
  { id: 'invitations', label: '초대 링크', icon: LinkIcon },
  { id: 'users', label: '사용자 관리', icon: Users },
  { id: 'upload', label: '트랙 업로드', icon: Upload },
];

const quickLinks: QuickLink[] = [
  { label: '유통사 CMS', path: '/cms-rl2025x', icon: BarChart3 },
  { label: '설정', path: '/admin/settings', icon: Settings },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('tracks');

  return (
    <MobileLayout
      title="관리자 콘솔"
      subtitle="관리자 콘솔"
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as Tab)}
      quickLinks={quickLinks}
      logoIcon={Music}
      logoText="ROUTELABEL"
      theme="light"
    >
      <div className="bg-white min-h-full">
        <AnimatePresence mode="wait">
          {activeTab === 'tracks' && <TracksView key="tracks" />}
          {activeTab === 'invitations' && <InvitationsView key="invitations" />}
          {activeTab === 'users' && <UsersView key="users" />}
          {activeTab === 'upload' && <UploadView key="upload" />}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
