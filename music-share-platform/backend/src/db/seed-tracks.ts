import { pool } from './index';

const dummyTracks = [
  {
    title: 'Summer Breeze',
    artist: 'The Acoustic Band',
    album: 'Seasonal Vibes',
    file_key: 'track_1.mp3',
    duration: 180,
  },
  {
    title: 'Night Drive',
    artist: 'Electric Dreams',
    album: 'Urban Nights',
    file_key: 'track_2.mp3',
    duration: 240,
  },
  {
    title: 'Mountain Echo',
    artist: 'Nature Sounds',
    album: 'Natural Harmony',
    file_key: 'track_3.mp3',
    duration: 210,
  },
  {
    title: 'Coffee Shop Jazz',
    artist: 'Jazz Trio',
    album: 'Smooth Sessions',
    file_key: 'track_4.mp3',
    duration: 195,
  },
  {
    title: 'Electronic Pulse',
    artist: 'Synth Wave',
    album: 'Digital Era',
    file_key: 'track_5.mp3',
    duration: 225,
  },
];

async function seedTracks() {
  try {
    console.log('🎵 Seeding dummy tracks...');

    for (const track of dummyTracks) {
      await pool.query(
        `INSERT INTO tracks (title, artist, album, file_key, duration)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [track.title, track.artist, track.album, track.file_key, track.duration]
      );
      console.log(`✅ Added: ${track.title} - ${track.artist}`);
    }

    console.log('');
    console.log('✅ All dummy tracks seeded successfully!');
    console.log('');
    console.log('To test, create an invitation and assign tracks to it.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedTracks();
