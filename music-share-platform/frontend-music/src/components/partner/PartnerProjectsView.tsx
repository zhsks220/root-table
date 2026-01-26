import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import api from '../../services/api';

interface SharedProject {
  id: string;
  projectId: string;
  projectTitle: string;
  permission: 'view' | 'comment' | 'edit';
  sharedAt: string;
  expiresAt: string | null;
}

export function PartnerProjectsView() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [projects, setProjects] = useState<SharedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedProjects();
  }, []);

  const loadSharedProjects = async () => {
    try {
      const response = await api.get('/admin/shared-with-me');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Failed to load shared projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'view': return '보기';
      case 'comment': return '댓글';
      case 'edit': return '편집';
      default: return permission;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 md:p-6"
    >
      <div className="mb-6">
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          공유받은 프로젝트
        </h2>
        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          협업자로 초대된 웹툰 프로젝트 목록입니다
        </p>
      </div>

      {projects.length === 0 ? (
        <div className={`text-center py-16 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <Film className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            공유받은 프로젝트가 없습니다
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            프로젝트 공유 링크를 받으면 여기에 표시됩니다
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/project/shared/${project.projectId}`)}
              className={`p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
                isDark
                  ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                  : 'bg-white border border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'
                }`}>
                  <Film className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {project.projectTitle}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getPermissionLabel(project.permission)}
                    </span>
                  </div>
                </div>
                <ExternalLink className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>

              <div className={`mt-3 pt-3 flex items-center gap-4 text-xs ${
                isDark ? 'border-t border-white/10 text-gray-400' : 'border-t border-gray-100 text-gray-500'
              }`}>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(project.sharedAt)}</span>
                </div>
                {project.expiresAt && (
                  <div className="text-amber-500">
                    {formatDate(project.expiresAt)} 만료
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
