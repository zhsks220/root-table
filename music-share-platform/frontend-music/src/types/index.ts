export interface Category {
    id: string;
    name: string;
    name_en: string;
    slug: string;
    parent_id?: string;
    description?: string;
    icon?: string;
    color?: string;
    display_order: number;
    track_count?: number;
    children?: Category[];
}

export interface TrackCategory {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    is_primary: boolean;
}

export interface Track {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration?: number;
    file_size?: number;
    created_at: string;
    // 확장 필드
    mood?: string;
    language?: string;
    bpm?: number;
    release_year?: number;
    is_explicit?: boolean;
    description?: string;
    tags?: string[];
    categories?: TrackCategory[];
}

export interface MoodOption {
    value: string;
    label: string;
    label_en: string;
}

export interface LanguageOption {
    value: string;
    label: string;
    label_en: string;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface TrackSearchParams {
    q?: string;
    category?: string;
    mood?: string;
    language?: string;
    sort?: 'created_at' | 'title' | 'artist' | 'album' | 'duration';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface Invitation {
    id: string;
    code: string;
    is_used: boolean;
    expires_at?: string;
    created_at: string;
    used_by_email?: string;
    track_count: number;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
    track_count: number;
}

// 웹툰 프로젝트 타입
export interface WebToonProject {
    id: string;
    title: string;
    description?: string;
    cover_image_url?: string;
    cover_image_key?: string;
    status: 'draft' | 'published' | 'archived';
    created_by: string;
    creator_name?: string;
    scene_count?: number;
    created_at: string;
    updated_at: string;
    scenes?: WebToonScene[];
}

export interface WebToonMemoNote {
    id: string;
    scene_id: string;
    content: string;
    position_x: number; // px from left
    position_y: number; // px from top (scroll position)
    width: number;
    height: number;
}

export interface WebToonScene {
    id: string;
    project_id: string;
    image_url: string;
    thumbnail_url?: string;
    image_key?: string;
    thumbnail_key?: string;
    display_order: number;
    memo?: string;
    scroll_trigger_position: number; // 0-100%
    created_at: string;
    updated_at: string;
    tracks?: SceneTrack[];
    memoNotes?: WebToonMemoNote[]; // 드래그 가능한 메모들
}

export interface SceneTrack {
    id: string;
    scene_id: string;
    track_id: string;
    display_order: number;
    created_at: string;
    track?: Track; // Full track info from join
}

export interface WebToonProjectSearchParams {
    q?: string;
    status?: 'draft' | 'published' | 'archived';
    page?: number;
    limit?: number;
}
