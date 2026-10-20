const STORAGE_KEYS = {
  leaderboard: 'manGamesRdcLeaderboard',
  profile: 'manGamesRdcProfile',
  points: 'manGamesRdcPoints',
  games: 'manGamesRdcGames'
};

const questions = [
  {
    question: 'Quelle est la capitale de la République démocratique du Congo ?',
    options: ['Kinshasa', 'Lubumbashi', 'Goma', 'Bukavu'],
    answer: 'Kinshasa'
  },
  {
    question: 'Quel fleuve traverse la ville de Kinshasa ?',
    options: ['Congo', 'Nil', 'Niger', 'Zambèze'],
    answer: 'Congo'
  },
  {
    question: 'Quel pays est frontalier avec la RDC au sud ?',
    options: ['Angola', 'Burundi', 'Tchad', 'Ethiopie'],
    answer: 'Angola'
  },
  {
    question: 'Quelle est la monnaie officielle de la RDC ?',
    options: ['Franc congolais', 'Franc CFA', 'Leu', 'Shilling'],
    answer: 'Franc congolais'
  },
  {
    question: 'Quel est le nom du drapeau national de la RDC ?',
    options: ['Drapeau à la sky blue', 'Drapeau bleu, rouge et jaune', 'Drapeau vert et blanc', 'Drapeau rouge et noir'],
    answer: 'Drapeau bleu, rouge et jaune'
  }
];

const state = {
  currentView: 'home',
  currentQuestion: 0,
  score: 0,
  selectedIndex: null,
  answered: false,
  profile: { name: 'Joueur RDC', points: 0, games: 0 },
  leaderboard: []
};

const navButtons = [...document.querySelectorAll('.nav-item')];
const views = [...document.querySelectorAll('.view')];
const questionText = document.getElementById('questionText');
const answersWrap = document.getElementById('answers');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const questionCount = document.getElementById('questionCount');
const leaderboardList = document.getElementById('leaderboardList');
const playerNameInput = document.getElementById('playerName');
const profilePoints = document.getElementById('profilePoints');
const profileGames = document.getElementById('profileGames');
const profileRank = document.getElementById('profileRank');
const quizPanel = document.getElementById('quizPanel');
const themeToggle = document.getElementById('themeToggle');

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initProfile() {
  const saved = readStorage(STORAGE_KEYS.profile, null);
  if (saved) {
    state.profile = saved;
  }
  playerNameInput.value = state.profile.name || 'Joueur RDC';
  updateProfileUI();
}

function initLeaderboard() {
  const saved = readStorage(STORAGE_KEYS.leaderboard, []);
  state.leaderboard = saved;
  renderLeaderboard();
}

function setView(viewName) {
  state.currentView = viewName;

  views.forEach((view) => {
    view.classList.toggle('active', view.id === viewName);
  });

  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.view === viewName);
  });
}

function showQuiz() {
  state.currentQuestion = 0;
  state.score = 0;
  state.selectedIndex = null;
  state.answered = false;
  quizPanel.classList.add('show');
  nextBtn.classList.remove('hidden');
  restartBtn.classList.add('hidden');
  renderQuestion();
  setView('games');
}

function renderQuestion() {
  const question = questions[state.currentQuestion];
  questionText.textContent = question.question;
  questionCount.textContent = `${state.currentQuestion + 1}/${questions.length}`;
  answersWrap.innerHTML = '';

  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-option';
    button.textContent = option;

    button.addEventListener('click', () => {
      if (state.answered) return;
      state.selectedIndex = index;
      state.answered = true;
      nextBtn.disabled = false;
      renderQuestion();
    });

    if (state.selectedIndex === index && state.answered) {
      button.classList.add('selected');
    }

    answersWrap.appendChild(button);
  });

  if (state.answered) {
    const selected = question.options[state.selectedIndex];
    const isCorrect = selected === question.answer;

    const buttons = [...answersWrap.querySelectorAll('.answer-option')];
    buttons.forEach((button, index) => {
      const option = question.options[index];
      if (option === question.answer) {
        button.classList.add('correct');
      }
      if (index === state.selectedIndex && option !== question.answer) {
        button.classList.add('wrong');
      }
    });

    if (isCorrect) {
      state.score += 20;
    }

    nextBtn.textContent = state.currentQuestion === questions.length - 1 ? 'Terminer' : 'Suivant';
  } else {
    nextBtn.disabled = true;
    nextBtn.textContent = 'Valider';
  }
}

