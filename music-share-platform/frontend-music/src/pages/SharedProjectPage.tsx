import { useParams, useNavigate } from 'react-router-dom';
import { WebToonProjectsView } from '../components/admin/WebToonProjectsView';

export default function SharedProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  if (!projectId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-white">프로젝트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <WebToonProjectsView
      projectId={projectId}
      onClose={() => navigate('/partner/dashboard')}
    />
  );
}
