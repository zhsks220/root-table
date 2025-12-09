import { pool } from './index';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'tracks';

// 간단한 무음 MP3 파일 생성 (테스트용)
function createDummyMp3(): Buffer {
  // 최소한의 유효한 MP3 헤더 + 프레임 (약 1KB)
  const header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, // MP3 프레임 헤더
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  // 더미 데이터로 파일 크기 늘리기 (약 100KB)
  const frames = Buffer.alloc(100 * 1024, 0);
  return Buffer.concat([header, frames]);
}

async function seedWithStorage() {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding database with dummy data and storage...\n');

    await client.query('BEGIN');

    // 1. 관리자 계정 확인/생성
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@test.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminHash = await bcrypt.hash(adminPassword, 10);

    const adminResult = await client.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2
       RETURNING id`,
      [adminEmail, adminHash, '관리자', 'admin']
    );
    const adminId = adminResult.rows[0].id;
    console.log('✅ Admin user:', adminEmail);

    // 2. 기존 데이터 정리
    await client.query('DELETE FROM download_logs');
    await client.query('DELETE FROM user_tracks');
    await client.query('DELETE FROM invitation_tracks');
    await client.query('DELETE FROM invitations WHERE is_used = FALSE');
    await client.query('DELETE FROM tracks');
    console.log('✅ Cleaned existing data');

    // 3. Storage에서 기존 파일 삭제
    const { data: existingFiles } = await supabase.storage.from(BUCKET_NAME).list();
    if (existingFiles && existingFiles.length > 0) {
      const filePaths = existingFiles.map(f => f.name);
      await supabase.storage.from(BUCKET_NAME).remove(filePaths);
      console.log(`✅ Removed ${filePaths.length} existing files from storage`);
    }

    // 4. 더미 음원 생성 및 업로드
    const tracks = [
      { title: 'Summer Breeze', artist: 'The Acoustic Band', album: 'Summer Collection', duration: 180 },
      { title: 'Night Drive', artist: 'Electric Dreams', album: 'Midnight Sessions', duration: 240 },
      { title: 'Mountain Echo', artist: 'Nature Sounds', album: 'Ambient Vol.1', duration: 210 },
      { title: 'Coffee Shop Jazz', artist: 'Jazz Trio', album: 'Cafe Vibes', duration: 195 },
      { title: 'Electronic Pulse', artist: 'Synth Wave', album: 'Digital Era', duration: 225 },
      { title: '봄날의 기억', artist: 'ROUTELABEL Artist', album: '사계', duration: 200 },
      { title: '여름밤의 꿈', artist: 'ROUTELABEL Artist', album: '사계', duration: 185 },
      { title: '가을 산책', artist: 'ROUTELABEL Artist', album: '사계', duration: 220 },
      { title: '겨울 이야기', artist: 'ROUTELABEL Artist', album: '사계', duration: 250 },
      { title: 'Urban Groove', artist: 'City Beats', album: 'Metropolitan', duration: 190 },
    ];

    const trackIds: string[] = [];
    const dummyMp3 = createDummyMp3();

    for (const track of tracks) {
      const fileKey = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.mp3`;

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileKey, dummyMp3, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error(`❌ Failed to upload ${track.title}:`, uploadError.message);
        continue;
      }

      // DB에 저장
      const result = await client.query(
        `INSERT INTO tracks (title, artist, album, duration, file_key, file_size, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [track.title, track.artist, track.album, track.duration, fileKey, dummyMp3.length, adminId]
      );
      trackIds.push(result.rows[0].id);
      console.log(`  📁 Uploaded: ${track.title}`);
    }
    console.log(`✅ Created ${trackIds.length} tracks with storage files`);

    // 5. 더미 사용자 생성
    const users = [
      { email: 'user1@test.com', name: '김철수', password: 'user123' },
      { email: 'user2@test.com', name: '이영희', password: 'user123' },
      { email: 'user3@test.com', name: '박민수', password: 'user123' },
    ];

    const userIds: string[] = [];

    for (const user of users) {
      const hash = await bcrypt.hash(user.password, 10);
      const result = await client.query(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, 'user')
         ON CONFLICT (email) DO UPDATE SET password_hash = $2, name = $3
         RETURNING id`,
        [user.email, hash, user.name]
      );
      userIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${users.length} dummy users`);

    // 6. 사용자-음원 매핑 생성
    // 사용자 1: 첫 3개 트랙 접근
    for (let i = 0; i < Math.min(3, trackIds.length); i++) {
      await client.query(
        `INSERT INTO user_tracks (user_id, track_id, can_download)
         VALUES ($1, $2, TRUE)
         ON CONFLICT DO NOTHING`,
        [userIds[0], trackIds[i]]
      );
    }

    // 사용자 2: 4~7번째 트랙 접근
    for (let i = 3; i < Math.min(7, trackIds.length); i++) {
      await client.query(
        `INSERT INTO user_tracks (user_id, track_id, can_download)
         VALUES ($1, $2, TRUE)
         ON CONFLICT DO NOTHING`,
        [userIds[1], trackIds[i]]
      );
    }

    // 사용자 3: 마지막 3개 트랙 접근
    for (let i = Math.max(0, trackIds.length - 3); i < trackIds.length; i++) {
      await client.query(
        `INSERT INTO user_tracks (user_id, track_id, can_download)
         VALUES ($1, $2, TRUE)
         ON CONFLICT DO NOTHING`,
        [userIds[2], trackIds[i]]
      );
    }
    console.log('✅ Created user-track mappings');

    // 7. 테스트용 초대 코드 생성
    const inviteCodes = [];
    for (let i = 0; i < 3; i++) {
      const code = `TEST-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const inviteResult = await client.query(
        `INSERT INTO invitations (code, created_by, expires_at)
         VALUES ($1, $2, $3)
         RETURNING id, code`,
        [code, adminId, expiresAt]
      );

      const trackCount = 2 + i;
      for (let j = 0; j < Math.min(trackCount, trackIds.length); j++) {
        await client.query(
          `INSERT INTO invitation_tracks (invitation_id, track_id)
           VALUES ($1, $2)`,
          [inviteResult.rows[0].id, trackIds[j % trackIds.length]]
        );
      }

      inviteCodes.push({ code, trackCount });
    }
    console.log('✅ Created test invitation codes');

    await client.query('COMMIT');

    // 결과 출력
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEED WITH STORAGE COMPLETED!');
    console.log('='.repeat(60));

    console.log('\n📋 TEST ACCOUNTS:');
    console.log('─'.repeat(40));
    console.log(`  Admin:  ${adminEmail} / ${adminPassword}`);
    users.forEach((u, i) => {
      console.log(`  User ${i+1}: ${u.email} / ${u.password}`);
    });

    console.log('\n🎫 INVITATION CODES:');
    console.log('─'.repeat(40));
    inviteCodes.forEach(inv => {
      console.log(`  ${inv.code} (${inv.trackCount} tracks)`);
    });

    console.log('\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

seedWithStorage();
