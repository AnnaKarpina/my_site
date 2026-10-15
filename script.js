// Резервные данные (на случай, если fetch не сработает из-за CORS при открытии файла локально без сервера)
const fallbackData = {
  reviews: [
    { id: 1, title: "Возвращение легенды", artist: "The Soundwaves", album: "Midnight Echoes", text: "Атмосферные гитары и глубокие тексты.", rating: 9.5, comments: [] },
    { id: 2, title: "Эксперименты со звуком", artist: "Neon Pulse", album: "Digital Heart", text: "Смелый шаг в сторону синти-попа.", rating: 8.0, comments: [] }
  ],
  playlists: [
    { id: 1, title: "Вечерний чилл", description: "Спокойная музыка для отдыха.", cover: "https://raw.githubusercontent.com/AnnaKarpina/save_img/main/2026-10-05_13-42.png", tracks: ["Track 1", "Track 2"] },
    { id: 2, title: "Драйв и энергия", description: "Мощные рок-хиты.", cover: "https://raw.githubusercontent.com/AnnaKarpina/save_img/main/2026-10-05_13-44.png", tracks: ["Track A", "Track B"] }
  ],
  voting: [
    { id: 1, album: "Midnight Echoes", artist: "The Soundwaves", votes: 42 },
    { id: 2, album: "Digital Heart", artist: "Neon Pulse", votes: 35 }
  ]
};

let appData = fallbackData;

// Загрузка данных (в будущем здесь будет запрос к вашей БД)
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
  else if (path.includes('playlists.html')) renderPlaylists();
  else if (path.includes('voting.html')) renderVoting();
  else if (path.includes('profile.html')) renderProfile();
}

// Рендер обзоров и комментариев
function renderReviews() {
  const container = document.getElementById('reviews-container');
  if (!container) return;
  container.innerHTML = appData.reviews.map(review => `
    <article class="review-card">
      <h2>${review.title}</h2>
      <p class="meta"><strong>${review.artist}</strong> — ${review.album}</p>
      <p class="rating">Оценка: ⭐ ${review.rating}/10</p>
      <p>${review.text}</p>
      <div class="comments-section">
        <h4>Комментарии</h4>
        <div class="comments-list" id="comments-${review.id}">
          ${review.comments.map(c => `<div class="comment"><strong>${c.author}:</strong> ${c.text}</div>`).join('')}
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
  
  // Сохраняем в localStorage для отображения в профиле
  const userComments = JSON.parse(localStorage.getItem('userComments') || '[]');
  userComments.push({ reviewId, ...comment });
  localStorage.setItem('userComments', JSON.stringify(userComments));
  
  alert('Комментарий добавлен! (Сохранен локально до подключения БД)');
  form.reset();
}

// Рендер плейлистов
function renderPlaylists() {
  const container = document.getElementById('playlists-container');
  if (!container) return;
  container.innerHTML = '<div class="playlists-grid">' + appData.playlists.map(pl => `
    <div class="playlist-card">
      <img src="${pl.cover}" alt="${pl.title}">
      <h3>${pl.title}</h3>
      <p>${pl.description}</p>
      <ul class="track-list">${pl.tracks.map(t => `<li>🎵 ${t}</li>`).join('')}</ul>
      <button class="btn-play">▶ Слушать подборку</button>
    </div>
  `).join('') + '</div>';
}

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
        <h3>${item.album} — ${item.artist}</h3>
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

// Рендер плейлистов
function renderPlaylists() {
  const container = document.getElementById('playlists-container');
  if (!container) return;
  container.innerHTML = '<div class="playlists-grid">' + appData.playlists.map(pl => `
    <div class="playlist-card">
      <img src="${pl.cover}" alt="${pl.title}">
      <h3>${pl.title}</h3>
      <p>${pl.description}</p>
      <ul class="track-list">${pl.tracks.map(t => `<li>🎵 ${t}</li>`).join('')}</ul>
      <button class="btn-play">▶ Слушать подборку</button>
    </div>
  `).join('') + '</div>';
}

document.addEventListener('DOMContentLoaded', loadData);