const appShell = document.querySelector(".app-shell");
const pages = Array.from(document.querySelectorAll(".page"));
const gotoButtons = Array.from(document.querySelectorAll("[data-goto]"));
const spaceBgm = document.getElementById("spaceBgm");
const viewAnalysis = document.getElementById("viewAnalysis");

const pageOrder = ["guide", "quiz", "analyzing", "space", "art", "letter", "love"];
let analysisTimer = null;

function showPage(id) {
  pages.forEach((page) => page.classList.toggle("active", page.id === id));
  if (id === "space") {
    if (analysisTimer) {
      clearTimeout(analysisTimer);
      analysisTimer = null;
    }
    startSpaceSequence();
  } else {
    clearSpaceSequence();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

gotoButtons.forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.goto));
});

viewAnalysis.addEventListener("click", () => {
  showPage("analyzing");
  analysisTimer = setTimeout(() => showPage("space"), 1800);
});

document.addEventListener("keydown", (event) => {
  const activePage = document.querySelector(".page.active");
  const currentIndex = pageOrder.indexOf(activePage.id);
  if (event.key === "ArrowRight" && currentIndex < pageOrder.length - 1) {
    showPage(pageOrder[currentIndex + 1]);
  }
  if (event.key === "ArrowLeft" && currentIndex > 0) {
    showPage(pageOrder[currentIndex - 1]);
  }
});

// Quiz
const questionCards = Array.from(document.querySelectorAll(".question-card"));
const progressFill = document.querySelector(".progress-fill");
const quizStep = document.getElementById("quizStep");
const quizResult = document.querySelector(".quiz-result");
const specialHint = document.getElementById("specialHint");
const answerHint = document.getElementById("answerHint");
const aiCompanionAnswer = document.getElementById("aiCompanionAnswer");
const submitOpenAnswer = document.getElementById("submitOpenAnswer");
let currentQuestion = 0;

function updateQuiz() {
  questionCards.forEach((card, index) => card.classList.toggle("active", index === currentQuestion));
  progressFill.style.width = `${((currentQuestion + 1) / questionCards.length) * 100}%`;
  quizStep.textContent = String(currentQuestion + 1);
}

function finishQuiz() {
  questionCards.forEach((card) => card.classList.remove("active"));
  quizResult.hidden = false;
  progressFill.style.width = "100%";
}

questionCards.forEach((card, cardIndex) => {
  const options = Array.from(card.querySelectorAll(".option-btn"));
  options.forEach((option) => {
    option.addEventListener("click", () => {
      if (cardIndex === 1 && option.dataset.special === "soft-lock") {
        specialHint.textContent = "系统提示：该方向已记录。请再选择一个更贴近日常关系场景的答案继续分析。";
        option.animate(
          [
            { transform: "translateX(0)" },
            { transform: "translateX(-7px)" },
            { transform: "translateX(7px)" },
            { transform: "translateX(0)" },
          ],
          { duration: 260 }
        );
        return;
      }

      options.forEach((item) => item.classList.remove("selected"));
      option.classList.add("selected");
      specialHint.textContent = "";

      setTimeout(() => {
        if (currentQuestion < questionCards.length - 1) {
          currentQuestion += 1;
          updateQuiz();
        } else {
          finishQuiz();
        }
      }, 360);
    });
  });
});

submitOpenAnswer.addEventListener("click", () => {
  const answer = aiCompanionAnswer.value.trim();
  if (answer.length < 6) {
    answerHint.textContent = "为了生成分析，请至少写下一句完整想法。";
    aiCompanionAnswer.focus();
    return;
  }

  answerHint.textContent = "";
  finishQuiz();
});

updateQuiz();

// Space planets
const planetCards = Array.from(document.querySelectorAll(".planet-card"));
const thirdStory = document.querySelector(".third-story");
let spaceTimers = [];
let spaceAudio = null;

function clearSpaceSequence() {
  spaceTimers.forEach((timer) => clearTimeout(timer));
  spaceTimers = [];
}

