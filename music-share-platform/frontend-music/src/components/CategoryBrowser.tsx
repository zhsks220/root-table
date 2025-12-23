import { useState, useEffect } from 'react';
import { categoryAPI } from '../services/api';
import { Category } from '../types';
import { cn } from '../lib/utils';
import {
  Music, Mic2, Heart, Guitar, Headphones, Sparkles,
  Radio, Disc3, Piano, Clapperboard, Star, ChevronRight, Loader2
} from 'lucide-react';

interface CategoryBrowserProps {
  selectedCategoryId?: string;
  onCategorySelect?: (category: Category | null) => void;
  compact?: boolean;
}

// 카테고리 아이콘 매핑
const categoryIcons: Record<string, React.ReactNode> = {
  pop: <Music className="w-5 h-5" />,
  hiphop: <Mic2 className="w-5 h-5" />,
  rnb: <Heart className="w-5 h-5" />,
  rock: <Guitar className="w-5 h-5" />,
  electronic: <Headphones className="w-5 h-5" />,
  ballad: <Sparkles className="w-5 h-5" />,
  dance: <Radio className="w-5 h-5" />,
  indie: <Disc3 className="w-5 h-5" />,
  jazz: <Piano className="w-5 h-5" />,
  classical: <Piano className="w-5 h-5" />,
  ost: <Clapperboard className="w-5 h-5" />,
  trot: <Star className="w-5 h-5" />,
  ccm: <Star className="w-5 h-5" />,
  korean: <Star className="w-5 h-5" />,
  other: <Music className="w-5 h-5" />,
};

// 카테고리 색상 매핑
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  pop: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  hiphop: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  rnb: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  rock: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  electronic: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  ballad: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  dance: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  indie: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  jazz: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  classical: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  ost: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  trot: { bg: 'bg-lime-50', text: 'text-lime-600', border: 'border-lime-200' },
  ccm: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
  korean: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  other: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
};

const defaultColors = { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };

export function CategoryBrowser({ selectedCategoryId, onCategorySelect, compact = false }: CategoryBrowserProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryAPI.getCategories();
        setCategories(res.data.categories);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const getIcon = (slug: string) => categoryIcons[slug] || <Music className="w-5 h-5" />;
  const getColors = (slug: string) => categoryColors[slug] || defaultColors;

  const handleCategoryClick = (category: Category) => {
    if (onCategorySelect) {
      if (selectedCategoryId === category.id) {
        onCategorySelect(null);
      } else {
        onCategorySelect(category);
      }
    }

    // 서브카테고리 토글
    if (category.children && category.children.length > 0) {
      setExpandedCategory(expandedCategory === category.id ? null : category.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  // 컴팩트 모드 (가로 스크롤)
  if (compact) {
    return (
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => onCategorySelect?.(null)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              !selectedCategoryId
                ? "bg-emerald-500 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            전체
          </button>
          {categories.map(cat => {
            const colors = getColors(cat.slug);
            const isSelected = selectedCategoryId === cat.id ||
              cat.children?.some(c => c.id === selectedCategoryId);

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                  isSelected
                    ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ${colors.border}`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {getIcon(cat.slug)}
                {cat.name}
                {Number(cat.track_count) > 0 && (
                  <span className="ml-1 text-xs opacity-75">({cat.track_count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 전체 모드 (그리드)
  return (
    <div className="space-y-4">
      {/* 전체 보기 버튼 */}
      <button
        onClick={() => onCategorySelect?.(null)}
        className={cn(
          "w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between",
          !selectedCategoryId
            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
            : "border-gray-200 hover:border-gray-300 text-gray-600"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
            <Music className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="font-medium">전체 카테고리</span>
        </div>
      </button>

      {/* 카테고리 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map(cat => {
          const colors = getColors(cat.slug);
          const isSelected = selectedCategoryId === cat.id;
          const isExpanded = expandedCategory === cat.id;
          const hasChildren = cat.children && cat.children.length > 0;

          return (
            <div key={cat.id} className="space-y-2">
              {/* 메인 카테고리 */}
              <button
                onClick={() => handleCategoryClick(cat)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all",
                  isSelected
                    ? `${colors.border} ${colors.bg}`
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      colors.bg, colors.text
                    )}>
                      {getIcon(cat.slug)}
                    </div>
                    <div className="text-left">
                      <h3 className={cn(
                        "font-medium",
                        isSelected ? colors.text : "text-gray-900"
                      )}>
                        {cat.name}
                      </h3>
                      {cat.name_en && (
                        <p className="text-xs text-gray-400">{cat.name_en}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {Number(cat.track_count) > 0 && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs",
                        isSelected ? `${colors.bg} ${colors.text}` : "bg-gray-100 text-gray-500"
                      )}>
                        {cat.track_count}
                      </span>
                    )}
                    {hasChildren && (
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform",
                        isExpanded && "rotate-90",
                        isSelected ? colors.text : "text-gray-400"
                      )} />
                    )}
                  </div>
                </div>
              </button>

              {/* 서브카테고리 */}
              {hasChildren && isExpanded && (
                <div className="ml-4 pl-4 border-l-2 border-gray-200 space-y-1">
                  {cat.children!.map(sub => {
                    const isSubSelected = selectedCategoryId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => onCategorySelect?.(sub)}
                        className={cn(
                          "w-full px-3 py-2 rounded-lg text-left text-sm transition-colors flex items-center justify-between",
                          isSubSelected
                            ? `${colors.bg} ${colors.text}`
                            : "hover:bg-gray-50 text-gray-600"
                        )}
                      >
                        <span>{sub.name}</span>
                        {Number(sub.track_count) > 0 && (
                          <span className="text-xs opacity-75">({sub.track_count})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
