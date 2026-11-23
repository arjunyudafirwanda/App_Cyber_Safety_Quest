(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [
    ...scope.querySelectorAll(selector),
  ];
  const STORAGE_KEY = "cyber-safety-quest-profiles-v1";
  const THEME_KEY = "cyber-safety-quest-theme-v1";
  const MISSIONS = Array.isArray(window.CYBER_MISSIONS)
    ? window.CYBER_MISSIONS
    : [];
  const ZONES = {
    identity: { label: "Digital Identity", color: "cyan" },
    password: { label: "Password Defense", color: "violet" },
    phishing: { label: "Phishing Radar", color: "orange" },
    footprint: { label: "Digital Footprint", color: "green" },
    device: { label: "Device & Network Safety", color: "blue" },
  };
  const LETTERS = ["A", "B", "C", "D"];

  const dom = {
    welcomeScreen: $("#welcomeScreen"),
    dashboard: $("#dashboard"),
    missionScreen: $("#missionScreen"),
    startForm: $("#startForm"),
    nameInput: $("#playerNameInput"),
    ageInput: $("#playerAgeInput"),
    startError: $("#startError"),
    playerSummary: $("#playerSummary"),
    headerPlayerName: $("#headerPlayerName"),
    headerLevel: $("#headerLevel"),
    headerScore: $("#headerScore"),
    themeToggle: $("#themeToggle"),
    welcomePlayerName: $("#welcomePlayerName"),
    gradeTag: $("#gradeTag"),
    ageTag: $("#ageTag"),
    overviewScore: $("#overviewScore"),
    overviewResolved: $("#overviewResolved"),
    overviewSolved: $("#overviewSolved"),
    overviewStreak: $("#overviewStreak"),
    overallPercent: $("#overallPercent"),
    overallProgressBar: $("#overallProgressBar"),
    overallProgressText: $("#overallProgressText"),
    caseGrid: $("#caseGrid"),
    zoneFilters: $("#zoneFilters"),
    switchPlayerButton: $("#switchPlayerButton"),
    backToCasesButton: $("#backToCasesButton"),
    missionZoneLabel: $("#missionZoneLabel"),
    missionLevelLabel: $("#missionLevelLabel"),
    missionIcon: $("#missionIcon"),
    missionDifficulty: $("#missionDifficulty"),
    missionTitle: $("#missionTitle"),
    missionSubtitle: $("#missionSubtitle"),
    missionStatus: $("#missionStatus"),
    missionScenario: $("#missionScenario"),
    evidenceList: $("#evidenceList"),
    missionQuestion: $("#missionQuestion"),
    attemptIndicator: $("#attemptIndicator"),
    answerList: $("#answerList"),
    hintBox: $("#hintBox"),
    hintText: $("#hintText"),
    feedbackBox: $("#feedbackBox"),
    feedbackHeading: $("#feedbackHeading"),
    feedbackText: $("#feedbackText"),
    feedbackContinueButton: $("#feedbackContinueButton"),
    missionProgressPercent: $("#missionProgressPercent"),
    missionProgressBar: $("#missionProgressBar"),
    sidebarScore: $("#sidebarScore"),
    sidebarStreak: $("#sidebarStreak"),
    penaltyModal: $("#penaltyModal"),
    penaltyDescription: $("#penaltyDescription"),
    scoreBefore: $("#scoreBefore"),
    scoreDeduction: $("#scoreDeduction"),
    scoreAfter: $("#scoreAfter"),
    closePenaltyButton: $("#closePenaltyButton"),
    resultModal: $("#resultModal"),
    resultTitle: $("#resultTitle"),
    resultDescription: $("#resultDescription"),
    resultPoints: $("#resultPoints"),
    resultStars: $("#resultStars"),
    resultContinueButton: $("#resultContinueButton"),
    toast: $("#toast"),
    toastMessage: $("#toastMessage"),
    currentYear: $("#currentYear"),
  };

  const state = {
    store: { activeProfileKey: null, profiles: {} },
    profileKey: null,
    profile: null,
    currentMissionId: null,
    activeZone: "all",
    pendingPenaltyFeedback: false,
  };
  let toastTimer = null;

  function readStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { activeProfileKey: null, profiles: {} };
      const parsed = JSON.parse(raw);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !parsed.profiles ||
        typeof parsed.profiles !== "object"
      ) {
        return { activeProfileKey: null, profiles: {} };
      }
      return {
        activeProfileKey: parsed.activeProfileKey || null,
        profiles: parsed.profiles,
      };
    } catch (error) {
      console.warn(
        "Cyber Safety Quest: saved profile could not be read.",
        error,
      );
      return { activeProfileKey: null, profiles: {} };
    }
  }

  function writeStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.store));
    } catch (error) {
      console.warn("Cyber Safety Quest: profile could not be saved.", error);
      showToast("Progres belum tersimpan. Periksa penyimpanan browser.");
    }
  }

  function normalizeName(name) {
    return String(name || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function profileKeyFrom(name, age) {
    return `${normalizeName(name).toLocaleLowerCase("id-ID")}::${Number(age)}`;
  }

  function gradeFromAge(age) {
    if (age === 13) return "VII";
    if (age === 14) return "VIII";
    return "IX";
  }

  function createProfile(name, age) {
    return {
      name,
      age,
      grade: gradeFromAge(age),
      score: 0,
      bestScore: 0,
      streak: 0,
      unlockedMission: 1,
      missions: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function normalizeMissionProgress(progress) {
    const allowed = ["new", "in-progress", "solved", "reviewed"];
    if (!progress || typeof progress !== "object") {
      return {
        status: "new",
        attempts: 0,
        wrongOptions: [],
        firstAwarded: false,
        points: 0,
        wrongCount: 0,
      };
    }
    return {
      status: allowed.includes(progress.status) ? progress.status : "new",
      attempts: Math.max(0, Math.min(3, Number(progress.attempts) || 0)),
      wrongOptions: Array.isArray(progress.wrongOptions)
        ? progress.wrongOptions.filter(
            (value) => Number.isInteger(value) && value >= 0 && value <= 3,
          )
        : [],
      firstAwarded: Boolean(progress.firstAwarded),
      points: Math.max(0, Number(progress.points) || 0),
      wrongCount: Math.max(0, Number(progress.wrongCount) || 0),
      lastPlayedAt: progress.lastPlayedAt || null,
    };
  }

  function ensureProfileShape(profile, name, age) {
    profile.name = name;
    profile.age = age;
    profile.grade = gradeFromAge(age);
    profile.score = Math.max(0, Number(profile.score) || 0);
    profile.bestScore = Math.max(profile.score, Number(profile.bestScore) || 0);
    profile.streak = Math.max(0, Number(profile.streak) || 0);
    profile.unlockedMission = Math.max(
      1,
      Math.min(MISSIONS.length, Number(profile.unlockedMission) || 1),
    );
    profile.missions =
      profile.missions && typeof profile.missions === "object"
        ? profile.missions
        : {};
    MISSIONS.forEach((mission) => {
      profile.missions[mission.id] = normalizeMissionProgress(
        profile.missions[mission.id],
      );
    });
    return profile;
  }

  function saveProfile() {
    if (!state.profile || !state.profileKey) return;
    state.profile.updatedAt = new Date().toISOString();
    state.store.profiles[state.profileKey] = state.profile;
    state.store.activeProfileKey = state.profileKey;
    writeStore();
    updateHeader();
  }

  function getProgress(missionId) {
    if (!state.profile) return null;
    if (!state.profile.missions[missionId]) {
      state.profile.missions[missionId] = normalizeMissionProgress(null);
    }
    return state.profile.missions[missionId];
  }

  function getCounts() {
    const values = Object.values(state.profile?.missions || {});
    const resolved = values.filter(
      (item) => item.status === "solved" || item.status === "reviewed",
    ).length;
    const solved = values.filter((item) => item.status === "solved").length;
    const reviewed = values.filter((item) => item.status === "reviewed").length;
    return { resolved, solved, reviewed };
  }

  function updateHeader() {
    if (!state.profile) {
      dom.playerSummary.hidden = true;
      return;
    }
    const nextLevel = Math.min(
      MISSIONS.length,
      Number(state.profile.unlockedMission) || 1,
    );
    dom.playerSummary.hidden = false;
    dom.headerPlayerName.textContent = state.profile.name;
    dom.headerLevel.textContent = `${String(nextLevel).padStart(2, "0")} / ${MISSIONS.length}`;
    dom.headerScore.textContent = Number(
      state.profile.score || 0,
    ).toLocaleString("id-ID");
  }

  function setScreen(screen) {
    dom.welcomeScreen.hidden = screen !== "welcome";
    dom.dashboard.hidden = screen !== "dashboard";
    dom.missionScreen.hidden = screen !== "mission";
    dom.playerSummary.hidden = screen === "welcome";
    if (screen !== "welcome")
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
  }

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function startSession(name, age) {
    const key = profileKeyFrom(name, age);
    const existing = state.store.profiles[key];
    const profile = existing
      ? ensureProfileShape(existing, name, age)
      : createProfile(name, age);
    state.profileKey = key;
    state.profile = profile;
    state.store.profiles[key] = profile;
    state.store.activeProfileKey = key;
    saveProfile();
    dom.welcomePlayerName.textContent = name.split(/\s+/)[0];
    dom.gradeTag.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> SMP · KELAS ${profile.grade}`;
    dom.ageTag.innerHTML = `<i class="fa-solid fa-user"></i> ${age} TAHUN`;
    state.activeZone = "all";
    $$(".zone-filter").forEach((button) => {
      const active = button.dataset.zone === "all";
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderDashboard();
    setScreen("dashboard");
  }

  function switchPlayer() {
    state.currentMissionId = null;
    dom.nameInput.value = "";
    dom.ageInput.value = "";
    dom.startError.hidden = true;
    setScreen("welcome");
    dom.nameInput.focus();
  }

  function renderDashboard() {
    if (!state.profile) return;
    const counts = getCounts();
    const total = MISSIONS.length;
    const percent = Math.round((counts.resolved / total) * 100);
    dom.overviewScore.textContent = state.profile.score.toLocaleString("id-ID");
    dom.overviewResolved.textContent = `${counts.resolved} / ${total}`;
    dom.overviewSolved.textContent = String(counts.solved);
    dom.overviewStreak.textContent = String(state.profile.streak || 0);
    dom.overallPercent.textContent = `${percent}%`;
    dom.overallProgressBar.style.width = `${percent}%`;
    dom.overallProgressText.textContent =
      counts.resolved === 0
        ? "Belum ada kasus yang diselesaikan"
        : `${counts.solved} kasus terpecahkan · ${counts.reviewed} kasus perlu latihan`;
    renderCaseGrid();
    updateHeader();
  }

  function renderCaseGrid() {
    if (!state.profile) return;
    const total = MISSIONS.length;
    const unlocked = Number(state.profile.unlockedMission) || 1;
    const visible = MISSIONS.filter(
      (mission) =>
        state.activeZone === "all" || mission.zone === state.activeZone,
    );
    dom.caseGrid.innerHTML = visible
      .map((mission) => {
        const progress = getProgress(mission.id);
        const locked = mission.id > unlocked && progress.status === "new";
        const isSolved = progress.status === "solved";
        const isReviewed = progress.status === "reviewed";
        const stateText = isSolved
          ? "CASE SOLVED"
          : isReviewed
            ? "REVIEW AGAIN"
            : progress.status === "in-progress"
              ? "IN PROGRESS"
              : locked
                ? "LOCKED"
                : "OPEN CASE";
        const stateClass = isSolved ? "solved" : isReviewed ? "reviewed" : "";
        const zone = ZONES[mission.zone];
        const description =
          mission.scenario.length > 112
            ? `${mission.scenario.slice(0, 109)}…`
            : mission.scenario;
        return `<button type="button" class="case-card ${locked ? "is-locked" : ""}" data-mission-id="${mission.id}" ${locked ? "disabled" : ""} aria-label="${locked ? "Terkunci" : "Buka"} kasus ${mission.id}: ${mission.title}">
        <div class="case-card-top"><span class="case-icon"><i class="fa-solid ${mission.icon}" aria-hidden="true"></i></span><span class="case-number">CASE ${String(mission.id).padStart(2, "0")} / ${total}</span></div>
        <h3>${mission.title}</h3><p>${description}</p>
        <div class="case-card-bottom"><span class="case-zone">${zone.label}</span><span class="case-state ${stateClass}"><i class="fa-solid ${isSolved ? "fa-check-circle" : isReviewed ? "fa-rotate" : locked ? "fa-lock" : "fa-folder-open"}"></i>${stateText}</span></div>
        <div class="case-card-progress"><span style="width:${isSolved ? 100 : isReviewed ? 100 : progress.status === "in-progress" ? Math.round((progress.attempts / 3) * 100) : 0}%"></span></div>
        ${locked ? '<span class="case-locked-overlay"><i class="fa-solid fa-lock"></i></span>' : ""}
      </button>`;
      })
      .join("");
  }

  function openMission(id) {
    const mission = MISSIONS.find((item) => item.id === id);
    if (!mission || !state.profile) return;
    const progress = getProgress(id);
    if (id > state.profile.unlockedMission && progress.status === "new") {
      showToast(
        "Selesaikan atau tinjau kasus sebelumnya untuk membuka misi ini.",
      );
      return;
    }
    state.currentMissionId = id;
    if (progress.status === "reviewed") {
      progress.status = "in-progress";
      progress.attempts = 0;
      progress.wrongOptions = [];
      progress.lastPlayedAt = new Date().toISOString();
      saveProfile();
    } else if (progress.status === "new") {
      progress.status = "in-progress";
      progress.attempts = 0;
      progress.wrongOptions = [];
      progress.lastPlayedAt = new Date().toISOString();
      saveProfile();
    }
    renderMission(mission, progress);
    setScreen("mission");
  }

  function renderMission(mission, progress) {
    const isSolved = progress.status === "solved";
    dom.missionZoneLabel.textContent = mission.zoneName.toUpperCase();
    dom.missionLevelLabel.textContent = `CASE ${String(mission.id).padStart(2, "0")} / ${MISSIONS.length}`;
    dom.missionIcon.innerHTML = `<i class="fa-solid ${mission.icon}" aria-hidden="true"></i>`;
    dom.missionDifficulty.textContent = `LEVEL ${mission.difficulty.toUpperCase()}`;
    dom.missionTitle.textContent = mission.title;
    dom.missionSubtitle.textContent = `INVESTIGATION FILE · CASE ${String(mission.id).padStart(2, "0")}`;
    dom.missionStatus.textContent = isSolved
      ? "CASE SOLVED"
      : progress.status === "reviewed"
        ? "REVIEWED"
        : progress.status === "in-progress" && progress.attempts > 0
          ? "IN PROGRESS"
          : "NEW CASE";
    dom.missionScenario.textContent = mission.scenario;
    dom.evidenceList.innerHTML = mission.evidence
      .map(
        (item) =>
          `<span class="evidence-chip"><i class="fa-solid fa-paperclip"></i>${item}</span>`,
      )
      .join("");
    dom.missionQuestion.textContent = mission.question;
    dom.attemptIndicator.textContent = isSolved
      ? "CASE COMPLETED"
      : `ATTEMPT ${Math.min(progress.attempts + 1, 3)} / 3`;
    dom.hintText.textContent = mission.hint;
    dom.hintBox.hidden = true;
    dom.feedbackBox.hidden = true;
    dom.feedbackBox.classList.remove("is-success", "is-warning");
    dom.answerList.innerHTML = mission.options
      .map((option, index) => {
        const wasWrong = progress.wrongOptions.includes(index);
        return `<button type="button" class="answer-option ${wasWrong ? "is-wrong" : ""}" data-answer-index="${index}" ${wasWrong || isSolved ? "disabled" : ""}>
        <span class="answer-letter">${LETTERS[index]}</span><span class="answer-text">${option}</span>
      </button>`;
      })
      .join("");
    updateMissionSidebar();
    if (isSolved) {
      const correctButton = $(
        `[data-answer-index="${mission.correct}"]`,
        dom.answerList,
      );
      if (correctButton) correctButton.classList.add("is-correct");
      showFeedback(
        "success",
        '<i class="fa-solid fa-circle-check"></i> Case solved — kerja bagus, detektif!',
        `${mission.explanation} Kasus ini sudah pernah kamu pecahkan. Kamu bisa kembali ke Case Files untuk melanjutkan investigasi lainnya.`,
        "Kembali ke Case Files",
      );
    } else if (progress.attempts > 0) {
      showFeedback(
        "warning",
        '<i class="fa-solid fa-circle-info"></i> Lanjutkan investigasi',
        `Kamu sudah menggunakan ${progress.attempts} dari 3 percobaan. Periksa pilihan yang masih tersedia dan gunakan petunjuk bila diperlukan.`,
        "Mengerti, lanjutkan",
      );
      dom.hintBox.hidden = false;
    }
  }

  function updateMissionSidebar() {
    if (!state.profile) return;
    const counts = getCounts();
    const percent = Math.round((counts.resolved / MISSIONS.length) * 100);
    dom.missionProgressPercent.textContent = `${percent}%`;
    dom.missionProgressBar.style.width = `${percent}%`;
    dom.sidebarScore.textContent = state.profile.score.toLocaleString("id-ID");
    dom.sidebarStreak.textContent = String(state.profile.streak || 0);
  }

  function showFeedback(type, headingHtml, message, buttonLabel) {
    dom.feedbackBox.hidden = false;
    dom.feedbackBox.classList.toggle("is-success", type === "success");
    dom.feedbackBox.classList.toggle("is-warning", type !== "success");
    dom.feedbackHeading.innerHTML = headingHtml;
    dom.feedbackText.textContent = message;
    dom.feedbackContinueButton.innerHTML = `${buttonLabel} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>`;
    dom.feedbackContinueButton.dataset.action =
      type === "success" ? "back" : "retry";
  }

  function answerQuestion(index) {
    const mission = MISSIONS.find((item) => item.id === state.currentMissionId);
    if (!mission || !state.profile) return;
    const progress = getProgress(mission.id);
    if (
      progress.status === "solved" ||
      progress.status === "reviewed" ||
      progress.wrongOptions.includes(index)
    )
      return;
    progress.attempts = Math.min(3, progress.attempts + 1);
    progress.lastPlayedAt = new Date().toISOString();

    const buttons = $$("[data-answer-index]", dom.answerList);
    const chosen = buttons.find(
      (button) => Number(button.dataset.answerIndex) === index,
    );
    if (chosen) chosen.disabled = true;

    if (index === mission.correct) {
      const attemptPoints = [100, 70, 40][progress.attempts - 1] || 40;
      const canAward = !progress.firstAwarded;
      let streakBonus = 0;
      if (progress.attempts === 1) {
        state.profile.streak = (Number(state.profile.streak) || 0) + 1;
        if (state.profile.streak % 3 === 0) streakBonus = 25;
      } else {
        state.profile.streak = 0;
      }
      const earned = canAward ? attemptPoints + streakBonus : 0;
      state.profile.score =
        Math.max(0, Number(state.profile.score) || 0) + earned;
      state.profile.bestScore = Math.max(
        state.profile.bestScore,
        state.profile.score,
      );
      progress.status = "solved";
      progress.points += earned;
      progress.firstAwarded = true;
      progress.wrongOptions = [];
      state.profile.unlockedMission = Math.min(
        MISSIONS.length,
        Math.max(state.profile.unlockedMission, mission.id + 1),
      );
      saveProfile();
      buttons.forEach((button) => {
        button.disabled = true;
      });
      if (chosen) chosen.classList.add("is-correct");
      dom.missionStatus.textContent = "CASE SOLVED";
      updateMissionSidebar();
      const stars =
        progress.attempts === 1
          ? "★★★"
          : progress.attempts === 2
            ? "★★☆"
            : "★☆☆";
      dom.resultTitle.textContent =
        progress.attempts === 1 ? "Excellent detective work!" : "Case solved!";
      dom.resultDescription.textContent =
        progress.attempts === 1
          ? "Kamu menemukan solusi yang tepat pada percobaan pertama."
          : `Kamu berhasil memecahkan kasus pada percobaan ke-${progress.attempts}. Terus asah kemampuan analisismu!`;
      dom.resultPoints.textContent = `+${earned.toLocaleString("id-ID")}`;
      dom.resultStars.textContent = stars;
      dom.resultModal.hidden = false;
      dom.resultContinueButton.focus();
    } else {
      progress.wrongOptions.push(index);
      progress.wrongCount += 1;
      state.profile.streak = 0;
      saveProfile();
      if (progress.attempts < 3) {
        dom.attemptIndicator.textContent = `ATTEMPT ${progress.attempts} / 3`;
        dom.hintBox.hidden = false;
        showFeedback(
          "warning",
          '<i class="fa-solid fa-circle-exclamation"></i> Belum tepat, coba analisis lagi',
          `Pilihan ini belum menjadi tindakan paling aman. Kamu masih memiliki ${3 - progress.attempts} kesempatan. ${mission.hint}`,
          "Coba lagi",
        );
        updateMissionSidebar();
      } else {
        const before = state.profile.score;
        const deduction = Math.min(20, before);
        state.profile.score = Math.max(0, before - deduction);
        state.profile.bestScore = Math.max(
          state.profile.bestScore,
          state.profile.score,
        );
        progress.status = "reviewed";
        state.profile.unlockedMission = Math.min(
          MISSIONS.length,
          Math.max(state.profile.unlockedMission, mission.id + 1),
        );
        saveProfile();
        buttons.forEach((button) => {
          button.disabled = true;
        });
        const correctButton = $(
          `[data-answer-index="${mission.correct}"]`,
          dom.answerList,
        );
        if (correctButton) correctButton.classList.add("is-correct");
        dom.missionStatus.textContent = "REVIEW REQUIRED";
        dom.scoreBefore.textContent = before.toLocaleString("id-ID");
        dom.scoreDeduction.textContent = `−${deduction.toLocaleString("id-ID")}`;
        dom.scoreAfter.textContent =
          state.profile.score.toLocaleString("id-ID");
        dom.penaltyDescription.textContent = `Tiga percobaan belum tepat. ${deduction > 0 ? "Sebanyak 20 poin dikurangi dari skormu." : "Skormu sudah 0, jadi tidak ada poin yang dikurangi."} Baca penjelasan kasus agar kamu bisa mengambil keputusan yang lebih aman berikutnya.`;
        state.pendingPenaltyFeedback = true;
        dom.penaltyModal.hidden = false;
        dom.closePenaltyButton.focus();
        updateMissionSidebar();
      }
    }
    dom.attemptIndicator.textContent = `ATTEMPT ${Math.min(Math.max(progress.attempts, 1), 3)} / 3`;
  }

  function continueAfterFeedback() {
    const action = dom.feedbackContinueButton.dataset.action;
    if (action === "back") {
      renderDashboard();
      setScreen("dashboard");
      $("#caseFiles")?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
      return;
    }
    dom.feedbackBox.hidden = true;
    dom.feedbackBox.classList.remove("is-success", "is-warning");
    if (state.currentMissionId) {
      const progress = getProgress(state.currentMissionId);
      dom.attemptIndicator.textContent = `ATTEMPT ${Math.min(progress.attempts + 1, 3)} / 3`;
    }
  }

  function closePenalty() {
    dom.penaltyModal.hidden = true;
    state.pendingPenaltyFeedback = false;
    const mission = MISSIONS.find((item) => item.id === state.currentMissionId);
    if (!mission) return;
    showFeedback(
      "warning",
      '<i class="fa-solid fa-book-open"></i> Case review — pelajari jawabannya',
      `Jawaban paling aman: ${mission.options[mission.correct]}. ${mission.explanation} Kasus ini sudah ditandai untuk ditinjau dan misi berikutnya terbuka. Kamu dapat kembali ke Case Files atau membuka kasus ini lagi untuk mencoba ulang.`,
      "Kembali ke Case Files",
    );
    dom.feedbackContinueButton.dataset.action = "back";
    dom.feedbackBox.classList.remove("is-warning");
    dom.feedbackBox.classList.add("is-success");
    dom.feedbackHeading.style.color = "#39b781";
    dom.missionStatus.textContent = "REVIEWED";
    updateMissionSidebar();
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    dom.toastMessage.textContent = message;
    dom.toast.classList.remove("show");
    requestAnimationFrame(() => dom.toast.classList.add("show"));
    toastTimer = window.setTimeout(
      () => dom.toast.classList.remove("show"),
      2800,
    );
  }

  function applyTheme(theme) {
    const value = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = value;
    dom.themeToggle.innerHTML =
      value === "dark"
        ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
    dom.themeToggle.setAttribute(
      "aria-label",
      value === "dark" ? "Aktifkan tema terang" : "Aktifkan tema gelap",
    );
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch (error) {}
  }

  function initializeEvents() {
    dom.startForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = normalizeName(dom.nameInput.value);
      const age = Number(dom.ageInput.value);
      if (name.length < 2 || name.length > 24) {
        dom.startError.textContent = "Nama harus terdiri dari 2–24 karakter.";
        dom.startError.hidden = false;
        dom.nameInput.focus();
        return;
      }
      if (!Number.isInteger(age) || age < 13 || age > 16) {
        dom.startError.textContent = "Masukkan usia 13 sampai 16 tahun.";
        dom.startError.hidden = false;
        dom.ageInput.focus();
        return;
      }
      dom.startError.hidden = true;
      startSession(name, age);
    });

    dom.switchPlayerButton.addEventListener("click", switchPlayer);
    dom.backToCasesButton.addEventListener("click", () => {
      renderDashboard();
      setScreen("dashboard");
    });
    dom.zoneFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-zone]");
      if (!button) return;
      state.activeZone = button.dataset.zone;
      $$(".zone-filter", dom.zoneFilters).forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      renderCaseGrid();
    });
    dom.caseGrid.addEventListener("click", (event) => {
      const card = event.target.closest("[data-mission-id]");
      if (!card || card.disabled) return;
      openMission(Number(card.dataset.missionId));
    });
    dom.answerList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-answer-index]");
      if (!button || button.disabled) return;
      answerQuestion(Number(button.dataset.answerIndex));
    });
    dom.feedbackContinueButton.addEventListener("click", continueAfterFeedback);
    dom.closePenaltyButton.addEventListener("click", closePenalty);
    dom.resultContinueButton.addEventListener("click", () => {
      dom.resultModal.hidden = true;
      renderDashboard();
      setScreen("dashboard");
    });
    dom.themeToggle.addEventListener("click", () => {
      const current = document.documentElement.dataset.theme || "dark";
      applyTheme(current === "dark" ? "light" : "dark");
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (!dom.resultModal.hidden) dom.resultModal.hidden = true;
        else if (!dom.penaltyModal.hidden) closePenalty();
      }
    });
  }

  function initialize() {
    if (!MISSIONS.length) {
      console.error(
        "Cyber Safety Quest: missions.js did not load any mission.",
      );
      return;
    }
    state.store = readStore();
    let theme = "dark";
    try {
      theme = localStorage.getItem(THEME_KEY) || "dark";
    } catch (error) {}
    applyTheme(theme);
    dom.currentYear.textContent = new Date().getFullYear();
    initializeEvents();
    setScreen("welcome");
  }

  initialize();
})();
