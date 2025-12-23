import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ShareData {
  yearMonth: string;
  sharePercent: number;
}

interface MarketShareBarChartProps {
  data: ShareData[];
  title?: string;
  dateRange?: string;
}

// 커스텀 툴팁
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-900 mb-1">
          {label.slice(0, 4)}년 {label.slice(5)}월
        </p>
        <p className="text-sm text-emerald-600 font-semibold">
          점유율: {payload[0].value.toFixed(2)}%
        </p>
      </div>
    );
  }
  return null;
};

export function MarketShareBarChart({
  data,
  title = '월별 점유율 변동',
  dateRange,
}: MarketShareBarChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {dateRange && (
          <span className="text-xs text-emerald-500 font-medium">{dateRange}</span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-xs text-gray-600">점유율</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-200" />
          <span className="text-xs text-gray-600">총정산금액</span>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="yearMonth"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              tickFormatter={(value) => value.slice(2)} // 2025-01 -> 25-01
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="sharePercent"
              name="점유율"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.sharePercent > 50 ? '#3B82F6' : '#93C5FD'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default MarketShareBarChart;
