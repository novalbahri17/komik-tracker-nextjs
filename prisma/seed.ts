import { PrismaClient, UserRole, ActionType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Default Master Data
const defaultTypes = [
  { name: 'Manga', slug: 'manga', color: '#ef4444' },
  { name: 'Manhua', slug: 'manhua', color: '#f97316' },
  { name: 'Manhwa', slug: 'manhwa', color: '#eab308' },
  { name: 'Webtoon', slug: 'webtoon', color: '#84cc16' },
  { name: 'Comic', slug: 'comic', color: '#22c55e' },
  { name: 'Graphic Novel', slug: 'graphic-novel', color: '#14b8a6' },
  { name: 'Doujinshi', slug: 'doujinshi', color: '#06b6d4' },
  { name: 'One-shot', slug: 'one-shot', color: '#0ea5e9' },
  { name: 'Anthology', slug: 'anthology', color: '#3b82f6' },
  { name: 'Light Novel', slug: 'light-novel', color: '#6366f1' },
  { name: 'Illustrated Book', slug: 'illustrated-book', color: '#8b5cf6' },
  { name: 'Art Book', slug: 'art-book', color: '#a855f7' },
  { name: '4-Koma', slug: '4-koma', color: '#d946ef' },
  { name: 'Web Comic', slug: 'web-comic', color: '#ec4899' },
  { name: 'Digital Comic', slug: 'digital-comic', color: '#f43f5e' },
  { name: 'Indie Comic', slug: 'indie-comic', color: '#64748b' },
  { name: 'Superhero', slug: 'superhero', color: '#dc2626' },
  { name: 'Fantasy', slug: 'fantasy', color: '#059669' },
  { name: 'Sci-Fi', slug: 'sci-fi', color: '#2563eb' },
  { name: 'Horror', slug: 'horror', color: '#7c3aed' },
  { name: 'Romance', slug: 'romance', color: '#db2777' },
  { name: 'Comedy', slug: 'comedy', color: '#ca8a04' },
  { name: 'Drama', slug: 'drama', color: '#0891b2' },
  { name: 'Action', slug: 'action', color: '#ea580c' },
  { name: 'Slice of Life', slug: 'slice-of-life', color: '#16a34a' }
];

const defaultStatuses = [
  { name: 'Reading', slug: 'reading', color: '#3b82f6' },
  { name: 'Completed', slug: 'completed', color: '#22c55e' },
  { name: 'On Hold', slug: 'on-hold', color: '#f59e0b' },
  { name: 'Dropped', slug: 'dropped', color: '#ef4444' },
  { name: 'Plan to Read', slug: 'plan-to-read', color: '#8b5cf6' },
  { name: 'Currently Reading', slug: 'currently-reading', color: '#06b6d4' },
  { name: 'Want to Read', slug: 'want-to-read', color: '#a855f7' },
  { name: 'Paused', slug: 'paused', color: '#f97316' },
  { name: 'Finished', slug: 'finished', color: '#10b981' },
  { name: 'Abandoned', slug: 'abandoned', color: '#dc2626' },
  { name: 'Re-reading', slug: 're-reading', color: '#7c3aed' },
  { name: 'Bookmark', slug: 'bookmark', color: '#ec4899' },
  { name: 'Favorite', slug: 'favorite', color: '#f43f5e' },
  { name: 'Interested', slug: 'interested', color: '#14b8a6' },
  { name: 'Not Interested', slug: 'not-interested', color: '#6b7280' },
  { name: 'Wait for Chapters', slug: 'wait-for-chapters', color: '#f59e0b' },
  { name: 'Following', slug: 'following', color: '#059669' },
  { name: 'Catch Up', slug: 'catch-up', color: '#0ea5e9' },
  { name: 'Pending', slug: 'pending', color: '#84cc16' },
  { name: 'Inactive', slug: 'inactive', color: '#64748b' },
  { name: 'Active', slug: 'active', color: '#22c55e' },
  { name: 'Archived', slug: 'archived', color: '#374151' }
];

const defaultPlatforms = [
  { name: 'LINE WEBTOON', slug: 'line-webtoon', color: '#00dc64' },
  { name: 'Komiku', slug: 'komiku', color: '#ff6b35' },
  { name: 'Tapas', slug: 'tapas', color: '#ff4757' },
  { name: 'MangaPlus', slug: 'mangaplus', color: '#0066cc' },
  { name: 'Mangadex', slug: 'mangadex', color: '#ff6b9d' },
  { name: 'Shinigami', slug: 'shinigami', color: '#2f3542' }
];

const defaultGenres = [
  { name: 'Action', slug: 'action', color: '#ef4444' },
  { name: 'Adventure', slug: 'adventure', color: '#f97316' },
  { name: 'Comedy', slug: 'comedy', color: '#eab308' },
  { name: 'Drama', slug: 'drama', color: '#84cc16' },
  { name: 'Fantasy', slug: 'fantasy', color: '#22c55e' },
  { name: 'Horror', slug: 'horror', color: '#14b8a6' },
  { name: 'Mystery', slug: 'mystery', color: '#06b6d4' },
  { name: 'Romance', slug: 'romance', color: '#0ea5e9' },
  { name: 'Sci-Fi', slug: 'sci-fi', color: '#3b82f6' },
  { name: 'Slice of Life', slug: 'slice-of-life', color: '#6366f1' },
  { name: 'Sports', slug: 'sports', color: '#8b5cf6' },
  { name: 'Supernatural', slug: 'supernatural', color: '#a855f7' },
  { name: 'Thriller', slug: 'thriller', color: '#d946ef' },
  { name: 'Psychological', slug: 'psychological', color: '#ec4899' },
  { name: 'Historical', slug: 'historical', color: '#f43f5e' },
  { name: 'Mecha', slug: 'mecha', color: '#64748b' },
  { name: 'School Life', slug: 'school-life', color: '#dc2626' },
  { name: 'Shounen', slug: 'shounen', color: '#059669' },
  { name: 'Shoujo', slug: 'shoujo', color: '#2563eb' },
  { name: 'Seinen', slug: 'seinen', color: '#7c3aed' },
  { name: 'Josei', slug: 'josei', color: '#db2777' },
  { name: 'Isekai', slug: 'isekai', color: '#ca8a04' },
  { name: 'Reincarnation', slug: 'reincarnation', color: '#0891b2' },
  { name: 'Game', slug: 'game', color: '#ea580c' },
  { name: 'Harem', slug: 'harem', color: '#16a34a' },
  { name: 'Ecchi', slug: 'ecchi', color: '#be123c' },
  { name: 'Magic', slug: 'magic', color: '#c2410c' },
  { name: 'Demons', slug: 'demons', color: '#15803d' },
  { name: 'Vampire', slug: 'vampire', color: '#1e40af' },
  { name: 'Angels', slug: 'angels', color: '#7e22ce' },
  { name: 'Ghosts', slug: 'ghosts', color: '#be185d' },
  { name: 'Monster Girls', slug: 'monster-girls', color: '#b91c1c' },
  { name: 'Martial Arts', slug: 'martial-arts', color: '#166534' },
  { name: 'Samurai', slug: 'samurai', color: '#1d4ed8' },
  { name: 'Ninja', slug: 'ninja', color: '#7c2d12' },
  { name: 'Pirate', slug: 'pirate', color: '#422006' },
  { name: 'Space', slug: 'space', color: '#14532d' },
  { name: 'Time Travel', slug: 'time-travel', color: '#1e3a8a' },
  { name: 'Virtual Reality', slug: 'virtual-reality', color: '#581c87' },
  { name: 'Post-Apocalyptic', slug: 'post-apocalyptic', color: '#831843' },
  { name: 'Dystopian', slug: 'dystopian', color: '#7f1d1d' },
  { name: 'Cyberpunk', slug: 'cyberpunk', color: '#134e4a' },
  { name: 'Steampunk', slug: 'steampunk', color: '#1e293b' },
  { name: 'Military', slug: 'military', color: '#312e81' },
  { name: 'Police', slug: 'police', color: '#701a75' },
  { name: 'Yakuza', slug: 'yakuza', color: '#881337' },
  { name: 'Gangster', slug: 'gangster', color: '#991b1b' },
  { name: 'Medical', slug: 'medical', color: '#166534' },
  { name: 'Detective', slug: 'detective', color: '#1d4ed8' },
  { name: 'Cooking', slug: 'cooking', color: '#c2410c' },
  { name: 'Music', slug: 'music', color: '#7c2d12' },
  { name: 'Idol', slug: 'idol', color: '#7c3aed' },
  { name: 'Showbiz', slug: 'showbiz', color: '#be185d' },
  { name: 'Family', slug: 'family', color: '#dc2626' },
  { name: 'Kids', slug: 'kids', color: '#059669' },
  { name: 'Gag Humor', slug: 'gag-humor', color: '#2563eb' },
  { name: 'Parody', slug: 'parody', color: '#9333ea' },
  { name: 'Satire', slug: 'satire', color: '#e11d48' },
  { name: 'Dark Comedy', slug: 'dark-comedy', color: '#64748b' },
  { name: 'Tragedy', slug: 'tragedy', color: '#422006' },
  { name: 'Philosophical', slug: 'philosophical', color: '#134e4a' },
  { name: 'Political', slug: 'political', color: '#1e293b' },
  { name: 'Religion', slug: 'religion', color: '#312e81' },
  { name: 'Mythology', slug: 'mythology', color: '#701a75' },
  { name: 'Folklore', slug: 'folklore', color: '#881337' },
  { name: 'Urban Legend', slug: 'urban-legend', color: '#991b1b' },
  { name: 'Superhero', slug: 'superhero', color: '#166534' },
  { name: 'Super Power', slug: 'super-power', color: '#1d4ed8' },
  { name: 'Vigilante', slug: 'vigilante', color: '#c2410c' },
  { name: 'Anti-Hero', slug: 'anti-hero', color: '#7c2d12' },
  { name: 'Villain Protagonist', slug: 'villain-protagonist', color: '#7c3aed' },
  { name: 'Revenge', slug: 'revenge', color: '#be185d' },
  { name: 'Redemption', slug: 'redemption', color: '#dc2626' },
  { name: 'Survival', slug: 'survival', color: '#059669' },
  { name: 'Exploration', slug: 'exploration', color: '#2563eb' },
  { name: 'Discovery', slug: 'discovery', color: '#9333ea' },
  { name: 'Innovation', slug: 'innovation', color: '#e11d48' },
  { name: 'Invention', slug: 'invention', color: '#64748b' },
  { name: 'Science', slug: 'science', color: '#422006' },
  { name: 'Technology', slug: 'technology', color: '#134e4a' },
  { name: 'Artificial Intelligence', slug: 'artificial-intelligence', color: '#1e293b' },
  { name: 'Robots', slug: 'robots', color: '#312e81' },
  { name: 'Android', slug: 'android', color: '#701a75' },
  { name: 'Mechanical', slug: 'mechanical', color: '#881337' },
  { name: 'Genetic Engineering', slug: 'genetic-engineering', color: '#991b1b' },
  { name: 'Mutation', slug: 'mutation', color: '#166534' },
  { name: 'Evolution', slug: 'evolution', color: '#1d4ed8' },
  { name: 'Aliens', slug: 'aliens', color: '#c2410c' },
  { name: 'Extraterrestrial', slug: 'extraterrestrial', color: '#7c2d12' },
  { name: 'Invasion', slug: 'invasion', color: '#7c3aed' },
  { name: 'Conspiracy', slug: 'conspiracy', color: '#be185d' },
  { name: 'Secret Society', slug: 'secret-society', color: '#dc2626' },
  { name: 'Hidden World', slug: 'hidden-world', color: '#059669' },
  { name: 'Parallel World', slug: 'parallel-world', color: '#2563eb' },
  { name: 'Alternative Universe', slug: 'alternative-universe', color: '#9333ea' },
  { name: 'Dimension Travel', slug: 'dimension-travel', color: '#e11d48' },
  { name: 'Portal Fantasy', slug: 'portal-fantasy', color: '#64748b' },
  { name: 'Summoned Hero', slug: 'summoned-hero', color: '#422006' },
  { name: 'Transmigration', slug: 'transmigration', color: '#134e4a' },
  { name: 'Possession', slug: 'possession', color: '#1e293b' },
  { name: 'Body Swap', slug: 'body-swap', color: '#312e81' },
  { name: 'Gender Bender', slug: 'gender-bender', color: '#701a75' },
  { name: 'LGBTQ+', slug: 'lgbtq', color: '#881337' },
  { name: 'Yuri', slug: 'yuri', color: '#991b1b' },
  { name: 'Yaoi', slug: 'yaoi', color: '#166534' },
  { name: 'Shounen Ai', slug: 'shounen-ai', color: '#1d4ed8' },
  { name: 'Shoujo Ai', slug: 'shoujo-ai', color: '#c2410c' },
  { name: 'Mature', slug: 'mature', color: '#7c2d12' },
  { name: 'Adult', slug: 'adult', color: '#7c3aed' },
  { name: 'Smut', slug: 'smut', color: '#be185d' },
  { name: 'Erotica', slug: 'erotica', color: '#dc2626' },
  { name: 'Borderline H', slug: 'borderline-h', color: '#059669' },
  { name: 'Psychopath', slug: 'psychopath', color: '#2563eb' },
  { name: 'Sociopath', slug: 'sociopath', color: '#9333ea' },
  { name: 'Yandere', slug: 'yandere', color: '#e11d48' },
  { name: 'Kuudere', slug: 'kuudere', color: '#64748b' },
  { name: 'Dandere', slug: 'dandere', color: '#422006' },
  { name: 'Tsundere', slug: 'tsundere', color: '#134e4a' },
  { name: 'Yamato Nadeshiko', slug: 'yamato-nadeshiko', color: '#1e293b' },
  { name: 'Ojou-sama', slug: 'ojou-sama', color: '#312e81' },
  { name: 'Meganekko', slug: 'meganekko', color: '#701a75' },
  { name: 'Maids', slug: 'maids', color: '#881337' },
  { name: 'Butlers', slug: 'butlers', color: '#991b1b' },
  { name: 'Delinquent', slug: 'delinquent', color: '#166534' },
  { name: 'Bully', slug: 'bully', color: '#1d4ed8' },
  { name: 'Gyaru', slug: 'gyaru', color: '#c2410c' },
  { name: 'Otaku', slug: 'otaku', color: '#7c2d12' },
  { name: 'NEET', slug: 'neet', color: '#7c3aed' },
  { name: 'Hikikomori', slug: 'hikikomori', color: '#be185d' },
  { name: 'Shut-in', slug: 'shut-in', color: '#dc2626' },
  { name: 'Workplace', slug: 'workplace', color: '#059669' },
  { name: 'Office', slug: 'office', color: '#2563eb' },
  { name: 'Business', slug: 'business', color: '#9333ea' },
  { name: 'Entrepreneur', slug: 'entrepreneur', color: '#e11d48' },
  { name: 'Corporate', slug: 'corporate', color: '#64748b' },
  { name: 'Freelance', slug: 'freelance', color: '#422006' },
  { name: 'Part-time Job', slug: 'part-time-job', color: '#134e4a' },
  { name: 'Full-time Job', slug: 'full-time-job', color: '#1e293b' },
  { name: 'Unemployment', slug: 'unemployment', color: '#312e81' },
  { name: 'Job Hunting', slug: 'job-hunting', color: '#701a75' },
  { name: 'Career Change', slug: 'career-change', color: '#881337' },
  { name: 'Retirement', slug: 'retirement', color: '#991b1b' },
  { name: 'Pension', slug: 'pension', color: '#166534' },
  { name: 'Veteran', slug: 'veteran', color: '#1d4ed8' },
  { name: 'War', slug: 'war', color: '#c2410c' },
  { name: 'Civil War', slug: 'civil-war', color: '#7c2d12' },
  { name: 'World War', slug: 'world-war', color: '#7c3aed' },
  { name: 'Cold War', slug: 'cold-war', color: '#be185d' },
  { name: 'Revolution', slug: 'revolution', color: '#dc2626' },
  { name: 'Rebellion', slug: 'rebellion', color: '#059669' },
  { name: 'Uprising', slug: 'uprising', color: '#2563eb' },
  { name: 'Coup', slug: 'coup', color: '#9333ea' },
  { name: 'Terrorism', slug: 'terrorism', color: '#e11d48' },
  { name: 'Espionage', slug: 'espionage', color: '#64748b' },
  { name: 'Spy', slug: 'spy', color: '#422006' },
  { name: 'Assassin', slug: 'assassin', color: '#134e4a' },
  { name: 'Mercenary', slug: 'mercenary', color: '#1e293b' },
  { name: 'Hitman', slug: 'hitman', color: '#312e81' },
  { name: 'Sniper', slug: 'sniper', color: '#701a75' },
  { name: 'Explosives', slug: 'explosives', color: '#881337' },
  { name: 'Weapons', slug: 'weapons', color: '#991b1b' },
  { name: 'Guns', slug: 'guns', color: '#166534' },
  { name: 'Swords', slug: 'swords', color: '#1d4ed8' },
  { name: 'Katanas', slug: 'katanas', color: '#c2410c' },
  { name: 'Lightsabers', slug: 'lightsabers', color: '#7c2d12' },
  { name: 'Magic Swords', slug: 'magic-swords', color: '#7c3aed' },
  { name: 'Legendary Weapons', slug: 'legendary-weapons', color: '#be185d' },
  { name: 'Ancient Artifacts', slug: 'ancient-artifacts', color: '#dc2626' },
  { name: 'Relics', slug: 'relics', color: '#059669' },
  { name: 'Cursed Items', slug: 'cursed-items', color: '#2563eb' },
  { name: 'Blessed Items', slug: 'blessed-items', color: '#9333ea' },
  { name: 'Holy Items', slug: 'holy-items', color: '#e11d48' },
  { name: 'Demonic Items', slug: 'demonic-items', color: '#64748b' },
  { name: 'Divine Items', slug: 'divine-items', color: '#422006' },
  { name: 'Mythical Items', slug: 'mythical-items', color: '#134e4a' },
  { name: 'Dragon Ball', slug: 'dragon-ball', color: '#1e293b' },
  { name: 'One Piece', slug: 'one-piece', color: '#312e81' },
  { name: 'Naruto', slug: 'naruto', color: '#701a75' },
  { name: 'Bleach', slug: 'bleach', color: '#881337' },
  { name: 'Attack on Titan', slug: 'attack-on-titan', color: '#991b1b' },
  { name: 'My Hero Academia', slug: 'my-hero-academia', color: '#166534' },
  { name: 'Demon Slayer', slug: 'demon-slayer', color: '#1d4ed8' },
  { name: 'Jujutsu Kaisen', slug: 'jujutsu-kaisen', color: '#c2410c' },
  { name: 'Chainsaw Man', slug: 'chainsaw-man', color: '#7c2d12' },
  { name: 'Spy x Family', slug: 'spy-x-family', color: '#7c3aed' },
  { name: 'Tokyo Revengers', slug: 'tokyo-revengers', color: '#be185d' },
  { name: 'Black Clover', slug: 'black-clover', color: '#dc2626' },
  { name: 'Hunter x Hunter', slug: 'hunter-x-hunter', color: '#059669' },
  { name: 'Fullmetal Alchemist', slug: 'fullmetal-alchemist', color: '#2563eb' },
  { name: 'Death Note', slug: 'death-note', color: '#9333ea' },
  { name: 'Code Geass', slug: 'code-geass', color: '#e11d48' },
  { name: 'Steins;Gate', slug: 'steins-gate', color: '#64748b' },
  { name: 'Re:Zero', slug: 're-zero', color: '#422006' },
  { name: 'Overlord', slug: 'overlord', color: '#134e4a' },
  { name: 'Sword Art Online', slug: 'sword-art-online', color: '#1e293b' },
  { name: 'Log Horizon', slug: 'log-horizon', color: '#312e81' },
  { name: 'No Game No Life', slug: 'no-game-no-life', color: '#701a75' },
  { name: 'Konosuba', slug: 'konosuba', color: '#881337' },
  { name: 'Mushoku Tensei', slug: 'mushoku-tensei', color: '#991b1b' },
  { name: 'That Time I Got Reincarnated as a Slime', slug: 'that-time-i-got-reincarnated-as-a-slime', color: '#166534' },
  { name: 'The Rising of the Shield Hero', slug: 'the-rising-of-the-shield-hero', color: '#1d4ed8' },
  { name: 'Saga of Tanya the Evil', slug: 'saga-of-tanya-the-evil', color: '#c2410c' },
  { name: 'Youjo Senki', slug: 'youjo-senki', color: '#7c2d12' },
  { name: 'GATE', slug: 'gate', color: '#7c3aed' },
  { name: 'Outbreak Company', slug: 'outbreak-company', color: '#be185d' },
  { name: 'Drifters', slug: 'drifters', color: '#dc2626' },
  { name: 'Hellsing', slug: 'hellsing', color: '#059669' },
  { name: 'Hellsing Ultimate', slug: 'hellsing-ultimate', color: '#2563eb' },
  { name: 'Trinity Blood', slug: 'trinity-blood', color: '#9333ea' },
  { name: 'Vampire Hunter D', slug: 'vampire-hunter-d', color: '#e11d48' },
  { name: 'Castlevania', slug: 'castlevania', color: '#64748b' },
  { name: 'Devil May Cry', slug: 'devil-may-cry', color: '#422006' },
  { name: 'Bayonetta', slug: 'bayonetta', color: '#134e4a' },
  { name: 'God of War', slug: 'god-of-war', color: '#1e293b' },
  { name: 'Kratos', slug: 'kratos', color: '#312e81' },
  { name: 'Zeus', slug: 'zeus', color: '#701a75' },
  { name: 'Hades', slug: 'hades', color: '#881337' },
  { name: 'Poseidon', slug: 'poseidon', color: '#991b1b' },
  { name: 'Apollo', slug: 'apollo', color: '#166534' },
  { name: 'Artemis', slug: 'artemis', color: '#1d4ed8' },
  { name: 'Athena', slug: 'athena', color: '#c2410c' },
  { name: 'Hera', slug: 'hera', color: '#7c2d12' },
  { name: 'Aphrodite', slug: 'aphrodite', color: '#7c3aed' },
  { name: 'Ares', slug: 'ares', color: '#be185d' },
  { name: 'Hephaestus', slug: 'hephaestus', color: '#dc2626' },
  { name: 'Hermes', slug: 'hermes', color: '#059669' },
  { name: 'Dionysus', slug: 'dionysus', color: '#2563eb' },
  { name: 'Demeter', slug: 'demeter', color: '#9333ea' },
  { name: 'Persephone', slug: 'persephone', color: '#e11d48' },
  { name: 'Hestia', slug: 'hestia', color: '#64748b' },
  { name: 'Cronos', slug: 'cronos', color: '#422006' },
  { name: 'Rhea', slug: 'rhea', color: '#134e4a' },
  { name: 'Uranus', slug: 'uranus', color: '#1e293b' },
  { name: 'Gaia', slug: 'gaia', color: '#312e81' },
  { name: 'Eros', slug: 'eros', color: '#701a75' },
  { name: 'Thanatos', slug: 'thanatos', color: '#881337' },
  { name: 'Nyx', slug: 'nyx', color: '#991b1b' },
  { name: 'Erebus', slug: 'erebus', color: '#166534' },
  { name: 'Chaos', slug: 'chaos', color: '#1d4ed8' },
  { name: 'Tartarus', slug: 'tartarus', color: '#c2410c' },
  { name: 'Leto', slug: 'leto', color: '#7c2d12' },
  { name: 'Titan', slug: 'titan', color: '#7c3aed' },
  { name: 'Olympus', slug: 'olympus', color: '#be185d' },
  { name: 'Mount Olympus', slug: 'mount-olympus', color: '#dc2626' },
  { name: 'Underworld', slug: 'underworld', color: '#059669' },
  { name: 'Elysium', slug: 'elysium', color: '#2563eb' },
  { name: 'Asphodel', slug: 'asphodel', color: '#9333ea' },
  { name: 'Styx', slug: 'styx', color: '#e11d48' },
  { name: 'Lethe', slug: 'lethe', color: '#64748b' },
  { name: 'Phlegethon', slug: 'phlegethon', color: '#422006' },
  { name: 'Cocytus', slug: 'cocytus', color: '#134e4a' },
  { name: 'Acheron', slug: 'acheron', color: '#1e293b' },
  { name: 'Charon', slug: 'charon', color: '#312e81' },
  { name: 'Cerberus', slug: 'cerberus', color: '#701a75' },
  { name: 'Furies', slug: 'furies', color: '#881337' },
  { name: 'Moirai', slug: 'moirai', color: '#991b1b' },
  { name: 'Fates', slug: 'fates', color: '#166534' },
  { name: 'Muses', slug: 'muses', color: '#1d4ed8' },
  { name: 'Graces', slug: 'graces', color: '#c2410c' },
  { name: 'Nymphs', slug: 'nymphs', color: '#7c2d12' },
  { name: 'Satyrs', slug: 'satyrs', color: '#7c3aed' },
  { name: 'Centaurs', slug: 'centaurs', color: '#be185d' },
  { name: 'Minotaur', slug: 'minotaur', color: '#dc2626' },
  { name: 'Medusa', slug: 'medusa', color: '#059669' },
  { name: 'Sirens', slug: 'sirens', color: '#2563eb' },
  { name: 'Harpy', slug: 'harpy', color: '#9333ea' },
  { name: 'Gorgon', slug: 'gorgon', color: '#e11d48' },
  { name: 'Hydra', slug: 'hydra', color: '#64748b' },
  { name: 'Chimera', slug: 'chimera', color: '#422006' },
  { name: 'Sphinx', slug: 'sphinx', color: '#134e4a' },
  { name: 'Phoenix', slug: 'phoenix', color: '#1e293b' },
  { name: 'Griffin', slug: 'griffin', color: '#312e81' },
  { name: 'Pegasus', slug: 'pegasus', color: '#701a75' },
  { name: 'Unicorn', slug: 'unicorn', color: '#881337' },
  { name: 'Dragon', slug: 'dragon', color: '#991b1b' },
  { name: 'Wyvern', slug: 'wyvern', color: '#166534' },
  { name: 'Drake', slug: 'drake', color: '#1d4ed8' },
  { name: 'Serpent', slug: 'serpent', color: '#c2410c' },
  { name: 'Basilisk', slug: 'basilisk', color: '#7c2d12' },
  { name: 'Cockatrice', slug: 'cockatrice', color: '#7c3aed' }
];

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🗑️  Cleaning existing data...');
  await prisma.activityLog.deleteMany();
  await prisma.comicGenre.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.comic.deleteMany();
  await prisma.appSettings.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.platform.deleteMany();
  await prisma.status.deleteMany();
  await prisma.type.deleteMany();
  await prisma.user.deleteMany();

  console.log('👥 Creating default admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@komiktracker.com',
      passwordHash: hashedPassword,
      fullName: 'Administrator',
      role: UserRole.admin,
    },
  });

  console.log('🎨 Creating default types...');
  for (const type of defaultTypes) {
    await prisma.type.create({
      data: {
        ...type,
        memberLocked: true,
        userId: null, // Global default
      },
    });
  }

  console.log('📊 Creating default statuses...');
  for (const status of defaultStatuses) {
    await prisma.status.create({
      data: {
        ...status,
        memberLocked: true,
        userId: null, // Global default
      },
    });
  }

  console.log('🏷️  Creating default genres...');
  for (const genre of defaultGenres) {
    await prisma.genre.create({
      data: {
        ...genre,
        memberLocked: true,
        userId: null, // Global default
      },
    });
  }

  console.log('📱 Creating default platforms...');
  for (const platform of defaultPlatforms) {
    await prisma.platform.create({
      data: {
        ...platform,
        memberLocked: true,
        userId: null, // Global default
      },
    });
  }

  console.log('⚙️  Creating default app settings for admin...');
  await prisma.appSettings.create({
    data: {
      userId: adminUser.id,
      themePreset: 'default',
      darkMode: false,
      pageSize: 20,
    },
  });

  console.log('📝 Creating sample activity logs...');
  const sampleActivityTypes = [
    ActionType.CREATE_TYPE,
    ActionType.CREATE_STATUS,
    ActionType.CREATE_GENRE,
    ActionType.CREATE_PLATFORM,
    ActionType.UPDATE_PROFILE,
  ];

  for (let i = 0; i < 5; i++) {
    await prisma.activityLog.create({
      data: {
        userId: adminUser.id,
        actionType: sampleActivityTypes[i],
        meta: {
          description: `Initial setup action ${i + 1}`,
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
        },
      },
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - Admin user: ${adminUser.username}`);
  console.log(`   - Types: ${defaultTypes.length}`);
  console.log(`   - Statuses: ${defaultStatuses.length}`);
  console.log(`   - Genres: ${defaultGenres.length}`);
  console.log(`   - Platforms: ${defaultPlatforms.length}`);
  console.log(`   - Activity logs: 5`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });