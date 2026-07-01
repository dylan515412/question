const appShell = document.querySelector(".app-shell");
const pages = Array.from(document.querySelectorAll(".page"));
const gotoButtons = Array.from(document.querySelectorAll("[data-goto]"));
const spaceBgm = document.getElementById("spaceBgm");
const viewAnalysis = document.getElementById("viewAnalysis");
const todayDate = document.getElementById("todayDate");
const secretDateTrigger = document.getElementById("secretDateTrigger");
const secretEggModal = document.getElementById("secretEggModal");
const closeSecretEgg = document.getElementById("closeSecretEgg");
const presencePill = document.getElementById("presencePill");
const presenceText = document.getElementById("presenceText");
const reportMonthTitle = document.getElementById("reportMonthTitle");
const monthlyBook = document.getElementById("monthlyBook");
const monthlyBookTitle = document.getElementById("monthlyBookTitle");
const monthlyBookHint = document.getElementById("monthlyBookHint");
const monthlyArchiveModal = document.getElementById("monthlyArchiveModal");
const closeMonthlyArchive = document.getElementById("closeMonthlyArchive");
const archiveMonthTitle = document.getElementById("archiveMonthTitle");
const archiveSummary = document.getElementById("archiveSummary");
const archiveStats = document.getElementById("archiveStats");
const archiveKeywords = document.getElementById("archiveKeywords");
const archiveQuote = document.getElementById("archiveQuote");

const pageOrder = ["love"];
let analysisTimer = null;

if (todayDate) {
  todayDate.textContent = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function getSecretRewardPointsTotal() {
  return Object.values(state.secretEggRewards || {}).reduce((total, reward) => {
    const points = Number(reward?.points || 0);
    return total + (Number.isFinite(points) ? points : 0);
  }, 0);
}

function openSecretEgg() {
  if (!secretEggModal) return;
  secretEggModal.hidden = false;
}

function closeSecretEggModal() {
  if (secretEggModal) secretEggModal.hidden = true;
}

secretDateTrigger?.addEventListener("click", openSecretEgg);
closeSecretEgg?.addEventListener("click", closeSecretEggModal);
secretEggModal?.querySelector("[data-close-secret-egg]")?.addEventListener("click", closeSecretEggModal);

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
  if (!activePage) return;
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
const defaultDashboardState = {
  score: 0,
  daily: [],
  words: [],
  wishes: [],
  mood: "",
};

function loadLocalDashboardState() {
  const rawState = localStorage.getItem("love-dashboard");
  if (!rawState) return { ...defaultDashboardState };

  try {
    const parsed = JSON.parse(rawState);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    throw new Error("Dashboard state is not an object.");
  } catch (error) {
    console.warn("Local dashboard state is unreadable; starting from a safe empty state.", error);
    try {
      localStorage.setItem(`love-dashboard-corrupt-${Date.now()}`, rawState);
    } catch (backupError) {
      console.warn("Failed to back up unreadable dashboard state.", backupError);
    }
    return { ...defaultDashboardState };
  }
}

const state = loadLocalDashboardState();

state.daily ||= [];
state.words ||= [];
state.wishes ||= [];
state.mood ||= "";
state.redeemedSurprises ||= 0;
state.lastRedeemedAt ||= "";
state.deletedIds ||= [];
state.syncUpdatedAt ||= "";
state.scoreOffset ||= 0;
state.monthlyReports ||= {};
state.secretEggRewards ||= {};

const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
const tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
const dailyForm = document.getElementById("dailyForm");
const dailySubmitButton = dailyForm.querySelector('button[type="submit"]');
const wordsForm = document.getElementById("wordsForm");
const wishForm = document.getElementById("wishForm");
const dailyInput = document.getElementById("dailyInput");
const wordsInput = document.getElementById("wordsInput");
const wishInput = document.getElementById("wishInput");
const dailyPhoto = document.getElementById("dailyPhoto");
const photoPreview = document.getElementById("photoPreview");
const wordsPhoto = document.getElementById("wordsPhoto");
const wordsPhotoPreview = document.getElementById("wordsPhotoPreview");
const dailyList = document.getElementById("dailyList");
const wordsList = document.getElementById("wordsList");
const wishList = document.getElementById("wishList");
const calendarGrid = document.getElementById("calendarGrid");
const calendarTitle = document.getElementById("calendarTitle");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const dayBundle = document.getElementById("dayBundle");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const scoreValue = document.getElementById("scoreValue");
const scorePercent = document.getElementById("scorePercent");
const scoreRing = document.querySelector(".score-ring");
const unlockBox = document.getElementById("unlockBox");
const unlockText = document.getElementById("unlockText");
const demoPoints = document.getElementById("demoPoints");
const mysterySeal = document.getElementById("mysterySeal");
const miniScore = document.getElementById("miniScore");
const memoryCount = document.getElementById("memoryCount");
const wordsCount = document.getElementById("wordsCount");
const wishCount = document.getElementById("wishCount");
const moodStatus = document.getElementById("moodStatus");
const moodButtons = Array.from(document.querySelectorAll(".mood-btn"));
const quickWords = Array.from(document.querySelectorAll(".quick-words button"));
const focusTabButtons = Array.from(document.querySelectorAll("[data-focus-tab]"));
const loveStartDate = document.getElementById("loveStartDate");
const loveDays = document.getElementById("loveDays");
const loveHours = document.getElementById("loveHours");
const loveMinutes = document.getElementById("loveMinutes");
const anniversaryDate = document.getElementById("anniversaryDate");
const anniversaryDays = document.getElementById("anniversaryDays");
const anniversaryHours = document.getElementById("anniversaryHours");
const anniversaryMinutes = document.getElementById("anniversaryMinutes");
const anniversaryHint = document.getElementById("anniversaryHint");
const coverPhotoCard = document.getElementById("coverPhotoCard");
const coverPhotoInput = document.getElementById("coverPhotoInput");
const heroPhoto = document.getElementById("heroPhoto");
const miniPolaroids = Array.from(document.querySelectorAll(".mini-polaroid span"));
const photoLightbox = document.getElementById("photoLightbox");
const closePhotoLightbox = document.getElementById("closePhotoLightbox");
const lightboxPhoto = document.getElementById("lightboxPhoto");
const lightboxTitle = document.getElementById("lightboxTitle");
const lightboxDescription = document.getElementById("lightboxDescription");
const lightboxTags = document.getElementById("lightboxTags");
const photoMetaForm = document.getElementById("photoMetaForm");
const photoNameInput = document.getElementById("photoNameInput");
const photoDescInput = document.getElementById("photoDescInput");
const photoTagsInput = document.getElementById("photoTagsInput");
const deleteCoverPhoto = document.getElementById("deleteCoverPhoto");
const tagFilterBar = document.getElementById("tagFilterBar");
const coverThumbs = document.getElementById("coverThumbs");
const letterReader = document.getElementById("letterReader");
const closeLetterReader = document.getElementById("closeLetterReader");
const letterReaderTitle = document.getElementById("letterReaderTitle");
const letterReaderText = document.getElementById("letterReaderText");
const letterReaderPhoto = document.getElementById("letterReaderPhoto");
let pendingPhoto = "";
let pendingWordsPhoto = "";
let selectedDateKey = toDateKey(new Date());
let calendarCursor = new Date();
let currentTodayKey = toDateKey(new Date());
let activeCoverIndex = Number(localStorage.getItem("love-cover-index") || "0");
let activePhotoTag = "全部";
let typewriterTimer = 0;
let photoDbPromise = null;
const syncConfig = window.LOVE_SYNC_CONFIG || {};
const localDashboardBackupKey = "love-dashboard-backups";
let cloudSaveTimer = 0;
let cloudSaveInFlight = false;
let cloudSaveQueued = false;
let applyingCloudState = false;
let cloudReadyForWrites = !isCloudSyncEnabled();
let lastLocalBackupSignature = "";
let archiveGenerationInFlight = false;
const localPresenceId =
  localStorage.getItem("love-presence-id") || `presence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
localStorage.setItem("love-presence-id", localPresenceId);

state.coverPhotos ||= [
  {
    src: "./assets/our-photo.jpeg",
    name: "我们的封面照片",
    description: "每一张都被放到灯光中央，像翻到回忆册里最柔软的一页。",
    tags: ["合照"],
  },
];

if (!Number.isFinite(activeCoverIndex) || activeCoverIndex < 0) {
  activeCoverIndex = 0;
}

function createEntryId(prefix = "entry") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTags(value) {
  const raw = Array.isArray(value) ? value.join(",") : String(value || "");
  return [...new Set(raw.split(/[,，、\s]+/).map((item) => item.trim()).filter(Boolean))].slice(0, 8);
}

function getPhotoName(photo, index = activeCoverIndex) {
  return photo?.name || `我们的相片 ${index + 1}`;
}

function getPhotoDescription(photo) {
  return photo?.description || "每一张都被放到灯光中央，像翻到回忆册里最柔软的一页。";
}

function getLetterPreview(text, maxLength = 46) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(
    2,
    "0"
  )}`;
}

function keyToDate(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function readableDate(key) {
  return keyToDate(key).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function updateTodayDateLabel(date = new Date()) {
  if (!todayDate) return;
  todayDate.textContent = date.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function syncCalendarToToday(force = false) {
  const today = new Date();
  const todayKey = toDateKey(today);
  if (!force && todayKey === currentTodayKey) return false;

  currentTodayKey = todayKey;
  selectedDateKey = todayKey;
  calendarCursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  updateTodayDateLabel(today);
  return true;
}

function inferDateKey(entry) {
  if (entry.dateKey) return entry.dateKey;
  const match = String(entry.time || "").match(/(\d{1,2})\.(\d{1,2})/);
  if (!match) return toDateKey(new Date());
  const now = new Date();
  return `${now.getFullYear()}-${String(match[1]).padStart(2, "0")}-${String(match[2]).padStart(2, "0")}`;
}

function normalizeDashboardState() {
  state.daily ||= [];
  state.words ||= [];
  state.wishes ||= [];
  state.coverPhotos ||= [];
  state.deletedIds ||= [];
  state.presence ||= {};
  state.monthlyReports ||= {};
  state.secretEggRewards ||= {};
  state.redeemedSurprises ||= 0;
  state.lastRedeemedAt ||= "";
  state.scoreOffset ||= Number(state.redeemedSurprises || 0) * 100;

  const deleted = new Set(state.deletedIds);

  state.daily.forEach((entry) => {
    entry.dateKey ||= inferDateKey(entry);
    entry.id ||= createEntryId("daily");
    entry.points = getEntryPoints(entry, "daily");
  });
  state.words.forEach((entry) => {
    entry.dateKey ||= inferDateKey(entry);
    entry.id ||= createEntryId("words");
    entry.points = getEntryPoints(entry, "words");
  });
  state.wishes.forEach((wish) => {
    wish.id ||= createEntryId("wish");
  });
  state.coverPhotos.forEach((photo, index) => {
    photo.id ||= createEntryId("cover");
    photo.name ||= photo.caption || `我们的相片 ${index + 1}`;
    photo.description ||= "每一张都被放到灯光中央，像翻到回忆册里最柔软的一页。";
    photo.tags = normalizeTags(photo.tags || photo.tag || "");
    delete photo.caption;
  });

  state.daily = state.daily.filter((entry) => !deleted.has(entry.id));
  state.words = state.words.filter((entry) => !deleted.has(entry.id));
  state.wishes = state.wishes.filter((wish) => !deleted.has(wish.id));
  state.coverPhotos = state.coverPhotos.filter((photo) => !deleted.has(photo.id));
  state.coverPhotos = [...state.coverPhotos.reduce((photos, photo) => {
    const key = photo.id || photo.src || photo.photo || photo.photoId;
    photos.set(key, { ...(photos.get(key) || {}), ...photo });
    return photos;
  }, new Map()).values()];
  Object.entries(state.presence || {}).forEach(([id, presence]) => {
    if (!presence?.lastSeen || Date.now() - new Date(presence.lastSeen).getTime() > 2 * 60 * 1000) {
      delete state.presence[id];
    }
  });
  const earnedPoints =
    state.daily.reduce((total, entry) => total + getEntryPoints(entry, "daily"), 0) +
    state.words.reduce((total, entry) => total + getEntryPoints(entry, "words"), 0) +
    getSecretRewardPointsTotal();
  state.scoreOffset = Math.min(Number(state.scoreOffset || 0), earnedPoints);
  state.score = Math.max(
    0,
    earnedPoints - Number(state.scoreOffset || 0)
  );
}

normalizeDashboardState();

function hasMeaningfulDashboardData(dashboard = state) {
  if (!dashboard || typeof dashboard !== "object") return false;
  const coverPhotos = Array.isArray(dashboard.coverPhotos) ? dashboard.coverPhotos : [];
  const hasCustomCover = coverPhotos.some((photo) => {
    const src = String(photo?.src || "");
    return src && src !== "./assets/our-photo.jpeg";
  });
  return Boolean(
    Number(dashboard.score || 0) > 0 ||
      dashboard.daily?.length ||
      dashboard.words?.length ||
      dashboard.wishes?.length ||
      (dashboard.secretEggRewards && Object.keys(dashboard.secretEggRewards).length) ||
      (dashboard.monthlyReports && Object.keys(dashboard.monthlyReports).length) ||
      hasCustomCover
  );
}

function compactImageValue(value) {
  const text = String(value || "");
  return text.startsWith("data:") ? "" : value;
}

function compactDashboardForLocalBackup(dashboard) {
  const copy = JSON.parse(JSON.stringify(dashboard || {}));
  delete copy.presence;
  delete copy.syncUpdatedAt;
  copy.daily = (copy.daily || []).map((entry) => ({ ...entry, photo: compactImageValue(entry.photo) }));
  copy.words = (copy.words || []).map((entry) => ({ ...entry, photo: compactImageValue(entry.photo) }));
  copy.coverPhotos = (copy.coverPhotos || []).map((photo) => ({ ...photo, src: compactImageValue(photo.src) }));
  return copy;
}

function getDashboardBackupSignature(dashboard = state) {
  const compact = compactDashboardForLocalBackup(dashboard);
  return JSON.stringify({
    daily: compact.daily?.map((entry) => [entry.id, entry.dateKey, entry.text, entry.points, entry.photo || entry.photoId]),
    words: compact.words?.map((entry) => [entry.id, entry.dateKey, entry.text, entry.points, entry.photo || entry.photoId]),
    wishes: compact.wishes?.map((wish) => [wish.id, wish.text, wish.done]),
    coverPhotos: compact.coverPhotos?.map((photo) => [photo.id, photo.src || photo.photoId, photo.name, photo.description, photo.tags]),
    scoreOffset: compact.scoreOffset,
    redeemedSurprises: compact.redeemedSurprises,
    lastRedeemedAt: compact.lastRedeemedAt,
    secretEggRewards: compact.secretEggRewards,
    monthlyReports: compact.monthlyReports,
  });
}

function readLocalDashboardBackups() {
  try {
    const backups = JSON.parse(localStorage.getItem(localDashboardBackupKey) || "[]");
    return Array.isArray(backups) ? backups.filter((backup) => backup?.data) : [];
  } catch (error) {
    console.warn("Local dashboard backup read failed.", error);
    return [];
  }
}

function writeLocalDashboardBackups(backups) {
  try {
    localStorage.setItem(localDashboardBackupKey, JSON.stringify(backups));
    return true;
  } catch (error) {
    console.warn("Full local dashboard backup failed; trying compact backup.", error);
    try {
      const compactBackups = backups
        .slice(0, 8)
        .map((backup) => ({ ...backup, data: compactDashboardForLocalBackup(backup.data) }));
      localStorage.setItem(localDashboardBackupKey, JSON.stringify(compactBackups));
      return true;
    } catch (compactError) {
      console.warn("Compact local dashboard backup failed.", compactError);
      return false;
    }
  }
}

function storeLocalDashboardBackup(reason = "local-save") {
  if (!hasMeaningfulDashboardData(state)) return;

  const signature = getDashboardBackupSignature(state);
  if (signature === lastLocalBackupSignature) return;

  const backups = readLocalDashboardBackups();
  if (backups[0]?.signature === signature) {
    lastLocalBackupSignature = signature;
    return;
  }

  const backup = {
    createdAt: new Date().toISOString(),
    reason,
    signature,
    score: state.score,
    dailyCount: state.daily?.length || 0,
    wordsCount: state.words?.length || 0,
    wishCount: state.wishes?.length || 0,
    photoCount: state.coverPhotos?.length || 0,
    data: JSON.parse(JSON.stringify(state)),
  };
  const nextBackups = [backup, ...backups.filter((item) => item.signature !== signature)].slice(0, 12);
  if (writeLocalDashboardBackups(nextBackups)) lastLocalBackupSignature = signature;
}

function saveDashboard() {
  storeLocalDashboardBackup();
  state.syncUpdatedAt = new Date().toISOString();
  localStorage.setItem("love-dashboard", JSON.stringify(state));
  if (!applyingCloudState && cloudReadyForWrites) scheduleCloudSave();
}

function setBouncyNumber(element, value) {
  if (!element) return;
  const next = String(value);
  if (element.textContent === next) return;
  element.textContent = next;
  element.classList.remove("number-bump");
  void element.offsetWidth;
  element.classList.add("number-bump");
}

function parseDateStart(key) {
  return new Date(`${key}T00:00:00`);
}

function nextAnniversaryFrom(startKey) {
  const now = new Date();
  const start = parseDateStart(startKey);
  const target = new Date(now.getFullYear(), start.getMonth(), start.getDate());
  if (target < now) target.setFullYear(target.getFullYear() + 1);
  return toDateKey(target);
}

function updateLoveTimer() {
  const startKey = loveStartDate?.value || "2024-05-20";
  const start = parseDateStart(startKey);
  const diff = Math.max(Date.now() - start.getTime(), 0);
  const day = 24 * 60 * 60 * 1000;
  const hour = 60 * 60 * 1000;
  const minute = 60 * 1000;

  setBouncyNumber(loveDays, Math.floor(diff / day));
  setBouncyNumber(loveHours, Math.floor((diff % day) / hour));
  setBouncyNumber(loveMinutes, Math.floor((diff % hour) / minute));
}

function updateAnniversaryTimer() {
  const targetKey = anniversaryDate?.value || nextAnniversaryFrom(loveStartDate?.value || "2024-05-20");
  const target = parseDateStart(targetKey);
  const diff = target.getTime() - Date.now();
  const day = 24 * 60 * 60 * 1000;
  const hour = 60 * 60 * 1000;
  const minute = 60 * 1000;
  const safeDiff = Math.max(diff, 0);

  setBouncyNumber(anniversaryDays, Math.floor(safeDiff / day));
  setBouncyNumber(anniversaryHours, Math.floor((safeDiff % day) / hour));
  setBouncyNumber(anniversaryMinutes, Math.floor((safeDiff % hour) / minute));

  if (anniversaryHint) {
    anniversaryHint.textContent =
      diff <= 0 ? "今天就是被阳光照到的纪念日。" : "把重要日子放在这里，它会替你悄悄数着。";
  }
}

function initTimers() {
  if (!loveStartDate || !anniversaryDate) return;
  const savedStart = localStorage.getItem("love-start-date") || "2024-05-20";
  loveStartDate.value = savedStart;
  anniversaryDate.value = localStorage.getItem("love-anniversary-date") || nextAnniversaryFrom(savedStart);

  loveStartDate.addEventListener("change", () => {
    localStorage.setItem("love-start-date", loveStartDate.value);
    if (!localStorage.getItem("love-anniversary-date")) {
      anniversaryDate.value = nextAnniversaryFrom(loveStartDate.value);
    }
    updateLoveTimer();
    updateAnniversaryTimer();
  });

  anniversaryDate.addEventListener("change", () => {
    localStorage.setItem("love-anniversary-date", anniversaryDate.value);
    updateAnniversaryTimer();
  });

  updateLoveTimer();
  updateAnniversaryTimer();
  setInterval(() => {
    updateLoveTimer();
    updateAnniversaryTimer();
  }, 30 * 1000);
}

function compressImage(file, maxSize = 1500, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("load", () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      });
      image.addEventListener("error", reject);
      image.src = String(reader.result);
    });
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function openPhotoDb() {
  if (!("indexedDB" in window)) return Promise.resolve(null);
  if (photoDbPromise) return photoDbPromise;

  photoDbPromise = new Promise((resolve) => {
    const request = indexedDB.open("love-memory-photo-library", 1);
    request.addEventListener("upgradeneeded", () => {
      if (!request.result.objectStoreNames.contains("photos")) {
        request.result.createObjectStore("photos");
      }
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => resolve(null));
  });

  return photoDbPromise;
}

async function savePhotoData(src) {
  const db = await openPhotoDb();
  if (!db) return "";
  const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve) => {
    const transaction = db.transaction("photos", "readwrite");
    transaction.objectStore("photos").put(src, id);
    transaction.addEventListener("complete", () => resolve(id));
    transaction.addEventListener("error", () => resolve(""));
  });
}

