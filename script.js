window.addEventListener("DOMContentLoaded", () => {
  // Utility
  const clampFloat = (v) => (isFinite(v) ? v : "");

  // Dose conversions
  const doseInputs = {
    sv: document.getElementById("dose-sv"),
    msv: document.getElementById("dose-msv"),
    usv: document.getElementById("dose-usv"),
    rem: document.getElementById("dose-rem"),
    mrem: document.getElementById("dose-mrem"),
    gy: document.getElementById("dose-gy"),
    rad: document.getElementById("dose-rad"),
  };

  function fromSv(sv) {
    const msv = sv * 1e3;
    const usv = sv * 1e6;
    const rem = sv * 100; // 1 Sv = 100 rem
    const mrem = rem * 1e3;
    // Assuming QF=1 (photons/β): 1 Gy ≈ 1 Sv → 1 rad ≈ 1 rem
    const gy = sv;
    const rad = rem;
    return { sv, msv, usv, rem, mrem, gy, rad };
  }

  function writeDose(values, exceptKey) {
    Object.entries(doseInputs).forEach(([k, el]) => {
      if (k !== exceptKey) el.value = clampFloat(values[k]);
    });
  }

  function handleDoseInput(key) {
    const v = parseFloat(doseInputs[key].value);
    if (!isFinite(v)) return;

    let sv;
    switch (key) {
      case "sv":
        sv = v;
        break;
      case "msv":
        sv = v / 1e3;
        break;
      case "usv":
        sv = v / 1e6;
        break;
      case "rem":
        sv = v / 100;
        break;
      case "mrem":
        sv = v / 100 / 1e3;
        break;
      case "gy":
        sv = v;
        break;
      case "rad":
        sv = v / 100;
        break;
      default:
        return;
    }
    writeDose(fromSv(sv), key);
  }

  Object.entries(doseInputs).forEach(([k, el]) => {
    el.addEventListener("input", () => handleDoseInput(k));
  });

  document.getElementById("clear-dose").addEventListener("click", () => {
    Object.values(doseInputs).forEach((el) => {
      el.value = "";
    });
  });

  // Dose rate conversions
  const rateInputs = {
    usvh: document.getElementById("rate-usvh"),
    msvh: document.getElementById("rate-msvh"),
    mremh: document.getElementById("rate-mremh"),
  };

  function fromUsvh(usvh) {
    const msvh = usvh / 1e3;
    const mremh = usvh / 10; // 1 mrem/h = 10 µSv/h
    return { usvh, msvh, mremh };
  }

  function writeRate(values, exceptKey) {
    Object.entries(rateInputs).forEach(([k, el]) => {
      if (k !== exceptKey) el.value = clampFloat(values[k]);
    });
  }

  function handleRateInput(key) {
    const v = parseFloat(rateInputs[key].value);
    if (!isFinite(v)) return;

    let usvh;
    switch (key) {
      case "usvh":
        usvh = v;
        break;
      case "msvh":
        usvh = v * 1e3;
        break;
      case "mremh":
        usvh = v * 10;
        break;
      default:
        return;
    }
    writeRate(fromUsvh(usvh), key);
  }

  Object.entries(rateInputs).forEach(([k, el]) => {
    el.addEventListener("input", () => handleRateInput(k));
  });

  document.getElementById("clear-rate").addEventListener("click", () => {
    Object.values(rateInputs).forEach((el) => {
      el.value = "";
    });
  });

  // CPM <-> µSv/h (approx)
  const cpm = document.getElementById("cpm");
  const cpmFactor = document.getElementById("cpmFactor");
  const cpmUsvh = document.getElementById("cpm-usvh");

  function updateCpmToUsvh() {
    const c = parseFloat(cpm.value);
    const f = parseFloat(cpmFactor.value);
    if (!isFinite(c) || !isFinite(f) || f === 0) return;
    cpmUsvh.value = clampFloat(c / f);
  }

  function updateUsvhToCpm() {
    const u = parseFloat(cpmUsvh.value);
    const f = parseFloat(cpmFactor.value);
    if (!isFinite(u) || !isFinite(f)) return;
    cpm.value = clampFloat(u * f);
  }

  [cpm, cpmFactor].forEach((el) => el.addEventListener("input", updateCpmToUsvh));
  cpmUsvh.addEventListener("input", updateUsvhToCpm);

  document.getElementById("clear-cpm").addEventListener("click", () => {
    cpm.value = "";
    cpmFactor.value = "175";
    cpmUsvh.value = "";
  });

  // Language translator calculator
  const defaultVocabText = `Cameron = known as bad
Noah = known as bad
Owen = known as bad
holy shit
fuck = good or bad
fucking = good or bad
oh my god = confusion, sometimes good
what the fuck = confusion, sometimes good
hello = greeting
hi = greeting
hey = greeting
phone
kill
sea lion
threat
water
bad
is
jerky
no
trash
ocean
good
blue
more
music
dad
please
go
light
camera
sonar
boat
fish
shark
dolphin
whale
orca
seal
net
hook
rope
propeller
anchor
chain
human
diver
swim
food
eat
sleep
goodnight
good morning
storming
avoid
stay
away
hide
deep
hurt
sick
submarine
see
seen
don't
do not
you
me
i'm
i am
nod
shake your head
a little
understand
can you
speak
here
come
alive
dead
die
live
baby
small
big
large
love
want
bite
break`;

  const languageInput = document.getElementById("language-input");
  const vocabList = document.getElementById("vocab-list");
  const lockVocabListButton = document.getElementById("lock-vocab-list");
  const knownTranslation = document.getElementById("known-translation");
  const understandingPercent = document.getElementById("understanding-percent");
  const tokenView = document.getElementById("token-view");
  const vocabPreview = document.getElementById("vocab-preview");
  const toggleRadiationButton = document.getElementById("toggle-radiation");
  const toggleLanguageButton = document.getElementById("toggle-language");
  const toggleTimeManagerButton = document.getElementById("toggle-time-manager");
  const radiationContent = document.getElementById("radiation-content");
  const languageContent = document.getElementById("language-content");
  const timeManagerContent = document.getElementById("time-manager-content");
  const radiationIntro = document.querySelector(".radiation-intro");
  const vocabSaveName = document.getElementById("vocab-save-name");
  const saveVocabListButton = document.getElementById("save-vocab-list");
  const savedVocabSelect = document.getElementById("saved-vocab-select");
  const loadVocabListButton = document.getElementById("load-vocab-list");
  const deleteVocabListButton = document.getElementById("delete-vocab-list");
  const vocabStorageKey = "language_vocab_list_v1";
  const inputStorageKey = "language_input_text_v1";
  const vocabSnapshotsKey = "language_vocab_snapshots_v1";
  const vocabLockedKey = "language_vocab_locked_v1";
  const radiationCollapsedKey = "radiation_collapsed_v1";
  const languageCollapsedKey = "language_collapsed_v1";
  const timeManagerCollapsedKey = "time_manager_collapsed_v1";
  const timeStartModeInputs = document.querySelectorAll('input[name="time-start-mode"]');
  const specificStartInput = document.getElementById("time-specific-start");
  const taskListInput = document.getElementById("time-task-list");
  const breakListInput = document.getElementById("time-break-list");
  const deadlineInput = document.getElementById("time-deadline");
  const calculateTimePlanButton = document.getElementById("calculate-time-plan");
  const totalTasksOutput = document.getElementById("time-total-tasks");
  const totalBreaksOutput = document.getElementById("time-total-breaks");
  const totalRequiredOutput = document.getElementById("time-total-required");
  const requiredStartOutput = document.getElementById("time-required-start");
  const timeStatusOutput = document.getElementById("time-status");

  const savedVocab = localStorage.getItem(vocabStorageKey);
  vocabList.value = savedVocab && savedVocab.trim() ? savedVocab : defaultVocabText;
  languageInput.value = localStorage.getItem(inputStorageKey) || "";

  function setVocabLockState(isLocked) {
    vocabList.readOnly = isLocked;
    lockVocabListButton.textContent = isLocked ? "Unlock vocabulary editing" : "Lock vocabulary editing";
    localStorage.setItem(vocabLockedKey, isLocked ? "true" : "false");
  }

  function setRadiationCollapsedState(isCollapsed) {
    radiationContent.classList.toggle("is-collapsed", isCollapsed);
    radiationIntro.classList.toggle("is-collapsed", isCollapsed);
    toggleRadiationButton.textContent = isCollapsed
      ? "Expand radiation calculator"
      : "Minimize radiation calculator";
    localStorage.setItem(radiationCollapsedKey, isCollapsed ? "true" : "false");
  }

  function setLanguageCollapsedState(isCollapsed) {
    languageContent.classList.toggle("is-collapsed", isCollapsed);
    toggleLanguageButton.textContent = isCollapsed
      ? "Expand language calculator"
      : "Minimize language calculator";
    localStorage.setItem(languageCollapsedKey, isCollapsed ? "true" : "false");
  }

  function setTimeManagerCollapsedState(isCollapsed) {
    timeManagerContent.classList.toggle("is-collapsed", isCollapsed);
    toggleTimeManagerButton.textContent = isCollapsed ? "Expand time manager" : "Minimize time manager";
    localStorage.setItem(timeManagerCollapsedKey, isCollapsed ? "true" : "false");
  }

  function parseMinuteEntries(rawText) {
    return rawText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .reduce((sum, line) => {
        const match = line.match(/(\d+(?:\.\d+)?)\s*$/);
        if (!match) return sum;
        return sum + Number(match[1]);
      }, 0);
  }

  function currentStartMode() {
    const selected = Array.from(timeStartModeInputs).find((input) => input.checked);
    return selected ? selected.value : "current";
  }

  function formatDateTimeOutput(dateObj) {
    return dateObj.toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function calculateTimePlan() {
    const taskMinutes = parseMinuteEntries(taskListInput.value);
    const breakMinutes = parseMinuteEntries(breakListInput.value);
    const totalRequiredMinutes = taskMinutes + breakMinutes;
    const deadlineValue = deadlineInput.value;
    const deadlineMs = deadlineValue ? new Date(deadlineValue).getTime() : NaN;

    totalTasksOutput.textContent = `${taskMinutes} min`;
    totalBreaksOutput.textContent = `${breakMinutes} min`;
    totalRequiredOutput.textContent = `${totalRequiredMinutes} min`;

    if (!Number.isFinite(deadlineMs) || totalRequiredMinutes <= 0) {
      requiredStartOutput.textContent = "Add a deadline and task/break times";
      timeStatusOutput.textContent = "—";
      return;
    }

    const requiredStartMs = deadlineMs - totalRequiredMinutes * 60 * 1000;
    const requiredStart = new Date(requiredStartMs);
    requiredStartOutput.textContent = formatDateTimeOutput(requiredStart);

    const chosenStartMs =
      currentStartMode() === "specific" && specificStartInput.value
        ? new Date(specificStartInput.value).getTime()
        : Date.now();

    if (!Number.isFinite(chosenStartMs)) {
      timeStatusOutput.textContent = "Add a valid specific start time";
      return;
    }

    if (chosenStartMs <= requiredStartMs) {
      const minutesAhead = Math.round((requiredStartMs - chosenStartMs) / 60000);
      timeStatusOutput.textContent = `On track. You have ${minutesAhead} minutes of buffer.`;
    } else {
      const minutesLate = Math.round((chosenStartMs - requiredStartMs) / 60000);
      timeStatusOutput.textContent = `Late by ${minutesLate} minutes.`;
    }
  }

  function normalizeTerm(term) {
    return term
      .toLowerCase()
      .replace(/[’‘ʼ`]/g, "'")
      .replace(/[^a-z0-9' ]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function variantForms(word) {
    const forms = new Set([word]);
    if (word === "ive") forms.add("i've");
    if (word === "ill") forms.add("i'll");
    if (word === "youve") forms.add("you've");
    if (word === "youll") forms.add("you'll");
    if (word.endsWith("'m")) forms.add(word.replace("'m", " am"));
    if (word.endsWith("'ll")) forms.add(word.replace("'ll", ""));
    if (word.endsWith("'re")) forms.add(word.replace("'re", ""));
    if (word.endsWith("'ve")) forms.add(word.replace("'ve", ""));
    if (word.endsWith("'d")) forms.add(word.replace("'d", ""));
    if (word.endsWith("'s")) forms.add(word.replace("'s", ""));
    if (word.endsWith("n't")) forms.add(word.replace("n't", ""));
    if (word === "i") forms.add("i'm");
    if (word.endsWith("ies")) forms.add(`${word.slice(0, -3)}y`);
    if (word.endsWith("es")) forms.add(word.slice(0, -2));
    if (word.endsWith("s")) forms.add(word.slice(0, -1));
    if (word.endsWith("ied")) forms.add(`${word.slice(0, -3)}y`);
    if (word.endsWith("ed")) {
      const base = word.slice(0, -2);
      forms.add(base);
      forms.add(`${base}e`);
    }
    if (word.endsWith("ing")) {
      forms.add(word.slice(0, -3));
      forms.add(`${word.slice(0, -3)}e`);
    }
    return Array.from(forms).filter(Boolean);
  }

  const pronounGroups = [
    ["i", "me", "my", "mine", "myself", "i'm", "i am", "i'll", "i've", "i'd"],
    ["you", "your", "yours", "yourself", "you're", "you are", "you'll", "you've", "you'd"],
  ];

  function expandPronounForms(vocabMap) {
    const expanded = new Map(vocabMap);
    pronounGroups.forEach((group) => {
      const knownEntry = group.find((item) => expanded.has(item));
      if (knownEntry) {
        const note = expanded.get(knownEntry) || `Known through "${knownEntry}"`;
        group.forEach((item) => {
          if (!expanded.has(item)) expanded.set(item, note);
        });
      }
    });
    return expanded;
  }

  function parseVocabulary() {
    const map = new Map();
    vocabList.value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const [rawPhrase, ...rawNote] = line.split("=");
        const phrase = normalizeTerm(rawPhrase || "");
        const note = rawNote.join("=").trim();
        if (!phrase) return;
        map.set(phrase, note);
      });
    return map;
  }

  function getSavedSnapshots() {
    const raw = localStorage.getItem(vocabSnapshotsKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item) => item && item.name && item.vocabText);
    } catch (error) {
      return [];
    }
  }

  function writeSavedSnapshots(snapshots) {
    localStorage.setItem(vocabSnapshotsKey, JSON.stringify(snapshots));
  }

  function renderSavedSnapshotOptions() {
    const snapshots = getSavedSnapshots();
    savedVocabSelect.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = snapshots.length ? "Select a saved vocabulary..." : "No saved vocab lists yet";
    savedVocabSelect.appendChild(placeholder);

    snapshots.forEach((snapshot) => {
      const option = document.createElement("option");
      option.value = snapshot.id;
      option.textContent = snapshot.name;
      savedVocabSelect.appendChild(option);
    });
  }

  function saveCurrentVocabularySnapshot() {
    const name = (vocabSaveName.value || "").trim();
    if (!name) return;
    const snapshots = getSavedSnapshots();
    const existingIndex = snapshots.findIndex((item) => item.name.toLowerCase() === name.toLowerCase());
    const snapshot = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      vocabText: vocabList.value.trim(),
      savedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      snapshots[existingIndex] = { ...snapshots[existingIndex], ...snapshot };
    } else {
      snapshots.push(snapshot);
    }

    writeSavedSnapshots(snapshots);
    renderSavedSnapshotOptions();
    const selectedSnapshot = getSavedSnapshots().find((item) => item.name.toLowerCase() === name.toLowerCase());
    if (selectedSnapshot) savedVocabSelect.value = selectedSnapshot.id;
  }

  function loadSelectedVocabularySnapshot() {
    const selectedId = savedVocabSelect.value;
    if (!selectedId) return;
    const snapshots = getSavedSnapshots();
    const selectedSnapshot = snapshots.find((item) => item.id === selectedId);
    if (!selectedSnapshot) return;
    vocabList.value = selectedSnapshot.vocabText;
    localStorage.setItem(vocabStorageKey, vocabList.value);
    calculateLanguage();
  }

  function deleteSelectedVocabularySnapshot() {
    const selectedId = savedVocabSelect.value;
    if (!selectedId) return;
    const snapshots = getSavedSnapshots().filter((item) => item.id !== selectedId);
    writeSavedSnapshots(snapshots);
    renderSavedSnapshotOptions();
  }

  function tokenize(text) {
    const matches = text.match(/[\p{L}'’]+|[^\p{L}'’\s]+/gu) || [];
    return matches.map((token) => ({
      raw: token,
      word: /^[\p{L}'’]+$/u.test(token),
      normalized: normalizeTerm(token),
    }));
  }

  function isKnownWord(normalized, vocabMap) {
    if (!normalized) return false;
    if (vocabMap.has(normalized)) return true;
    const variants = variantForms(normalized);
    return variants.some((form) => vocabMap.has(form));
  }

  function appendWordToVocabulary(rawWord) {
    const normalized = normalizeTerm(rawWord);
    if (!normalized) return;
    if (vocabList.readOnly) return;
    const current = parseVocabulary();
    if (current.has(normalized)) return;
    vocabList.value = `${vocabList.value.trim()}\n${normalized}`.trim();
    localStorage.setItem(vocabStorageKey, vocabList.value);
    calculateLanguage();
  }

  function renderVocabPreview(vocabMap) {
    vocabPreview.innerHTML = "";
    Array.from(vocabMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([phrase, note]) => {
        const chip = document.createElement("span");
        chip.className = "vocab-chip";
        chip.textContent = phrase;
        chip.title = note || "No note yet";
        vocabPreview.appendChild(chip);
      });
  }

  function calculateLanguage() {
    const vocabMap = expandPronounForms(parseVocabulary());
    const tokens = tokenize(languageInput.value);

    let totalWords = 0;
    let knownWords = 0;
    const knownOnlyOutput = [];

    tokenView.innerHTML = "";

    tokens.forEach((token) => {
      const span = document.createElement("span");
      span.className = "token";
      span.textContent = token.raw;

      if (token.word) {
        totalWords += 1;
        const known = isKnownWord(token.normalized, vocabMap);
        if (known) {
          knownWords += 1;
          knownOnlyOutput.push(token.raw);
          const note = vocabMap.get(token.normalized) || "Known word";
          span.title = note || "Known word";
          span.classList.add("known");
        } else {
          span.classList.add("unknown");
          span.title = "Unknown word. Click to add to vocabulary.";
          span.addEventListener("click", () => appendWordToVocabulary(token.raw));
        }
      } else {
        span.classList.add("punct");
        knownOnlyOutput.push(token.raw);
      }

      tokenView.appendChild(span);
    });

    const percent = totalWords ? (knownWords / totalWords) * 100 : 0;
    understandingPercent.textContent = `${percent.toFixed(1)}% (${knownWords}/${totalWords} words)`;
    const translationText = knownOnlyOutput
      .join(" ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/([([{])\s+/g, "$1")
      .trim();
    knownTranslation.textContent = translationText || "—";

    renderVocabPreview(vocabMap);
  }

  languageInput.addEventListener("input", () => {
    localStorage.setItem(inputStorageKey, languageInput.value);
    calculateLanguage();
  });
  vocabList.addEventListener("input", () => {
    localStorage.setItem(vocabStorageKey, vocabList.value);
    calculateLanguage();
  });
  saveVocabListButton.addEventListener("click", saveCurrentVocabularySnapshot);
  loadVocabListButton.addEventListener("click", loadSelectedVocabularySnapshot);
  deleteVocabListButton.addEventListener("click", deleteSelectedVocabularySnapshot);
  lockVocabListButton.addEventListener("click", () => {
    setVocabLockState(!vocabList.readOnly);
  });
  toggleRadiationButton.addEventListener("click", () => {
    const next = !radiationContent.classList.contains("is-collapsed");
    setRadiationCollapsedState(next);
  });
  toggleLanguageButton.addEventListener("click", () => {
    const next = !languageContent.classList.contains("is-collapsed");
    setLanguageCollapsedState(next);
  });
  toggleTimeManagerButton.addEventListener("click", () => {
    const next = !timeManagerContent.classList.contains("is-collapsed");
    setTimeManagerCollapsedState(next);
  });
  timeStartModeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      specificStartInput.disabled = currentStartMode() !== "specific";
      calculateTimePlan();
    });
  });
  [specificStartInput, taskListInput, breakListInput, deadlineInput].forEach((input) => {
    input.addEventListener("input", calculateTimePlan);
  });
  calculateTimePlanButton.addEventListener("click", calculateTimePlan);

  setVocabLockState(localStorage.getItem(vocabLockedKey) === "true");
  setRadiationCollapsedState(localStorage.getItem(radiationCollapsedKey) === "true");
  setLanguageCollapsedState(localStorage.getItem(languageCollapsedKey) === "true");
  setTimeManagerCollapsedState(localStorage.getItem(timeManagerCollapsedKey) === "true");
  specificStartInput.disabled = currentStartMode() !== "specific";
  calculateLanguage();
  calculateTimePlan();
  localStorage.setItem(vocabStorageKey, vocabList.value);
  renderSavedSnapshotOptions();
  console.log("✅ script validated");
});
