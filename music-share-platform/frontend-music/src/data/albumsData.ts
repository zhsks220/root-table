// 앨범 상세 데이터
export interface Credit {
    role: string;
    name: string;
}

export interface StreamingLinks {
    genie?: string;
    bugs?: string;
    melon?: string;
    spotify?: string;
    youtube?: string;
    appleMusic?: string;
}

export interface AlbumDetail {
    slug: string;
    title: string;
    artist: string;           // 웹툰명
    singers: string[];        // 실제 가수/보컬
    coverImage: string;
    releaseDate: string;
    genre: string;
    description: string;      // 앨범소개
    credits: Credit[];
    links: StreamingLinks;
}

// 23개 앨범 상세 데이터
export const albumsDetailData: AlbumDetail[] = [
    // ===== 외모지상주의 (3개) =====
    {
        slug: 'lookism',
        title: 'Lookism',
        artist: '외모지상주의',
        singers: ['Various Artists'],
        coverImage: '/images/albums/외지주_Lookism.webp',
        releaseDate: '2019.03.15',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 외모지상주의 OST 공개!

외모지상주의의 다양한 캐릭터들을 위한 테마곡들이 담긴 앨범입니다.
각 캐릭터의 개성과 스토리를 음악으로 표현했습니다.`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
            { role: 'Composed by', name: '최선' },
            { role: 'Arranged by', name: '최선' },
            { role: 'Mixing by', name: 'R31 SOUND' },
            { role: 'Mastering by', name: 'R31 SOUND' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
            genie: 'https://www.genie.co.kr/detail/albumInfo?axnm=',
            bugs: 'https://music.bugs.co.kr/album/',
            spotify: 'https://open.spotify.com/album/',
            youtube: 'https://www.youtube.com/watch?v=',
        },
    },
    {
        slug: 'lookism-busan',
        title: '부산',
        artist: '외모지상주의',
        singers: ['Various Artists'],
        coverImage: '/images/albums/외지주_부산.webp',
        releaseDate: '2020.05.20',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 외모지상주의 부산 편 OST!

부산을 배경으로 한 스토리의 웅장함과 긴장감을 담았습니다.`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
            genie: 'https://www.genie.co.kr/detail/albumInfo?axnm=',
        },
    },
    {
        slug: 'lookism-incheon',
        title: '인천',
        artist: '외모지상주의',
        singers: ['Various Artists'],
        coverImage: '/images/albums/외지주_인천.webp',
        releaseDate: '2020.08.12',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 외모지상주의 인천 편 OST!

인천을 배경으로 한 스토리의 분위기를 담았습니다.`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },

    // ===== 연애혁명 (11개) =====
    {
        slug: 'love-revolution-ost',
        title: '연애혁명 OST',
        artist: '연애혁명',
        singers: ['Various Artists'],
        coverImage: '/images/albums/연애혁명 OST.webp',
        releaseDate: '2019.11.01',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 연애혁명 메인 OST!

연애혁명의 달콤하고 설레는 감성을 담은 앨범입니다.`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },
    {
        slug: 'love-revolution-memory',
        title: 'The Memory',
        artist: '연애혁명',
        singers: ['미온', 'near'],
        coverImage: '/images/albums/연애혁명_The Memory.webp',
        releaseDate: '2020.09.02',
        genre: '애니메이션/웹툰, R&B/Soul',
        description: `네이버 웹툰 연애혁명 OST (민지와 자림) 공개!

네이버 웹툰 연애혁명의 민지와 자림 테마곡이 공개되었다.
감성적인 보컬의 near와, 지난 6월 시티 팝 앨범으로 솔로 데뷔한 미온의 콜라보가 성사되었다.
갈등의 끝에 서있는 민지와 자림을 담아낸 이번 앨범은,
작곡은 그동안 연애혁명의 수많은 OST들을 프로듀싱 한 최선이, 작사에는 웹툰 [내일]의 원작자 라마 작가가 참여해 완성도를 높였다.`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Album Art by', name: '232, 광운' },
            { role: 'Produced by', name: '최선' },
            { role: 'Composed by', name: '최선' },
            { role: 'Lyrics by', name: '라마' },
            { role: 'Arranged by', name: '최선' },
            { role: 'Acoustic Guitar by', name: 'LIZRO' },
            { role: 'Chorus by', name: '최선' },
            { role: 'Recorded by', name: 'R31 SOUND' },
            { role: 'Mixing by', name: 'R31 SOUND' },
            { role: 'Mastering by', name: 'R31 SOUND' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
            genie: 'https://www.genie.co.kr/detail/albumInfo?axnm=',
            bugs: 'https://music.bugs.co.kr/album/',
        },
    },
    {
        slug: 'love-revolution-back',
        title: '내가 모르는 뒷모습',
        artist: '연애혁명',
        singers: ['Various Artists'],
        coverImage: '/images/albums/연애혁명_내가 모르는 뒷모습.webp',
        releaseDate: '2020.03.15',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 연애혁명 OST - 내가 모르는 뒷모습`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },
    {
        slug: 'love-revolution-dilemma',
        title: '딜레마',
        artist: '연애혁명',
        singers: ['Various Artists'],
        coverImage: '/images/albums/연애혁명_딜레마.webp',
        releaseDate: '2020.04.10',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 연애혁명 OST - 딜레마`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },
    {
        slug: 'love-revolution-broken',
        title: '망가져',
        artist: '연애혁명',
        singers: ['Various Artists'],
        coverImage: '/images/albums/연애혁명_망가져.webp',
        releaseDate: '2020.05.08',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 연애혁명 OST - 망가져`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },
    {
        slug: 'love-revolution-sandcastle',
        title: '모래성',
        artist: '연애혁명',
        singers: ['Various Artists'],
        coverImage: '/images/albums/연애혁명_모래성.webp',
        releaseDate: '2020.06.12',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 연애혁명 OST - 모래성`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },
    {
        slug: 'love-revolution-title',
        title: '연애혁명',
        artist: '연애혁명',
        singers: ['Various Artists'],
        coverImage: '/images/albums/연애혁명_연애혁명.webp',
        releaseDate: '2019.08.20',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 연애혁명 메인 테마곡`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },
    {
        slug: 'love-revolution-eclipse',
        title: '이클립스',
        artist: '연애혁명',
        singers: ['Various Artists'],
        coverImage: '/images/albums/연애혁명_이클립스.webp',
        releaseDate: '2020.07.15',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 연애혁명 OST - 이클립스`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },
    {
        slug: 'love-revolution-twilight',
        title: '트와일라잇',
        artist: '연애혁명',
        singers: ['Various Artists'],
        coverImage: '/images/albums/연애혁명_트와일라잇.webp',
        releaseDate: '2020.08.20',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 연애혁명 OST - 트와일라잇`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },
    {
        slug: 'love-revolution-dont-leave',
        title: '헤어지기 싫어',
        artist: '연애혁명',
        singers: ['Various Artists'],
        coverImage: '/images/albums/연애혁명_헤어지기 싫어.webp',
        releaseDate: '2020.10.05',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 연애혁명 OST - 헤어지기 싫어`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },
    {
        slug: 'love-revolution-hallowed',
        title: '할로우드',
        artist: '연애혁명',
        singers: ['Various Artists'],
        coverImage: '/images/albums/연애혁명_할로우드.webp',
        releaseDate: '2020.11.10',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 연애혁명 OST - 할로우드`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },

    // ===== 개짓 (5개) =====
    {
        slug: 'gaejit-florette',
        title: 'Florette',
        artist: '개짓',
        singers: ['Various Artists'],
        coverImage: '/images/albums/개짓_Florette.webp',
        releaseDate: '2021.03.15',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 개짓 OST - Florette`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },
    {
        slug: 'gaejit-burned',
        title: 'Burned',
        artist: '개짓',
        singers: ['Various Artists'],
        coverImage: '/images/albums/개짓_Burned.webp',
        releaseDate: '2021.04.20',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 개짓 OST - Burned`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },
    {
        slug: 'gaejit-new-shoes',
        title: '새 신발을 신고',
        artist: '개짓',
        singers: ['Various Artists'],
        coverImage: '/images/albums/개짓_새 신발을 신고.webp',
        releaseDate: '2021.05.15',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 개짓 OST - 새 신발을 신고`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },
    {
        slug: 'gaejit-if-only',
        title: 'If only',
        artist: '개짓',
        singers: ['Various Artists'],
        coverImage: '/images/albums/개짓_If only.webp',
        releaseDate: '2021.06.10',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 개짓 OST - If only`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },
    {
        slug: 'gaejit-honest',
        title: '솔직하게 말했으면 됐잖아',
        artist: '개짓',
        singers: ['Various Artists'],
        coverImage: '/images/albums/개짓_솔직하게 말했으면 됐잖아.webp',
        releaseDate: '2021.07.20',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 개짓 OST - 솔직하게 말했으면 됐잖아`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },

    // ===== 백XX (1개) =====
    {
        slug: 'baekxx-throne',
        title: 'Throne',
        artist: '백XX',
        singers: ['Various Artists'],
        coverImage: '/images/albums/백XX_Throne.webp',
        releaseDate: '2022.01.15',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 백XX OST - Throne`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },

    // ===== 작두 (2개) =====
    {
        slug: 'jakdu-evil-spirit',
        title: '악귀',
        artist: '작두',
        singers: ['Various Artists'],
        coverImage: '/images/albums/작두_악귀.webp',
        releaseDate: '2022.05.10',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 작두 OST - 악귀

작두의 어둡고 긴장감 넘치는 분위기를 담은 OST입니다.`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },
    {
        slug: 'jakdu-pungsujitan',
        title: '풍수지탄',
        artist: '작두',
        singers: ['Various Artists'],
        coverImage: '/images/albums/작두_풍수지탄.webp',
        releaseDate: '2022.06.15',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 작두 OST - 풍수지탄`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },

    // ===== 퀘스트지상주의 (1개) =====
    {
        slug: 'quest-supremacy-ost',
        title: '퀘스트지상주의 OST',
        artist: '퀘스트지상주의',
        singers: ['Various Artists'],
        coverImage: '/images/albums/퀘스트지상주의 OST.webp',
        releaseDate: '2023.03.20',
        genre: '애니메이션/웹툰, OST',
        description: `네이버 웹툰 퀘스트지상주의 메인 OST!

퀘스트지상주의의 웅장하고 박진감 넘치는 세계관을 담은 OST입니다.`,
        credits: [
            { role: 'Executive Produced by', name: '최선 @ ROUTE LABEL' },
            { role: 'Management by', name: 'ROUTE LABEL' },
            { role: 'Produced by', name: '최선' },
        ],
        links: {
            melon: 'https://www.melon.com/album/detail.htm?albumId=',
        },
    },
];

// slug로 앨범 찾기
export const getAlbumBySlug = (slug: string): AlbumDetail | undefined => {
    return albumsDetailData.find(album => album.slug === slug);
};
