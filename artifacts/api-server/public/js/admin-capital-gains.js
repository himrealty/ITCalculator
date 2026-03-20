/**
 * admin-capital-gains.js
 * Loads formula JSON, renders editable UI, saves back to localStorage
 */

const STORAGE_KEY = 'itcalc_capital_gains_formulas';
const DEFAULT_JSON_PATH = '/data/capital-gains-formulas.json';

let formulas = null;

// ─── BOOTSTRAP ───────────────────────────────────────────────────────────────
async function init() {
  formulas = loadFromStorage();

  if (!formulas) {
    try {
      const res = await fetch(DEFAULT_JSON_PATH);
      formulas = await res.json();
      log('Loaded defaults from JSON file', 'info');
    } catch (e) {
      log('Could not load default JSON. Starting blank.', 'warn');
      formulas = {};
    }
  } else {
    log('Loaded from localStorage', 'success');
  }

  renderAll();
  updateMetaDisplay();
}

// ─── STORAGE ─────────────────────────────────────────────────────────────────
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveToStorage() {
  try {
    formulas.meta.lastUpdated = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formulas, null, 2));
    log('Saved successfully to localStorage', 'success');
    updateMetaDisplay();
    showSaveFlash();
  } catch (e) {
    log('Save failed: ' + e.message, 'error');
  }
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(formulas, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `capital-gains-formulas-${formulas.meta?.lastUpdated || 'export'}.json`;
  a.click();
  log('Exported JSON file', 'info');
}

