function doGet(e) {
  return ContentService.createTextOutput("Piket Malam API is running.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const action = req.action;

    // Otomatis inisialisasi sheet jika kosong/baru pertama kali
    autoSetupDatabase();

    if (action === "getSantri") return getSantri();
    if (action === "simpanPiket") return simpanPiket(req.data);
    if (action === "getPiketHistory") return getPiketHistory();
    if (action === "getSettings") return getSettings();
    if (action === "saveSettings") return saveSettings(req.data);
    if (action === "setupDatabase") {
      autoSetupDatabase(true);
      return outputJSON({ message: "✅ Inisialisasi/Reset database berhasil dilakukan!" });
    }

    return outputJSON({ error: "Action tidak dikenal" });
  } catch (err) {
    return outputJSON({ error: err.message });
  }
}

// === Auto Inisialisasi Database (Membuat Sheet & Header Otomatis jika Belum Ada) ===
function autoSetupDatabase(forceReset = false) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Setup Sheet "Data Santri"
  let shData = ss.getSheetByName("Data Santri");
  if (!shData || forceReset) {
    if (shData) {
      shData.clear();
    } else {
      shData = ss.insertSheet("Data Santri");
    }
    
    // Tulis Header
    shData.appendRow(["Stambuk", "Nama", "Kelas", "Rayon", "Tipe"]);
    
    // Desain Header Premium (Warna Orange Brand)
    const range = shData.getRange("A1:E1");
    range.setFontWeight("bold")
         .setBackground("#ffedd5") // Orange sangat muda
         .setFontColor("#ea580c")   // Orange tua
         .setHorizontalAlignment("center");
    
    shData.setFrozenRows(1); // Bekukan baris pertama
    
    // Tambah Data Contoh/Dummy agar langsung bisa diuji coba di web
    shData.appendRow(["1001", "Muhammad Fadhil", "5-B", "LAB", "Mudabbir"]);
    shData.appendRow(["1002", "Akbar Kumara", "5-B", "LAB", "Kader"]);
    shData.appendRow(["1003", "Ahmad Fauzi", "5-A", "Makkah", "Mudabbir"]);
    shData.appendRow(["1004", "Budi Santoso", "5-A", "Makkah", "Atlan"]);
    shData.appendRow(["1005", "Zainuddin", "5-B", "Rayon 3", "OPPM"]);
  }
  
  // 2. Setup Sheet "Riwayat Perizinan"
  let shPiket = ss.getSheetByName("Riwayat Perizinan");
  if (!shPiket || forceReset) {
    if (shPiket) {
      shPiket.clear();
    } else {
      shPiket = ss.insertSheet("Riwayat Perizinan");
    }
    
    // Tulis Header
    shPiket.appendRow(["Tanggal", "Stambuk", "Nama", "Kelas", "Rayon", "Status", "Alasan", "Detail Keterangan"]);
    
    // Desain Header Premium (Warna Orange Brand)
    const range = shPiket.getRange("A1:H1");
    range.setFontWeight("bold")
         .setBackground("#ffedd5")
         .setFontColor("#ea580c")
         .setHorizontalAlignment("center");
         
    shPiket.setFrozenRows(1); // Bekukan baris pertama
  }

  // Hapus "Sheet1" bawaan Google Sheet baru jika ada agar rapi
  const sheet1 = ss.getSheetByName("Sheet1");
  if (sheet1) {
    try {
      ss.deleteSheet(sheet1);
    } catch(e) {
      // Abaikan jika tidak bisa dihapus
    }
  }
}

// === Ambil Daftar Santri dari Sheet "Data Santri" ===
function getSantri() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Ambil stambuk yang sudah piket HARI INI
    const checkedInToday = {};
    const shPiket = ss.getSheetByName("Riwayat Perizinan");
    if (shPiket) {
      const piketData = shPiket.getDataRange().getValues();
      piketData.shift(); // Buang header
      
      const todayStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
      
      piketData.forEach(row => {
        let dateVal = row[0];
        let dateStr = "";
        if (dateVal) {
          try {
            dateStr = Utilities.formatDate(new Date(dateVal), "Asia/Jakarta", "yyyy-MM-dd");
          } catch(e) {
            // Jika dalam bentuk string
            dateStr = String(dateVal).split(" ")[0];
          }
        }
        if (dateStr === todayStr && row[1]) {
          checkedInToday[String(row[1])] = String(row[6] || "Terdaftar");
        }
      });
    }

    const shData = ss.getSheetByName("Data Santri");
    const data = shData.getDataRange().getValues();
    data.shift(); // Buang header
    
    const hasil = data.map(row => {
      const stambuk = String(row[0] || "");
      return {
        stambuk: stambuk,
        nama: String(row[1] || ""),
        kelas: String(row[2] || ""),
        rayon: String(row[3] || ""),
        tipe: String(row[4] || ""),
        sudahPiket: !!checkedInToday[stambuk], // Tandai jika stambuk sudah mendaftar hari ini
        alasanPiket: checkedInToday[stambuk] || "" // What they registered for
      };
    }).filter(s => s.stambuk || s.nama);

    return outputJSON(hasil);
  } catch (err) {
    return outputJSON({ error: "Gagal mengambil data santri: " + err.message });
  }
}

