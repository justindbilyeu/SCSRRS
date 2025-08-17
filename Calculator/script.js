/* SCSSRS ROI Calculator — MIT License
   Client-side only. No external libs. */

const $ = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat('en-US', {maximumFractionDigits:0});
const fmt2 = new Intl.NumberFormat('en-US', {maximumFractionDigits:2});

function getInputs() {
  // parse floats safely
  const val = (el, d=0)=> {
    const n = parseFloat($(el).value);
    return Number.isFinite(n) ? n : d;
  };

  const [carrierName, defDisc] = (()=>{
    const v = $('carrier').value;
    if (v === 'custom') return ['Custom', null];
    const [n,p] = v.split('|');
    return [n, parseFloat(p)];
  })();

  // if a carrier was selected, autopopulate discount once
  if (defDisc !== null && !$('discount').dataset.userEdited) {
    $('discount').value = defDisc;
  }

  return {
    premium: Math.max(val('premium', 0), 0),
    growthPct: Math.max(val('growth', 5), 0),
    years: parseInt($('years').value, 10),
    coverage: Math.max(val('coverage', 0), 0),
    deductiblePct: Math.max(val('deductiblePct', 1), 0),
    discountPct: Math.min(Math.max(val('discount', 20), 0), 50),
    claimsAvoided: Math.max(parseInt($('claimsAvoided').value || '0', 10), 0),
    squares: Math.max(val('squares', 20), 1),
    asphaltPerSq: Math.max(val('asphaltPerSq', 400), 0),
    metalPerSq: Math.max(val('metalPerSq', 600), 0),
    metalType: $('metalType').value, // 'standing' | 'scs'
    incentives: Math.max(val('incentives', 0), 0),
    fortified: Math.max(val('fortified', 0), 0),
    discountRatePct: Math.max(val('discountRate', 0), 0)
  };
}

// compute series and KPIs
function computeModel(inp){
  const g = inp.growthPct/100;
  const d = inp.discountPct/100;
  const years = Math.max(inp.years, 1);

  // CapEx
  const asphaltCapex = inp.squares * inp.asphaltPerSq;
  const metalCapex = inp.squares * inp.metalPerSq + inp.fortified - inp.incentives;
  const deltaCapex = metalCapex - asphaltCapex; // incremental investment

  // annual premiums
  const premA = []; // asphalt
  const premM = []; // metal
  for (let t=0; t<=years; t++){
    const base = inp.premium * Math.pow(1+g, t);
    premA.push(base);
    premM.push(base * (1 - d));
  }

  // cumulative totals include capex at t0
  const cumA = [asphaltCapex + premA[0]];
  const cumM = [metalCapex + premM[0]];
  for (let t=1; t<=years; t++){
    cumA.push(cumA[t-1] + premA[t]);
    cumM.push(cumM[t-1] + premM[t]);
  }

  // Deductibles for asphalt scenario (claims avoided by choosing metal)
  const deductible = inp.coverage * (inp.deductiblePct/100);
  const asphaltAdj = inp.claimsAvoided * deductible;
  cumA[cumA.length-1] += asphaltAdj; // add at horizon end for simplicity

  // Savings curve (as if claims avoided occur at horizon end)
  const savings = cumA.map((a, i) => a - cumM[i]);
  const savingsH = savings[years];

  // payback year: first t where savings[t] >= deltaCapex (if delta>0)
  let payback = (deltaCapex <= 0) ? 0 : null;
  if (deltaCapex > 0){
    for (let t=0; t<=years; t++){
      if (savings[t] >= deltaCapex){ payback = t; break; }
    }
  }

  // 15 & 20 year savings (compute up to 20 internally)
  const maxT = Math.max(20, years);
  let premA20=[...premA], premM20=[...premM], cumA20=[asphaltCapex+premA[0]], cumM20=[metalCapex+premM[0]];
  for (let t=1; t<=maxT; t++){
    const base = inp.premium * Math.pow(1+g, t);
    premA20[t] = base;
    premM20[t] = base * (1 - d);
    cumA20[t] = cumA20[t-1] + premA20[t];
    cumM20[t] = cumM20[t-1] + premM20[t];
  }
  // add the same deductible assumption to the 20-yr point if we computed beyond horizon
  cumA20[20] += asphaltAdj;

  const save15 = (15 <= maxT) ? (cumA20[15] - cumM20[15]) : null;
  const save20 = (cumA20[20] - cumM20[20]);

  // Incremental ROI over selected horizon
  const incrInvestment = Math.max(deltaCapex, 0.00001);
  const incrROI = (savingsH - deltaCapex) / incrInvestment; // simple ratio over horizon

  // NPV of savings stream vs. delta investment
  const r = inp.discountRatePct/100;
  let npv = -deltaCapex;
  for (let t=0; t<=years; t++){
    // period benefit = (premA - premM); at horizon end add deductible avoidance
    const cash = (premA[t] - premM[t]) + (t===years ? asphaltAdj : 0);
    npv += cash / Math.pow(1+r, t);
  }

  return {
    asphaltCapex, metalCapex, deltaCapex,
    premA, premM, cumA, cumM, savings,
    payback, save15, save20, incrROI, npv
  };
}

