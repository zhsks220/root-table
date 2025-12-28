import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useThemeStore } from '../../store/themeStore';

interface MonthlyData {
  yearMonth: string;
  grossRevenue: number;
  netRevenue: number;
  managementFee: number;
}

interface RevenueLineChartProps {
  data: MonthlyData[];
  title?: string;
  dateRange?: string;
}

// 금액 포맷팅
const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
};

const formatFullCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR').format(value) + '원';
};

// 월 포맷팅 (2025-01 -> 2025년01월)
const formatMonth = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-');
  return `${year}년${month}월`;
};

// 커스텀 툴팁
const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-3 rounded-lg shadow-lg border ${
        isDark
          ? 'bg-[#1a1a1a] border-white/10'
          : 'bg-white border-gray-200'
      }`}>
        <p className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {formatMonth(label)}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatFullCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueLineChart({ data, title = '월별 정산금액 변동', dateRange }: RevenueLineChartProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  // Y축 최대값 계산 (데이터 기반)
  const maxValue = Math.max(...data.map(d => d.grossRevenue)) * 1.1;

  return (
    <div className={`rounded-xl border p-6 ${
      isDark
        ? 'bg-[#0a0a0a] border-white/10'
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        {dateRange && (
          <span className="text-xs text-emerald-500 font-medium">{dateRange}</span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>총정산금액</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-300" />
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>관리사정산금액</span>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorManagement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#93C5FD" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#93C5FD" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#E5E7EB'} vertical={false} />
            <XAxis
              dataKey="yearMonth"
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11 }}
              tickFormatter={(value) => value.slice(2)} // 2025-01 -> 25-01
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11 }}
              tickFormatter={formatCurrency}
              domain={[0, maxValue]}
              width={60}
            />
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
            <Area
              type="monotone"
              dataKey="grossRevenue"
              name="총정산금액"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#colorGross)"
              dot={{ fill: '#3B82F6', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#3B82F6' }}
            />
            <Area
              type="monotone"
              dataKey="managementFee"
              name="관리사정산금액"
              stroke="#93C5FD"
              strokeWidth={2}
              fill="url(#colorManagement)"
              dot={{ fill: '#93C5FD', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#93C5FD' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RevenueLineChart;
