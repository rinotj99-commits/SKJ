# SKJ Purchasing Dashboard

Dashboard pembelian interaktif untuk admin purchasing. Bisa track pembelian per **Badan Usaha**, **Outlet**, **Vendor**, dan **Divisi**, dengan perbandingan **Month-to-Month (MoM)**, **Year-on-Year (YoY)**, dan **Year-to-Date (YTD)**.

## Cara Pakai

1. **Buka `index.html`** di browser (Chrome / Firefox / Edge). Bisa langsung double-click filenya, atau host pakai Live Server / GitHub Pages.
2. **Mulai input data** lewat tombol **+ Input Pembelian**, atau **Import CSV** kalau lo punya export dari sistem lain.
3. Klik **Load Sample** kalau mau liat dulu dummy data biar paham flow-nya.

## Fitur

### Filter & Sort
- **Tahun & Bulan** — sort/filter pembelian per periode.
- **Badan Usaha** — 4 BU (atau sebanyak yg lo input) bisa di-toggle.
- **Outlet, Vendor, Divisi** — filter dropdown otomatis populate dari data.
- **Mode Compare**: MoM (vs bulan lalu), YoY (vs tahun lalu), YTD (year-to-date vs tahun lalu).

### KPI Cards
- Total pembelian (sesuai filter aktif).
- Periode berjalan & periode pembanding + delta % (naik/turun).
- Average per transaksi.

### Charts (auto-update)
- **Tren per bulan** — line chart 12 bulan, overlay tahun lalu (dashed).
- **Per Badan Usaha** — bar chart.
- **Per Divisi** — donut chart.
- **Top 10 Vendor** — horizontal bar.
- **Per Outlet** — bar chart.

### Rankings
- Top 10 Badan Usaha, Outlet, Vendor, dan Divisi berdasarkan total pembelian.

### Manajemen Data
- **Input manual** via form modal (qty × harga otomatis hitung total).
- **Edit & hapus** per transaksi.
- **Import CSV** (header: `tanggal,badanUsaha,outlet,vendor,divisi,deskripsi,qty,satuan,hargaSatuan,total`).
- **Export CSV** semua data.
- **Search** di tabel transaksi (cari deskripsi/vendor/outlet).
- Data tersimpan di **localStorage** browser — auto-update tiap input baru, gak hilang saat refresh.

## Format CSV

Header wajib (urutan boleh dibolak-balik):

```
tanggal,badanUsaha,outlet,vendor,divisi,deskripsi,qty,satuan,hargaSatuan,total
```

- `tanggal`: format `YYYY-MM-DD` atau `DD/MM/YYYY`.
- `total`: opsional. Kalau kosong, otomatis dihitung dari `qty × hargaSatuan`.
- Lihat `sample-data.csv` untuk contoh.

## Catatan

- Data disimpan di **browser** (localStorage), bukan server. Kalau ganti komputer / clear cache, data hilang. **Selalu Export CSV** sebagai backup.
- Untuk multi-user / shared data, perlu di-upgrade ke backend (bisa pakai Google Sheets API, Firebase, atau backend custom). Tinggal bilang aja kalau perlu.

## Tech Stack

- HTML + CSS (vanilla, no framework)
- JavaScript (vanilla)
- [Chart.js](https://www.chartjs.org/) via CDN

Tidak butuh build / install. Tinggal buka aja.
