// Script Migrasi Data Lengkap ke Firebase Baru (muwajah-5101)
// Menggabungkan Semester 1 (dari Firebase lama) dan Semester 2 (dari pelajaran-master.md)
const fs = require('fs');

const NEW_CONFIG = {
  projectId: 'muwajah-5101', // Catatan: wajib huruf kecil
  apiKey: 'AIzaSyCZFTSN6XQsw9SLOkv6KwiIiOXLWRSAKRA'
};

const COLLECTIONS = ['settings', 'pelajaran_master', 'setoran', 'stats'];

function encodeToFirestore(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(encodeToFirestore) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = encodeToFirestore(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// Helper tulis 1 dokumen ke Firebase baru
async function writeDocToNew(collectionName, docId, dataOrFields, isRawFields = false) {
  const encodedId = encodeURIComponent(docId);
  const url = `https://firestore.googleapis.com/v1/projects/${NEW_CONFIG.projectId}/databases/(default)/documents/${collectionName}/${encodedId}?key=${NEW_CONFIG.apiKey}`;
  
  let fields;
  if (isRawFields) {
    fields = dataOrFields;
  } else {
    fields = encodeToFirestore(dataOrFields).mapValue.fields;
  }

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
  
  const result = await res.json();
  if (result.error) {
    throw new Error(`[${collectionName}/${docId}] ${result.error.message} (Code: ${result.error.code})`);
  }
  return result;
}

async function main() {
  console.log('=====================================================');
  console.log('  TRANSFER DATA KE FIREBASE BARU (muwajah-5101)');
  console.log('  Termasuk: Semester 1 + Semester 2 (pelajaran-master.md)');
  console.log('=====================================================\n');

  // 1. Cek koneksi ke Firebase Baru terlebih dahulu
  console.log('1. Menguji izin tulis ke Firebase Baru (muwajah-5101)...');
  try {
    await writeDocToNew('_test_connection', 'ping', {
      ping: 'test_koneksi_' + new Date().toISOString()
    });
    console.log('✅ Izin tulis Firebase Baru BERHASIL!\n');
  } catch (err) {
    console.error('❌ GAGAL menulis ke Firebase Baru:');
    console.error('   Pesan error:', err.message);
    console.log('\n-----------------------------------------------------');
    console.log('PANDUAN PENYEBAB & SOLUSI:');
    console.log('1. Buka Firebase Console (https://console.firebase.google.com/)');
    console.log(`2. Pilih project: "${NEW_CONFIG.projectId}"`);
    console.log('3. Buka menu: Build -> Firestore Database -> tab "Rules" (Aturan)');
    console.log('4. Ubah aturan sementara menjadi:');
    console.log(`   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }`);
    console.log('5. Klik tombol "Publish" (Publikasikan).');
    console.log('6. Jalankan kembali script ini (node migrasi.js).');
    console.log('-----------------------------------------------------\n');
    process.exit(1);
  }

  // 2. Baca file data_siap_migrasi.json
  if (!fs.existsSync('data_siap_migrasi.json')) {
    console.log('Menyiapkan file gabungan data_siap_migrasi.json...');
    require('./generate_merged_data.js');
  }

  const dataset = JSON.parse(fs.readFileSync('data_siap_migrasi.json', 'utf-8'));
  let totalSukses = 0;
  let totalGagal = 0;

  for (const col of COLLECTIONS) {
    const items = dataset[col] || [];
    console.log(`\n▶ Mengupload koleksi [${col}] (${items.length} dokumen):`);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        await writeDocToNew(col, item.id, item.data);
        totalSukses++;
        process.stdout.write(`   ✓ [${i + 1}/${items.length}] Berhasil: ${col}/${item.id}\n`);
      } catch (e) {
        totalGagal++;
        process.stdout.write(`   ✗ [${i + 1}/${items.length}] Gagal: ${col}/${item.id} -> ${e.message}\n`);
      }
    }
  }

  console.log('\n=====================================================');
  console.log('  TRANSFER SELESAI!');
  console.log(`  Total Dokumen Sukses: ${totalSukses}`);
  console.log(`  Total Dokumen Gagal:  ${totalGagal}`);
  console.log('=====================================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
});
