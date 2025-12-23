import { useState } from 'react';
import { Partner } from '../../services/partnerAdminApi';
import { Users, Building2, Music2, MoreVertical, Trash2, Eye } from 'lucide-react';
import { PartnerDetailModal } from './PartnerDetailModal';

interface PartnerListProps {
  partners: Partner[];
  onDelete: (partnerId: string) => void;
  onRefresh: () => void;
}

export function PartnerList({ partners, onDelete, onRefresh }: PartnerListProps) {
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const getPartnerTypeIcon = (type: string) => {
    switch (type) {
      case 'artist':
        return <Music2 className="w-4 h-4" />;
      case 'company':
        return <Building2 className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getPartnerTypeName = (type: string) => {
    switch (type) {
      case 'artist':
        return '아티스트';
      case 'company':
        return '기획사';
      case 'composer':
        return '작곡가';
      default:
        return type;
    }
  };

  const getPartnerTypeStyle = (type: string) => {
    switch (type) {
      case 'artist':
        return 'bg-purple-100 text-purple-800';
      case 'company':
        return 'bg-blue-100 text-blue-800';
      case 'composer':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetail = (partner: Partner) => {
    setSelectedPartner(partner);
    setShowDetailModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = (partnerId: string) => {
    setOpenMenuId(null);
    onDelete(partnerId);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-gray-100">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">전체 파트너</p>
            <p className="text-2xl font-bold text-gray-900">{partners.length}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600">아티스트</p>
            <p className="text-2xl font-bold text-purple-900">
              {partners.filter(p => p.partnerType === 'artist').length}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">기획사</p>
            <p className="text-2xl font-bold text-blue-900">
              {partners.filter(p => p.partnerType === 'company').length}
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <p className="text-sm text-amber-600">작곡가</p>
            <p className="text-2xl font-bold text-amber-900">
              {partners.filter(p => p.partnerType === 'composer').length}
            </p>
          </div>
        </div>

        {/* 테이블 */}
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">파트너</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기본 정산율</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {partners.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  등록된 파트너가 없습니다
                </td>
              </tr>
            ) : (
              partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        partner.partnerType === 'artist' ? 'bg-purple-100 text-purple-600' :
                        partner.partnerType === 'company' ? 'bg-blue-100 text-blue-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {getPartnerTypeIcon(partner.partnerType)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {partner.businessName || partner.representativeName || '이름 없음'}
                        </p>
                        <p className="text-sm text-gray-500">{partner.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getPartnerTypeStyle(partner.partnerType)}`}>
                      {getPartnerTypeIcon(partner.partnerType)}
                      {getPartnerTypeName(partner.partnerType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {partner.phone || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-emerald-600">
                      {partner.defaultShareRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      partner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {partner.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(partner.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === partner.id ? null : partner.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>

                      {openMenuId === partner.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                          <button
                            onClick={() => handleViewDetail(partner)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4" />
                            상세보기
                          </button>
                          <button
                            onClick={() => handleDelete(partner.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 상세보기 모달 */}
      {selectedPartner && (
        <PartnerDetailModal
          isOpen={showDetailModal}
          partner={selectedPartner}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPartner(null);
          }}
          onUpdate={onRefresh}
        />
      )}
    </>
  );
}
