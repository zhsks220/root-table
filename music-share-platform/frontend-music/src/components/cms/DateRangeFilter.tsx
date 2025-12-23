import { useState } from 'react';
import { Calendar, ChevronDown, Search } from 'lucide-react';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  onSearch: () => void;
}

// 프리셋 옵션
const presets = [
  { label: '최근 3개월', months: 3 },
  { label: '최근 6개월', months: 6 },
  { label: '최근 12개월', months: 12 },
  { label: '올해', type: 'year' },
];

// 월 선택 옵션 생성 (최근 24개월)
const generateMonthOptions = () => {
  const options: { value: string; label: string }[] = [];
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
    options.push({ value, label });
  }

  return options;
};

export function DateRangeFilter({
  startDate,
  endDate,
  onDateChange,
  onSearch,
}: DateRangeFilterProps) {
  const [showPresets, setShowPresets] = useState(false);
  const monthOptions = generateMonthOptions();

  const handlePresetClick = (preset: typeof presets[0]) => {
    const now = new Date();
    let start: string;
    let end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (preset.type === 'year') {
      start = `${now.getFullYear()}-01`;
    } else {
      const startDate = new Date(now.getFullYear(), now.getMonth() - (preset.months ?? 12) + 1, 1);
      start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    }

    onDateChange(start, end);
    setShowPresets(false);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* 프리셋 드롭다운 */}
      <div className="relative">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>조회기간</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {showPresets && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 시작일 */}
      <div className="flex items-center gap-2">
        <select
          value={startDate}
          onChange={(e) => onDateChange(e.target.value, endDate)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <span className="text-gray-400">~</span>

        {/* 종료일 */}
        <select
          value={endDate}
          onChange={(e) => onDateChange(startDate, e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 조회 버튼 */}
      <button
        onClick={onSearch}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
      >
        <Search className="w-4 h-4" />
        조회하기
      </button>
    </div>
  );
}

export default DateRangeFilter;
