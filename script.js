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
  const rem = sv * 100;    // 1 Sv = 100 rem
  const mrem = rem * 1e3;
  // Assuming QF=1 (photons/β): 1 Gy ≈ 1 Sv → 1 rad ≈ 1 rem
  const gy = sv;           // with QF=1
  const rad = rem;         // with QF=1
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
    case "sv":   sv = v; break;
    case "msv":  sv = v / 1e3; break;
    case "usv":  sv = v / 1e6; break;
    case "rem":  sv = v / 100; break;
    case "mrem": sv = (v / 100) / 1e3; break;
    case "gy":   sv = v; break;        // QF=1
    case "rad":  sv = (v / 100); break; // rad → rem (1:1), rem → Sv (/100)
    default: return;
  }
  writeDose(fromSv(sv), key);
}

Object.entries(doseInputs).forEach(([k, el]) => {
  el.addEventListener("input", () => handleDoseInput(k));
});

document.getElementById("clear-dose").addEventListener("click", () => {
  Object.values(doseInputs).forEach((el) => (el.value = ""));
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
    case "usvh": usvh = v; break;
    case "msvh": usvh = v * 1e3; break;
    case "mremh": usvh = v * 10; break;
    default: return;
  }
  writeRate(fromUsvh(usvh), key);
}

Object.entries(rateInputs).forEach(([k, el]) => {
  el.addEventListener("input", () => handleRateInput(k));
});

document.getElementById("clear-rate").addEventListener("click", () => {
  Object.values(rateInputs).forEach((el) => (el.value = ""));
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
