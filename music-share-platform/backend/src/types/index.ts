import { Request } from 'express';

// JWT 페이로드
export interface JWTPayload {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'partner';
  partnerId?: string;
}

// 인증된 요청
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// 사용자
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'user' | 'admin' | 'partner';
  invitation_code?: string;
  created_at: Date;
  updated_at: Date;
}

// 초대
export interface Invitation {
  id: string;
  code: string;
  created_by?: string;
  is_used: boolean;
  used_by?: string;
  expires_at?: Date;
  created_at: Date;
}

// 음원
export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  file_key: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: Date;
  updated_at: Date;
}

// 사용자-음원 매핑
export interface UserTrack {
  id: string;
  user_id: string;
  track_id: string;
  invitation_id?: string;
  can_download: boolean;
  created_at: Date;
}
