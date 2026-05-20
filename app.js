/* === SKJ Purchasing Dashboard - Logic === */

const STORAGE_KEY = 'skj_purchasing_data_v1';
const FMT_RP = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const FMT_NUM = new Intl.NumberFormat('id-ID');
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const MONTHS_FULL = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

// Color palette for charts
const COLORS = ['#2563eb','#0ea5e9','#16a34a','#d97706','#dc2626','#7c3aed','#db2777','#0891b2','#65a30d','#ea580c'];

// === STATE ===
let data = loadData();
let charts = {};
let editingId = null;

// === DATA PERSISTENCE ===
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// === UTILS ===
function uid() { return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2,8); }
function rp(n) { return FMT_RP.format(n || 0); }
function num(n) { return FMT_NUM.format(n || 0); }
function pctDelta(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}
function uniqSorted(arr) { return [...new Set(arr)].sort((a,b) => a.localeCompare(b)); }

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  setTimeout(() => t.classList.add('hidden'), 2400);
}

// === FILTERING ===
function getFilters() {
  return {
    year: document.getElementById('f-year').value,
    month: document.getElementById('f-month').value,
    bu: document.getElementById('f-bu').value,
    outlet: document.getElementById('f-outlet').value,
    vendor: document.getElementById('f-vendor').value,
    divisi: document.getElementById('f-divisi').value,
    compare: document.getElementById('f-compare').value,
  };
}
function applyFilters(rows, f, ignore = []) {
  return rows.filter(r => {
    const d = new Date(r.tanggal);
    if (!ignore.includes('year') && f.year !== 'all' && d.getFullYear() !== +f.year) return false;
    if (!ignore.includes('month') && f.month !== 'all' && d.getMonth() !== +f.month) return false;
    if (f.bu !== 'all' && r.badanUsaha !== f.bu) return false;
    if (f.outlet !== 'all' && r.outlet !== f.outlet) return false;
    if (f.vendor !== 'all' && r.vendor !== f.vendor) return false;
    if (f.divisi !== 'all' && r.divisi !== f.divisi) return false;
    return true;
  });
}

