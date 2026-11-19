// Резервные данные
const fallbackData = {
  reviews: [
    { id: 1, title: "Возвращение легенды", artist: "The Soundwaves", album: "Midnight Echoes", text: "Атмосферные гитары и глубокие тексты.", rating: 9.5, comments: [] },
    { id: 2, title: "Эксперименты со звуком", artist: "Neon Pulse", album: "Digital Heart", text: "Смелый шаг в сторону синти-попа.", rating: 8.0, comments: [] }
  ],
  playlists: [
    { id: 1, title: "Вечерняя тоска", description: "Спокойная музыка с налётом меланхолизма после тяжелого дня", cover: "https://raw.githubusercontent.com/AnnaKarpina/save_img/main/2026-10-05_13-42.png", tracks: [{ name: "Pretty Little Things", src: "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/The_Crane_Wives_-_Pretty_Little_Things_74519843.mp3" }, { name: "The Moon_Will Sing", src: "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/The_Crane_Wives_-_The_Moon_Will_Sing_79475225.mp3" }] },
    { id: 2, title: "Драйв и энергия", description: "Мощные рок-хиты.", cover: "https://raw.githubusercontent.com/AnnaKarpina/save_img/main/2026-10-05_13-44.png", tracks: [{ name: "Track A", src: "ССЫЛКА_3" }, { name: "Track B", src: "ССЫЛКА_4" }] },
    { id: 3, title: "Утренний кофе", description: "Легкие мелодии.", cover: "https://raw.githubusercontent.com/AnnaKarpina/save_img/main/2026-10-05_13-42.png", tracks: [{ name: "Sunrise", src: "ССЫЛКА_5" }, { name: "Coffee Break", src: "ССЫЛКА_6" }] }
  ],
  albums: [
    {
      id: 1, title: "Safe Ship, Harbored", artist: "The Crane Wives", year: "2011", description: "Альбом сочетает акустическую фолк-основу с эмоциональными текстами о любви, уязвимости, внутренней борьбе и поиске себя",
      cover: "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/saveship.png",
      tracks: [
        { "name": "1. I Aint Done", "src": "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/The_Crane_Wives_-_I_Aint_Done_79001361.mp3" },
        { "name": "2. Counting Sheep", "src": "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/The_Crane_Wives_-_Counting_Sheep_79790982.mp3" },
        { "name": "3. October", "src": "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/The_Crane_Wives_-_October_82153951.mp3" },
        { "name": "4. The Diving Bell", "src": "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/The Crane Wives — The Diving Bell.mp3" }
      ]
    },
    {
      id: 2, title: "Foxlore", artist: "The crane wives", year: "2016", description: "Сочетает фирменный многоголосный фолк-рок группы с более плотным, электрическим и экспериментальным звучанием. В треках встречаются элементы джаза, психоделической балладности, оркестрового софт-рока и гаражного рока",
      cover: "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/Foxlore.jpg",
      tracks: [
        { "name": "1. Down the River", "src": "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/The_Crane_Wives_-_Down_the_River_74519838.mp3" },
        { "name": "2. I Talk in My Sleep", "src": "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/The_Crane_Wives_-_I_Talk_in_My_Sleep_74519837.mp3" },
        { "name": "3. Nothing at All", "src": "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/The_Crane_Wives_-_Nothing_at_All_74519836.mp3"},
        { "name": "4. Turn out the Lights", "src": "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/The_Crane_Wives_-_Turn_out_the_Lights_74519842.mp3"}
      ]
    }
  ],
  voting: [
    { id: 1, album: "Midnight Echoes", artist: "The Soundwaves", votes: 42 },
    { id: 2, album: "Foxlore", artist: "The crane wives", votes: 35 }
  ]
};

let appData = fallbackData;
let currentAlbumIndex = 0; // Индекс текущего альбома

// --- ПЛЕЙЛИСТЫ: состояние воспроизведения ---
let currentPlaylistId = null;      // ID активного плейлиста
let currentTrackIndex = 0;          // Индекс текущего трека
let playlistAudio = null;           // Единственный <audio> элемент для плейлистов
let isPlaylistPlaying = false;      // Флаг воспроизведения

async function loadData() {
  try {
    const response = await fetch('data.json');
    if (response.ok) appData = await response.json();
  } catch (error) {
    console.log('Используются резервные данные (открыто локально без сервера).');
  }
  initPage();
}

function initPage() {
  const path = window.location.pathname;
  if (path.includes('index.html') || path.endsWith('/') || path === '') renderReviews();
  else if (path.includes('album.html')) renderAlbum();
  else if (path.includes('playlists.html')) renderPlaylists();
  else if (path.includes('voting.html')) renderVoting();
  else if (path.includes('profile.html')) renderProfile();
}

