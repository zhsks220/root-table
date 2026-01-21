import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

// 앨범 데이터 타입
interface Album {
    id: string;
    title: string;
    artist: string;
    coverImage: string;
    // 퍼즐 사이즈: 'small' = 1x1, 'medium' = 2x1, 'large' = 2x2
    size: 'small' | 'medium' | 'large';
    slug: string; // 앨범 상세 페이지 링크용
}

// 앨범 데이터 - 6컬럼 그리드에 빈틈없이 배치 (grid-auto-flow: dense 사용)
// 23개 앨범, dense 배치 시 시각적으로 같은 웹툰끼리 묶이도록 데이터 배치
//
// 웹툰별 앨범 수:
// - 외모지상주의: 3개
// - 연애혁명: 11개
// - 개짓: 5개
// - 백XX: 1개
// - 작두: 2개
// - 퀘스트지상주의: 1개
const albumsData: Album[] = [
    // 외모지상주의 (3개)
    { id: '1', title: 'Lookism', artist: '외모지상주의', coverImage: '/images/albums/외지주_Lookism.webp', size: 'large', slug: 'lookism' },
    { id: '2', title: '부산', artist: '외모지상주의', coverImage: '/images/albums/외지주_부산.webp', size: 'medium', slug: 'lookism-busan' },
    { id: '3', title: '인천', artist: '외모지상주의', coverImage: '/images/albums/외지주_인천.webp', size: 'small', slug: 'lookism-incheon' },

    // 연애혁명 (11개)
    { id: '4', title: '연애혁명 OST', artist: '연애혁명', coverImage: '/images/albums/연애혁명 OST.webp', size: 'large', slug: 'love-revolution-ost' },
    { id: '5', title: 'The Memory', artist: '연애혁명', coverImage: '/images/albums/연애혁명_The Memory.webp', size: 'small', slug: 'love-revolution-memory' },
    { id: '6', title: '내가 모르는 뒷모습', artist: '연애혁명', coverImage: '/images/albums/연애혁명_내가 모르는 뒷모습.webp', size: 'medium', slug: 'love-revolution-back' },
    { id: '7', title: '딜레마', artist: '연애혁명', coverImage: '/images/albums/연애혁명_딜레마.webp', size: 'small', slug: 'love-revolution-dilemma' },
    { id: '8', title: '망가져', artist: '연애혁명', coverImage: '/images/albums/연애혁명_망가져.webp', size: 'small', slug: 'love-revolution-broken' },
    { id: '9', title: '모래성', artist: '연애혁명', coverImage: '/images/albums/연애혁명_모래성.webp', size: 'medium', slug: 'love-revolution-sandcastle' },
    { id: '10', title: '연애혁명', artist: '연애혁명', coverImage: '/images/albums/연애혁명_연애혁명.webp', size: 'small', slug: 'love-revolution-title' },
    { id: '11', title: '이클립스', artist: '연애혁명', coverImage: '/images/albums/연애혁명_이클립스.webp', size: 'small', slug: 'love-revolution-eclipse' },
    { id: '12', title: '트와일라잇', artist: '연애혁명', coverImage: '/images/albums/연애혁명_트와일라잇.webp', size: 'medium', slug: 'love-revolution-twilight' },
    { id: '13', title: '헤어지기 싫어', artist: '연애혁명', coverImage: '/images/albums/연애혁명_헤어지기 싫어.webp', size: 'small', slug: 'love-revolution-dont-leave' },
    { id: '14', title: '할로우드', artist: '연애혁명', coverImage: '/images/albums/연애혁명_할로우드.webp', size: 'small', slug: 'love-revolution-hallowed' },

    // 개짓 (5개)
    { id: '15', title: 'Florette', artist: '개짓', coverImage: '/images/albums/개짓_Florette.webp', size: 'medium', slug: 'gaejit-florette' },
    { id: '16', title: 'Burned', artist: '개짓', coverImage: '/images/albums/개짓_Burned.webp', size: 'small', slug: 'gaejit-burned' },
    { id: '17', title: '새 신발을 신고', artist: '개짓', coverImage: '/images/albums/개짓_새 신발을 신고.webp', size: 'medium', slug: 'gaejit-new-shoes' },
    { id: '18', title: 'If only', artist: '개짓', coverImage: '/images/albums/개짓_If only.webp', size: 'small', slug: 'gaejit-if-only' },
    { id: '19', title: '솔직하게 말했으면 됐잖아', artist: '개짓', coverImage: '/images/albums/개짓_솔직하게 말했으면 됐잖아.webp', size: 'medium', slug: 'gaejit-honest' },

    // 백XX (1개)
    { id: '20', title: 'Throne', artist: '백XX', coverImage: '/images/albums/백XX_Throne.webp', size: 'medium', slug: 'baekxx-throne' },

    // 작두 (2개)
    { id: '21', title: '악귀', artist: '작두', coverImage: '/images/albums/작두_악귀.webp', size: 'large', slug: 'jakdu-evil-spirit' },
    { id: '22', title: '풍수지탄', artist: '작두', coverImage: '/images/albums/작두_풍수지탄.webp', size: 'small', slug: 'jakdu-pungsujitan' },

    // 퀘스트지상주의 (1개)
    { id: '23', title: '퀘스트지상주의 OST', artist: '퀘스트지상주의', coverImage: '/images/albums/퀘스트지상주의 OST.webp', size: 'medium', slug: 'quest-supremacy-ost' },
];

