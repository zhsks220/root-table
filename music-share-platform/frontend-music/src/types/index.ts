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
