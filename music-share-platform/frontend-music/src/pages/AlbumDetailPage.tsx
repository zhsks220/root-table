import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Disc3, ChevronDown } from 'lucide-react';
import { SiSpotify, SiApplemusic, SiYoutubemusic } from 'react-icons/si';
import { getAlbumBySlug } from '../data/albumsData';

// 스트리밍 서비스 설정 - 글로벌은 react-icons, 한국은 로고 이미지
const streamingServices = {
    melon: {
        name: '멜론',
        color: 'bg-zinc-800 hover:bg-zinc-700',
        logo: '/images/streaming/melon.svg',
    },
    genie: {
        name: '지니',
        color: 'bg-zinc-800 hover:bg-zinc-700',
        logo: '/images/streaming/genie.svg',
    },
    bugs: {
        name: '벅스',
        color: 'bg-zinc-800 hover:bg-zinc-700',
        logo: '/images/streaming/bugs.svg',
    },
    spotify: {
        name: 'Spotify',
        color: 'bg-zinc-800 hover:bg-zinc-700',
        Icon: SiSpotify,
        iconColor: 'text-[#1DB954]',
    },
    youtubeMusic: {
        name: 'YouTube Music',
        color: 'bg-zinc-800 hover:bg-zinc-700',
        Icon: SiYoutubemusic,
        iconColor: 'text-[#FF0000]',
    },
    appleMusic: {
        name: 'Apple Music',
        color: 'bg-zinc-800 hover:bg-zinc-700',
        Icon: SiApplemusic,
        iconColor: 'text-[#FA243C]',
    },
};

type ServiceKey = keyof typeof streamingServices;

const CREDITS_PREVIEW_COUNT = 10;

const AlbumDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [isCreditsExpanded, setIsCreditsExpanded] = useState(false);

    // 페이지 진입 시 스크롤 맨 위로
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    const album = slug ? getAlbumBySlug(slug) : undefined;

    if (!album) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">앨범을 찾을 수 없습니다</h1>
                    <button
                        onClick={() => navigate('/')}
                        className="text-emerald-500 hover:text-emerald-400 flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        메인으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            {/* 헤더 - 뒤로가기 */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>돌아가기</span>
                    </button>
                </div>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="pt-20 pb-16">
                <div className="max-w-5xl mx-auto px-4">
                    {/* 앨범 정보 섹션 */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row gap-8 mb-12"
                    >
                        {/* 앨범 커버 */}
                        <div className="flex-shrink-0 mx-auto md:mx-0">
                            <div className="w-64 h-64 md:w-80 md:h-80 rounded-lg overflow-hidden shadow-2xl shadow-emerald-500/10">
                                <img
                                    src={album.coverImage}
                                    alt={album.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* 앨범 기본 정보 */}
                        <div className="flex-1 flex flex-col justify-center">
                            <span className="text-emerald-500 text-sm font-medium mb-2">[OST]</span>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">{album.title}</h1>
                            <p className="text-xl text-emerald-400 mb-4">
                                {album.singers.join(', ')}
                            </p>

                            <div className="space-y-2 text-white/60 text-sm">
                                <p>
                                    <span className="text-white/40 mr-2">발매일</span>
                                    {album.releaseDate}
                                </p>
                                <p>
                                    <span className="text-white/40 mr-2">장르</span>
                                    {album.genre}
                                </p>
                                <p>
                                    <span className="text-white/40 mr-2">발매사</span>
                                    {album.artist}
                                </p>
                                <p>
                                    <span className="text-white/40 mr-2">기획사</span>
                                    ROUTELABEL
                                </p>
                            </div>
                        </div>
                    </motion.section>

                    {/* 스트리밍 링크 버튼들 */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex justify-center gap-4 mb-12"
                    >
                        {Object.entries(album.links).map(([key, url]) => {
                            if (!url) return null;
                            const service = streamingServices[key as ServiceKey];
                            if (!service) return null;

                            const hasIcon = 'Icon' in service;

                            return (
                                <a
                                    key={key}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={service.name}
                                    className={`${service.color} w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg`}
                                >
                                    {hasIcon ? (
                                        <service.Icon className={`w-8 h-8 ${'iconColor' in service ? service.iconColor : 'text-white'}`} />
                                    ) : (
                                        <img
                                            src={(service as { logo: string }).logo}
                                            alt={service.name}
                                            className="w-12 h-12 object-contain"
                                        />
                                    )}
                                </a>
                            );
                        })}
                    </motion.section>

                    {/* 앨범소개 섹션 */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-12"
                    >
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Disc3 className="w-5 h-5 text-emerald-500" />
                            앨범소개
                        </h2>
                        <div className="bg-white/5 rounded-xl p-6">
                            <p className="text-white/80 whitespace-pre-line leading-relaxed">
                                {album.description}
                            </p>
                        </div>
                    </motion.section>

                    {/* 크레딧 섹션 */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2 className="text-xl font-bold mb-4">[Credit]</h2>
                        <div className="bg-white/5 rounded-xl p-6">
                            <div className="space-y-2">
                                {(isCreditsExpanded ? album.credits : album.credits.slice(0, CREDITS_PREVIEW_COUNT)).map((credit, index) => (
                                    <p key={index} className={`text-white/70 ${credit.role.startsWith('[') ? 'mt-4 pt-4 border-t border-white/10 first:mt-0 first:pt-0 first:border-0' : ''}`}>
                                        {credit.role.startsWith('[') ? (
                                            <span className="text-emerald-400 font-semibold">{credit.role}</span>
                                        ) : (
                                            <>
                                                <span className="text-white/50">{credit.role}</span>{' '}
                                                <span className="text-white">{credit.name}</span>
                                            </>
                                        )}
                                    </p>
                                ))}
                            </div>

                            {album.credits.length > CREDITS_PREVIEW_COUNT && (
                                <button
                                    onClick={() => setIsCreditsExpanded(!isCreditsExpanded)}
                                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 text-white/60 hover:text-white transition-colors border-t border-white/10"
                                >
                                    <span>{isCreditsExpanded ? '접기' : `전체 크레딧 보기 (${album.credits.length}개)`}</span>
                                    <ChevronDown className={`w-5 h-5 transition-transform ${isCreditsExpanded ? 'rotate-180' : ''}`} />
                                </button>
                            )}
                        </div>
                    </motion.section>
                </div>
            </main>

            {/* 푸터 */}
            <footer className="border-t border-white/10 py-8">
                <div className="max-w-5xl mx-auto px-4 text-center text-white/40 text-sm">
                    <p>&copy; {new Date().getFullYear()} ROUTELABEL. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default AlbumDetailPage;
