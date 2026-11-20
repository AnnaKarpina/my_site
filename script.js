// ============================================================
// ГЛОБАЛЬНЫЙ АУДИОМЕНЕДЖЕР
// Один Audio на весь сайт. Состояние хранится в localStorage,
// чтобы музыка не прерывалась при переходе между страницами.
// ============================================================
const MusicPlayer = (function () {
  let audio = null;              // единственный Audio-элемент
  let currentSrc = null;         // текущий URL трека
  let currentMeta = null;        // { playlistId, trackIndex, name, src, context }
  let onUpdateCallback = null;   // колбэк для обновления UI

  function getAudio() {
    if (!audio) {
      audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 1;

      // По окончании трека — сообщаем странице, что можно перейти к следующему
      audio.addEventListener('ended', () => {
        if (onUpdateCallback) onUpdateCallback('ended');
      });
      audio.addEventListener('play', () => notify());
      audio.addEventListener('pause', () => notify());
      audio.addEventListener('error', () => {
        console.warn('Ошибка загрузки трека:', currentSrc);
        if (onUpdateCallback) onUpdateCallback('error');
      });
      audio.addEventListener('timeupdate', () => {
        // Обновляем прогресс, если страница подписана
        if (onUpdateCallback) onUpdateCallback('timeupdate');
      });
    }
    return audio;
  }

  function notify() {
    if (onUpdateCallback) onUpdateCallback('state');
  }

  // Сохранить состояние в localStorage
  function persist() {
    try {
      const state = {
        meta: currentMeta,
        currentTime: audio ? audio.currentTime : 0,
        paused: audio ? audio.paused : true,
        src: currentSrc
      };
      localStorage.setItem('musicPlayerState', JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  // Восстановить состояние (вызывается на каждой странице при загрузке)
  function restore() {
    try {
      const raw = localStorage.getItem('musicPlayerState');
      if (!raw) return;
      const state = JSON.parse(raw);
      if (!state || !state.src) return;

      currentMeta = state.meta;
      currentSrc = state.src;

      const a = getAudio();
      a.src = state.src;

      // Восстанавливаем позицию после загрузки метаданных
      a.addEventListener('loadedmetadata', function once() {
        a.removeEventListener('loadedmetadata', once);
        if (state.currentTime && state.currentTime < a.duration) {
          a.currentTime = state.currentTime;
        }
        // Пытаемся продолжить воспроизведение, если не было паузы
        if (!state.paused) {
          a.play().catch(() => {
            // Браузер заблокировал автозапуск — оставляем на паузе
            notify();
          });
        } else {
          notify();
        }
      });

      // Если метаданные уже есть (кэш) — обрабатываем сразу
      if (a.readyState >= 1 && a.duration) {
        if (state.currentTime && state.currentTime < a.duration) {
          a.currentTime = state.currentTime;
        }
        if (!state.paused) {
          a.play().catch(() => notify());
        } else {
          notify();
        }
      }
    } catch (e) {
      console.warn('Не удалось восстановить состояние плеера:', e);
    }
  }

  // Запустить новый трек (останавливает всё остальное — у нас один Audio)
  function play(meta, src, startTime) {
    const a = getAudio();
    // Если тот же трек уже играет — просто продолжим
    if (currentSrc === src && a && !a.paused) {
      currentMeta = meta;
      notify();
      return;
    }
    // Останавливаем текущий и запускаем новый
    a.pause();
    a.src = src;
    currentSrc = src;
    currentMeta = meta;

    if (startTime && startTime > 0) {
      a.addEventListener('loadedmetadata', function once() {
        a.removeEventListener('loadedmetadata', once);
        if (startTime < a.duration) a.currentTime = startTime;
      });
    }

    a.play().then(() => {
      persist();
      notify();
    }).catch((e) => {
      console.warn('Автовоспроизведение заблокировано:', e);
      notify();
    });
  }

  function toggle() {
    const a = getAudio();
    if (!currentSrc) return;
    if (a.paused) {
      a.play().catch(() => notify());
    } else {
      a.pause();
    }
  }

  function pause() {
    const a = getAudio();
    if (a && !a.paused) a.pause();
  }

  function stop() {
    const a = getAudio();
    a.pause();
    a.removeAttribute('src');
    a.load();
    currentSrc = null;
    currentMeta = null;
    localStorage.removeItem('musicPlayerState');
    notify();
  }

  function seek(time) {
    const a = getAudio();
    if (a && a.duration) a.currentTime = time;
  }

  function setVolume(v) {
    const a = getAudio();
    a.volume = Math.max(0, Math.min(1, v));
  }

  function subscribe(cb) {
    onUpdateCallback = cb;
  }

  function getState() {
    const a = getAudio();
    return {
      audio: a,
      src: currentSrc,
      meta: currentMeta,
      paused: a ? a.paused : true,
      currentTime: a ? a.currentTime : 0,
      duration: a && a.duration ? a.duration : 0
    };
  }

  // Сохраняем позицию периодически
  setInterval(() => {
    if (audio && currentSrc) persist();
  }, 1000);

  // Сохраняем при уходе со страницы
  window.addEventListener('beforeunload', () => {
    if (audio && currentSrc) persist();
  });

  return { play, toggle, pause, stop, seek, setVolume, subscribe, getState, restore, persist };
})();

// ============================================================
// РЕЗЕРВНЫЕ ДАННЫЕ
// ============================================================
const fallbackData = {
  reviews: [
    { id: 1, title: "Возвращение легенды", artist: "The Soundwaves", album: "Midnight Echoes", text: "Атмосферные гитары и глубокие тексты.", rating: 9.5, comments: [] },
    { id: 2, title: "Эксперименты со звуком", artist: "Neon Pulse", album: "Digital Heart", text: "Смелый шаг в сторону синти-попа.", rating: 8.0, comments: [] }
  ],
  playlists: [
    { id: 1, title: "Вечерняя тоска", description: "Спокойная музыка с налётом меланхолизма после тяжелого дня", cover: "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/play_list1_cover.png", tracks: [{ name: "Pretty Little Things — The Crane Wives", src: "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/The_Crane_Wives_-_Pretty_Little_Things_74519843.mp3" }, { name: "The Moon Will Sing — The Crane Wives", src: "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/The_Crane_Wives_-_The_Moon_Will_Sing_79475225.mp3" }] },
    { id: 2, title: "Драйв и энергия", description: "Мощные рок-хиты.", cover: "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/play_list2_cover.png", tracks: [{ name: "The Greatest Showman — The other side", src: "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/The Greatest Showman — The other side.m4a"}, { name: "The Greatest Showman — The Greatest Show", src: "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/The Greatest Showman OST — The Greatest Show.m4a" }] },
    { id: 3, title: "Утренний кофе", description: "Легкие мелодии.", cover: "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/play_list3_cover.png", tracks: [{ name: "Connor Spiotto - The Villain I Appear to Be", src: "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/Connor_Spiotto_-_The_Villain_I_Appear_to_Be_Dimond_Jack_74542114.mp3"}, { name: "Green Apelsin - Северный ветер", src: "https://raw.githubusercontent.com/AnnaKarpina/my_site/main/Green_Apelsin_-_Severnyjj_veter_73009680.mp3" }] }
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
    { id: 1, album: "Safe Ship, Harbored", artist: "The Crane Wives", votes: 42 },
    { id: 2, album: "Foxlore", artist: "The Crane Wives", votes: 35 }
  ]
};

let appData = fallbackData;
let currentAlbumIndex = 0;

async function loadData() {
  try {
    const response = await fetch('data.json');
    if (response.ok) appData = await response.json();
  } catch (error) {
    console.log('Используются резервные данные (открыто локально без сервера).');
  }
  initPage();
  MusicPlayer.restore();
}

function initPage() {
  const path = window.location.pathname;
  if (path.includes('index.html') || path.endsWith('/') || path === '') renderReviews();
  else if (path.includes('album.html')) renderAlbum();
  else if (path.includes('playlists.html')) renderPlaylists();
  else if (path.includes('voting.html')) renderVoting();
  else if (path.includes('profile.html')) renderProfile();
}

// ============================================================
// ОБЩИЙ РЕНДЕР КАСТОМНОГО ПЛЕЕРА (используется в альбомах и плейлистах)
// ============================================================
function playerHTML(uniqueId, context) {
  // context: { type: 'album'|'playlist', id, trackIndex, name, src, list }
  return `
    <div class="cp" data-player-id="${uniqueId}" data-context-type="${context.type}" data-context-id="${context.id}" data-track-index="${context.trackIndex}">
      <div class="cp-row">
        <button class="cp-btn cp-play" onclick="cpToggle(this)" title="Играть/Пауза">
          <span class="cp-icon">▶</span>
        </button>
        <div class="cp-progress-wrap">
          <div class="cp-progress" onclick="cpSeek(event, this)">
            <div class="cp-bar"></div>
          </div>
          <div class="cp-times">
            <span class="cp-cur">0:00</span>
            <span class="cp-dur">0:00</span>
          </div>
        </div>
        <div class="cp-volume-wrap">
          <span class="cp-vol-icon">🔊</span>
          <input type="range" class="cp-volume" min="0" max="1" step="0.01" value="1" oninput="cpVolume(this)">
        </div>
      </div>
    </div>
  `;
}

// Обновление всех плееров на странице по глобальному состоянию
function refreshAllPlayers() {
  const state = MusicPlayer.getState();
  const audio = state.audio;

  document.querySelectorAll('.cp').forEach(cp => {
    const type = cp.dataset.contextType;
    const id = Number(cp.dataset.contextId);
    const trackIndex = Number(cp.dataset.trackIndex);
    const meta = state.meta;

    const isCurrent = meta
      && meta.contextType === type
      && Number(meta.contextId) === id
      && Number(meta.trackIndex) === trackIndex
      && meta.src === state.src;

    // Кнопка play/pause
    const btn = cp.querySelector('.cp-play');
    const icon = cp.querySelector('.cp-icon');
    if (isCurrent) {
      cp.classList.add('cp-active');
      if (audio && !audio.paused) {
        icon.textContent = '⏸';
        btn.classList.add('cp-playing');
      } else {
        icon.textContent = '▶';
        btn.classList.remove('cp-playing');
      }
    } else {
      cp.classList.remove('cp-active');
      icon.textContent = '▶';
      btn.classList.remove('cp-playing');
    }

    // Прогресс
    const bar = cp.querySelector('.cp-bar');
    const cur = cp.querySelector('.cp-cur');
    const dur = cp.querySelector('.cp-dur');
    if (isCurrent && audio) {
      const d = audio.duration || 0;
      const t = audio.currentTime || 0;
      bar.style.width = d ? `${(t / d) * 100}%` : '0%';
      cur.textContent = formatTime(t);
      dur.textContent = formatTime(d);
    } else {
      bar.style.width = '0%';
      cur.textContent = '0:00';
      dur.textContent = '0:00';
    }
  });

  // Подсветка активного трека в списках плейлистов
  document.querySelectorAll('.playlist-track').forEach(li => {
    const plId = Number(li.dataset.playlistId);
    const idx = Number(li.dataset.trackIndex);
    const meta = state.meta;
    if (meta && meta.contextType === 'playlist' && Number(meta.contextId) === plId && Number(meta.trackIndex) === idx) {
      li.classList.add('current-track');
    } else {
      li.classList.remove('current-track');
    }
  });
}

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// === Управление плеером из UI ===
function cpToggle(btn) {
  const cp = btn.closest('.cp');
  const type = cp.dataset.contextType;
  const id = Number(cp.dataset.contextId);
  const trackIndex = Number(cp.dataset.trackIndex);
  const state = MusicPlayer.getState();
  const meta = state.meta;

  const isCurrent = meta
    && meta.contextType === type
    && Number(meta.contextId) === id
    && Number(meta.trackIndex) === trackIndex
    && meta.src === state.src;

  if (isCurrent) {
    MusicPlayer.toggle();
    return;
  }

  // Запускаем трек заново из этого плеера
  const track = getTrackByContext(type, id, trackIndex);
  if (!track) return;
  MusicPlayer.play({
    contextType: type,
    contextId: id,
    trackIndex: trackIndex,
    name: track.name,
    src: track.src,
    list: getListByContext(type, id)
  }, track.src);
}

function cpSeek(event, el) {
  const cp = el.closest('.cp');
  const rect = el.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const state = MusicPlayer.getState();
  // Ищем, текущий ли это плеер
  const type = cp.dataset.contextType;
  const id = Number(cp.dataset.contextId);
  const trackIndex = Number(cp.dataset.trackIndex);
  const meta = state.meta;
  const isCurrent = meta
    && meta.contextType === type
    && Number(meta.contextId) === id
    && Number(meta.trackIndex) === trackIndex;
  if (isCurrent && state.audio && state.audio.duration) {
    MusicPlayer.seek(ratio * state.audio.duration);
  }
}

function cpVolume(input) {
  MusicPlayer.setVolume(Number(input.value));
}

// Получить трек по контексту
function getTrackByContext(type, id, index) {
  if (type === 'album') {
    const album = appData.albums.find(a => a.id === id);
    return album ? album.tracks[index] : null;
  }
  if (type === 'playlist') {
    const pl = appData.playlists.find(p => p.id === id);
    return pl ? pl.tracks[index] : null;
  }
  return null;
}

function getListByContext(type, id) {
  if (type === 'album') {
    const album = appData.albums.find(a => a.id === id);
    return album ? album.tracks : [];
  }
  if (type === 'playlist') {
    const pl = appData.playlists.find(p => p.id === id);
    return pl ? pl.tracks : [];
  }
  return [];
}

// Обработчик событий от MusicPlayer (переход к следующему треку и т.д.)
MusicPlayer.subscribe((reason) => {
  refreshAllPlayers();

  if (reason === 'ended') {
    // Переход к следующему треку в том же контексте
    const state = MusicPlayer.getState();
    const meta = state.meta;
    if (!meta) return;
    const list = meta.list || getListByContext(meta.contextType, meta.contextId);
    const nextIndex = Number(meta.trackIndex) + 1;
    if (nextIndex < list.length) {
      const next = list[nextIndex];
      MusicPlayer.play({
        contextType: meta.contextType,
        contextId: meta.contextId,
        trackIndex: nextIndex,
        name: next.name,
        src: next.src,
        list: list
      }, next.src);
    } else {
      // Плейлист/альбом закончился — сбрасываем состояние
      MusicPlayer.stop();
    }
  } else if (reason === 'error') {
    // При ошибке — пропускаем трек
    const state = MusicPlayer.getState();
    const meta = state.meta;
    if (!meta) return;
    const list = meta.list || getListByContext(meta.contextType, meta.contextId);
    const nextIndex = Number(meta.trackIndex) + 1;
    if (nextIndex < list.length) {
      const next = list[nextIndex];
      setTimeout(() => {
        MusicPlayer.play({
          contextType: meta.contextType,
          contextId: meta.contextId,
          trackIndex: nextIndex,
          name: next.name,
          src: next.src,
          list: list
        }, next.src);
      }, 300);
    } else {
      MusicPlayer.stop();
    }
  } else if (reason === 'state' || reason === 'timeupdate') {
    // уже обновили в refreshAllPlayers
  }
});

// ============================================================
// ЛОГИКА АЛЬБОМОВ
// ============================================================
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
          ${album.tracks.map((track, idx) => `
            <li class="album-track-li">
              <span class="album-track-name">${track.name}</span>
              ${playerHTML(`album-${album.id}-${idx}`, { type: 'album', id: album.id, trackIndex: idx, name: track.name, src: track.src })}
            </li>
          `).join('')}
        </ul>
      </div>
    </article>
  `;
  refreshAllPlayers();
}

function switchAlbum() {
  if (!appData.albums || appData.albums.length === 0) return;
  currentAlbumIndex = (currentAlbumIndex + 1) % appData.albums.length;
  renderAlbum();
}

// ============================================================
// РЕНДЕР ОБЗОРОВ
// ============================================================
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

// ============================================================
// РЕНДЕР ПЛЕЙЛИСТОВ (с выбором любого трека)
// ============================================================
// ============================================================
// РЕНДЕР ПЛЕЙЛИСТОВ — переработанная версия
// ============================================================
function renderPlaylists() {
  const container = document.getElementById('playlists-container');
  if (!container) return;

  if (!appData.playlists || appData.playlists.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--violet);">Плейлистов пока нет.</p>';
    return;
  }

  container.innerHTML = '<div class="playlists-stack">' + appData.playlists.map(pl => {
    const totalTracks = pl.tracks.length;
    return `
    <section class="playlist-block" data-playlist-id="${pl.id}">
      <!-- Левая колонка: обложка + информация + кнопка -->
      <aside class="playlist-side">
        <div class="playlist-cover-wrap">
          <img src="${pl.cover}" alt="${pl.title}" class="playlist-cover" loading="lazy">
          <div class="playlist-cover-overlay"></div>
        </div>
        <h3 class="playlist-title">${pl.title}</h3>
        <p class="playlist-desc">${pl.description}</p>
        <p class="playlist-count">${totalTracks} ${pluralTracks(totalTracks)}</p>
        <button class="btn-play-all" onclick="playPlaylistFromStart(${pl.id})">
          ▶ Слушать всё
        </button>
      </aside>

      <!-- Правая колонка: треклист с плеерами -->
      <div class="playlist-main">
        <h4 class="playlist-tracks-title">Треклист</h4>
        <ul class="track-list playlist-tracklist">
          ${pl.tracks.map((t, idx) => `
            <li class="playlist-track" data-playlist-id="${pl.id}" data-track-index="${idx}">
              <div class="playlist-track-head">
                <span class="playlist-track-num">${idx + 1}</span>
                <span class="playlist-track-name">${t.name}</span>
              </div>
              ${playerHTML(`playlist-${pl.id}-${idx}`, { type: 'playlist', id: pl.id, trackIndex: idx, name: t.name, src: t.src })}
            </li>
          `).join('')}
        </ul>
      </div>
    </section>
  `;
  }).join('') + '</div>';

  refreshAllPlayers();
}

// Склонение слова «трек»
function pluralTracks(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'трек';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'трека';
  return 'треков';
}

// Запуск плейлиста с определённого трека
function playPlaylistTrack(playlistId, trackIndex) {
  const pl = appData.playlists.find(p => p.id === playlistId);
  if (!pl) return;
  const track = pl.tracks[trackIndex];
  if (!track) return;

  const state = MusicPlayer.getState();
  const meta = state.meta;
  const isCurrent = meta
    && meta.contextType === 'playlist'
    && Number(meta.contextId) === playlistId
    && Number(meta.trackIndex) === trackIndex;

  if (isCurrent) {
    MusicPlayer.toggle();
    return;
  }

  MusicPlayer.play({
    contextType: 'playlist',
    contextId: playlistId,
    trackIndex: trackIndex,
    name: track.name,
    src: track.src,
    list: pl.tracks
  }, track.src);
}

// «Слушать всё» — всегда с первого трека
function playPlaylistFromStart(playlistId) {
  playPlaylistTrack(playlistId, 0);
}

// ============================================================
// РЕНДЕР ГОЛОСОВАНИЯ
// ============================================================
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

// ============================================================
// ПРОФИЛЬ
// ============================================================
function renderProfile() {
  const container = document.getElementById('user-comments');
  if (!container) return;
  const userComments = JSON.parse(localStorage.getItem('userComments') || '[]');
  if (userComments.length === 0) {
    container.innerHTML = '<p>Вы пока не оставляли комментариев.</p>';
    return;
  }
  container.innerHTML = userComments.map(c => `
    <div class="comment">
      <strong>${c.author}</strong> <span style="opacity:0.6;font-size:0.85rem;">${c.date || ''}</span>
      <p style="margin:0.5rem 0 0;">${c.text}</p>
    </div>
  `).join('');
}

// ============================================================
// СТАРТ
// ============================================================
document.addEventListener('DOMContentLoaded', loadData);