// === POPULATE FILTER OPTIONS ===
function populateFilterOptions() {
  const years = uniqSorted([...new Set(data.map(r => new Date(r.tanggal).getFullYear()))].map(String));
  const yearSel = document.getElementById('f-year');
  const currentY = yearSel.value;
  yearSel.innerHTML = '<option value="all">Semua Tahun</option>';
  years.reverse().forEach(y => {
    yearSel.innerHTML += `<option value="${y}">${y}</option>`;
  });
  // default to current year if exists
  const thisYear = String(new Date().getFullYear());
  if (years.includes(thisYear)) yearSel.value = currentY || thisYear;
  else yearSel.value = currentY || (years[0] || 'all');

  populateSelect('f-bu', uniqSorted(data.map(r => r.badanUsaha)), 'Semua BU');
  populateSelect('f-outlet', uniqSorted(data.map(r => r.outlet)), 'Semua Outlet');
  populateSelect('f-vendor', uniqSorted(data.map(r => r.vendor)), 'Semua Vendor');
  populateSelect('f-divisi', uniqSorted(data.map(r => r.divisi)), 'Semua Divisi');

  populateDatalist('dl-bu', uniqSorted(data.map(r => r.badanUsaha)));
  populateDatalist('dl-outlet', uniqSorted(data.map(r => r.outlet)));
  populateDatalist('dl-vendor', uniqSorted(data.map(r => r.vendor)));
  populateDatalist('dl-divisi', uniqSorted(data.map(r => r.divisi)));
}
function populateSelect(id, opts, allLabel) {
  const sel = document.getElementById(id);
  const cur = sel.value;
  sel.innerHTML = `<option value="all">${allLabel}</option>` + opts.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
  if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
}
function populateDatalist(id, opts) {
  const dl = document.getElementById(id);
  dl.innerHTML = opts.map(o => `<option value="${escapeHtml(o)}">`).join('');
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// === KPI ===
function renderKPI() {
  const f = getFilters();
  const filtered = applyFilters(data, f);
  const total = filtered.reduce((s, r) => s + r.total, 0);
  document.getElementById('kpi-total').textContent = rp(total);
  document.getElementById('kpi-total-sub').textContent = `${num(filtered.length)} transaksi`;

  // Compare logic
  const cmp = f.compare;
  let currLabel = 'Periode Berjalan', curr = 0, prev = 0, prevLabel = 'Periode Lalu';

  if (cmp === 'mom') {
    // Pakai bulan yg dipilih (atau bulan saat ini kalo "all")
    const now = new Date();
    const targetYear = f.year === 'all' ? now.getFullYear() : +f.year;
    const targetMonth = f.month === 'all' ? now.getMonth() : +f.month;
    const prevDate = new Date(targetYear, targetMonth - 1, 1);
    curr = sumMonth(applyFilters(data, f, ['year','month']), targetYear, targetMonth);
    prev = sumMonth(applyFilters(data, f, ['year','month']), prevDate.getFullYear(), prevDate.getMonth());
    currLabel = `${MONTHS_FULL[targetMonth]} ${targetYear}`;
    prevLabel = `vs ${MONTHS_FULL[prevDate.getMonth()]} ${prevDate.getFullYear()}`;
  } else if (cmp === 'yoy') {
    const targetYear = f.year === 'all' ? new Date().getFullYear() : +f.year;
    curr = sumYear(applyFilters(data, f, ['year','month']), targetYear);
    prev = sumYear(applyFilters(data, f, ['year','month']), targetYear - 1);
    currLabel = `Tahun ${targetYear}`;
    prevLabel = `vs Tahun ${targetYear - 1}`;
  } else if (cmp === 'ytd') {
    const now = new Date();
    const targetYear = f.year === 'all' ? now.getFullYear() : +f.year;
    const cutoffMonth = (targetYear === now.getFullYear()) ? now.getMonth() : 11;
    curr = sumYTD(applyFilters(data, f, ['year','month']), targetYear, cutoffMonth);
    prev = sumYTD(applyFilters(data, f, ['year','month']), targetYear - 1, cutoffMonth);
    currLabel = `YTD ${targetYear} (s/d ${MONTHS_FULL[cutoffMonth]})`;
    prevLabel = `vs YTD ${targetYear - 1}`;
  }

  document.getElementById('kpi-current').textContent = rp(curr);
  document.getElementById('kpi-current-sub').textContent = currLabel;
  document.getElementById('kpi-compare').textContent = rp(prev);
  document.getElementById('kpi-compare-label').textContent = prevLabel;

  const delta = pctDelta(curr, prev);
  const deltaEl = document.getElementById('kpi-delta');
  const arrow = delta > 0.5 ? '▲' : (delta < -0.5 ? '▼' : '●');
  const cls = delta > 0.5 ? 'up' : (delta < -0.5 ? 'down' : 'flat');
  deltaEl.className = 'delta ' + cls;
  deltaEl.textContent = `${arrow} ${delta.toFixed(1)}%`;

  const avg = filtered.length ? total / filtered.length : 0;
  document.getElementById('kpi-avg').textContent = rp(avg);
  document.getElementById('kpi-avg-sub').textContent = `dari ${num(filtered.length)} trx`;
}

function sumMonth(rows, year, month) {
  return rows.filter(r => {
    const d = new Date(r.tanggal);
    return d.getFullYear() === year && d.getMonth() === month;
  }).reduce((s,r) => s + r.total, 0);
}
function sumYear(rows, year) {
  return rows.filter(r => new Date(r.tanggal).getFullYear() === year).reduce((s,r) => s + r.total, 0);
}
function sumYTD(rows, year, cutoffMonth) {
  return rows.filter(r => {
    const d = new Date(r.tanggal);
    return d.getFullYear() === year && d.getMonth() <= cutoffMonth;
  }).reduce((s,r) => s + r.total, 0);
}

// === CHARTS ===
function renderCharts() {
  const f = getFilters();
  const filtered = applyFilters(data, f);

  renderTrendChart(f);
  renderGroupChart('chart-bu', filtered, 'badanUsaha', 'bar');
  renderGroupChart('chart-divisi', filtered, 'divisi', 'doughnut');
  renderGroupChart('chart-vendor', filtered, 'vendor', 'horizontalBar', 10);
  renderGroupChart('chart-outlet', filtered, 'outlet', 'bar');
}

function renderTrendChart(f) {
  // Show 12 months for selected year + previous year as comparison
  const now = new Date();
  const targetYear = f.year === 'all' ? now.getFullYear() : +f.year;
  const baseRows = applyFilters(data, f, ['year','month']);

  const currMonthly = Array(12).fill(0);
  const prevMonthly = Array(12).fill(0);
  baseRows.forEach(r => {
    const d = new Date(r.tanggal);
    if (d.getFullYear() === targetYear) currMonthly[d.getMonth()] += r.total;
    if (d.getFullYear() === targetYear - 1) prevMonthly[d.getMonth()] += r.total;
  });

  document.getElementById('trend-hint').textContent = `${targetYear} vs ${targetYear - 1}`;

  destroyChart('chart-trend');
  charts['chart-trend'] = new Chart(document.getElementById('chart-trend'), {
    type: 'line',
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: String(targetYear),
          data: currMonthly,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37,99,235,0.1)',
          tension: 0.3,
          fill: true,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#2563eb',
        },
        {
          label: String(targetYear - 1),
          data: prevMonthly,
          borderColor: '#94a3b8',
          backgroundColor: 'transparent',
          borderDash: [5,5],
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#94a3b8',
        }
      ]
    },
    options: chartOpts({ legend: true, currency: true })
  });
}

