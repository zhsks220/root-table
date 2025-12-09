import { pool } from './index';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding database with dummy data...\n');

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

    // 2. 더미 음원 생성 (로컬 파일 없이 DB만)
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

    // 기존 트랙 삭제 (초기화)
    await client.query('DELETE FROM download_logs');
    await client.query('DELETE FROM user_tracks');
    await client.query('DELETE FROM invitation_tracks');
    await client.query('DELETE FROM invitations WHERE is_used = FALSE');
    await client.query('DELETE FROM tracks');

    for (const track of tracks) {
      const fileKey = `tracks/dummy_${crypto.randomBytes(4).toString('hex')}.mp3`;
      const result = await client.query(
        `INSERT INTO tracks (title, artist, album, duration, file_key, file_size, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [track.title, track.artist, track.album, track.duration, fileKey, 5000000, adminId]
      );
      trackIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${tracks.length} dummy tracks`);

    // 3. 더미 사용자 생성
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

    // 4. 초대 및 사용자-음원 매핑 생성
    // 사용자 1: 첫 3개 트랙 접근
    for (let i = 0; i < 3; i++) {
      await client.query(
        `INSERT INTO user_tracks (user_id, track_id, can_download)
         VALUES ($1, $2, TRUE)
         ON CONFLICT DO NOTHING`,
        [userIds[0], trackIds[i]]
      );
    }

    // 사용자 2: 4~7번째 트랙 접근
    for (let i = 3; i < 7; i++) {
      await client.query(
        `INSERT INTO user_tracks (user_id, track_id, can_download)
         VALUES ($1, $2, TRUE)
         ON CONFLICT DO NOTHING`,
        [userIds[1], trackIds[i]]
      );
    }

    // 사용자 3: 마지막 3개 트랙 접근
    for (let i = 7; i < 10; i++) {
      await client.query(
        `INSERT INTO user_tracks (user_id, track_id, can_download)
         VALUES ($1, $2, TRUE)
         ON CONFLICT DO NOTHING`,
        [userIds[2], trackIds[i]]
      );
    }
    console.log('✅ Created user-track mappings');

    // 5. 사용 가능한 초대 코드 생성 (새 사용자 테스트용)
    const inviteCodes = [];
    for (let i = 0; i < 3; i++) {
      const code = `TEST-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30일 후 만료

      const inviteResult = await client.query(
        `INSERT INTO invitations (code, created_by, expires_at)
         VALUES ($1, $2, $3)
         RETURNING id, code`,
        [code, adminId, expiresAt]
      );

      // 각 초대에 2-3개 트랙 할당
      const trackCount = 2 + i;
      for (let j = 0; j < trackCount; j++) {
        await client.query(
          `INSERT INTO invitation_tracks (invitation_id, track_id)
           VALUES ($1, $2)`,
          [inviteResult.rows[0].id, trackIds[j % trackIds.length]]
        );
      }

      inviteCodes.push({ code, trackCount });
    }
    console.log('✅ Created test invitation codes');

    // 6. 더미 다운로드 로그 생성
    const now = new Date();
    for (let i = 0; i < 15; i++) {
      const randomUserIdx = Math.floor(Math.random() * userIds.length);
      const randomTrackIdx = Math.floor(Math.random() * trackIds.length);
      const downloadDate = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // 최근 7일

      await client.query(
        `INSERT INTO download_logs (user_id, track_id, ip_address, user_agent, downloaded_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userIds[randomUserIdx],
          trackIds[randomTrackIdx],
          '127.0.0.1',
          'Mozilla/5.0 Test Browser',
          downloadDate
        ]
      );
    }
    console.log('✅ Created 15 download logs');

    await client.query('COMMIT');

    // 결과 출력
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));

    console.log('\n📋 TEST ACCOUNTS:');
    console.log('─'.repeat(40));
    console.log(`  Admin:  ${adminEmail} / ${adminPassword}`);
    users.forEach((u, i) => {
      console.log(`  User ${i+1}: ${u.email} / ${u.password}`);
    });

    console.log('\n🎫 AVAILABLE INVITATION CODES:');
    console.log('─'.repeat(40));
    inviteCodes.forEach(inv => {
      console.log(`  ${inv.code} (${inv.trackCount} tracks)`);
      console.log(`  → http://localhost:3002/invite/${inv.code}`);
    });

    console.log('\n🌐 URLS:');
    console.log('─'.repeat(40));
    console.log('  Main Site:  http://localhost:3000');
    console.log('  Music Site: http://localhost:3002');
    console.log('  Admin Site: http://localhost:3003');
    console.log('  API Health: http://localhost:3001/health');

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

seed();