function resetToDefaults() {
  if (!confirm('Reset all formulas to defaults? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  log('Reset to defaults — reloading...', 'warn');
  setTimeout(() => location.reload(), 800);
}

// ─── RENDER ALL SECTIONS ─────────────────────────────────────────────────────
function renderAll() {
  renderHoldingPeriods();
  renderTaxRates();
  renderCII();
  renderExemptions();
  renderSetOff();
  renderCessAndSurcharge();
}

// ─── HOLDING PERIODS ─────────────────────────────────────────────────────────
function renderHoldingPeriods() {
  const wrap = document.getElementById('holdingPeriods');
  const hp = formulas.holdingPeriods || {};
  wrap.innerHTML = Object.entries(hp).map(([key, val]) => `
    <div class="field-row" data-path="holdingPeriods.${key}">
      <div class="field-label">
        <span class="field-key">${key}</span>
        <input class="field-desc" value="${val.label}" 
               onchange="setNested('holdingPeriods.${key}.label', this.value)" />
      </div>
      <div class="field-control">
        <label>STCP Months</label>
        <input type="number" class="num-input" value="${val.stcpMonths}"
               onchange="setNested('holdingPeriods.${key}.stcpMonths', +this.value)" />
      </div>
    </div>
  `).join('');
}

// ─── TAX RATES ───────────────────────────────────────────────────────────────
function renderTaxRates() {
  const wrap = document.getElementById('taxRates');
  const tr = formulas.taxRates || {};
  let html = '';

  // STCG
  html += `<div class="sub-section-title">Short-Term Capital Gains (STCG)</div>`;
  Object.entries(tr.stcg || {}).forEach(([key, val]) => {
    html += `
      <div class="field-row">
        <div class="field-label">
          <span class="field-key">${val.label}</span>
          <span class="field-notes">${val.notes || ''}</span>
        </div>
        <div class="field-control">
          <label>Rate (%)</label>
          ${val.rate === 'slabRate'
            ? `<span class="slab-badge">Slab Rate</span>`
            : `<input type="number" step="0.5" class="num-input" value="${val.rate}"
                     onchange="setNested('taxRates.stcg.${key}.rate', +this.value)" />`
          }
        </div>
      </div>`;
  });

  // LTCG
  html += `<div class="sub-section-title" style="margin-top:20px">Long-Term Capital Gains (LTCG)</div>`;
  Object.entries(tr.ltcg || {}).forEach(([key, val]) => {
    html += `
      <div class="field-row">
        <div class="field-label">
          <span class="field-key">${val.label}</span>
          <span class="field-notes">${val.notes || ''}</span>
        </div>
        <div class="field-control">
          ${val.rate !== undefined ? `
            <label>Rate (%)</label>
            <input type="number" step="0.5" class="num-input" value="${val.rate}"
                   onchange="setNested('taxRates.ltcg.${key}.rate', +this.value)" />
          ` : ''}
          ${val.rateWithIndexation !== undefined ? `
            <label>With Indexation (%)</label>
            <input type="number" step="0.5" class="num-input" value="${val.rateWithIndexation}"
                   onchange="setNested('taxRates.ltcg.${key}.rateWithIndexation', +this.value)" />
            <label style="margin-top:6px">Without Indexation (%)</label>
            <input type="number" step="0.5" class="num-input" value="${val.rateWithoutIndexation}"
                   onchange="setNested('taxRates.ltcg.${key}.rateWithoutIndexation', +this.value)" />
          ` : ''}
          ${val.exemptionLimit !== undefined ? `
            <label style="margin-top:6px">Exemption Limit (₹)</label>
            <input type="number" class="num-input" value="${val.exemptionLimit}"
                   onchange="setNested('taxRates.ltcg.${key}.exemptionLimit', +this.value)" />
          ` : ''}
        </div>
      </div>`;
  });

  wrap.innerHTML = html;
}

// ─── CII TABLE ────────────────────────────────────────────────────────────────
function renderCII() {
  const wrap = document.getElementById('ciiTable');
  const cii = formulas.indexation?.ciiValues || {};
  wrap.innerHTML = `
    <div class="cii-grid">
      ${Object.entries(cii).map(([yr, val]) => `
        <div class="cii-row">
          <span class="cii-year">${yr}</span>
          <input type="number" class="cii-input" value="${val}"
                 onchange="setNested('indexation.ciiValues.${yr}', +this.value)" />
        </div>
      `).join('')}
    </div>
    <button class="btn-add" onclick="addCIIYear()">+ Add Year</button>
  `;
}

function addCIIYear() {
  const cii = formulas.indexation.ciiValues;
  const years = Object.keys(cii).sort();
  const lastYear = years[years.length - 1]; // e.g. "2024-25"
  const [start] = lastYear.split('-').map(Number);
  const newKey = `${start + 1}-${String(start + 2).slice(-2)}`;
  if (cii[newKey]) { log('Year already exists', 'warn'); return; }
  cii[newKey] = 0;
  renderCII();
  log(`Added CII year ${newKey}`, 'info');
}

// ─── EXEMPTIONS ──────────────────────────────────────────────────────────────
function renderExemptions() {
  const wrap = document.getElementById('exemptions');
  const ex = formulas.exemptions || {};
  wrap.innerHTML = Object.entries(ex).map(([key, val]) => `
    <div class="field-row exemption-row">
      <div class="field-label">
        <span class="field-key">${key}</span>
        <input class="field-desc" value="${val.label}"
               onchange="setNested('exemptions.${key}.label', this.value)" />
        <span class="field-notes">${val.notes || val.condition || ''}</span>
      </div>
      <div class="field-control">
        <label>Applies To</label>
        <input class="text-input" value="${val.appliesTo || ''}"
               onchange="setNested('exemptions.${key}.appliesTo', this.value)" />
        ${val.maxExemption !== null && val.maxExemption !== undefined ? `
          <label style="margin-top:6px">Max Exemption (₹)</label>
          <input type="number" class="num-input" value="${val.maxExemption}"
                 onchange="setNested('exemptions.${key}.maxExemption', +this.value)" />
        ` : `<span class="slab-badge" style="margin-top:6px">No Limit</span>`}
      </div>
    </div>
  `).join('');
}

// ─── SET-OFF RULES ────────────────────────────────────────────────────────────
function renderSetOff() {
  const wrap = document.getElementById('setOff');
  const so = formulas.setOff || {};
  const boolFields = ['stcgVsSTCG', 'stcgVsLTCG', 'ltcgVsLTCG', 'ltcgVsSTCG'];
  wrap.innerHTML = `
    <div class="setoff-grid">
      ${boolFields.map(f => `
        <div class="toggle-row">
          <label class="toggle-label">${formatCamel(f)}</label>
          <label class="toggle-switch">
            <input type="checkbox" ${so[f] ? 'checked' : ''}
                   onchange="setNested('setOff.${f}', this.checked)" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      `).join('')}
    </div>
    <div class="field-row" style="margin-top:16px">
      <div class="field-label"><span class="field-key">Carry Forward (Years)</span></div>
      <div class="field-control">
        <input type="number" class="num-input" value="${so.carryForwardYears || 8}"
               onchange="setNested('setOff.carryForwardYears', +this.value)" />
      </div>
    </div>
  `;
}

// ─── CESS & SURCHARGE ────────────────────────────────────────────────────────
function renderCessAndSurcharge() {
  const wrap = document.getElementById('cessAndSurcharge');
  const cess = formulas.cess || {};
  const sur = formulas.surcharge || {};
  wrap.innerHTML = `
    <div class="field-row">
      <div class="field-label"><span class="field-key">Cess Rate (%)</span></div>
      <div class="field-control">
        <input type="number" step="0.5" class="num-input" value="${cess.rate || 4}"
               onchange="setNested('cess.rate', +this.value)" />
      </div>
    </div>
    <div class="field-row">
      <div class="field-label">
        <span class="field-key">Max Surcharge on LTCG (Sec 112A) %</span>
        <span class="field-notes">${sur.notes || ''}</span>
      </div>
      <div class="field-control">
        <input type="number" step="1" class="num-input" value="${sur.maxSurchargeOnLTCG || 15}"
               onchange="setNested('surcharge.maxSurchargeOnLTCG', +this.value)" />
      </div>
    </div>
    <div class="toggle-row" style="margin-top:12px">
      <label class="toggle-label">Surcharge Applicable on LTCG 112A?</label>
      <label class="toggle-switch">
        <input type="checkbox" ${sur.applicableOnLTCG112A ? 'checked' : ''}
               onchange="setNested('surcharge.applicableOnLTCG112A', this.checked)" />
        <span class="toggle-slider"></span>
      </label>
    </div>
  `;
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function setNested(path, value) {
  const keys = path.split('.');
  let obj = formulas;
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;
}

function formatCamel(str) {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

function updateMetaDisplay() {
  const el = document.getElementById('metaInfo');
  if (el && formulas?.meta) {
    el.textContent = `FY ${formulas.meta.fy} · Last saved: ${formulas.meta.lastUpdated}`;
  }
}

function showSaveFlash() {
  const btn = document.getElementById('saveBtn');
  btn.textContent = '✓ Saved!';
  btn.classList.add('saved');
  setTimeout(() => { btn.textContent = 'Save Formulas'; btn.classList.remove('saved'); }, 2000);
}

function log(msg, type = 'info') {
  const wrap = document.getElementById('logOutput');
  if (!wrap) return;
  const line = document.createElement('div');
  line.className = `log-line log-${type}`;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  wrap.appendChild(line);
  wrap.scrollTop = wrap.scrollHeight;
}

// Preview raw JSON
function togglePreview() {
  const wrap = document.getElementById('jsonPreview');
  if (wrap.style.display === 'none') {
    wrap.textContent = JSON.stringify(formulas, null, 2);
    wrap.style.display = 'block';
  } else {
    wrap.style.display = 'none';
  }
}

window.addEventListener('DOMContentLoaded', init);