function renderGroupChart(canvasId, rows, key, type, limit = null) {
  const map = {};
  rows.forEach(r => { map[r[key]] = (map[r[key]] || 0) + r.total; });
  let entries = Object.entries(map).sort((a,b) => b[1] - a[1]);
  if (limit) entries = entries.slice(0, limit);

  const labels = entries.map(e => e[0]);
  const values = entries.map(e => e[1]);
  const bgColors = labels.map((_, i) => COLORS[i % COLORS.length]);

  destroyChart(canvasId);

  let chartType = type;
  let indexAxis = 'x';
  if (type === 'horizontalBar') { chartType = 'bar'; indexAxis = 'y'; }

  charts[canvasId] = new Chart(document.getElementById(canvasId), {
    type: chartType,
    data: {
      labels,
      datasets: [{
        label: 'Total Pembelian',
        data: values,
        backgroundColor: bgColors,
        borderWidth: type === 'doughnut' ? 2 : 0,
        borderColor: '#fff',
        borderRadius: type === 'doughnut' ? 0 : 6,
      }]
    },
    options: chartOpts({
      legend: type === 'doughnut',
      currency: true,
      indexAxis,
      isPie: type === 'doughnut',
    })
  });
}

function chartOpts({ legend = false, currency = false, indexAxis = 'x', isPie = false } = {}) {
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis,
    plugins: {
      legend: {
        display: legend,
        position: isPie ? 'right' : 'top',
        labels: { font: { size: 11 }, boxWidth: 12, padding: 10 }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed?.y ?? ctx.parsed?.x ?? ctx.parsed;
            const label = ctx.dataset.label || ctx.label || '';
            return `${label}: ${currency ? rp(v) : num(v)}`;
          }
        }
      }
    },
  };
  if (!isPie) {
    opts.scales = {
      x: { grid: { display: indexAxis === 'y' }, ticks: { font: { size: 10 } } },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          font: { size: 10 },
          callback: (v) => indexAxis === 'x' ? compactRp(v) : v
        }
      }
    };
    if (indexAxis === 'y') {
      opts.scales.x.ticks.callback = (v) => compactRp(v);
    }
  }
  return opts;
}

function compactRp(v) {
  if (v >= 1e9) return 'Rp ' + (v/1e9).toFixed(1) + 'M';
  if (v >= 1e6) return 'Rp ' + (v/1e6).toFixed(1) + 'jt';
  if (v >= 1e3) return 'Rp ' + (v/1e3).toFixed(0) + 'rb';
  return 'Rp ' + v;
}

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