function nextQuestion() {
  if (!state.answered) return;

  if (state.currentQuestion < questions.length - 1) {
    state.currentQuestion += 1;
    state.selectedIndex = null;
    state.answered = false;
    renderQuestion();
    return;
  }

  finishQuiz();
}

function finishQuiz() {
  state.profile.points += state.score;
  state.profile.games += 1;
  writeStorage(STORAGE_KEYS.profile, state.profile);

  const entry = {
    name: state.profile.name,
    score: state.profile.points
  };

  const leaderboard = [...state.leaderboard, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  state.leaderboard = leaderboard;
  writeStorage(STORAGE_KEYS.leaderboard, leaderboard);
  writeStorage(STORAGE_KEYS.points, state.profile.points);

  renderLeaderboard();
  updateProfileUI();

  nextBtn.classList.add('hidden');
  restartBtn.classList.remove('hidden');
  restartBtn.textContent = 'Rejouer';

  questionText.textContent = `Quiz terminé ! Tu as obtenu ${state.score} points.`;
  answersWrap.innerHTML = `
    <div class="answer-option selected">
      Score final : <strong>${state.score}</strong>
    </div>
    <div class="answer-option">
      Total cumulé : <strong>${state.profile.points}</strong>
    </div>
  `;
  questionCount.textContent = `${questions.length}/${questions.length}`;
}

function restartQuiz() {
  state.currentQuestion = 0;
  state.score = 0;
  state.selectedIndex = null;
  state.answered = false;
  nextBtn.classList.remove('hidden');
  restartBtn.classList.add('hidden');
  nextBtn.disabled = true;
  nextBtn.textContent = 'Valider';
  renderQuestion();
}

function renderLeaderboard() {
  leaderboardList.innerHTML = '';

  const data = [...state.leaderboard];
  if (data.length === 0) {
    leaderboardList.innerHTML = '<div class="leaderboard-item"><span>Aucun score pour le moment.</span></div>';
    return;
  }

  data.sort((a, b) => b.score - a.score);

  data.forEach((entry, index) => {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';
    item.innerHTML = `
      <div style="display:flex; align-items:center; gap: 10px;">
        <span class="leaderboard-rank">${index + 1}</span>
        <span class="player-name">${entry.name}</span>
      </div>
      <span class="player-score">${entry.score} pts</span>
    `;
    leaderboardList.appendChild(item);
  });
}

function updateProfileUI() {
  profilePoints.textContent = String(state.profile.points);
  profileGames.textContent = String(state.profile.games);

  const leaderboardRank = state.leaderboard.findIndex((entry) => entry.name === state.profile.name);
  profileRank.textContent = leaderboardRank >= 0 ? `#${leaderboardRank + 1}` : '#1';
}

function saveProfile() {
  const name = playerNameInput.value.trim() || 'Joueur RDC';
  state.profile.name = name;
  writeStorage(STORAGE_KEYS.profile, state.profile);
  renderLeaderboard();
  updateProfileUI();
}

function bindEvents() {
  navButtons.forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.view));
  });

  document.querySelector('[data-action="start-quiz"]').addEventListener('click', showQuiz);
  document.querySelector('[data-action="view-games"]').addEventListener('click', () => {
    setView('games');
    if (!quizPanel.classList.contains('show')) {
      showQuiz();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (state.answered) {
      nextQuestion();
    }
  });

  restartBtn.addEventListener('click', restartQuiz);
  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
  playerNameInput.addEventListener('change', saveProfile);

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  });
}

function bootstrap() {
  initProfile();
  initLeaderboard();
  bindEvents();
  renderQuestion();
  setView('home');
  quizPanel.classList.remove('show');
  restartBtn.classList.add('hidden');
}

bootstrap();