async function readPhotoData(id) {
  if (!id) return "";
  const db = await openPhotoDb();
  if (!db) return "";

  return new Promise((resolve) => {
    const request = db.transaction("photos", "readonly").objectStore("photos").get(id);
    request.addEventListener("success", () => resolve(request.result || ""));
    request.addEventListener("error", () => resolve(""));
  });
}

async function deletePhotoData(id) {
  const db = await openPhotoDb();
  if (!db || !id) return;

  await new Promise((resolve) => {
    const transaction = db.transaction("photos", "readwrite");
    transaction.objectStore("photos").delete(id);
    transaction.addEventListener("complete", resolve);
    transaction.addEventListener("error", resolve);
  });
}

async function resolvePhotoSrc(photoLike) {
  if (!photoLike) return "";
  if (typeof photoLike === "string") return photoLike;
  if (photoLike.src) return photoLike.src;
  if (photoLike.photoId) return readPhotoData(photoLike.photoId);
  return "";
}

async function resolveEntryPhoto(entry) {
  if (entry.photoId) return readPhotoData(entry.photoId);
  return entry.photo || "";
}

function attachEntryPhoto(entry, container) {
  if (!entry.photo && !entry.photoId) return;
  const image = document.createElement("img");
  image.alt = "当天照片";
  container.appendChild(image);
  resolveEntryPhoto(entry).then((src) => {
    if (src) {
      image.src = src;
    } else {
      image.remove();
    }
  });
}

async function migrateStoredPhotos() {
  let changed = false;

  for (const entry of [...state.daily, ...state.words]) {
    if (entry.photoId || !entry.photo || !String(entry.photo).startsWith("data:")) continue;
    const id = await savePhotoData(entry.photo);
    if (!id) continue;
    entry.photoId = id;
    delete entry.photo;
    changed = true;
  }

  for (const photo of state.coverPhotos) {
    if (photo.photoId || !photo.src || !String(photo.src).startsWith("data:")) continue;
    const id = await savePhotoData(photo.src);
    if (!id) continue;
    photo.photoId = id;
    delete photo.src;
    changed = true;
  }

  state.coverPhotos.forEach((photo, index) => {
    const name = getPhotoName(photo, index);
    const description = getPhotoDescription(photo);
    const tags = normalizeTags(photo.tags);
    if (photo.name !== name || photo.description !== description || JSON.stringify(photo.tags) !== JSON.stringify(tags)) {
      photo.name = name;
      photo.description = description;
      photo.tags = tags;
      changed = true;
    }
  });

  if (changed) saveDashboard();
}

function isCloudSyncEnabled() {
  return Boolean(syncConfig.enabled && syncConfig.supabaseUrl && syncConfig.supabaseAnonKey);
}

