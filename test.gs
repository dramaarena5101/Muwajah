  function doPost(e) {
    try {
      const req = JSON.parse(e.postData.contents);
      const action = req.action;

      // Otomatis buat sheet jika tidak sengaja terhapus
      autoSetupDatabase();

      if (action === "getPelajaran") return getPelajaran();
      if (action === "simpanData") return simpanData(req.data);
      if (action === "getProgress") return getProgress(req.stambuk);

      return outputJSON({ error: "Action tidak dikenal" });
    } catch (err) {
      return outputJSON({ error: err.message });
    }
  }

  // === Auto Setup Database ===
  function autoSetupDatabase() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Setup "Progress Santri"
    let shProgress = ss.getSheetByName("Progress Santri");
    if (!shProgress) {
      shProgress = ss.insertSheet("Progress Santri");
      shProgress.appendRow(["Tanggal", "Stambuk", "Nama", "Kelas", "Daerah", "Ustadz", "Pelajaran", "Judul Materi", "Jenis Kegiatan"]);
      shProgress.getRange("A1:I1").setFontWeight("bold").setBackground("#ffedd5").setFontColor("#ea580c").setHorizontalAlignment("center");
      shProgress.setFrozenRows(1);
    }

    // 2. Setup "Data Pelajaran"
    let shPelajaran = ss.getSheetByName("Data Pelajaran");
    if (!shPelajaran) {
      shPelajaran = ss.insertSheet("Data Pelajaran");
      shPelajaran.appendRow(["ID", "Pelajaran", "Judul", "Type"]);
      shPelajaran.getRange("A1:D1").setFontWeight("bold").setBackground("#ffedd5").setFontColor("#ea580c").setHorizontalAlignment("center");
      shPelajaran.setFrozenRows(1);
    }
  }

  // === Ambil daftar pelajaran & judul ===

  function getPelajaran() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName("Data Pelajaran");
    if (!sh) return outputJSON({}); // Safety
    const data = sh.getDataRange().getValues();
    if (data.length > 0) data.shift(); // buang header

    const hasil = {};
    data.forEach(row => {
      const [id, pelajaran, judul, type] = row;
      if (!hasil[pelajaran]) hasil[pelajaran] = [];
      hasil[pelajaran].push({ id, judul, type });
    });

    return outputJSON(hasil);
  }



// === Simpan progress baru (versi aman terhadap race condition) ===
function simpanData(d) {
  // validasi awal
  if (!d || !Array.isArray(d.judul) || d.judul.length === 0) {
    return outputJSON({ error: "Payload tidak lengkap: tidak ada judul." });
  }

  const lock = LockService.getScriptLock();
  // coba ambil lock dengan retry/backoff sederhana selama total 30s
  const maxWaitMs = 30000;
  const start = Date.now();
  let haveLock = false;
  let waitMs = 200; // mulai dari 200ms
  while (Date.now() - start < maxWaitMs) {
    try {
      haveLock = lock.tryLock(0); // non-blocking, kita kendalikan retry manual
    } catch (e) {
      haveLock = false;
    }
    if (haveLock) break;
    Utilities.sleep(waitMs);
    // eksponensial tetapi cap 2000ms
    waitMs = Math.min(2000, Math.floor(waitMs * 1.8));
  }

  if (!haveLock) {
    // Jika tidak dapat lock, minta client untuk retry (atau bisa switch ke queue)
    return outputJSON({ error: "Server sibuk. Silakan coba lagi dalam beberapa detik.", retry: true });
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName("Progress Santri");
    if (!sh) {
      return outputJSON({ error: "Gagal: Sheet 'Progress Santri' tidak ditemukan." });
    }
    const tanggal = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

    // Pastikan d.judul adalah array id yang valid, unique
    const judulUnique = Array.from(new Set(d.judul.filter(x => x !== null && x !== undefined && x !== "")));
    if (judulUnique.length === 0) {
      return outputJSON({ error: "Tidak ada judul yang valid untuk disimpan." });
    }

    // siapkan rows
    const rowsToAdd = judulUnique.map(judulID => [
      tanggal, d.stambuk || "", d.nama || "", d.kelas || "", d.daerah || "", d.ustadz || "",
      d.pelajaran || "", judulID, d.jenis || ""
    ]);

    // cari baris target (jika sheet kosong, getLastRow() bisa 0)
    // PERBAIKAN: Cari baris terakhir berdasarkan Kolom A agar tidak tertipu oleh rumus VLOOKUP
    const aVals = sh.getRange("A:A").getValues();
    let lastRow = 0;
    for (let i = aVals.length - 1; i >= 0; i--) {
      if (aVals[i][0] !== "") {
        lastRow = i + 1;
        break;
      }
    }
    const startRow = Math.max(1, lastRow + 1);

    sh.getRange(startRow, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);
    SpreadsheetApp.flush(); // SANGAT PENTING: Memaksa Google Sheets menyimpan data fisik sebelum melepas gembok antrean

    return outputJSON({ message: "✅ Data berhasil disimpan." });

  } catch (err) {
    return outputJSON({ error: "Gagal menyimpan data: " + err.message });
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {
      // jika tidak punya lock, abaikan
    }
  }
}





  // === Ambil progress berdasarkan stambuk ===
  function getProgress(stambuk) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName("Progress Santri");
    if (!sh) return outputJSON([]); // Safety
    const data = sh.getDataRange().getValues();
    const hasil = [];

    if (data.length > 0) {
      const headers = data.shift();
      data.forEach(row => {
        if (row[1] == stambuk) {
          hasil.push({
            tanggal: row[0],
            pelajaran: row[6],
            judul: row[7],
            jenis: row[8],
            materi: row[9]
          });
        }
      });
    }

    return outputJSON(hasil);
  }

  // === Helper untuk kirim JSON ===
  function outputJSON(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj))
      .setMimeType(ContentService.MimeType.JSON);
  }
