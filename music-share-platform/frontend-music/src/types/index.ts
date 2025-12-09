export interface Track {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration?: number;
    file_size?: number;
    created_at: string;
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
