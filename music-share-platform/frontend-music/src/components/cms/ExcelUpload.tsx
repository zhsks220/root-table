import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cmsAPI } from '../../services/cmsApi';
import { useThemeStore } from '../../store/themeStore';

interface ExcelUploadProps {
  onUploadComplete?: () => void;
}

export function ExcelUpload({ onUploadComplete }: ExcelUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setUploadResult({
        success: false,
        message: 'Excel 또는 CSV 파일만 업로드 가능합니다.',
      });
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const response = await cmsAPI.uploadSettlements(selectedFile);
      setUploadResult({
        success: true,
        message: `파일 업로드 완료: ${response.data.fileName}`,
      });
      setSelectedFile(null);
      onUploadComplete?.();
    } catch (error: any) {
      setUploadResult({
        success: false,
        message: error.response?.data?.error || '업로드 중 오류가 발생했습니다.',
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`rounded-xl border p-6 ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-100'}`}>
      <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>정산 데이터 업로드</h3>

      {/* 드래그 앤 드롭 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragging
            ? isDark ? 'border-emerald-500 bg-emerald-900/20' : 'border-emerald-500 bg-emerald-50'
            : isDark ? 'border-white/20 hover:border-white/30 hover:bg-white/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />

        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-emerald-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        <p className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          파일을 드래그하거나 클릭하여 업로드
        </p>
        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Excel (.xlsx, .xls) 또는 CSV 파일 지원 (최대 10MB)
        </p>
      </div>

      {/* 선택된 파일 */}
      {selectedFile && (
        <div className={`mt-4 p-4 rounded-lg flex items-center justify-between ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <FileSpreadsheet className={`w-8 h-8 ${isDark ? 'text-emerald-400' : 'text-green-600'}`} />
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedFile.name}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className={`p-1 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 업로드 결과 */}
      {uploadResult && (
        <div
          className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
            uploadResult.success
              ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'
              : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'
          }`}
        >
          {uploadResult.success ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p className="text-sm">{uploadResult.message}</p>
        </div>
      )}

      {/* 업로드 버튼 */}
      {selectedFile && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              업로드 중...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              업로드 시작
            </>
          )}
        </button>
      )}

      {/* 안내 사항 */}
      <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
        <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-900'}`}>📋 업로드 가이드</h4>
        <ul className={`text-xs space-y-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
          <li>• 첫 번째 행은 헤더로 인식됩니다.</li>
          <li>• 필수 컬럼: 정산월, 유통사코드, 총매출, 순매출</li>
          <li>• 유통사코드는 시스템에 등록된 코드와 일치해야 합니다.</li>
          <li>• 기존 데이터와 중복되는 경우 덮어씌워집니다.</li>
        </ul>
      </div>
    </div>
  );
}

export default ExcelUpload;