// 초기 표시 개수
const INITIAL_DISPLAY_COUNT = 12;
const LOAD_MORE_COUNT = 8;

export const AlbumPuzzleGrid = () => {
    const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const displayedAlbums = useMemo(() => {
        return albumsData.slice(0, displayCount);
    }, [displayCount]);

    const hasMore = displayCount < albumsData.length;

    const handleLoadMore = () => {
        setDisplayCount(prev => Math.min(prev + LOAD_MORE_COUNT, albumsData.length));
    };

    const handleAlbumClick = (album: Album) => {
        // 앨범 상세 페이지로 이동
        window.location.href = `/albums/${album.slug}`;
    };

    // 사이즈에 따른 그리드 클래스
    const getSizeClasses = (size: Album['size']) => {
        switch (size) {
            case 'large':
                return 'col-span-2 row-span-2';
            case 'medium':
                return 'col-span-2 row-span-1';
            case 'small':
            default:
                return 'col-span-1 row-span-1';
        }
    };

    // 사이즈에 따른 aspect ratio
    const getAspectRatio = (size: Album['size']) => {
        switch (size) {
            case 'large':
                return 'aspect-square';
            case 'medium':
                return 'aspect-[2/1]';
            case 'small':
            default:
                return 'aspect-square';
        }
    };

    return (
        <section className="py-24 px-6 bg-[#0a0a0a] overflow-hidden">
            <div className="max-w-7xl mx-auto">
                {/* 섹션 헤더 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl 3xl:text-7xl font-black mb-6">
                        <span className="text-emerald-500">OST</span> 라이브러리
                    </h2>
                    <p className="text-white/50 text-base md:text-lg 3xl:text-2xl">
                        지금까지 제작한 작품들을 만나보세요
                    </p>
                </motion.div>

                {/* 퍼즐 그리드 - grid-auto-flow: dense로 빈 공간 자동 채움 */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3"
                    style={{ gridAutoFlow: 'dense' }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ staggerChildren: 0.05 }}
                >
                    {displayedAlbums.map((album, index) => (
                        <motion.div
                            key={album.id}
                            className={`relative overflow-hidden rounded-lg md:rounded-xl cursor-pointer ${getSizeClasses(album.size)}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.03 }}
                            onMouseEnter={() => setHoveredId(album.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => handleAlbumClick(album)}
                        >
                            {/* 앨범 커버 이미지 */}
                            <div className={`relative w-full h-full ${getAspectRatio(album.size)}`}>
                                {/* 플레이스홀더 배경 (이미지 로딩 전) */}
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />

                                {/* 실제 이미지 */}
                                <img
                                    src={album.coverImage}
                                    alt={album.title}
                                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                                        hoveredId === album.id
                                            ? 'opacity-100 scale-110 brightness-110'
                                            : 'opacity-50 scale-100'
                                    }`}
                                    loading="lazy"
                                    onError={(e) => {
                                        // 이미지 로드 실패 시 플레이스홀더 표시
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />

                                {/* 호버 오버레이 */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 ${
                                        hoveredId === album.id ? 'opacity-100' : 'opacity-0'
                                    }`}
                                />

                                {/* 앨범 정보 (호버 시 표시) */}
                                <div
                                    className={`absolute inset-0 flex flex-col justify-end p-3 md:p-4 transition-all duration-300 ${
                                        hoveredId === album.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                    }`}
                                >
                                    <h3 className={`font-bold text-white leading-tight mb-1 ${
                                        album.size === 'large' ? 'text-lg md:text-2xl' :
                                        album.size === 'medium' ? 'text-base md:text-xl' : 'text-sm md:text-base'
                                    }`}>
                                        {album.title}
                                    </h3>
                                    <p className={`text-white/60 ${
                                        album.size === 'large' ? 'text-sm md:text-base' : 'text-xs md:text-sm'
                                    }`}>
                                        {album.artist}
                                    </p>
                                </div>

                                {/* 하이라이트 보더 */}
                                <div
                                    className={`absolute inset-0 border-2 rounded-lg md:rounded-xl transition-all duration-300 ${
                                        hoveredId === album.id
                                            ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
                                            : 'border-transparent'
                                    }`}
                                />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* 더보기 버튼 */}
                {hasMore && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex justify-center mt-12"
                    >
                        <button
                            onClick={handleLoadMore}
                            className="group flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 rounded-full text-white/70 hover:text-white transition-all duration-300"
                        >
                            <span className="font-medium">더 많은 앨범 보기</span>
                            <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                            <span className="text-sm text-white/40">
                                ({displayCount}/{albumsData.length})
                            </span>
                        </button>
                    </motion.div>
                )}

                {/* 모두 표시됨 */}
                {!hasMore && displayCount > INITIAL_DISPLAY_COUNT && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-white/40 mt-8"
                    >
                        모든 앨범을 표시했습니다
                    </motion.p>
                )}
            </div>
        </section>
    );
};