// --- ЛОГИКА АЛЬБОМОВ ---
function renderAlbum() {
  const container = document.getElementById('album-container');
  if (!container || !appData.albums || appData.albums.length === 0) return;

  const album = appData.albums[currentAlbumIndex];

  container.innerHTML = `
    <article class="album-card">
      <div class="album-info">
        <img src="${album.cover}" alt="Обложка альбома" class="album-cover">
        <h2>${album.title}</h2>
        <p class="artist">${album.artist}</p>
        <p class="year">${album.year}</p>
        <p class="description">${album.description}</p>
      </div>

      <div class="album-tracks">
        <h3>Треклист</h3>
        <ul class="tracklist">
          ${album.tracks.map(track => `
            <li>
              <span>${track.name}</span>
              <audio controls src="${track.src}"></audio>
            </li>
          `).join('')}
        </ul>
      </div>
    </article>
  `;
}

function switchAlbum() {
  if (!appData.albums || appData.albums.length === 0) return;
  currentAlbumIndex = (currentAlbumIndex + 1) % appData.albums.length;
  renderAlbum();
}
// -----------------------

// Рендер обзоров
function renderReviews() {
  const container = document.getElementById('reviews-container');
  if (!container) return;
  container.innerHTML = appData.reviews.map(review => `
    <article class="review-card">
      <h2>${review.title}</h2>
      <p class="meta"><strong>${review.artist}</strong> — ${review.album}</p>
      <p class="rating">⭐ ${review.rating}/10</p>
      <p>${review.text}</p>
      <div class="comments-section">
        <h4>Комментарии</h4>
        <div class="comments-list" id="comments-${review.id}">
          ${review.comments.length > 0 
            ? review.comments.map(c => `<div class="comment"><strong>${c.author}:</strong> ${c.text}</div>`).join('')
            : '<p style="color: var(--violet); font-size: 0.9rem;">Пока нет комментариев. Будьте первым!</p>'
          }
        </div>
        <form class="comment-form" onsubmit="addComment(event, ${review.id})">
          <input type="text" name="author" placeholder="Ваше имя" required />
          <textarea name="text" placeholder="Ваш комментарий" rows="3" required></textarea>
          <button type="submit">Отправить</button>
        </form>
      </div>
    </article>
  `).join('');
}

function addComment(event, reviewId) {
  event.preventDefault();
  const form = event.target;
  const comment = { author: form.author.value, text: form.text.value, date: new Date().toLocaleDateString() };
  
  const userComments = JSON.parse(localStorage.getItem('userComments') || '[]');
  userComments.push({ reviewId, ...comment });
  localStorage.setItem('userComments', JSON.stringify(userComments));
  
  alert('Комментарий добавлен! (Сохранен локально)');
  form.reset();
}

// --- РЕНДЕР ПЛЕЙЛИСТОВ (обновлён) ---
function renderPlaylists() {
  const container = document.getElementById('playlists-container');
  if (!container) return;
  container.innerHTML = '<div class="playlists-grid">' + appData.playlists.map(pl => `
    <div class="playlist-card" id="playlist-card-${pl.id}">
      <img src="${pl.cover}" alt="${pl.title}">
      <h3>${pl.title}</h3>
      <p style="color: var(--lilac); opacity: 0.8; font-size: 0.9rem;">${pl.description}</p>
      <ul class="track-list">
        ${pl.tracks.map((t, idx) => `
          <li class="playlist-track" data-track-index="${idx}">
            <span class="playlist-track-name">🎵 ${t.name}</span>
          </li>
        `).join('')}
      </ul>
      <button class="btn-play" id="btn-play-${pl.id}" onclick="togglePlaylist(${pl.id})">▶ Слушать</button>
      <div class="playlist-now-playing" id="now-playing-${pl.id}" style="display:none;"></div>
    </div>
  `).join('') + '</div>';

  // Восстанавливаем состояние, если плейлист уже играл (например, при перерендере)
  if (currentPlaylistId !== null && playlistAudio) {
    updatePlaylistUI();
  }
}