function drawChart(canvas, savings){
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  // clear
  ctx.clearRect(0,0,W,H);
  // padding
  const pad = {l:60, r:20, t:20, b:40};
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  // axes
  ctx.strokeStyle = '#9aa3b2';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t);
  ctx.lineTo(pad.l, H - pad.b);
  ctx.lineTo(W - pad.r, H - pad.b);
  ctx.stroke();

  // scale
  const maxY = Math.max(...savings);
  const minY = Math.min(0, ...savings);
  const yRange = Math.max(1, maxY - minY);
  const xMax = savings.length - 1;

  // gridlines (5)
  ctx.fillStyle = '#586174';
  ctx.font = '12px system-ui';
  for (let i=0;i<=5;i++){
    const yVal = minY + (yRange * i/5);
    const y = H - pad.b - ( (yVal - minY) / yRange ) * innerH;
    ctx.strokeStyle = '#eef1f6';
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = '#586174';
    ctx.fillText('$'+fmt.format(yVal|0), 8, y+4);
  }
  // x labels every 5 years
  for (let t=0; t<=xMax; t+=5){
    const x = pad.l + (t/xMax)*innerW;
    ctx.fillText(String(t), x-4, H - pad.b + 16);
  }

  // savings line
  ctx.strokeStyle = '#1967d2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  savings.forEach((v,t) => {
    const x = pad.l + (t/xMax)*innerW;
    const y = H - pad.b - ((v - minY)/yRange)*innerH;
    if(t===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  // zero line
  if (minY < 0 && maxY > 0){
    const y0 = H - pad.b - ((0 - minY)/yRange)*innerH;
    ctx.strokeStyle = '#cccccc'; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(pad.l, y0); ctx.lineTo(W - pad.r, y0); ctx.stroke();
    ctx.setLineDash([]);
  }
}

function updateUI(model){
  $('deltaCapex').textContent = '$'+fmt.format(model.deltaCapex);
  $('save15').textContent = (model.save15!=null) ? ('$'+fmt.format(model.save15)) : '—';
  $('save20').textContent = '$'+fmt.format(model.save20);
  $('payback').textContent = (model.payback===null) ? 'No payback within horizon' : (model.payback===0 ? 'Immediate' : model.payback+' yrs');
  $('roi').textContent = fmt2.format(model.incrROI*100)+'%';
  $('npv').textContent = '$'+fmt.format(model.npv);

  drawChart($('chart'), model.savings);
}

function calc(){
  const inp = getInputs();
  const model = computeModel(inp);
  updateUI(model);
  // persist for convenience
  localStorage.setItem('scssrs_calc', JSON.stringify(inp));
}

function loadFromQuery(){
  const q = new URLSearchParams(location.search);
  if (!q.toString()) return;
  const bind = (id, key=id)=> { if(q.has(key)) $(id).value = q.get(key); };
  ['premium','growth','years','coverage','deductiblePct','discount','claimsAvoided','squares',
   'asphaltPerSq','metalPerSq','incentives','fortified','discountRate'].forEach(bind);
  if (q.has('metalType')) $('metalType').value = q.get('metalType');
  if (q.has('carrier')) {
    // try to match by name (case-insensitive)
    const name = q.get('carrier').toLowerCase();
    const opts = Array.from($('carrier').options);
    const hit = opts.find(o=>o.text.toLowerCase().startsWith(name));
    if (hit) $('carrier').value = hit.value;
  }
}

function loadFromStorage(){
  try{
    const s = localStorage.getItem('scssrs_calc');
    if(!s) return;
    const obj = JSON.parse(s);
    for (const [k,v] of Object.entries(obj)){
      const el = $(k) || $(k==='growthPct'?'growth':k==='discountPct'?'discount':k);
      if (!el) continue;
      if (el.tagName==='SELECT') el.value = v;
      else el.value = v;
    }
  }catch(e){}
}

function shareLink(){
  const inp = getInputs();
  const p = new URLSearchParams({
    premium: inp.premium, growth: inp.growthPct, years: inp.years,
    coverage: inp.coverage, deductiblePct: inp.deductiblePct,
    discount: inp.discountPct, claimsAvoided: inp.claimsAvoided,
    squares: inp.squares, asphaltPerSq: inp.asphaltPerSq, metalPerSq: inp.metalPerSq,
    incentives: inp.incentives, fortified: inp.fortified,
    discountRate: inp.discountRatePct, metalType: inp.metalType
  });
  const url = location.origin + location.pathname + '?' + p.toString();
  navigator.clipboard.writeText(url).then(()=>{
    $('shareNote').textContent = 'Link copied. Paste in an email or text.';
  }).catch(()=>{
    $('shareNote').textContent = url; // fallback: show the URL
  });
}

// Event wiring
$('calcBtn').addEventListener('click', calc);
$('shareBtn').addEventListener('click', shareLink);
$('carrier').addEventListener('change', ()=>calc());
// mark user-edited discount so carrier change doesn’t overwrite
$('discount').addEventListener('input', ()=>{$('discount').dataset.userEdited = '1';});

window.addEventListener('DOMContentLoaded', ()=>{
  loadFromStorage();
  loadFromQuery();
  calc();
});