// === Ambil Riwayat Laporan Piket Malam (Untuk View Guru) ===
function getPiketHistory() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName("Riwayat Perizinan");
    if (!sh) {
      return outputJSON([]);
    }
    
    const data = sh.getDataRange().getValues();
    data.shift(); // Buang header
    
    // Kembalikan urutan terbalik agar yang terbaru berada di atas
    const hasil = data.map(row => {
      let tglStr = "";
      if (row[0]) {
        try {
          tglStr = Utilities.formatDate(new Date(row[0]), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
        } catch(e) {
          tglStr = String(row[0]);
        }
      }
      return {
        tanggal: tglStr,
        stambuk: String(row[1] || ""),
        nama: String(row[2] || ""),
        kelas: String(row[3] || ""),
        rayon: String(row[4] || ""),
        status: String(row[5] || "Hadir"),
        alasan: String(row[6] || "Piket Malam"),
        detail: String(row[7] || "")
      };
    }).reverse();
    
    return outputJSON(hasil);
  } catch (err) {
    return outputJSON({ error: "Gagal memuat riwayat piket: " + err.message });
  }
}

// === Simpan Data Piket Malam (Concurrency-Safe) ===
function simpanPiket(dataPiket) {
  if (!dataPiket || !Array.isArray(dataPiket) || dataPiket.length === 0) {
    return outputJSON({ error: "Data piket tidak lengkap atau kosong." });
  }

  const lock = LockService.getScriptLock();
  const maxWaitMs = 30000;
  const start = Date.now();
  let haveLock = false;
  let waitMs = 200;

  while (Date.now() - start < maxWaitMs) {
    try {
      haveLock = lock.tryLock(0);
    } catch (e) {
      haveLock = false;
    }
    if (haveLock) break;
    Utilities.sleep(waitMs);
    waitMs = Math.min(2000, Math.floor(waitMs * 1.8));
  }

  if (!haveLock) {
    return outputJSON({ error: "Server sedang sibuk. Silakan klik submit kembali dalam beberapa detik.", retry: true });
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName("Riwayat Perizinan");

    const tanggal = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

    // Persiapkan baris data
    const rowsToAdd = dataPiket.map(s => [
      tanggal,
      s.stambuk || "",
      s.nama || "",
      s.kelas || "",
      s.rayon || "",
      "Hadir",
      s.alasan || "Piket Malam",
      s.detail || ""
    ]);

    const lastRow = sh.getLastRow();
    const startRow = Math.max(1, lastRow + 1);

    sh.getRange(startRow, 1, rowsToAdd.length, rowsToAdd[0].length).setValues(rowsToAdd);

    return outputJSON({ message: "✅ Berhasil! Data piket malam berhasil disimpan." });

  } catch (err) {
    return outputJSON({ error: "Gagal menyimpan data piket: " + err.message });
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {
      // Abaikan
    }
  }
}

// === Helper Output JSON ===
function outputJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// === Settings ===
function getSettings() {
  const props = PropertiesService.getScriptProperties();
  const reasons = props.getProperty("alasan_izin");
  if (!reasons) {
    return outputJSON({ reasons: ["Piket Malam", "Sakit", "Izin Pulang", "Lainnya"] });
  }
  return outputJSON({ reasons: JSON.parse(reasons) });
}

function saveSettings(data) {
  try {
    const props = PropertiesService.getScriptProperties();
    if (data.reasons && Array.isArray(data.reasons)) {
      props.setProperty("alasan_izin", JSON.stringify(data.reasons));
      return outputJSON({ message: "Pengaturan berhasil disimpan." });
    }
    return outputJSON({ error: "Data alasan tidak valid." });
  } catch (err) {
    return outputJSON({ error: "Gagal menyimpan pengaturan: " + err.message });
  }
}
