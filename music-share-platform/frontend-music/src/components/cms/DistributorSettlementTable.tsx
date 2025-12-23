import { Download } from 'lucide-react';

interface DistributorSettlement {
  rank: number;
  distributorName: string;
  distributorCode: string;
  commissionRate: number;
  sharePercent: number;
  grossRevenue: number;
  netRevenue: number;
  managementFee: number;
  streamCount: number;
  downloadCount: number;
  monthCount: number;
}

interface Totals {
  grossRevenue: number;
  netRevenue: number;
  managementFee: number;
  streamCount: number;
  downloadCount: number;
  sharePercent: number;
}

interface DistributorSettlementTableProps {
  settlements: DistributorSettlement[];
  totals: Totals;
  title?: string;
  dateRange?: string;
  onExcelDownload?: () => void;
}

// 금액 포맷팅
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR').format(Math.round(value));
};

// 숫자 포맷팅 (스트리밍 수 등)
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('ko-KR').format(value);
};

export function DistributorSettlementTable({
  settlements,
  totals,
  title = '음원 - 서비스사별 판매 현황',
  dateRange,
  onExcelDownload,
}: DistributorSettlementTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {dateRange && (
            <span className="text-xs text-emerald-500 font-medium">{dateRange}</span>
          )}
        </div>
        {onExcelDownload && (
          <button
            onClick={onExcelDownload}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            엑셀
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                순위
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                서비스사
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                점유율
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                판매금액(원/외)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                관리사정산금액
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                판매수
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                판매수량
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {settlements.map((settlement) => (
              <tr
                key={settlement.distributorCode}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {settlement.rank}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {settlement.distributorName}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className="text-emerald-600 font-semibold">
                    {settlement.sharePercent.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium tabular-nums">
                  {formatCurrency(settlement.grossRevenue)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-emerald-600 font-medium tabular-nums">
                  {formatCurrency(settlement.managementFee)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600 tabular-nums">
                  {settlement.monthCount}개
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600 tabular-nums">
                  {formatNumber(settlement.streamCount)}회
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-emerald-50 border-t-2 border-emerald-200">
              <td className="px-4 py-3 text-sm font-bold text-gray-900" colSpan={2}>
                합계
              </td>
              <td className="px-4 py-3 text-sm text-right">
                <span className="text-emerald-600 font-bold">
                  {totals.sharePercent.toFixed(2)}%
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-right font-bold text-gray-900 tabular-nums">
                {formatCurrency(totals.grossRevenue)}
              </td>
              <td className="px-4 py-3 text-sm text-right font-bold text-emerald-600 tabular-nums">
                {formatCurrency(totals.managementFee)}
              </td>
              <td className="px-4 py-3 text-sm text-right font-bold text-gray-900 tabular-nums">
                {settlements.reduce((sum, s) => sum + s.monthCount, 0)}개
              </td>
              <td className="px-4 py-3 text-sm text-right font-bold text-gray-900 tabular-nums">
                {formatNumber(totals.streamCount)}회
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default DistributorSettlementTable;