// === RANKINGS ===
function renderRankings() {
  const f = getFilters();
  const filtered = applyFilters(data, f);
  renderRankTable('rank-bu', filtered, 'badanUsaha');
  renderRankTable('rank-outlet', filtered, 'outlet');
  renderRankTable('rank-vendor', filtered, 'vendor');
  renderRankTable('rank-divisi', filtered, 'divisi');
}
function renderRankTable(tbodyId, rows, key) {
  const map = {};
  rows.forEach(r => {
    if (!map[r[key]]) map[r[key]] = { total: 0, count: 0 };
    map[r[key]].total += r.total;
    map[r[key]].count += 1;
  });
  const entries = Object.entries(map).sort((a,b) => b[1].total - a[1].total).slice(0, 10);
  const tbody = document.getElementById(tbodyId);
  if (!entries.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty">Belum ada data</td></tr>';
    return;
  }
  tbody.innerHTML = entries.map((e, i) => `
    <tr>
      <td><span class="rank-pos">${i+1}</span></td>
      <td>${escapeHtml(e[0])}</td>
      <td class="num">${rp(e[1].total)}</td>
      <td class="num">${num(e[1].count)}</td>
    </tr>
  `).join('');
}

// === TRANSACTIONS TABLE ===
function renderTrxTable() {
  const f = getFilters();
  const search = (document.getElementById('trx-search').value || '').toLowerCase();
  let rows = applyFilters(data, f);
  if (search) {
    rows = rows.filter(r =>
      (r.deskripsi || '').toLowerCase().includes(search) ||
      r.vendor.toLowerCase().includes(search) ||
      r.outlet.toLowerCase().includes(search) ||
      r.badanUsaha.toLowerCase().includes(search) ||
      r.divisi.toLowerCase().includes(search)
    );
  }
  rows.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));

  document.getElementById('trx-count').textContent = `(${num(rows.length)})`;

  const tbody = document.getElementById('trx-body');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="10" class="empty">Belum ada transaksi. Klik "Input Pembelian" atau "Load Sample" untuk mulai.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.slice(0, 200).map(r => `
    <tr>
      <td>${formatDate(r.tanggal)}</td>
      <td>${escapeHtml(r.badanUsaha)}</td>
      <td>${escapeHtml(r.outlet)}</td>
      <td>${escapeHtml(r.vendor)}</td>
      <td>${escapeHtml(r.divisi)}</td>
      <td>${escapeHtml(r.deskripsi || '-')}</td>
      <td class="num">${num(r.qty)} ${escapeHtml(r.satuan || '')}</td>
      <td class="num">${rp(r.hargaSatuan)}</td>
      <td class="num"><strong>${rp(r.total)}</strong></td>
      <td class="trx-actions">
        <button onclick="editTrx('${r.id}')" title="Edit">✎</button>
        <button class="delete" onclick="deleteTrx('${r.id}')" title="Hapus">🗑</button>
      </td>
    </tr>
  `).join('');
  if (rows.length > 200) {
    tbody.innerHTML += `<tr><td colspan="10" class="empty">Menampilkan 200 dari ${num(rows.length)} transaksi. Gunakan filter untuk mempersempit.</td></tr>`;
  }
}
function formatDate(s) {
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

// === MASTER RENDER ===
function renderAll() {
  populateFilterOptions();
  renderKPI();
  renderCharts();
  renderRankings();
  renderTrxTable();
}

// === MODAL FORM ===
function openModal(record = null) {
  editingId = record ? record.id : null;
  document.getElementById('modal-title').textContent = record ? 'Edit Pembelian' : 'Input Pembelian';
  document.getElementById('form-id').value = record?.id || '';
  document.getElementById('form-tanggal').value = record?.tanggal || new Date().toISOString().slice(0,10);
  document.getElementById('form-bu').value = record?.badanUsaha || '';
  document.getElementById('form-outlet').value = record?.outlet || '';
  document.getElementById('form-vendor').value = record?.vendor || '';
  document.getElementById('form-divisi').value = record?.divisi || '';
  document.getElementById('form-deskripsi').value = record?.deskripsi || '';
  document.getElementById('form-qty').value = record?.qty ?? 1;
  document.getElementById('form-satuan').value = record?.satuan || '';
  document.getElementById('form-harga').value = record?.hargaSatuan ?? '';
  updateFormTotal();
  document.getElementById('modal').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  editingId = null;
}
function updateFormTotal() {
  const qty = parseFloat(document.getElementById('form-qty').value) || 0;
  const harga = parseFloat(document.getElementById('form-harga').value) || 0;
  document.getElementById('form-total').value = rp(qty * harga);
}

window.editTrx = function(id) {
  const rec = data.find(r => r.id === id);
  if (rec) openModal(rec);
};
window.deleteTrx = function(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  data = data.filter(r => r.id !== id);
  saveData(); renderAll();
  showToast('Transaksi dihapus', 'success');
};

// === CSV ===
function toCSV(rows) {
  const headers = ['tanggal','badanUsaha','outlet','vendor','divisi','deskripsi','qty','satuan','hargaSatuan','total'];
  const escape = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [headers.join(',')];
  rows.forEach(r => {
    lines.push(headers.map(h => escape(r[h])).join(','));
  });
  return lines.join('\n');
}
function parseCSV(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (!lines.length) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => obj[h] = cells[idx] ?? '');
    rows.push(obj);
  }
  return rows;
}
function parseCSVLine(line) {
  const out = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i+1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { cur += c; }
    } else {
      if (c === ',') { out.push(cur); cur = ''; }
      else if (c === '"') { inQ = true; }
      else { cur += c; }
    }
  }
  out.push(cur);
  return out;
}

