import { useState, useEffect } from 'react';
import { adminAPI, categoryAPI } from '../../services/api';
import { Category, MoodOption, LanguageOption } from '../../types';
import { PageTransition } from '../PageTransition';
import { Upload, Music, Disc, User as UserIcon, Tag, Globe, Sparkles, ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';

export function UploadView() {
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [file, setFile] = useState<File | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [form, setForm] = useState({
        title: '',
        artist: '',
        album: '',
        description: '',
        tags: '',
        mood: '',
        language: 'ko',
        bpm: '',
        release_year: new Date().getFullYear().toString(),
        is_explicit: false
    });
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    // 데이터 로딩
    const [categories, setCategories] = useState<Category[]>([]);
    const [moods, setMoods] = useState<MoodOption[]>([]);
    const [languages, setLanguages] = useState<LanguageOption[]>([]);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        loadOptions();
    }, []);

    const loadOptions = async () => {
        try {
            const [catRes, moodRes, langRes] = await Promise.all([
                categoryAPI.getCategories(),
                categoryAPI.getMoods(),
                categoryAPI.getLanguages()
            ]);
            setCategories(catRes.data.categories);
            setMoods(moodRes.data.moods);
            setLanguages(langRes.data.languages);
        } catch (error) {
            console.error('Failed to load options:', error);
        }
    };

    // 오디오 파일에서 duration 추출
    const extractDuration = (audioFile: File): Promise<number> => {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.src = URL.createObjectURL(audioFile);
            audio.onloadedmetadata = () => {
                URL.revokeObjectURL(audio.src);
                resolve(Math.round(audio.duration));
            };
            audio.onerror = () => {
                URL.revokeObjectURL(audio.src);
                resolve(0);
            };
        });
    };

    const handleFileSelect = async (selectedFile: File | null) => {
        setFile(selectedFile);
        if (selectedFile) {
            const dur = await extractDuration(selectedFile);
            setDuration(dur);
        } else {
            setDuration(null);
        }
    };

    const handleCategoryToggle = (categoryId: string) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId);
            }
            if (prev.length >= 3) {
                alert('최대 3개까지 선택할 수 있습니다.');
                return prev;
            }
            return [...prev, categoryId];
        });
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return alert('파일을 선택해주세요.');
        if (selectedCategories.length === 0) return alert('카테고리를 선택해주세요.');

        const data = new FormData();
        data.append('file', file);
        data.append('title', form.title);
        data.append('artist', form.artist);
        if (form.album) data.append('album', form.album);
        if (duration) data.append('duration', duration.toString());

        // 카테고리
        data.append('categoryIds', JSON.stringify(selectedCategories));

        // 추가 메타데이터
        if (form.mood) data.append('mood', form.mood);
        if (form.language) data.append('language', form.language);
        if (form.bpm) data.append('bpm', form.bpm);
        if (form.release_year) data.append('release_year', form.release_year);
        if (form.is_explicit) data.append('is_explicit', 'true');
        if (form.description) data.append('description', form.description);
        if (form.tags) data.append('tags', form.tags);

        setUploading(true);
        try {
            await adminAPI.uploadTrack(data);
            alert('트랙이 성공적으로 업로드되었습니다!');
            setFile(null);
            setDuration(null);
            setSelectedCategories([]);
            setForm({
                title: '', artist: '', album: '', description: '', tags: '',
                mood: '', language: 'ko', bpm: '',
                release_year: new Date().getFullYear().toString(), is_explicit: false
            });
        } catch (error: any) {
            alert('업로드 실패: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
        }
    };

    return (
        <PageTransition className="p-8 max-w-3xl mx-auto">
            <div className="text-center mb-10">
                <h1 className={cn("text-3xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>트랙 업로드</h1>
                <p className={isDark ? "text-white/50" : "text-gray-500"}>라이브러리에 새 음악을 추가하세요</p>
            </div>

            <div className={cn(
                "rounded-2xl p-8",
                isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-sm border border-gray-100"
            )}>
                <form onSubmit={handleUpload} className="space-y-6">

                    {/* File Drop Area */}
                    <div className="space-y-2">
                        <label className={cn("text-sm font-medium", isDark ? "text-white/70" : "text-gray-700")}>오디오 파일</label>
                        <div className={cn(
                            "border-2 border-dashed rounded-xl p-8 transition-colors text-center cursor-pointer",
                            file
                                ? (isDark ? "border-emerald-500/30 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50/50")
                                : (isDark ? "border-white/20 hover:border-white/30 hover:bg-white/5" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")
                        )}>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer block">
                                {file ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center",
                                            isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"
                                        )}>
                                            <Music className="w-6 h-6" />
                                        </div>
                                        <p className={cn("font-medium", isDark ? "text-white" : "text-emerald-900")}>{file.name}</p>
                                        <p className={cn("text-xs", isDark ? "text-emerald-400" : "text-emerald-500")}>
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                            {duration ? ` · ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : ''}
                                        </p>
                                    </div>
                                ) : (
                                    <div className={cn("flex flex-col items-center gap-2", isDark ? "text-white/40" : "text-gray-400")}>
                                        <Upload className="w-10 h-10 mb-2" />
                                        <span className={cn("text-sm font-medium", isDark ? "text-white/60" : "text-gray-600")}>클릭하여 업로드하거나 드래그 앤 드롭</span>
                                        <span className="text-xs">MP3, WAV, FLAC 지원</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* 기본 정보 */}
                    <div className="grid gap-5">
                        <div>
                            <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-white/70" : "text-gray-700")}>트랙 제목 *</label>
                            <div className="relative">
                                <Music className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-white/40" : "text-gray-400")} />
                                <input
                                    type="text"
                                    required
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    className={cn(
                                        "w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow",
                                        isDark ? "bg-white/5 border-white/10 text-white placeholder-white/40" : "border-gray-200 text-gray-900"
                                    )}
                                    placeholder="예: Summer Vibes"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-white/70" : "text-gray-700")}>아티스트 *</label>
                                <div className="relative">
                                    <UserIcon className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-white/40" : "text-gray-400")} />
                                    <input
                                        type="text"
                                        required
                                        value={form.artist}
                                        onChange={e => setForm({ ...form, artist: e.target.value })}
                                        className={cn(
                                            "w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow",
                                            isDark ? "bg-white/5 border-white/10 text-white placeholder-white/40" : "border-gray-200 text-gray-900"
                                        )}
                                        placeholder="아티스트 이름"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-white/70" : "text-gray-700")}>앨범</label>
                                <div className="relative">
                                    <Disc className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-white/40" : "text-gray-400")} />
                                    <input
                                        type="text"
                                        value={form.album}
                                        onChange={e => setForm({ ...form, album: e.target.value })}
                                        className={cn(
                                            "w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow",
                                            isDark ? "bg-white/5 border-white/10 text-white placeholder-white/40" : "border-gray-200 text-gray-900"
                                        )}
                                        placeholder="앨범 이름"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 카테고리 선택 */}
                    <div className="space-y-3">
                        <label className={cn("block text-sm font-medium", isDark ? "text-white/70" : "text-gray-700")}>
                            카테고리 * <span className={isDark ? "text-white/40 font-normal" : "text-gray-400 font-normal"}>(최대 3개)</span>
                        </label>

                        {/* 선택된 카테고리 표시 */}
                        {selectedCategories.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {selectedCategories.map((catId, index) => {
                                    const category = categories.flatMap(c => [c, ...(c.children || [])]).find(c => c.id === catId);
                                    return category ? (
                                        <span
                                            key={catId}
                                            className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                                                index === 0
                                                    ? (isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700")
                                                    : (isDark ? "bg-white/10 text-white/70" : "bg-gray-100 text-gray-700")
                                            )}
                                        >
                                            <span>{category.icon}</span>
                                            {category.name}
                                            {index === 0 && <span className="text-xs opacity-60">(주)</span>}
                                            <button
                                                type="button"
                                                onClick={() => handleCategoryToggle(catId)}
                                                className="ml-1 hover:text-red-500"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        )}

                        {/* 카테고리 그리드 */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => handleCategoryToggle(category.id)}
                                    className={cn(
                                        "p-3 rounded-lg border text-center transition-all hover:shadow-sm",
                                        selectedCategories.includes(category.id)
                                            ? (isDark ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400" : "border-emerald-300 bg-emerald-50 text-emerald-700")
                                            : (isDark ? "border-white/10 hover:border-white/20 text-white/70" : "border-gray-200 hover:border-gray-300 text-gray-700")
                                    )}
                                >
                                    <div className="text-xl mb-1">{category.icon}</div>
                                    <div className="text-xs font-medium truncate">{category.name}</div>
                                </button>
                            ))}
                        </div>

                        {/* 서브카테고리 (선택된 메인 카테고리가 있을 때) */}
                        {selectedCategories.length > 0 && (() => {
                            const mainCat = categories.find(c => c.id === selectedCategories[0]);
                            if (mainCat?.children && mainCat.children.length > 0) {
                                return (
                                    <div className={cn("mt-3 p-3 rounded-lg", isDark ? "bg-white/5" : "bg-gray-50")}>
                                        <label className={cn("block text-xs font-medium mb-2", isDark ? "text-white/50" : "text-gray-500")}>
                                            {mainCat.name} 세부 장르
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {mainCat.children.map(sub => (
                                                <button
                                                    key={sub.id}
                                                    type="button"
                                                    onClick={() => handleCategoryToggle(sub.id)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                                                        selectedCategories.includes(sub.id)
                                                            ? "bg-emerald-500 text-white"
                                                            : (isDark ? "bg-white/10 border border-white/10 text-white/60 hover:border-emerald-500/30" : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-300")
                                                    )}
                                                >
                                                    {sub.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>

                    {/* 고급 옵션 토글 */}
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={cn("flex items-center gap-2 text-sm", isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700")}
                    >
                        <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
                        고급 옵션 {showAdvanced ? '접기' : '펼치기'}
                    </button>

                    {/* 고급 옵션 */}
                    {showAdvanced && (
                        <div className={cn("space-y-5 p-5 rounded-xl", isDark ? "bg-white/5" : "bg-gray-50")}>
                            <div className="grid grid-cols-2 gap-5">
                                {/* 분위기 */}
                                <div>
                                    <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-white/70" : "text-gray-700")}>
                                        <Sparkles className="inline w-4 h-4 mr-1" />
                                        분위기
                                    </label>
                                    <select
                                        value={form.mood}
                                        onChange={e => setForm({ ...form, mood: e.target.value })}
                                        className={cn(
                                            "w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
                                            isDark ? "bg-white/5 border-white/10 text-white" : "border-gray-200 text-gray-900"
                                        )}
                                    >
                                        <option value="">선택 안함</option>
                                        {moods.map(mood => (
                                            <option key={mood.value} value={mood.value}>{mood.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 언어 */}
                                <div>
                                    <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-white/70" : "text-gray-700")}>
                                        <Globe className="inline w-4 h-4 mr-1" />
                                        언어
                                    </label>
                                    <select
                                        value={form.language}
                                        onChange={e => setForm({ ...form, language: e.target.value })}
                                        className={cn(
                                            "w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
                                            isDark ? "bg-white/5 border-white/10 text-white" : "border-gray-200 text-gray-900"
                                        )}
                                    >
                                        {languages.map(lang => (
                                            <option key={lang.value} value={lang.value}>{lang.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                {/* BPM */}
                                <div>
                                    <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-white/70" : "text-gray-700")}>BPM</label>
                                    <input
                                        type="number"
                                        value={form.bpm}
                                        onChange={e => setForm({ ...form, bpm: e.target.value })}
                                        className={cn(
                                            "w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
                                            isDark ? "bg-white/5 border-white/10 text-white placeholder-white/40" : "border-gray-200 text-gray-900"
                                        )}
                                        placeholder="120"
                                        min="30"
                                        max="300"
                                    />
                                </div>

                                {/* 발매년도 */}
                                <div>
                                    <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-white/70" : "text-gray-700")}>발매년도</label>
                                    <input
                                        type="number"
                                        value={form.release_year}
                                        onChange={e => setForm({ ...form, release_year: e.target.value })}
                                        className={cn(
                                            "w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
                                            isDark ? "bg-white/5 border-white/10 text-white placeholder-white/40" : "border-gray-200 text-gray-900"
                                        )}
                                        placeholder="2024"
                                        min="1900"
                                        max={new Date().getFullYear() + 1}
                                    />
                                </div>
                            </div>

                            {/* 태그 */}
                            <div>
                                <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-white/70" : "text-gray-700")}>
                                    <Tag className="inline w-4 h-4 mr-1" />
                                    태그 <span className={isDark ? "text-white/40 font-normal" : "text-gray-400 font-normal"}>(쉼표로 구분)</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.tags}
                                    onChange={e => setForm({ ...form, tags: e.target.value })}
                                    className={cn(
                                        "w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500",
                                        isDark ? "bg-white/5 border-white/10 text-white placeholder-white/40" : "border-gray-200 text-gray-900"
                                    )}
                                    placeholder="예: 여름, 드라이브, 청량"
                                />
                            </div>

                            {/* 설명 */}
                            <div>
                                <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-white/70" : "text-gray-700")}>설명</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className={cn(
                                        "w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none",
                                        isDark ? "bg-white/5 border-white/10 text-white placeholder-white/40" : "border-gray-200 text-gray-900"
                                    )}
                                    rows={3}
                                    placeholder="트랙에 대한 간단한 설명..."
                                />
                            </div>

                            {/* 성인 콘텐츠 여부 */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_explicit}
                                    onChange={e => setForm({ ...form, is_explicit: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className={cn("text-sm", isDark ? "text-white/70" : "text-gray-700")}>성인 콘텐츠 (Explicit)</span>
                            </label>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={uploading}
                        className={cn(
                            "w-full font-medium py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100",
                            isDark
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                : "bg-gray-900 hover:bg-black text-white shadow-lg shadow-gray-200 hover:shadow-gray-300"
                        )}
                    >
                        {uploading ? '업로드 중...' : '트랙 업로드'}
                    </button>
                </form>
            </div>
        </PageTransition>
    );
}
