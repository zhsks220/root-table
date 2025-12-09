import { useState } from 'react';
import { LoopsSidebar } from '../components/LoopsSidebar';
import { TracksView } from '../components/admin/TracksView';
import { InvitationsView } from '../components/admin/InvitationsView';
import { UsersView } from '../components/admin/UsersView';
import { UploadView } from '../components/admin/UploadView';
import { AnimatePresence } from 'framer-motion';

type Tab = 'tracks' | 'invitations' | 'users' | 'upload';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('tracks');

  return (
    <div className="flex min-h-screen bg-white font-sans">
      <LoopsSidebar activeTab={activeTab} onTabChange={(tab: any) => setActiveTab(tab)} />

      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white relative">
        <AnimatePresence mode="wait">
          {activeTab === 'tracks' && <TracksView key="tracks" />}
          {activeTab === 'invitations' && <InvitationsView key="invitations" />}
          {activeTab === 'users' && <UsersView key="users" />}
          {activeTab === 'upload' && <UploadView key="upload" />}
        </AnimatePresence>
      </main>
    </div>
  );
}