function showPlanet(index) {
  thirdStory.classList.remove("show-second", "show-like");
  planetCards.forEach((card, cardIndex) => {
    card.classList.toggle("active", cardIndex === index);
  });
}

function frequency(note) {
  const notes = {
    C3: 130.81,
    D3: 146.83,
    E3: 164.81,
    F3: 174.61,
    G3: 196,
    A3: 220,
    B3: 246.94,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392,
    A4: 440,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    G5: 783.99,
    A5: 880,
  };
  return notes[note];
}

function scheduleTone(ctx, destination, note, start, duration, volume, type = "sine") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency(note), start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.08);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume * 0.4, 0.001), start + duration * 0.72);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function scheduleChord(ctx, destination, notes, start, duration, volume) {
  notes.forEach((note, index) => {
    scheduleTone(ctx, destination, note, start + index * 0.035, duration, volume, index % 2 ? "triangle" : "sine");
  });
}

function startSpaceMusic() {
  try {
    window.__debugSpaceAudioState = "starting";
    if (spaceBgm) {
      spaceBgm.pause();
      spaceBgm.currentTime = 0;
      spaceBgm.volume = 0.92;
      const playPromise = spaceBgm.play();
      if (playPromise) {
        playPromise
          .then(() => {
            window.__debugSpaceAudioState = "html-audio-playing";
          })
          .catch(() => {
            window.__debugSpaceAudioState = "html-audio-blocked";
          });
      } else {
        window.__debugSpaceAudioState = "html-audio-playing";
      }
      return;
    }

    if (spaceAudio) {
      spaceAudio.master.gain.cancelScheduledValues(spaceAudio.ctx.currentTime);
      spaceAudio.master.gain.setTargetAtTime(0.0001, spaceAudio.ctx.currentTime, 0.08);
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const master = ctx.createGain();
    const pad = ctx.createGain();
    const delay = ctx.createDelay();
    const feedback = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    const start = ctx.currentTime + 0.05;

    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(0.13, start + 4);
    master.gain.linearRampToValueAtTime(0.18, start + 13.8);
    master.gain.linearRampToValueAtTime(0.34, start + 16.8);
    master.gain.setTargetAtTime(0.02, start + 18.8, 2.8);

    pad.gain.setValueAtTime(0.36, start);
    delay.delayTime.setValueAtTime(0.34, start);
    feedback.gain.setValueAtTime(0.28, start);
    delay.connect(feedback);
    feedback.connect(delay);
    pad.connect(delay);
    pad.connect(compressor);
    delay.connect(compressor);
    compressor.connect(master);
    master.connect(ctx.destination);

    const chords = [
      ["F3", "A3", "C4", "E4"],
      ["D3", "A3", "C4", "F4"],
      ["A3", "C4", "E4", "G4"],
      ["G3", "B3", "D4", "F4"],
      ["F3", "A3", "C4", "G4"],
      ["D3", "A3", "D4", "F4"],
    ];

    chords.forEach((chord, index) => {
      scheduleChord(ctx, pad, chord, start + index * 2.6, 3.2, 0.045 + index * 0.004);
    });

    ["A4", "G4", "E4", "F4", "C5", "A4", "G4"].forEach((note, index) => {
      scheduleTone(ctx, pad, note, start + 1.4 + index * 1.55, 1.7, 0.035, "sine");
    });

    scheduleChord(ctx, pad, ["F3", "C4", "F4", "A4", "C5"], start + 15.05, 3.2, 0.075);
    scheduleTone(ctx, pad, "F5", start + 15.3, 2.1, 0.08, "sine");
    scheduleTone(ctx, pad, "A5", start + 16.45, 3.2, 0.12, "sine");
    scheduleTone(ctx, pad, "C5", start + 16.85, 4.4, 0.09, "triangle");

    if (ctx.state === "suspended") {
      ctx.resume().then(() => {
        window.__debugSpaceAudioState = ctx.state;
      });
    } else {
      window.__debugSpaceAudioState = ctx.state;
    }
    spaceAudio = { ctx, master };
  } catch {
    window.__debugSpaceAudioState = "unavailable";
    spaceAudio = null;
  }
}

function startSpaceSequence() {
  clearSpaceSequence();
  startSpaceMusic();
  showPlanet(0);
  spaceTimers.push(setTimeout(() => showPlanet(1), 5000));
  spaceTimers.push(
    setTimeout(() => {
      showPlanet(2);
      spaceTimers.push(setTimeout(() => thirdStory.classList.add("show-second"), 2000));
      spaceTimers.push(setTimeout(() => thirdStory.classList.add("show-like"), 5000));
      spaceTimers.push(setTimeout(() => showPage("art"), 7000));
    }, 10000)
  );
}

// Letter theme and editable paper
const defaultLetter = document.getElementById("letterPaper").textContent.trim();
const savedLetter = localStorage.getItem("surprise-letter");
const letterPaper = document.getElementById("letterPaper");
const resetLetter = document.getElementById("resetLetter");
const flowerChoices = Array.from(document.querySelectorAll(".flower-choice"));
const letterPage = document.querySelector(".letter-page");
const fallLayer = document.querySelector(".fall-layer");
const basketToggle = document.getElementById("basketToggle");
const flowerDrawer = document.getElementById("flowerDrawer");

if (savedLetter) {
  letterPaper.textContent = savedLetter;
}

letterPaper.addEventListener("input", () => {
  localStorage.setItem("surprise-letter", letterPaper.textContent);
});

resetLetter.addEventListener("click", () => {
  letterPaper.textContent = defaultLetter;
  localStorage.setItem("surprise-letter", defaultLetter);
});

function petalColor(theme) {
  return {
    peony: "#ff7ba8",
    lavender: "#9a80ff",
    sunflower: "#f7b733",
  }[theme];
}

function dropPetals(theme) {
  fallLayer.innerHTML = "";
  for (let index = 0; index < 44; index += 1) {
    const petal = document.createElement("span");
    petal.className = "petal";
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.background = petalColor(theme);
    petal.style.setProperty("--drift", `${Math.random() * 140 - 70}px`);
    petal.style.setProperty("--fall-time", `${3.2 + Math.random() * 2.4}s`);
    petal.style.animationDelay = `${Math.random() * 0.8}s`;
    fallLayer.appendChild(petal);
  }
  setTimeout(() => {
    fallLayer.innerHTML = "";
  }, 6500);
}

flowerChoices.forEach((choice) => {
  choice.addEventListener("click", () => {
    const theme = choice.dataset.flower;
    appShell.dataset.theme = theme;
    letterPage.classList.add("romantic");
    flowerDrawer.classList.remove("open");
    basketToggle.setAttribute("aria-expanded", "false");
    flowerChoices.forEach((item) => item.classList.toggle("active", item === choice));
    localStorage.setItem("surprise-flower", theme);
    dropPetals(theme);
  });
});

basketToggle.addEventListener("click", () => {
  const isOpen = flowerDrawer.classList.toggle("open");
  basketToggle.setAttribute("aria-expanded", String(isOpen));
});

const savedTheme = localStorage.getItem("surprise-flower");
if (savedTheme) {
  appShell.dataset.theme = savedTheme;
  letterPage.classList.add("romantic");
  flowerChoices.forEach((item) => item.classList.toggle("active", item.dataset.flower === savedTheme));
}

// Love dashboard
const state = JSON.parse(
  localStorage.getItem("love-dashboard") ||
    JSON.stringify({
      score: 0,
      daily: [],
      words: [],
      wishes: [],
      mood: "",
    })
);

state.daily ||= [];
state.words ||= [];
state.wishes ||= [];
state.mood ||= "";

const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
const tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
const dailyForm = document.getElementById("dailyForm");
const wordsForm = document.getElementById("wordsForm");
const wishForm = document.getElementById("wishForm");
const dailyInput = document.getElementById("dailyInput");
const wordsInput = document.getElementById("wordsInput");
const wishInput = document.getElementById("wishInput");
const dailyList = document.getElementById("dailyList");
const wordsList = document.getElementById("wordsList");
const wishList = document.getElementById("wishList");
const scoreValue = document.getElementById("scoreValue");
const scorePercent = document.getElementById("scorePercent");
const scoreRing = document.querySelector(".score-ring");
const unlockBox = document.getElementById("unlockBox");
const unlockText = document.getElementById("unlockText");
const demoPoints = document.getElementById("demoPoints");
const miniScore = document.getElementById("miniScore");
const memoryCount = document.getElementById("memoryCount");
const wordsCount = document.getElementById("wordsCount");
const wishCount = document.getElementById("wishCount");
const moodStatus = document.getElementById("moodStatus");
const moodButtons = Array.from(document.querySelectorAll(".mood-btn"));
const quickWords = Array.from(document.querySelectorAll(".quick-words button"));

function saveDashboard() {
  localStorage.setItem("love-dashboard", JSON.stringify(state));
}

function formatDate() {
  const now = new Date();
  return `${now.getMonth() + 1}.${now.getDate()} ${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

function renderList(listElement, entries) {
  listElement.innerHTML = "";
  entries
    .slice()
    .reverse()
    .forEach((entry) => {
      const item = document.createElement("li");
      const text = document.createElement("span");
      const time = document.createElement("time");
      text.textContent = entry.text;
      time.textContent = entry.time;
      item.append(text, time);
      listElement.appendChild(item);
    });
}

function renderWishList() {
  wishList.innerHTML = "";
  state.wishes
    .slice()
    .reverse()
    .forEach((wish) => {
      const item = document.createElement("li");
      item.textContent = wish.text;
      wishList.appendChild(item);
    });
}

function updateScore() {
  const capped = Math.min(state.score, 100);
  const percent = Math.round((capped / 100) * 100);
  scoreValue.textContent = String(state.score);
  miniScore.textContent = String(state.score);
  memoryCount.textContent = String(state.daily.length);
  wordsCount.textContent = String(state.words.length);
  wishCount.textContent = String(state.wishes.length);
  moodStatus.textContent = state.mood ? `今天是：${state.mood}` : "等你选择今日心情";
  scorePercent.textContent = `${percent}%`;
  scoreRing.style.setProperty("--score-deg", `${percent * 3.6}deg`);
  moodButtons.forEach((button) => button.classList.toggle("active", button.dataset.mood === state.mood));

  if (state.score >= 100) {
    unlockBox.classList.remove("locked");
    unlockBox.classList.add("unlocked");
    unlockText.textContent = "惊喜已解锁：兑换一次由你决定的浪漫约会，时间、地点、仪式感都听你的。";
    demoPoints.hidden = true;
  } else {
    unlockBox.classList.add("locked");
    unlockBox.classList.remove("unlocked");
    unlockText.textContent = `还差 ${100 - state.score} 分。每条记录或留言都会让惊喜更近两分。`;
    demoPoints.hidden = false;
  }
}

function renderDashboard() {
  renderList(dailyList, state.daily);
  renderList(wordsList, state.words);
  renderWishList();
  updateScore();
  saveDashboard();
}

function addEntry(type, value) {
  const text = value.trim();
  if (!text) return;
  state[type].push({ text, time: formatDate() });
  state.score += 2;
  renderDashboard();
}

dailyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addEntry("daily", dailyInput.value);
  dailyInput.value = "";
});

wordsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addEntry("words", wordsInput.value);
  wordsInput.value = "";
});

wishForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = wishInput.value.trim();
  if (!text) return;
  state.wishes.push({ text, time: formatDate() });
  wishInput.value = "";
  renderDashboard();
});

moodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.mood = button.dataset.mood;
    renderDashboard();
  });
});

quickWords.forEach((button) => {
  button.addEventListener("click", () => {
    wordsInput.value = button.dataset.template;
    wordsInput.focus();
  });
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((item) => item.classList.toggle("active", item === button));
    tabPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === button.dataset.tab));
  });
});

demoPoints.addEventListener("click", () => {
  state.score = 100;
  renderDashboard();
});

renderDashboard();