function cloudBaseUrl() {
  return String(syncConfig.supabaseUrl || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
}

function cloudCoupleId() {
  return syncConfig.coupleId || "wu-wang-memory-book";
}

function cloudTableName() {
  return syncConfig.tableName || "love_state";
}

function cloudHeaders(extra = {}) {
  const headers = {
    apikey: syncConfig.supabaseAnonKey,
    ...extra,
  };
  if (String(syncConfig.supabaseAnonKey || "").startsWith("eyJ")) {
    headers.Authorization = `Bearer ${syncConfig.supabaseAnonKey}`;
  }
  return headers;
}

function aiHeaders(extra = {}) {
  return cloudHeaders({
    "Content-Type": "application/json",
    ...extra,
  });
}

function isLoveAIEnabled() {
  return Boolean(syncConfig.aiEnabled && syncConfig.aiEndpoint && syncConfig.supabaseAnonKey);
}

function compactEntry(entry) {
  return {
    text: entry.text,
    time: entry.time,
    dateKey: inferDateKey(entry),
    points: getEntryPoints(entry, entry.id?.startsWith("daily") ? "daily" : "words"),
    hasPhoto: Boolean(entry.photo || entry.photoId),
  };
}

function buildMemoryContext() {
  return {
    mood: state.mood,
    score: state.score,
    daily: state.daily.slice(-40).map(compactEntry),
    words: state.words.slice(-30).map(compactEntry),
    wishes: state.wishes.slice(-30).map((wish) => ({ text: wish.text, time: wish.time })),
    coverPhotos: state.coverPhotos.slice(-30).map((photo) => ({
      name: getPhotoName(photo),
      description: getPhotoDescription(photo),
      tags: normalizeTags(photo.tags),
    })),
  };
}

async function callLoveAI(task, payload = {}) {
  if (!isLoveAIEnabled()) return null;
  try {
    const response = await fetch(syncConfig.aiEndpoint, {
      method: "POST",
      headers: aiHeaders(),
      body: JSON.stringify({
        task,
        memory: buildMemoryContext(),
        payload,
      }),
    });
    if (!response.ok) throw new Error(`Love AI failed: ${response.status}`);
    return response.json();
  } catch (error) {
    console.warn("Love AI unavailable; using local fallback.", error);
    return null;
  }
}

function dataUrlToBlob(dataUrl) {
  const [meta, data] = String(dataUrl).split(",");
  const mime = meta.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const binary = atob(data || "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

async function uploadCloudPhoto(src, folder = "photos") {
  if (!src || !isCloudSyncEnabled() || !String(src).startsWith("data:")) return src;
  const bucket = syncConfig.storageBucket || "love photos";
  if (!bucket) return src;

  try {
    const blob = dataUrlToBlob(src);
    const extension = blob.type.includes("png") ? "png" : "jpg";
    const path = `${cloudCoupleId()}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;
    const encodedBucket = encodeURIComponent(bucket);
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const response = await fetch(`${cloudBaseUrl()}/storage/v1/object/${encodedBucket}/${encodedPath}`, {
      method: "POST",
      headers: cloudHeaders({
        "Content-Type": blob.type,
        "x-upsert": "false",
      }),
      body: blob,
    });

    if (!response.ok) throw new Error(`Photo upload failed: ${response.status}`);
    return `${cloudBaseUrl()}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
  } catch (error) {
    console.warn("Cloud photo upload failed; falling back to embedded image data.", error);
    return src;
  }
}

async function entryForCloud(entry, folder) {
  const copy = { ...entry };
  if (copy.photoId) {
    if (!String(copy.photo || "").startsWith("data:")) {
      copy.photo ||= "";
    } else {
      copy.photo = await uploadCloudPhoto(copy.photo, folder);
    }
    if (!copy.photo) {
      const src = await readPhotoData(copy.photoId);
      if (src) copy.photo = await uploadCloudPhoto(src, folder);
    }
    delete copy.photoId;
  } else if (copy.photo) {
    copy.photo = await uploadCloudPhoto(copy.photo, folder);
  }
  return copy;
}

async function photoForCloud(photo) {
  const copy = { ...photo };
  if (copy.photoId) {
    if (!String(copy.src || "").startsWith("data:")) {
      copy.src ||= "";
    } else {
      copy.src = await uploadCloudPhoto(copy.src, "covers");
    }
    if (!copy.src) {
      const src = await readPhotoData(copy.photoId);
      if (src) copy.src = await uploadCloudPhoto(src, "covers");
    }
    delete copy.photoId;
  } else if (copy.src) {
    copy.src = await uploadCloudPhoto(copy.src, "covers");
  }
  return copy;
}

async function prepareCloudState() {
  normalizeDashboardState();
  const snapshot = JSON.parse(JSON.stringify(state));
  snapshot.daily = await Promise.all(state.daily.map((entry) => entryForCloud(entry, "daily")));
  snapshot.words = await Promise.all(state.words.map((entry) => entryForCloud(entry, "words")));
  snapshot.coverPhotos = await Promise.all(state.coverPhotos.map(photoForCloud));
  snapshot.syncUpdatedAt = new Date().toISOString();
  return snapshot;
}

function mergeMonthlyReportMaps(localReports = {}, remoteReports = {}) {
  const merged = { ...(remoteReports || {}) };
  Object.entries(localReports || {}).forEach(([monthKey, localReport]) => {
    const remoteReport = merged[monthKey];
    const localTime = new Date(localReport?.generatedAt || 0).getTime();
    const remoteTime = new Date(remoteReport?.generatedAt || 0).getTime();
    if (!remoteReport || localTime >= remoteTime) {
      merged[monthKey] = localReport;
    }
  });
  return merged;
}

function mergeCloudState(remoteState) {
  if (!remoteState || typeof remoteState !== "object") return false;
  const before = JSON.stringify(state);
  const localPresence = state.presence?.[localPresenceId];
  const nextState = JSON.parse(JSON.stringify(remoteState));

  Object.keys(state).forEach((key) => {
    delete state[key];
  });
  Object.assign(state, nextState);
  state.presence = {
    ...(remoteState.presence || {}),
    ...(localPresence ? { [localPresenceId]: localPresence } : {}),
  };

  normalizeDashboardState();
  activeCoverIndex = Math.min(activeCoverIndex, Math.max(0, state.coverPhotos.length - 1));
  return JSON.stringify(state) !== before;
}

async function fetchCloudState() {
  if (!isCloudSyncEnabled()) return null;

  const response = await fetch(
    `${cloudBaseUrl()}/rest/v1/${cloudTableName()}?id=eq.${encodeURIComponent(cloudCoupleId())}&select=data,updated_at`,
    { headers: cloudHeaders() }
  );
  if (!response.ok) throw new Error(`Cloud state fetch failed: ${response.status}`);
  const rows = await response.json();
  return rows?.[0]?.data || null;
}

async function loadCloudState() {
  if (!isCloudSyncEnabled()) return false;
  try {
    const remoteState = await fetchCloudState();
    cloudReadyForWrites = true;
    return mergeCloudState(remoteState);
  } catch (error) {
    cloudReadyForWrites = false;
    console.warn("Cloud state load failed.", error);
    return false;
  }
}

async function saveCloudState() {
  if (!isCloudSyncEnabled()) return;
  if (cloudSaveInFlight) {
    cloudSaveQueued = true;
    return;
  }
  cloudSaveInFlight = true;

  try {
    const snapshot = await prepareCloudState();
    const remoteState = await fetchCloudState().catch(() => null);
    if (remoteState?.monthlyReports) {
      snapshot.monthlyReports = mergeMonthlyReportMaps(snapshot.monthlyReports, remoteState.monthlyReports);
    }
    if (!hasMeaningfulDashboardData(snapshot)) {
      console.warn("Skipped cloud save because empty snapshots are not allowed to replace cloud data.");
      return;
    }
    const response = await fetch(`${cloudBaseUrl()}/rest/v1/${cloudTableName()}?on_conflict=id`, {
      method: "POST",
      headers: cloudHeaders({
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify({
        id: cloudCoupleId(),
        data: snapshot,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!response.ok) throw new Error(`Cloud state save failed: ${response.status}`);
  } catch (error) {
    console.warn("Cloud state save failed.", error);
  } finally {
    cloudSaveInFlight = false;
    if (cloudSaveQueued) {
      cloudSaveQueued = false;
      scheduleCloudSave();
    }
  }
}

function scheduleCloudSave() {
  if (!isCloudSyncEnabled()) return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(saveCloudState, 1200);
}

function startCloudSyncPolling() {
  if (!isCloudSyncEnabled()) return;
  window.setInterval(async () => {
    const changed = await loadCloudState();
    if (!changed) return;
    applyingCloudState = true;
    renderDashboard();
    applyingCloudState = false;
  }, Number(syncConfig.pollIntervalMs || 15000));
}

function writePresence() {
  state.presence ||= {};
  state.presence[localPresenceId] = {
    lastSeen: new Date().toISOString(),
    mood: state.mood || "",
    page: "love",
  };
  saveDashboard();
}

function getOtherPresence() {
  const now = Date.now();
  return Object.entries(state.presence || {})
    .filter(([id, presence]) => {
      if (id === localPresenceId || !presence?.lastSeen) return false;
      return now - new Date(presence.lastSeen).getTime() < 45 * 1000;
    })
    .map(([, presence]) => presence);
}

function updatePresenceUI() {
  if (!presenceText) return;
  const others = getOtherPresence();
  const isTogether = others.length > 0;
  presencePill?.classList.toggle("together", isTogether);
  presenceText.textContent = isTogether ? "她也在这里" : "你在这里";
  if (presencePill) {
    presencePill.title = isTogether
      ? `另一端刚刚亮起了心跳${others[0]?.mood ? `，她现在是：${others[0].mood}` : ""}。`
      : "另一端打开网站时，这里会悄悄变亮。";
  }
}

function startPresenceHeartbeat() {
  writePresence();
  window.setInterval(writePresence, Number(syncConfig.presencePollIntervalMs || 12000));
}

function imageStyle(src) {
  return `url("${src}")`;
}

async function renderCoverPhotos() {
  if (!state.coverPhotos.length) {
    if (heroPhoto) heroPhoto.style.removeProperty("background-image");
    miniPolaroids.forEach((polaroid) => polaroid.style.removeProperty("background-image"));
    if (coverThumbs) coverThumbs.innerHTML = "";
    if (tagFilterBar) tagFilterBar.innerHTML = "";
    return;
  }
  activeCoverIndex = Math.min(activeCoverIndex, state.coverPhotos.length - 1);
  const active = state.coverPhotos[activeCoverIndex];
  const activeSrc = await resolvePhotoSrc(active);
  if (heroPhoto && activeSrc) heroPhoto.style.backgroundImage = imageStyle(activeSrc);
  miniPolaroids.forEach(async (polaroid, index) => {
    const photo = state.coverPhotos[(activeCoverIndex + index + 1) % state.coverPhotos.length] || active;
    const src = await resolvePhotoSrc(photo);
    if (src) polaroid.style.backgroundImage = imageStyle(src);
  });

  if (!coverThumbs) return;
  renderTagFilters();
  coverThumbs.innerHTML = "";
  getFilteredCoverPhotos().forEach(({ photo, index }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "thumb-photo";
    button.classList.toggle("active", index === activeCoverIndex);
    resolvePhotoSrc(photo).then((src) => {
      if (src) button.style.backgroundImage = imageStyle(src);
    });
    button.setAttribute("aria-label", `查看第 ${index + 1} 张照片`);
    button.addEventListener("click", () => {
      activeCoverIndex = index;
      localStorage.setItem("love-cover-index", String(activeCoverIndex));
      renderCoverPhotos();
      openPhotoLightbox(index);
    });
    coverThumbs.appendChild(button);
  });
}

function getAllPhotoTags() {
  return [...new Set(state.coverPhotos.flatMap((photo) => normalizeTags(photo.tags)))];
}

function getFilteredCoverPhotos() {
  if (activePhotoTag === "全部") {
    return state.coverPhotos.map((photo, index) => ({ photo, index }));
  }

  const filtered = state.coverPhotos
    .map((photo, index) => ({ photo, index }))
    .filter(({ photo }) => normalizeTags(photo.tags).includes(activePhotoTag));

  return filtered.length ? filtered : state.coverPhotos.map((photo, index) => ({ photo, index }));
}

function renderTagFilters() {
  if (!tagFilterBar) return;
  const tags = ["全部", ...getAllPhotoTags()];
  if (!tags.includes(activePhotoTag)) activePhotoTag = "全部";
  tagFilterBar.innerHTML = "";

  tags.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-filter";
    button.classList.toggle("active", tag === activePhotoTag);
    button.textContent = tag;
    button.addEventListener("click", () => {
      activePhotoTag = tag;
      renderCoverPhotos();
    });
    tagFilterBar.appendChild(button);
  });
}

function renderPhotoMeta(photo) {
  if (lightboxTitle) lightboxTitle.textContent = getPhotoName(photo);
  if (lightboxDescription) lightboxDescription.textContent = getPhotoDescription(photo);
  if (photoNameInput) photoNameInput.value = getPhotoName(photo);
  if (photoDescInput) photoDescInput.value = getPhotoDescription(photo);
  if (photoTagsInput) photoTagsInput.value = normalizeTags(photo.tags).join(", ");

  if (!lightboxTags) return;
  lightboxTags.innerHTML = "";
  const tags = normalizeTags(photo.tags);
  if (!tags.length) {
    const empty = document.createElement("span");
    empty.textContent = "未分类";
    lightboxTags.appendChild(empty);
    return;
  }

  tags.forEach((tag) => {
    const item = document.createElement("button");
    item.type = "button";
    item.textContent = tag;
    item.addEventListener("click", () => {
      activePhotoTag = tag;
      renderCoverPhotos();
    });
    lightboxTags.appendChild(item);
  });
}

async function openPhotoLightbox(index = activeCoverIndex) {
  if (!photoLightbox || !state.coverPhotos.length) return;
  activeCoverIndex = Math.min(index, state.coverPhotos.length - 1);
  const photo = state.coverPhotos[activeCoverIndex];
  const src = await resolvePhotoSrc(photo);
  if (lightboxPhoto && src) lightboxPhoto.style.backgroundImage = imageStyle(src);
  renderPhotoMeta(photo);
  photoLightbox.hidden = false;
  renderCoverPhotos();
}

function closeLightbox() {
  if (photoLightbox) photoLightbox.hidden = true;
}

async function deleteActiveCoverPhoto() {
  const photo = state.coverPhotos[activeCoverIndex];
  if (!photo) return;
  if (photo.id) state.deletedIds.push(photo.id);
  if (photo.photoId) await deletePhotoData(photo.photoId);
  state.coverPhotos = state.coverPhotos.filter((item) => item !== photo);
  activeCoverIndex = Math.min(activeCoverIndex, Math.max(0, state.coverPhotos.length - 1));
  localStorage.setItem("love-cover-index", String(activeCoverIndex));

  if (!state.coverPhotos.length) closeLightbox();

  renderDashboard();

  if (state.coverPhotos.length && !photoLightbox.hidden) {
    openPhotoLightbox(activeCoverIndex);
  }
}

function openLetter(entry) {
  if (!letterReader || !letterReaderText) return;
  clearTimeout(typewriterTimer);
  letterReader.hidden = false;
  letterReaderTitle.textContent = entry.time ? `${entry.time} 写下的信` : "慢慢打开这封信";
  letterReaderText.textContent = "";
  if (letterReaderPhoto) {
    letterReaderPhoto.hidden = true;
    letterReaderPhoto.style.backgroundImage = "";
  }
  resolveEntryPhoto(entry).then((src) => {
    if (!src || !letterReaderPhoto) return;
    letterReaderPhoto.hidden = false;
    letterReaderPhoto.style.backgroundImage = imageStyle(src);
  });
  const text = entry.text;
  let index = 0;

  function typeNext() {
    letterReaderText.textContent = text.slice(0, index);
    if (index <= text.length) {
      index += 1;
      typewriterTimer = window.setTimeout(typeNext, 34);
    }
  }

  typeNext();
}

function closeLetter() {
  clearTimeout(typewriterTimer);
  if (letterReader) letterReader.hidden = true;
}

function formatDate() {
  const now = new Date();
  return `${now.getMonth() + 1}.${now.getDate()} ${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

function isTodayEntry(entry) {
  return inferDateKey(entry) === toDateKey(new Date());
}

function getEntryPoints(entry, type = "words") {
  return Number.isFinite(entry.points) ? entry.points : type === "daily" ? 1 : 2;
}

function hasDailyScoreForDate(dateKey) {
  return state.daily.some((entry) => inferDateKey(entry) === dateKey && getEntryPoints(entry, "daily") > 0);
}

function getEntryPointsForType(type, dateKey) {
  if (type !== "daily") return 2;
  return hasDailyScoreForDate(dateKey) ? 0 : 1;
}

function getEarnedPointsTotal() {
  return (
    state.daily.reduce((total, entry) => total + getEntryPoints(entry, "daily"), 0) +
    state.words.reduce((total, entry) => total + getEntryPoints(entry, "words"), 0) +
    getSecretRewardPointsTotal()
  );
}

async function deleteDailyEntry(entryId) {
  const entry = state.daily.find((item) => item.id === entryId);
  if (!entry || !isTodayEntry(entry)) return;
  state.deletedIds.push(entry.id);
  state.daily = state.daily.filter((item) => item.id !== entryId);
  state.score = Math.max(0, state.score - getEntryPoints(entry, "daily"));
  if (entry.photoId) await deletePhotoData(entry.photoId);
  renderDashboard();
}

async function deleteWordsEntry(entryId) {
  const entry = state.words.find((item) => item.id === entryId);
  if (!entry || !isTodayEntry(entry)) return;
  state.deletedIds.push(entry.id);
  state.words = state.words.filter((item) => item.id !== entryId);
  state.score = Math.max(0, state.score - getEntryPoints(entry));
  if (entry.photoId) await deletePhotoData(entry.photoId);
  renderDashboard();
}

function deleteWishEntry(wishId) {
  const wish = state.wishes.find((item) => item.id === wishId);
  if (!wish) return;
  state.deletedIds.push(wish.id);
  state.wishes = state.wishes.filter((item) => item.id !== wishId);
  renderDashboard();
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
      attachEntryPhoto(entry, item);
      if (isTodayEntry(entry)) {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-entry-btn";
        deleteButton.textContent = "删除";
        deleteButton.setAttribute("aria-label", "删除这条每日记录");
        deleteButton.addEventListener("click", () => {
          deleteDailyEntry(entry.id);
        });
        item.appendChild(deleteButton);
      }
      listElement.appendChild(item);
    });
}

function renderWordsList(entries = state.words) {
  wordsList.innerHTML = "";
  entries
    .slice()
    .reverse()
    .forEach((entry) => {
      const item = document.createElement("li");
      item.className = "folded-letter-item";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "folded-letter";

      const stamp = document.createElement("span");
      stamp.className = "letter-stamp";
      stamp.textContent = "for you";

      const preview = document.createElement("strong");
      preview.textContent = entry.text.length > 28 ? `${entry.text.slice(0, 28)}...` : entry.text;

      const time = document.createElement("time");
      time.textContent = entry.time;

      button.append(stamp, preview, time);
      attachEntryPhoto(entry, button);
      button.addEventListener("click", () => openLetter(entry));
      item.appendChild(button);
      if (isTodayEntry(entry)) {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-entry-btn";
        deleteButton.textContent = "删除";
        deleteButton.setAttribute("aria-label", "删除这封情书");
        deleteButton.addEventListener("click", () => {
          deleteWordsEntry(entry.id);
        });
        item.appendChild(deleteButton);
      }
      wordsList.appendChild(item);
    });
}

function renderWishList() {
  wishList.innerHTML = "";
  state.wishes
    .slice()
    .reverse()
    .forEach((wish) => {
      const item = document.createElement("li");
      const text = document.createElement("span");
      const deleteButton = document.createElement("button");
      text.textContent = wish.text;
      deleteButton.type = "button";
      deleteButton.className = "delete-entry-btn";
      deleteButton.textContent = "删除";
      deleteButton.setAttribute("aria-label", "删除这个心愿");
      deleteButton.addEventListener("click", () => {
        deleteWishEntry(wish.id);
      });
      item.append(text, deleteButton);
      wishList.appendChild(item);
    });
}

function getDateEntries(key) {
  return {
    daily: state.daily.filter((entry) => inferDateKey(entry) === key),
    words: state.words.filter((entry) => inferDateKey(entry) === key),
  };
}

function getTodayEntries(entries) {
  const todayKey = toDateKey(new Date());
  return entries.filter((entry) => inferDateKey(entry) === todayKey);
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getPreviousMonthKey(date = new Date()) {
  return getMonthKey(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}

function formatMonthTitle(monthKey) {
  const [year, month] = String(monthKey).split("-").map(Number);
  if (!year || !month) return "上月回忆册";
  return `${year}年${month}月回忆册`;
}

function isEntryInMonth(entry, monthKey = getMonthKey()) {
  return inferDateKey(entry).startsWith(monthKey);
}

function getMonthlyEntries(monthKey = getMonthKey()) {
  return {
    daily: state.daily.filter((entry) => isEntryInMonth(entry, monthKey)),
    words: state.words.filter((entry) => isEntryInMonth(entry, monthKey)),
  };
}

function getMonthlyPhotos(monthKey = getMonthKey()) {
  return state.coverPhotos.filter((photo) => {
    if (!photo.dateKey && !photo.createdAt) return false;
    return String(photo.dateKey || photo.createdAt).startsWith(monthKey);
  });
}

function getMonthlyPhotoCount(monthKey = getMonthKey()) {
  const entryPhotos = [...state.daily, ...state.words].filter(
    (entry) => isEntryInMonth(entry, monthKey) && (entry.photo || entry.photoId)
  ).length;
  const coverPhotos = getMonthlyPhotos(monthKey).length;
  return entryPhotos + coverPhotos;
}

function pickKeywords(entries) {
  const text = entries.map((entry) => entry.text).join(" ");
  const seeds = ["想你", "开心", "抱抱", "晚饭", "见面", "照片", "温柔", "选择", "安心", "委屈", "浪漫", "好吃"];
  const matched = seeds.filter((word) => text.includes(word));
  const moodKeyword = state.mood ? [state.mood] : [];
  return [...new Set([...moodKeyword, ...matched, "回忆", "我们"])].slice(0, 6);
}

function buildLocalMonthlyReport(monthKey = getMonthKey()) {
  const monthly = getMonthlyEntries(monthKey);
  const photos = getMonthlyPhotos(monthKey);
  const allEntries = [...monthly.daily, ...monthly.words];
  const photoEntries = photos.map((photo) => ({
    text: `${getPhotoName(photo)} ${getPhotoDescription(photo)} ${normalizeTags(photo.tags).join(" ")}`,
    dateKey: photo.dateKey || String(photo.createdAt || "").slice(0, 10),
  }));
  const analyzableEntries = [...allEntries, ...photoEntries];
  const countsByDate = analyzableEntries.reduce((map, entry) => {
    const key = entry.dateKey || inferDateKey(entry);
    if (!key) return map;
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map());
  const highlightKey = [...countsByDate.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  const highlight = highlightKey ? readableDate(highlightKey).replace("星期", "周") : "等待记录";
  const keywords = pickKeywords(analyzableEntries);
  const quoteSource = monthly.words[monthly.words.length - 1]?.text || monthly.daily[monthly.daily.length - 1]?.text || "";
  const memoryCount = allEntries.length + photos.length;
  const photoCount = getMonthlyPhotoCount(monthKey);

  return {
    monthKey,
    monthTitle: formatMonthTitle(monthKey),
    summary: memoryCount
      ? `这个月一共留下 ${monthly.daily.length} 条日常、${monthly.words.length} 封情书、${photoCount} 张照片线索。最明显的情绪是“${keywords[0] || "温柔"}”，这些小事已经可以装订成一本回忆册。`
      : "这个月还没有足够可以分析的记录，等更多回忆出现后，这里会自动生成月度总结。",
    keywords,
    memoryCount,
    highlight,
    photoCount,
    wordsCount: monthly.words.length,
    quote: quoteSource ? `“${getLetterPreview(quoteSource, 42)}”` : "当记忆开始变多，爱就有了自己的纹理。",
    signature: JSON.stringify({
      daily: monthly.daily.map((entry) => `${entry.id}:${entry.text}:${entry.points}`).join("|"),
      words: monthly.words.map((entry) => `${entry.id}:${entry.text}:${entry.points}`).join("|"),
      photos: photos.map((photo) => `${photo.id}:${getPhotoName(photo)}:${getPhotoDescription(photo)}`).join("|"),
    }),
  };
}

function getActiveArchiveKey() {
  return getPreviousMonthKey();
}

function getActiveMonthlyArchive() {
  const key = getActiveArchiveKey();
  return state.monthlyReports?.[key] || null;
}

function renderMonthlyArchiveBook() {
  if (!reportMonthTitle || !monthlyBookTitle || !monthlyBookHint) return;
  reportMonthTitle.textContent = "回忆册";
  const archive = getActiveMonthlyArchive();
  const previousMonthKey = getPreviousMonthKey();
  const pendingReport = buildLocalMonthlyReport(previousMonthKey);
  monthlyBook?.classList.toggle("has-report", Boolean(archive));
  monthlyBookTitle.textContent = archive?.monthTitle || formatMonthTitle(previousMonthKey);
  monthlyBookHint.textContent = archive
    ? `${archive.memoryCount || 0} 条线索已装订`
    : pendingReport.memoryCount
      ? "等待大模型生成"
      : "上个月还没有可分析记录";
}

function renderArchiveModal() {
  const archive = getActiveMonthlyArchive();
  if (!archiveMonthTitle || !archiveSummary || !archiveStats || !archiveKeywords || !archiveQuote) return;
  archiveMonthTitle.textContent = archive?.monthTitle || formatMonthTitle(getPreviousMonthKey());
  archiveSummary.textContent = archive?.summary || "每月 1 号会自动读取上个月的每日记录、情书和照片文字线索，生成一本可以回看的月度总结。";
  archiveStats.innerHTML = "";
  const stats = archive
    ? [
        ["值得分析", `${archive.memoryCount || 0} 条`],
        ["照片线索", `${archive.photoCount || 0} 张`],
        ["情话", `${archive.wordsCount || 0} 封`],
        ["高光日", archive.highlight || "等待记录"],
      ]
    : [
        ["生成时间", "每月 1 号"],
        ["分析范围", "上个月"],
        ["内容来源", "记录 / 情书 / 照片文字"],
      ];
  stats.forEach(([label, value]) => {
    const item = document.createElement("article");
    const small = document.createElement("span");
    const strong = document.createElement("strong");
    small.textContent = label;
    strong.textContent = value;
    item.append(small, strong);
    archiveStats.appendChild(item);
  });
  archiveKeywords.innerHTML = "";
  (archive?.keywords?.length ? archive.keywords : ["等待装订", "上月总结", "回忆册"]).forEach((keyword) => {
    const item = document.createElement("span");
    item.textContent = keyword;
    archiveKeywords.appendChild(item);
  });
  archiveQuote.textContent = archive?.quote || "等第一本月报生成后，这里会留下最适合回看的那句话。";
}

function openMonthlyArchive() {
  if (!monthlyArchiveModal) return;
  renderArchiveModal();
  monthlyArchiveModal.hidden = false;
  requestAnimationFrame(() => monthlyArchiveModal.classList.add("open"));
}

function closeMonthlyArchiveModal() {
  if (!monthlyArchiveModal) return;
  monthlyArchiveModal.classList.remove("open");
  window.setTimeout(() => {
    monthlyArchiveModal.hidden = true;
  }, 180);
}

async function saveMonthlyArchive(monthKey, report, source = "ai") {
  state.monthlyReports ||= {};
  state.monthlyReports[monthKey] = {
    ...report,
    monthKey,
    source,
    generatedAt: new Date().toISOString(),
  };
  renderMonthlyArchiveBook();
  saveDashboard();
}

function buildMonthlyArchivePayload(monthKey, report) {
  const monthly = getMonthlyEntries(monthKey);
  const photos = getMonthlyPhotos(monthKey);
  return {
    localAnalysisSeed: report,
    monthKey,
    archiveMode: "previous_month",
    monthlyRecords: {
      daily: monthly.daily.map((entry) => ({
        text: entry.text,
        time: entry.time,
        dateKey: inferDateKey(entry),
        points: getEntryPoints(entry, "daily"),
        hasPhoto: Boolean(entry.photo || entry.photoId),
      })),
      words: monthly.words.map((entry) => ({
        text: entry.text,
        time: entry.time,
        dateKey: inferDateKey(entry),
        points: getEntryPoints(entry, "words"),
        hasPhoto: Boolean(entry.photo || entry.photoId),
      })),
      photos: photos.map((photo) => ({
        name: getPhotoName(photo),
        description: getPhotoDescription(photo),
        tags: normalizeTags(photo.tags),
        dateKey: photo.dateKey || String(photo.createdAt || "").slice(0, 10),
      })),
    },
  };
}

async function generateMonthlyArchiveWithAI(monthKey, report) {
  if (!isLoveAIEnabled()) return false;
  const aiReport = await callLoveAI("monthly_report", {
    ...buildMonthlyArchivePayload(monthKey, report),
  });
  if (!aiReport?.report) return false;
  await saveMonthlyArchive(monthKey, { ...report, ...aiReport.report, monthKey, signature: report.signature }, "ai");
  return true;
}

function shouldGenerateMonthlyArchive(monthKey, report) {
  if (!report.memoryCount) return false;
  const archive = state.monthlyReports?.[monthKey];
  return !archive || archive.signature !== report.signature;
}

async function ensureMonthlyArchive(date = new Date()) {
  if (archiveGenerationInFlight) {
    renderMonthlyArchiveBook();
    return;
  }
  const monthKey = getPreviousMonthKey(date);
  const report = buildLocalMonthlyReport(monthKey);
  if (!shouldGenerateMonthlyArchive(monthKey, report)) {
    renderMonthlyArchiveBook();
    return;
  }

  archiveGenerationInFlight = true;
  try {
    const generated = await generateMonthlyArchiveWithAI(monthKey, report);
    if (!generated) {
      console.warn("Monthly archive generation skipped or failed; it will retry on the next page load.");
    }
  } finally {
    archiveGenerationInFlight = false;
    renderMonthlyArchiveBook();
  }
}

function getMemoryDateKeys() {
  return new Set([...state.daily.map(inferDateKey), ...state.words.map(inferDateKey)]);
}

function renderDayBundle() {
  const entries = getDateEntries(selectedDateKey);
  selectedDateTitle.textContent = readableDate(selectedDateKey);
  dayBundle.innerHTML = "";

  if (!entries.daily.length && !entries.words.length) {
    const empty = document.createElement("p");
    empty.className = "empty-day";
    empty.textContent = "这一天还没有种下回忆。";
    dayBundle.appendChild(empty);
    return;
  }

  entries.daily.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "bundle-entry";
    const label = document.createElement("span");
    const copy = document.createElement("p");
    const time = document.createElement("time");
    label.textContent = "每日记录";
    copy.textContent = entry.text;
    time.textContent = entry.time;
    card.append(label, copy, time);
    attachEntryPhoto(entry, card);
    if (isTodayEntry(entry)) {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-entry-btn";
      deleteButton.textContent = "删除";
      deleteButton.setAttribute("aria-label", "删除这条每日记录");
      deleteButton.addEventListener("click", () => {
        deleteDailyEntry(entry.id);
      });
      card.appendChild(deleteButton);
    }
    dayBundle.appendChild(card);
  });

  entries.words.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "bundle-entry love-word calendar-letter-card";
    const letterButton = document.createElement("button");
    letterButton.type = "button";
    letterButton.className = "calendar-letter";
    const label = document.createElement("span");
    const copy = document.createElement("p");
    const time = document.createElement("time");
    const cue = document.createElement("small");
    label.textContent = "想对你说的话";
    copy.textContent = getLetterPreview(entry.text);
    time.textContent = entry.time;
    cue.textContent = "点击展开完整情书";
    letterButton.append(label, copy, cue, time);
    attachEntryPhoto(entry, letterButton);
    letterButton.addEventListener("click", () => openLetter(entry));
    card.appendChild(letterButton);
    if (isTodayEntry(entry)) {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-entry-btn";
      deleteButton.textContent = "删除";
      deleteButton.setAttribute("aria-label", "删除这封情书");
      deleteButton.addEventListener("click", () => {
        deleteWordsEntry(entry.id);
      });
      card.appendChild(deleteButton);
    }
    dayBundle.appendChild(card);
  });
}

function renderCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (firstDay.getDay() + 6) % 7;
  const memoryDates = getMemoryDateKeys();

  calendarTitle.textContent = calendarCursor.toLocaleDateString("zh-CN", { year: "numeric", month: "long" });
  calendarGrid.innerHTML = "";

  for (let index = 0; index < leading; index += 1) {
    const spacer = document.createElement("span");
    spacer.className = "calendar-empty";
    calendarGrid.appendChild(spacer);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = toDateKey(new Date(year, month, day));
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(day);
    button.className = "calendar-day";
    button.classList.toggle("has-memory", memoryDates.has(key));
    button.classList.toggle("selected", key === selectedDateKey);
    button.addEventListener("click", () => {
      selectedDateKey = key;
      renderCalendar();
      renderDayBundle();
    });
    calendarGrid.appendChild(button);
  }
}

function updateScore() {
  const capped = Math.min(state.score, 100);
  const percent = Math.round((capped / 100) * 100);
  scoreValue.textContent = String(state.score);
  miniScore.textContent = String(state.score);
  memoryCount.textContent = String(getMemoryDateKeys().size);
  wordsCount.textContent = String(state.words.length);
  wishCount.textContent = String(state.wishes.length);
  moodStatus.textContent = state.mood ? `今天是：${state.mood}` : "等你选择今日心情";
  scorePercent.textContent = `${percent}%`;
  scoreRing.style.setProperty("--score-deg", `${percent * 3.6}deg`);
  moodButtons.forEach((button) => button.classList.toggle("active", button.dataset.mood === state.mood));
  dailySubmitButton.textContent = hasDailyScoreForDate(toDateKey(new Date())) ? "记录" : "+1";

  if (state.score >= 100) {
    unlockBox.classList.remove("locked");
    unlockBox.classList.add("unlocked");
    mysterySeal.classList.add("unlocked");
    unlockText.textContent = "已经攒够 100 分，可以兑换一次惊喜。兑换后积分会清零，新的惊喜从下一分重新开始。";
    demoPoints.hidden = false;
    demoPoints.disabled = false;
    demoPoints.textContent = "兑换惊喜";
  } else {
    unlockBox.classList.add("locked");
    unlockBox.classList.remove("unlocked");
    mysterySeal.classList.remove("unlocked");
    unlockText.textContent = state.lastRedeemedAt
      ? `上一次惊喜已在 ${state.lastRedeemedAt} 兑换。现在还差 ${100 - state.score} 分，可以开启下一次。`
      : `还差 ${100 - state.score} 分。封印还在，但已经能看见一点光。`;
    demoPoints.hidden = false;
    demoPoints.disabled = true;
    demoPoints.textContent = "兑换惊喜";
  }
}

function renderDashboard() {
  normalizeDashboardState();
  renderList(dailyList, getTodayEntries(state.daily));
  renderWordsList(getTodayEntries(state.words));
  renderWishList();
  renderCalendar();
  renderDayBundle();
  updateScore();
  renderMonthlyArchiveBook();
  updatePresenceUI();
  renderCoverPhotos();
  saveDashboard();
}

function addEntry(type, value, extras = {}) {
  const text = value.trim();
  if (!text) return;
  const dateKey = toDateKey(new Date());
  const points = getEntryPointsForType(type, dateKey);
  state[type].push({ id: createEntryId(type), text, time: formatDate(), dateKey, points, ...extras });
  state.score += points;
  selectedDateKey = dateKey;
  calendarCursor = new Date();
  renderDashboard();
}

async function createPhotoPayload(src) {
  if (!src) return {};
  const photoId = await savePhotoData(src);
  return photoId ? { photoId } : { photo: src };
}

dailyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!dailyInput.value.trim()) return;
  const photoPayload = await createPhotoPayload(pendingPhoto);
  addEntry("daily", dailyInput.value, photoPayload);
  pendingPhoto = "";
  dailyPhoto.value = "";
  photoPreview.hidden = true;
  photoPreview.style.backgroundImage = "";
  dailyInput.value = "";
});

wordsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!wordsInput.value.trim()) return;
  const photoPayload = await createPhotoPayload(pendingWordsPhoto);
  addEntry("words", wordsInput.value, photoPayload);
  pendingWordsPhoto = "";
  wordsPhoto.value = "";
  wordsPhotoPreview.hidden = true;
  wordsPhotoPreview.style.backgroundImage = "";
  wordsInput.value = "";
});

wishForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = wishInput.value.trim();
  if (!text) return;
  state.wishes.push({ id: createEntryId("wish"), text, time: formatDate() });
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

dailyPhoto.addEventListener("change", async () => {
  const file = dailyPhoto.files?.[0];
  if (!file) return;
  try {
    pendingPhoto = await compressImage(file, 1400, 0.84);
    photoPreview.hidden = false;
    photoPreview.style.backgroundImage = `url("${pendingPhoto}")`;
  } catch {
    pendingPhoto = "";
    photoPreview.hidden = true;
  }
});

wordsPhoto.addEventListener("change", async () => {
  const file = wordsPhoto.files?.[0];
  if (!file) return;
  try {
    pendingWordsPhoto = await compressImage(file, 1400, 0.84);
    wordsPhotoPreview.hidden = false;
    wordsPhotoPreview.style.backgroundImage = `url("${pendingWordsPhoto}")`;
  } catch {
    pendingWordsPhoto = "";
    wordsPhotoPreview.hidden = true;
  }
});

coverPhotoInput.addEventListener("click", (event) => {
  event.stopPropagation();
});

coverPhotoInput.addEventListener("change", async () => {
  const files = Array.from(coverPhotoInput.files || []);
  if (!files.length) return;

  for (const file of files) {
    const src = await compressImage(file, 1800, 0.84);
    const photoId = await savePhotoData(src);
    const number = state.coverPhotos.length + 1;
    state.coverPhotos.push({
      ...(photoId ? { photoId } : { src }),
      name: `新照片 ${number}`,
      description: "还没有写描述，等你补上这张照片里的故事。",
      tags: ["未分类"],
      dateKey: toDateKey(new Date()),
      createdAt: new Date().toISOString(),
    });
  }

  activeCoverIndex = state.coverPhotos.length - 1;
  localStorage.setItem("love-cover-index", String(activeCoverIndex));
  coverPhotoInput.value = "";
  renderDashboard();
  openPhotoLightbox(activeCoverIndex);
});

coverPhotoCard.addEventListener("click", (event) => {
  if (event.target.closest(".cover-upload")) return;
  openPhotoLightbox(activeCoverIndex);
});

coverPhotoCard.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  openPhotoLightbox(activeCoverIndex);
});

closePhotoLightbox.addEventListener("click", closeLightbox);
photoLightbox.querySelector("[data-close-lightbox]").addEventListener("click", closeLightbox);
monthlyBook?.addEventListener("click", openMonthlyArchive);
closeMonthlyArchive?.addEventListener("click", closeMonthlyArchiveModal);
monthlyArchiveModal?.querySelector("[data-close-monthly-archive]")?.addEventListener("click", closeMonthlyArchiveModal);

photoMetaForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const photo = state.coverPhotos[activeCoverIndex];
  if (!photo) return;
  photo.name = photoNameInput.value.trim() || getPhotoName(photo);
  photo.description = photoDescInput.value.trim() || getPhotoDescription(photo);
  photo.tags = normalizeTags(photoTagsInput.value);
  renderPhotoMeta(photo);
  renderCoverPhotos();
  saveDashboard();
});

deleteCoverPhoto.addEventListener("click", () => {
  deleteActiveCoverPhoto();
});

closeLetterReader.addEventListener("click", closeLetter);
letterReader.querySelector("[data-close-letter]").addEventListener("click", closeLetter);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeSecretEggModal();
  closeMonthlyArchiveModal();
  closeLightbox();
  closeLetter();
});

prevMonth.addEventListener("click", () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
  renderCalendar();
});

nextMonth.addEventListener("click", () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
  renderCalendar();
});

focusTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTab(button.dataset.focusTab);
    document.querySelector(".garden-workspace").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function setActiveTab(tab) {
  tabButtons.forEach((item) => item.classList.toggle("active", item.dataset.tab === tab));
  tabPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tab));
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTab(button.dataset.tab);
  });
});

demoPoints.addEventListener("click", () => {
  if (state.score < 100) return;
  state.scoreOffset = getEarnedPointsTotal();
  state.score = 0;
  state.redeemedSurprises += 1;
  state.lastRedeemedAt = formatDate();
  renderDashboard();
});

initTimers();

async function initDashboard() {
  await migrateStoredPhotos();
  syncCalendarToToday(true);
  await loadCloudState();
  renderDashboard();
  ensureMonthlyArchive();
  startPresenceHeartbeat();
  startCloudSyncPolling();
  setInterval(() => {
    if (!syncCalendarToToday(false)) return;
    renderDashboard();
    ensureMonthlyArchive();
  }, 60 * 1000);
}

initDashboard();
