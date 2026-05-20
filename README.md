# SKJ Purchasing Dashboard

Dashboard pembelian interaktif untuk admin purchasing. Track pembelian per **Badan Usaha** (PT, CV, PW, SW), **Outlet**, **Vendor**, dan **Divisi**, dengan perbandingan **Month-to-Month (MoM)**, **Year-on-Year (YoY)**, dan **Year-to-Date (YTD)** — plus **Budget tracking**, **Approval & Payment status**, dan **Print Report**.

## Cara Pakai

1. **Buka `index.html`** di browser (Chrome / Firefox / Edge). Bisa langsung double-click filenya, atau host pakai Live Server / GitHub Pages.
2. **Mulai input data** lewat tombol **+ Input Pembelian**, atau **Import CSV** kalau lo punya export dari sistem lain.
3. Klik **Load Sample** kalau mau liat dulu dummy data biar paham flow-nya.
4. Klik **Set Budget** untuk atur target tahunan per BU & per Divisi.

## Fitur

### 4 Badan Usaha Default
- **PT** &middot; **CV** &middot; **PW** &middot; **SW** sudah preset di dropdown.
- Bisa rename/tambah BU baru kapan aja saat input data.

### Filter & Sort
- **Tahun & Bulan** &mdash; sort/filter pembelian per periode.
- **Badan Usaha, Outlet, Vendor, Divisi** &mdash; dropdown otomatis populate dari data.
- **Status Approval**: Pending / Approved / Rejected.
- **Status Payment**: Unpaid / Partial / Paid.
- **Mode Compare**: MoM (vs bulan lalu), YoY (vs tahun lalu), YTD (year-to-date vs tahun lalu).

### KPI Cards (6 cards)
1. Total Pembelian (sesuai filter)
2. Periode Berjalan
3. Periode Pembanding + delta % (▲/▼)
4. ⏳ **Pending Approval** &mdash; berapa Rp & berapa transaksi nunggu approval
5. 💸 **Outstanding Payment** &mdash; total yg belum/parsial dibayar
6. Average per Transaksi

### Charts (auto-update)
- **Tren per bulan** &mdash; line chart 12 bulan, overlay tahun lalu (dashed).
- **Per Badan Usaha** &mdash; bar chart.
- **Per Divisi** &mdash; donut chart.
- **Top 10 Vendor** &mdash; horizontal bar.
- **Per Outlet** &mdash; bar chart.

### Budget vs Actual
- Set budget tahunan per **BU** dan per **Divisi** lewat modal **Set Budget**.
- Progress bar otomatis: hijau (aman <80%), kuning (80&ndash;99%), merah (over 100%).
- Tracking: total terpakai, sisa budget, atau over budget.

### Rankings
- Top 10 Badan Usaha, Outlet, Vendor, dan Divisi berdasarkan total pembelian.

### Manajemen Data
- **Input manual** via form modal (qty &times; harga otomatis hitung total).
- **PR & PO Number** field untuk traceability dokumen.
- **Edit & hapus** per transaksi.
- **Import CSV** &mdash; lihat header di bawah.
- **Export CSV** semua data.
- **Search** di tabel transaksi (cari deskripsi/vendor/outlet/PR/PO).
- Data tersimpan di **localStorage** browser &mdash; auto-update tiap input baru, gak hilang saat refresh.

### Print Report
- Klik tombol **Print Report** untuk versi printable / save as PDF.
- Layout otomatis disesuaikan: header laporan, hilangkan tombol/filter, charts dirapihin.
- Browser print dialog akan keluar &mdash; pilih "Save as PDF" untuk export PDF.

## Format CSV

Header (urutan boleh dibolak-balik):

```
tanggal,badanUsaha,outlet,vendor,divisi,prNumber,poNumber,deskripsi,qty,satuan,hargaSatuan,total,approvalStatus,paymentStatus
```

- `tanggal`: format `YYYY-MM-DD` atau `DD/MM/YYYY`.
- `total`: opsional, otomatis dihitung dari `qty &times; hargaSatuan` kalau kosong.
- `approvalStatus`: `Pending` / `Approved` / `Rejected`. Default `Approved`.
- `paymentStatus`: `Unpaid` / `Partial` / `Paid`. Default `Paid`.
- Lihat `sample-data.csv` untuk contoh.

## Catatan

- Data disimpan di **browser** (localStorage), bukan server. Kalau ganti komputer / clear cache, data hilang. **Selalu Export CSV** sebagai backup berkala.
- Untuk multi-user / shared data, perlu di-upgrade ke backend (Google Sheets API, Firebase, atau backend custom).

## Tech Stack

- HTML + CSS (vanilla, no framework)
- JavaScript (vanilla)
- [Chart.js](https://www.chartjs.org/) via CDN

Tidak butuh build / install. Tinggal buka aja.
