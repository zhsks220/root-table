import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, Copy, Check, Trash2, Loader2, Users, Calendar } from 'lucide-react';
import { webToonProjectAPI } from '../../services/api';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
}

interface ShareLink {
  id: string;
  share_token: string;
  shareUrl: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  collaborator_count: number;
}

interface Collaborator {
  id: string;
  partnerId: string;
  partnerName: string;
  email: string;
  permission: string;
  joinedAt: string;
}

export function ShareModal({ isOpen, onClose, projectId, projectTitle }: ShareModalProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [shares, setShares] = useState<ShareLink[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    if (isOpen && projectId) {
      loadData();
    }
  }, [isOpen, projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sharesRes, collaboratorsRes] = await Promise.all([
        webToonProjectAPI.getShares(projectId),
        webToonProjectAPI.getCollaborators(projectId),
      ]);
      setShares(sharesRes.data.shares || []);
      setCollaborators(collaboratorsRes.data.collaborators || []);
    } catch (error) {
      console.error('Failed to load share data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 공유 링크 생성
  const handleCreateShare = async () => {
    setCreating(true);
    try {
      await webToonProjectAPI.createShare(projectId, expiresInDays || undefined);
      await loadData();
      setExpiresInDays(null);
    } catch (error) {
      console.error('Failed to create share link:', error);
      alert('공유 링크 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  // 공유 링크 비활성화
  const handleDeactivateShare = async (shareId: string) => {
    if (!confirm('이 공유 링크를 비활성화하면 해당 링크로 참여한 협업자들의 접근 권한도 해제됩니다. 계속하시겠습니까?')) {
      return;
    }

    try {
      await webToonProjectAPI.deactivateShare(projectId, shareId);
      await loadData();
    } catch (error) {
      console.error('Failed to deactivate share:', error);
      alert('공유 링크 비활성화에 실패했습니다.');
    }
  };

  // 협업자 제거
  const handleRemoveCollaborator = async (collaboratorId: string, name: string) => {
    if (!confirm(`${name}님의 접근 권한을 제거하시겠습니까?`)) {
      return;
    }

    try {
      await webToonProjectAPI.removeCollaborator(projectId, collaboratorId);
      await loadData();
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      alert('협업자 제거에 실패했습니다.');
    }
  };

  // 링크 복사
  const handleCopyLink = async (shareUrl: string, shareId: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(shareId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const activeShares = shares.filter(s => s.is_active);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl',
              isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white'
            )}
          >
            {/* 헤더 */}
            <div className={cn(
              'sticky top-0 flex items-center justify-between p-5 border-b',
              isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-100'
            )}>
              <div>
                <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                  프로젝트 공유
                </h2>
                <p className={cn('text-sm mt-0.5', isDark ? 'text-white/50' : 'text-gray-500')}>
                  {projectTitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              </div>
            ) : (
              <div className="p-5 space-y-6">
                {/* 공유 링크 생성 */}
                <div>
                  <h3 className={cn('text-sm font-semibold mb-3', isDark ? 'text-white' : 'text-gray-900')}>
                    새 공유 링크 만들기
                  </h3>
                  <div className="flex items-center gap-3">
                    <select
                      value={expiresInDays || ''}
                      onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : null)}
                      className={cn(
                        'flex-1 px-3 py-2.5 rounded-lg text-sm',
                        isDark
                          ? 'bg-white/5 border border-white/10 text-white'
                          : 'bg-gray-50 border border-gray-200 text-gray-900'
                      )}
                    >
                      <option value="">만료 없음</option>
                      <option value="7">7일 후 만료</option>
                      <option value="30">30일 후 만료</option>
                      <option value="90">90일 후 만료</option>
                    </select>
                    <button
                      onClick={handleCreateShare}
                      disabled={creating}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {creating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Link2 className="w-4 h-4" />
                      )}
                      생성
                    </button>
                  </div>
                </div>

                {/* 활성 공유 링크 */}
                {activeShares.length > 0 && (
                  <div>
                    <h3 className={cn('text-sm font-semibold mb-3', isDark ? 'text-white' : 'text-gray-900')}>
                      활성 공유 링크
                    </h3>
                    <div className="space-y-2">
                      {activeShares.map((share) => (
                        <div
                          key={share.id}
                          className={cn(
                            'p-3 rounded-lg',
                            isDark ? 'bg-white/5' : 'bg-gray-50'
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              value={share.shareUrl}
                              readOnly
                              className={cn(
                                'flex-1 px-2 py-1.5 rounded text-xs font-mono',
                                isDark ? 'bg-white/5 text-white/70' : 'bg-white text-gray-600'
                              )}
                            />
                            <button
                              onClick={() => handleCopyLink(share.shareUrl, share.id)}
                              className={cn(
                                'p-2 rounded-lg transition-colors',
                                copiedId === share.id
                                  ? 'bg-emerald-500 text-white'
                                  : isDark ? 'hover:bg-white/10 text-white/70' : 'hover:bg-gray-200 text-gray-600'
                              )}
                            >
                              {copiedId === share.id ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeactivateShare(share.id)}
                              className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className={cn('flex items-center gap-4 text-xs', isDark ? 'text-white/40' : 'text-gray-500')}>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {share.expires_at ? `${formatDate(share.expires_at)} 만료` : '만료 없음'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {share.collaborator_count}명 참여
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 협업자 목록 */}
                <div>
                  <h3 className={cn('text-sm font-semibold mb-3', isDark ? 'text-white' : 'text-gray-900')}>
                    협업자 ({collaborators.length})
                  </h3>
                  {collaborators.length === 0 ? (
                    <p className={cn('text-sm py-4 text-center', isDark ? 'text-white/40' : 'text-gray-400')}>
                      아직 참여한 협업자가 없습니다
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {collaborators.map((collab) => (
                        <div
                          key={collab.id}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg',
                            isDark ? 'bg-white/5' : 'bg-gray-50'
                          )}
                        >
                          <div>
                            <p className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                              {collab.partnerName}
                            </p>
                            <p className={cn('text-xs', isDark ? 'text-white/50' : 'text-gray-500')}>
                              {collab.email} · {formatDate(collab.joinedAt)} 참여
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveCollaborator(collab.id, collab.partnerName)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
