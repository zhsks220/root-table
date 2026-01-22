import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../../services/api';
import { PageTransition } from '../PageTransition';
import { Users, RefreshCw, Plus, Copy, Check, Key, Trash2, ChevronDown, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'partner' | 'developer';
  force_password_change: boolean;
  track_count: number;
  created_at: string;
}

const ROLES = [
  { value: 'user', label: '일반 사용자', prefix: 'cu', color: 'gray' },
  { value: 'admin', label: '관리자', prefix: 'route', color: 'purple' },
  { value: 'partner', label: '파트너', prefix: 'cp', color: 'blue' },
  { value: 'developer', label: '개발자', prefix: 'deve', color: 'emerald' },
] as const;

export function UsersView() {
  const { theme } = useThemeStore();
  const { user: currentUser } = useAuthStore();
  const isDark = theme === 'dark';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // 생성 폼
  const [createForm, setCreateForm] = useState<{ name: string; email: string; role: 'user' | 'admin' | 'partner' | 'developer' }>({ name: '', email: '', role: 'user' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState<'username' | 'password' | null>(null);

  // 역할 변경 드롭다운
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const roleButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // 비밀번호 초기화 결과
  const [resetResult, setResetResult] = useState<{ username: string; password: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.name.trim()) return;

    setCreateLoading(true);
    try {
      const res = await adminAPI.createUser({
        name: createForm.name,
        email: createForm.email || undefined,
        role: createForm.role,
      });

      setCreatedUser({
        username: res.data.user.username,
        password: res.data.initialPassword,
      });

      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || '사용자 생성 실패');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setRoleDropdown(null);
      setDropdownPosition(null);
    } catch (error: any) {
      alert(error.response?.data?.error || '역할 변경 실패');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const res = await adminAPI.resetUserPassword(userId);
      setResetResult({
        username: res.data.username,
        password: res.data.newPassword,
      });
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || '비밀번호 초기화 실패');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      setShowDeleteConfirm(null);
    } catch (error: any) {
      alert(error.response?.data?.error || '사용자 삭제 실패');
    }
  };

  const copyToClipboard = async (text: string, type: 'username' | 'password') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  const getRoleStyle = (role: string): { bg: string; text: string; border: string } => {
    const roleInfo = ROLES.find(r => r.value === role);
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      gray: {
        bg: isDark ? 'bg-gray-500/20' : 'bg-gray-100',
        text: isDark ? 'text-gray-400' : 'text-gray-600',
        border: isDark ? 'border-gray-500/30' : 'border-gray-200',
      },
      purple: {
        bg: isDark ? 'bg-purple-500/20' : 'bg-purple-50',
        text: isDark ? 'text-purple-400' : 'text-purple-700',
        border: isDark ? 'border-purple-500/30' : 'border-purple-100',
      },
      blue: {
        bg: isDark ? 'bg-blue-500/20' : 'bg-blue-50',
        text: isDark ? 'text-blue-400' : 'text-blue-700',
        border: isDark ? 'border-blue-500/30' : 'border-blue-100',
      },
      emerald: {
        bg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-50',
        text: isDark ? 'text-emerald-400' : 'text-emerald-700',
        border: isDark ? 'border-emerald-500/30' : 'border-emerald-100',
      },
    };

    return colors[roleInfo?.color || 'gray'] || colors.gray;
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreatedUser(null);
    setCreateForm({ name: '', email: '', role: 'user' });
  };

  return (
    <PageTransition className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-gray-900")}>팀 멤버</h1>
          <p className={cn("mt-1", isDark ? "text-white/50" : "text-gray-500")}>사용자 계정을 생성하고 권한을 관리하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
              isDark
                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            )}
          >
            <Plus className="w-4 h-4" />
            사용자 추가
          </button>
          <button
            onClick={loadUsers}
            className={cn(
              "p-2 transition-colors rounded-full",
              isDark ? "text-white/50 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className={cn(
        "rounded-xl overflow-hidden",
        isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100"
      )}>
        {users.length === 0 && !loading ? (
          <div className="p-16 text-center">
            <Users className={cn("w-12 h-12 mx-auto mb-4", isDark ? "text-white/20" : "text-gray-300")} />
            <h3 className={cn("text-lg font-medium", isDark ? "text-white" : "text-gray-900")}>사용자가 없습니다</h3>
          </div>
        ) : (
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className={cn("border-b sticky top-0 z-10", isDark ? "bg-white/5 text-white/50 border-white/10" : "bg-gray-50/50 text-gray-500 border-gray-100")}>
              <tr>
                <th className="px-6 py-4 font-medium">유저 ID</th>
                <th className="px-6 py-4 font-medium">이름</th>
                <th className="px-6 py-4 font-medium">이메일</th>
                <th className="px-6 py-4 font-medium">역할</th>
                <th className="px-6 py-4 font-medium">상태</th>
                <th className="px-6 py-4 font-medium">트랙</th>
                <th className="px-6 py-4 font-medium">가입일</th>
                <th className="px-6 py-4 font-medium text-right">작업</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDark ? "divide-white/10" : "divide-gray-100")}>
              {users.map((u) => {
                const roleStyle = getRoleStyle(u.role);
                const isCurrentUser = u.id === currentUser?.id;
                const canEditRole = currentUser?.role === 'developer' || (currentUser?.role === 'admin' && u.role !== 'developer');

                return (
                  <tr key={u.id} className={cn("group transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-gray-50/50")}>
                    <td className={cn("px-6 py-4 font-mono text-sm", isDark ? "text-emerald-400" : "text-emerald-600")}>
                      {u.username || '-'}
                    </td>
                    <td className={cn("px-6 py-4 font-medium", isDark ? "text-white" : "text-gray-900")}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                          isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"
                        )}>
                          {u.name[0]}
                        </div>
                        {u.name}
                        {isCurrentUser && (
                          <span className={cn("text-xs px-2 py-0.5 rounded-full", isDark ? "bg-white/10 text-white/50" : "bg-gray-100 text-gray-500")}>
                            나
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={cn("px-6 py-4", isDark ? "text-white/70" : "text-gray-600")}>{u.email}</td>
                    <td className="px-6 py-4">
                      {canEditRole && !isCurrentUser ? (
                        <div className="relative">
                          <button
                            ref={(el) => {
                              if (el) roleButtonRefs.current.set(u.id, el);
                            }}
                            onClick={() => {
                              if (roleDropdown === u.id) {
                                setRoleDropdown(null);
                                setDropdownPosition(null);
                              } else {
                                const button = roleButtonRefs.current.get(u.id);
                                if (button) {
                                  const rect = button.getBoundingClientRect();
                                  setDropdownPosition({
                                    top: rect.bottom + 4,
                                    left: rect.left,
                                  });
                                }
                                setRoleDropdown(u.id);
                              }
                            }}
                            className={cn(
                              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
                              roleStyle.bg, roleStyle.text, roleStyle.border
                            )}
                          >
                            {ROLES.find(r => r.value === u.role)?.label}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap",
                          roleStyle.bg, roleStyle.text, roleStyle.border
                        )}>
                          {ROLES.find(r => r.value === u.role)?.label}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.force_password_change ? (
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                          isDark ? "bg-yellow-500/20 text-yellow-400" : "bg-yellow-50 text-yellow-700"
                        )}>
                          비번 변경 필요
                        </span>
                      ) : (
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                          isDark ? "bg-green-500/20 text-green-400" : "bg-green-50 text-green-700"
                        )}>
                          활성
                        </span>
                      )}
                    </td>
                    <td className={cn("px-6 py-4 font-mono text-xs", isDark ? "text-white/70" : "text-gray-600")}>{u.track_count}</td>
                    <td className={cn("px-6 py-4", isDark ? "text-white/70" : "text-gray-600")}>{formatDate(u.created_at)}</td>
                    <td className="px-6 py-4">
                      {!isCurrentUser && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleResetPassword(u.id)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              isDark ? "text-white/50 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                            )}
                            title="비밀번호 초기화"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(u.id)}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              isDark ? "text-red-400/50 hover:text-red-400 hover:bg-red-400/10" : "text-red-400 hover:text-red-600 hover:bg-red-50"
                            )}
                            title="사용자 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* 역할 변경 드롭다운 (fixed로 테이블 밖에 렌더링) */}
      {roleDropdown && dropdownPosition && (
        <>
          {/* 배경 클릭 시 닫기 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setRoleDropdown(null);
              setDropdownPosition(null);
            }}
          />
          <div
            className={cn(
              "fixed z-50 py-1 rounded-lg shadow-lg min-w-[120px]",
              isDark ? "bg-black border border-white/10" : "bg-white border border-gray-200"
            )}
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
          >
            {ROLES.filter(r => currentUser?.role === 'developer' || r.value !== 'developer').map(role => {
              const targetUser = users.find(u => u.id === roleDropdown);
              const isSelected = targetUser?.role === role.value;
              const roleColors: Record<string, { selected: string }> = {
                user: { selected: isDark ? "bg-gray-500/20 text-gray-400" : "bg-gray-100 text-gray-700" },
                admin: { selected: isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-50 text-purple-600" },
                partner: { selected: isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600" },
                developer: { selected: isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600" },
              };
              return (
                <button
                  key={role.value}
                  onClick={() => handleRoleChange(roleDropdown, role.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm transition-colors",
                    isSelected
                      ? roleColors[role.value]?.selected
                      : (isDark ? "text-white/70 hover:bg-white/5" : "text-gray-600 hover:bg-gray-50")
                  )}
                >
                  {role.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* 사용자 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={cn(
            "w-full max-w-md mx-4 rounded-2xl p-6",
            isDark ? "bg-gray-900 border border-gray-800" : "bg-white"
          )}>
            {createdUser ? (
              <>
                <h2 className={cn("text-xl font-bold mb-4", isDark ? "text-white" : "text-gray-900")}>계정 생성 완료</h2>
                <p className={cn("mb-4", isDark ? "text-white/60" : "text-gray-600")}>
                  아래 정보를 사용자에게 전달해주세요. 첫 로그인 시 비밀번호 변경이 필요합니다.
                </p>

                <div className="space-y-3">
                  <div className={cn("p-4 rounded-xl", isDark ? "bg-white/5" : "bg-gray-50")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={cn("text-xs mb-1", isDark ? "text-white/50" : "text-gray-500")}>유저 ID (로그인 ID)</p>
                        <p className={cn("font-mono text-lg font-bold", isDark ? "text-emerald-400" : "text-emerald-600")}>{createdUser.username}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(createdUser.username, 'username')}
                        className={cn("p-2 rounded-lg transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-200")}
                      >
                        {copied === 'username' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className={cn("w-5 h-5", isDark ? "text-white/50" : "text-gray-400")} />}
                      </button>
                    </div>
                  </div>

                  <div className={cn("p-4 rounded-xl", isDark ? "bg-white/5" : "bg-gray-50")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={cn("text-xs mb-1", isDark ? "text-white/50" : "text-gray-500")}>초기 비밀번호</p>
                        <p className={cn("font-mono text-lg font-bold", isDark ? "text-yellow-400" : "text-yellow-600")}>{createdUser.password}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(createdUser.password, 'password')}
                        className={cn("p-2 rounded-lg transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-200")}
                      >
                        {copied === 'password' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className={cn("w-5 h-5", isDark ? "text-white/50" : "text-gray-400")} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={closeCreateModal}
                  className={cn(
                    "w-full mt-6 py-3 rounded-xl font-medium transition-all",
                    isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  )}
                >
                  닫기
                </button>
              </>
            ) : (
              <>
                <h2 className={cn("text-xl font-bold mb-6", isDark ? "text-white" : "text-gray-900")}>새 사용자 추가</h2>

                <div className="space-y-4">
                  <div>
                    <label className={cn("block text-sm font-medium mb-2", isDark ? "text-white/70" : "text-gray-700")}>
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="홍길동"
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border transition-all",
                        isDark
                          ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50"
                          : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500"
                      )}
                    />
                  </div>

                  <div>
                    <label className={cn("block text-sm font-medium mb-2", isDark ? "text-white/70" : "text-gray-700")}>
                      이메일 <span className={isDark ? "text-white/30" : "text-gray-400"}>(선택)</span>
                    </label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="user@example.com"
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border transition-all",
                        isDark
                          ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50"
                          : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500"
                      )}
                    />
                  </div>

                  <div>
                    <label className={cn("block text-sm font-medium mb-2", isDark ? "text-white/70" : "text-gray-700")}>
                      역할
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ROLES.filter(r => currentUser?.role === 'developer' || r.value !== 'developer').map(role => (
                        <button
                          key={role.value}
                          onClick={() => setCreateForm({ ...createForm, role: role.value })}
                          className={cn(
                            "px-4 py-3 rounded-xl text-sm font-medium border transition-all",
                            createForm.role === role.value
                              ? (isDark ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-emerald-50 border-emerald-500 text-emerald-700")
                              : (isDark ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")
                          )}
                        >
                          <div className="font-medium">{role.label}</div>
                          <div className={cn("text-xs mt-0.5", isDark ? "text-white/30" : "text-gray-400")}>
                            {role.prefix}0001
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeCreateModal}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-medium transition-all",
                      isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    )}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={!createForm.name.trim() || createLoading}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-medium transition-all disabled:opacity-50",
                      isDark ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-emerald-500 text-white hover:bg-emerald-600"
                    )}
                  >
                    {createLoading ? '생성 중...' : '계정 생성'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 비밀번호 초기화 결과 모달 */}
      {resetResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={cn(
            "w-full max-w-md mx-4 rounded-2xl p-6",
            isDark ? "bg-gray-900 border border-gray-800" : "bg-white"
          )}>
            <h2 className={cn("text-xl font-bold mb-4", isDark ? "text-white" : "text-gray-900")}>비밀번호 초기화 완료</h2>
            <p className={cn("mb-4", isDark ? "text-white/60" : "text-gray-600")}>
              새 비밀번호를 사용자에게 전달해주세요.
            </p>

            <div className="space-y-3">
              <div className={cn("p-4 rounded-xl", isDark ? "bg-white/5" : "bg-gray-50")}>
                <p className={cn("text-xs mb-1", isDark ? "text-white/50" : "text-gray-500")}>유저 ID</p>
                <p className={cn("font-mono font-bold", isDark ? "text-white" : "text-gray-900")}>{resetResult.username}</p>
              </div>

              <div className={cn("p-4 rounded-xl", isDark ? "bg-white/5" : "bg-gray-50")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={cn("text-xs mb-1", isDark ? "text-white/50" : "text-gray-500")}>새 비밀번호</p>
                    <p className={cn("font-mono text-lg font-bold", isDark ? "text-yellow-400" : "text-yellow-600")}>{resetResult.password}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(resetResult.password, 'password')}
                    className={cn("p-2 rounded-lg transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-200")}
                  >
                    {copied === 'password' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className={cn("w-5 h-5", isDark ? "text-white/50" : "text-gray-400")} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setResetResult(null)}
              className={cn(
                "w-full mt-6 py-3 rounded-xl font-medium transition-all",
                isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              )}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={cn(
            "w-full max-w-sm mx-4 rounded-2xl p-6",
            isDark ? "bg-gray-900 border border-gray-800" : "bg-white"
          )}>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-3 rounded-full", isDark ? "bg-red-500/20" : "bg-red-50")}>
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>사용자 삭제</h2>
            </div>

            <p className={cn("mb-6", isDark ? "text-white/60" : "text-gray-600")}>
              이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className={cn(
                  "flex-1 py-3 rounded-xl font-medium transition-all",
                  isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                )}
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
