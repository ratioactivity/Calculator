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
  const knownTranslation = document.getElementById("known-translation");
  const understandingPercent = document.getElementById("understanding-percent");
  const tokenView = document.getElementById("token-view");
  const vocabPreview = document.getElementById("vocab-preview");
  const vocabStorageKey = "language_vocab_list_v1";
  const inputStorageKey = "language_input_text_v1";

  const savedVocab = localStorage.getItem(vocabStorageKey);
  vocabList.value = savedVocab && savedVocab.trim() ? savedVocab : defaultVocabText;
  languageInput.value = localStorage.getItem(inputStorageKey) || "";

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
      }

      tokenView.appendChild(span);
    });

    const percent = totalWords ? (knownWords / totalWords) * 100 : 0;
    understandingPercent.textContent = `${percent.toFixed(1)}% (${knownWords}/${totalWords} words)`;
    knownTranslation.textContent = knownOnlyOutput.length ? `${knownOnlyOutput.join(" ")}.` : "—";

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

  calculateLanguage();
  localStorage.setItem(vocabStorageKey, vocabList.value);
  console.log("✅ script validated");
});