function exportCSV() {
  if (!data.length) { showToast('Belum ada data untuk diexport', 'error'); return; }
  const csv = toCSV(data);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `pembelian_skj_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV berhasil diexport', 'success');
}

function importCSV(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const rows = parseCSV(e.target.result);
      let added = 0;
      rows.forEach(r => {
        if (!r.tanggal || !r.badanUsaha) return;
        const qty = parseFloat(r.qty) || 0;
        const hargaSatuan = parseFloat(r.hargaSatuan) || 0;
        const total = parseFloat(r.total) || (qty * hargaSatuan);
        data.push({
          id: uid(),
          tanggal: normalizeDate(r.tanggal),
          badanUsaha: (r.badanUsaha || '').trim(),
          outlet: (r.outlet || '').trim(),
          vendor: (r.vendor || '').trim(),
          divisi: (r.divisi || '').trim(),
          deskripsi: (r.deskripsi || '').trim(),
          qty, satuan: (r.satuan || '').trim(),
          hargaSatuan, total
        });
        added++;
      });
      saveData(); renderAll();
      showToast(`${added} baris berhasil diimport`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal parse CSV: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}
function normalizeDate(s) {
  // Accept YYYY-MM-DD or DD/MM/YYYY
  s = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  return s;
}

// === SAMPLE DATA ===
function loadSample() {
  if (data.length && !confirm('Data existing akan ditambahkan. Lanjutkan?')) return;
  const buList = ['PT Sumber Karya Jaya', 'PT Bintang Niaga', 'PT Mitra Sejati', 'PT Andalan Prima'];
  const outletList = ['Outlet Jakarta Pusat','Outlet Bandung','Outlet Surabaya','Outlet Medan','Outlet Bali','Outlet Makassar'];
  const vendorList = ['CV Sentosa','PT Aneka Pangan','UD Berkah Jaya','PT Distribusi Nasional','CV Maju Mundur','PT Logistik Cepat','UD Sumber Rejeki'];
  const divisiList = ['Food','Beverage','Non-Food','Packaging','Office Supplies','Maintenance'];
  const items = ['Beras Premium','Minyak Goreng','Gula Pasir','Air Mineral','Tisu','Sabun Cuci','ATK','Spare Part','Cleaning Supplies','Daging Sapi'];
  const satuans = ['kg','box','pcs','liter','dus','pack'];

  const now = new Date();
  let added = 0;
  for (let yOffset = 1; yOffset >= 0; yOffset--) {
    const year = now.getFullYear() - yOffset;
    for (let m = 0; m < 12; m++) {
      if (year === now.getFullYear() && m > now.getMonth()) break;
      const trxThisMonth = 8 + Math.floor(Math.random() * 12);
      for (let t = 0; t < trxThisMonth; t++) {
        const day = 1 + Math.floor(Math.random() * 28);
        const qty = Math.floor(1 + Math.random() * 100);
        const harga = [50000, 100000, 250000, 500000, 1000000, 2500000][Math.floor(Math.random()*6)];
        data.push({
          id: uid(),
          tanggal: `${year}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
          badanUsaha: buList[Math.floor(Math.random()*buList.length)],
          outlet: outletList[Math.floor(Math.random()*outletList.length)],
          vendor: vendorList[Math.floor(Math.random()*vendorList.length)],
          divisi: divisiList[Math.floor(Math.random()*divisiList.length)],
          deskripsi: items[Math.floor(Math.random()*items.length)],
          qty,
          satuan: satuans[Math.floor(Math.random()*satuans.length)],
          hargaSatuan: harga,
          total: qty * harga
        });
        added++;
      }
    }
  }
  saveData(); renderAll();
  showToast(`Sample data dimuat (${added} baris)`, 'success');
}