// Переключение воспроизведения плейлиста
function togglePlaylist(playlistId) {
  const playlist = appData.playlists.find(p => p.id === playlistId);
  if (!playlist) return;

  // Если нажали на тот же плейлист, который уже играет — пауза/продолжение
  if (currentPlaylistId === playlistId && playlistAudio) {
    if (playlistAudio.paused) {
      playlistAudio.play().catch(e => console.warn('Не удалось воспроизвести:', e));
    } else {
      playlistAudio.pause();
    }
    updatePlaylistUI();
    return;
  }

  // Иначе запускаем новый плейлист с первого трека
  stopPlaylist(); // Останавливаем предыдущий

  currentPlaylistId = playlistId;
  currentTrackIndex = 0;

  // Создаём новый audio элемент
  playlistAudio = new Audio();
  playlistAudio.src = playlist.tracks[currentTrackIndex].src;
  playlistAudio.volume = 1;

  // Обработчик окончания трека — переход к следующему
  playlistAudio.addEventListener('ended', () => {
    playNextTrackInPlaylist();
  });

  // Обработчик ошибок (например, если ссылка не работает)
  playlistAudio.addEventListener('error', () => {
    console.warn(`Не удалось загрузить трек: ${playlist.tracks[currentTrackIndex].name}`);
    // Пробуем следующий трек
    setTimeout(() => playNextTrackInPlaylist(), 500);
  });

  playlistAudio.play().catch(e => console.warn('Не удалось воспроизвести:', e));
  updatePlaylistUI();
}

// Переход к следующему треку в плейлисте
function playNextTrackInPlaylist() {
  const playlist = appData.playlists.find(p => p.id === currentPlaylistId);
  if (!playlist) return;

  currentTrackIndex++;
  if (currentTrackIndex >= playlist.tracks.length) {
    // Плейлист закончился — останавливаем
    stopPlaylist();
    return;
  }

  if (playlistAudio) {
    playlistAudio.src = playlist.tracks[currentTrackIndex].src;
    playlistAudio.play().catch(e => console.warn('Не удалось воспроизвести:', e));
  }
  updatePlaylistUI();
}

// Остановка текущего плейлиста
function stopPlaylist() {
  if (playlistAudio) {
    playlistAudio.pause();
    playlistAudio.src = '';
    playlistAudio = null;
  }
  const prevId = currentPlaylistId;
  currentPlaylistId = null;
  currentTrackIndex = 0;
  isPlaylistPlaying = false;
  if (prevId !== null) updatePlaylistUI();
}

// Обновление интерфейса плейлистов (кнопки, подсветка треков, now playing)
function updatePlaylistUI() {
  appData.playlists.forEach(pl => {
    const btn = document.getElementById(`btn-play-${pl.id}`);
    const card = document.getElementById(`playlist-card-${pl.id}`);
    const nowPlaying = document.getElementById(`now-playing-${pl.id}`);
    if (!btn || !card) return;

    // Подсветка активного плейлиста
    if (pl.id === currentPlaylistId) {
      card.classList.add('active-playlist');

      // Обновляем текст кнопки
      if (playlistAudio && !playlistAudio.paused) {
        btn.textContent = '⏸ Пауза';
        btn.classList.add('playing');
      } else {
        btn.textContent = '▶ Продолжить';
        btn.classList.remove('playing');
      }

      // Показываем "сейчас играет"
      if (nowPlaying) {
        const track = pl.tracks[currentTrackIndex];
        nowPlaying.style.display = 'block';
        nowPlaying.innerHTML = `🎧 Сейчас играет: <strong>${track ? track.name : '—'}</strong>`;
      }

      // Подсвечиваем текущий трек в списке
      const trackItems = card.querySelectorAll('.playlist-track');
      trackItems.forEach((li, idx) => {
        if (idx === currentTrackIndex) {
          li.classList.add('current-track');
        } else {
          li.classList.remove('current-track');
        }
      });
    } else {
      card.classList.remove('active-playlist');
      btn.textContent = '▶ Слушать';
      btn.classList.remove('playing');
      if (nowPlaying) nowPlaying.style.display = 'none';

      const trackItems = card.querySelectorAll('.playlist-track');
      trackItems.forEach(li => li.classList.remove('current-track'));
    }
  });
}
// -----------------------

// Рендер голосования
function renderVoting() {
  const container = document.getElementById('voting-container');
  if (!container) return;
  const userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
  
  container.innerHTML = appData.voting.map(item => {
    const currentVotes = userVotes[item.id] || item.votes;
    return `
    <div class="voting-card">
      <div>
        <h3>${item.album} — <span style="color: var(--violet); font-size: 1.1rem;">${item.artist}</span></h3>
        <p>Голосов: <strong id="votes-${item.id}">${currentVotes}</strong></p>
      </div>
      <button class="btn-vote" onclick="vote(${item.id})">Голосовать ❤️</button>
    </div>
  `}).join('');
}

function vote(id) {
  const userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
  const currentVotes = userVotes[id] || appData.voting.find(v => v.id === id).votes;
  userVotes[id] = currentVotes + 1;
  localStorage.setItem('userVotes', JSON.stringify(userVotes));
  document.getElementById(`votes-${id}`).textContent = userVotes[id];
}

document.addEventListener('DOMContentLoaded', loadData);