// === EVENT LISTENERS ===
function init() {
  // Topbar
  document.getElementById('btn-add').onclick = () => openModal();
  document.getElementById('btn-import').onclick = () => document.getElementById('file-input').click();
  document.getElementById('btn-export').onclick = exportCSV;
  document.getElementById('btn-sample').onclick = loadSample;
  document.getElementById('btn-clear').onclick = () => {
    if (!data.length) { showToast('Data sudah kosong'); return; }
    if (!confirm(`Hapus SEMUA ${data.length} transaksi? Tindakan tidak bisa di-undo.`)) return;
    data = []; saveData(); renderAll();
    showToast('Semua data dihapus', 'success');
  };
  document.getElementById('file-input').onchange = (e) => {
    if (e.target.files[0]) importCSV(e.target.files[0]);
    e.target.value = '';
  };

  // Filters
  ['f-year','f-month','f-bu','f-outlet','f-vendor','f-divisi','f-compare'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      renderKPI(); renderCharts(); renderRankings(); renderTrxTable();
    });
  });
  document.getElementById('btn-reset-filter').onclick = () => {
    document.getElementById('f-month').value = 'all';
    document.getElementById('f-bu').value = 'all';
    document.getElementById('f-outlet').value = 'all';
    document.getElementById('f-vendor').value = 'all';
    document.getElementById('f-divisi').value = 'all';
    document.getElementById('f-compare').value = 'mom';
    renderKPI(); renderCharts(); renderRankings(); renderTrxTable();
  };
  document.getElementById('trx-search').addEventListener('input', renderTrxTable);

  // Modal
  document.getElementById('modal-close').onclick = closeModal;
  document.getElementById('form-cancel').onclick = closeModal;
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });
  document.getElementById('form-qty').addEventListener('input', updateFormTotal);
  document.getElementById('form-harga').addEventListener('input', updateFormTotal);

  document.getElementById('form-trx').addEventListener('submit', (e) => {
    e.preventDefault();
    const qty = parseFloat(document.getElementById('form-qty').value) || 0;
    const hargaSatuan = parseFloat(document.getElementById('form-harga').value) || 0;
    const rec = {
      id: editingId || uid(),
      tanggal: document.getElementById('form-tanggal').value,
      badanUsaha: document.getElementById('form-bu').value.trim(),
      outlet: document.getElementById('form-outlet').value.trim(),
      vendor: document.getElementById('form-vendor').value.trim(),
      divisi: document.getElementById('form-divisi').value.trim(),
      deskripsi: document.getElementById('form-deskripsi').value.trim(),
      qty,
      satuan: document.getElementById('form-satuan').value.trim(),
      hargaSatuan,
      total: qty * hargaSatuan,
    };
    if (editingId) {
      const idx = data.findIndex(r => r.id === editingId);
      if (idx >= 0) data[idx] = rec;
      showToast('Transaksi diupdate', 'success');
    } else {
      data.push(rec);
      showToast('Transaksi ditambahkan', 'success');
    }
    saveData(); closeModal(); renderAll();
  });

  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
