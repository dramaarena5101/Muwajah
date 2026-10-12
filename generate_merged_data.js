const fs = require('fs');

const b = JSON.parse(fs.readFileSync('backup_firebase_lama.json', 'utf-8'));
const mdContent = fs.readFileSync('pelajaran-master.md', 'utf-8');
const mdLines = mdContent.split(/\r?\n/).filter(l => l.trim().length > 0);

const subjectAlias = {
  'Muthalaah': "Muthala'ah",
  'Musthalah': 'Mushtalah Hadist',
  'Ushul Fiqih': 'Ushul Fiqh',
  'Hadits': 'Hadist',
  "Hafalan Do'a": 'Doa-Doa'
};

// 1. Process Sem 1
const mergedPelajaran = {};
for (const p of b.pelajaran_master) {
  const sem1Items = (p.data.materi || []).map(m => ({
    ...m,
    semester: 1
  }));
  mergedPelajaran[p.id] = {
    id: p.id,
    materi: sem1Items,
    updatedAt: new Date().toISOString()
  };
}

// 2. Process Sem 2 from MD
let addedCount = 0;
for (let i = 1; i < mdLines.length; i++) {
  const parts = mdLines[i].split('\t');
  if (parts.length < 3) continue;
  const id = parts[0].trim();
  const rawPel = parts[1].trim();
  const judul = parts[2].trim();
  const type = parts[3] ? parts[3].trim() : 'Isi';
  
  const pel = subjectAlias[rawPel] || rawPel;
  if (!mergedPelajaran[pel]) {
    mergedPelajaran[pel] = {
      id: pel,
      materi: [],
      updatedAt: new Date().toISOString()
    };
  }
  
  mergedPelajaran[pel].materi.push({
    id: id,
    judul: judul,
    tipe: type.toLowerCase() === 'judul' ? 'Judul' : 'Isi',
    semester: 2
  });
  addedCount++;
}

console.log('Total Sem 2 items processed:', addedCount);
console.log('Total subjects after merge:', Object.keys(mergedPelajaran).length);

for (const [k, v] of Object.entries(mergedPelajaran)) {
  const s1 = v.materi.filter(m => m.semester === 1).length;
  const s2 = v.materi.filter(m => m.semester === 2).length;
  console.log(k.padEnd(20), 'Sem 1:', String(s1).padStart(3), '| Sem 2:', String(s2).padStart(3), '| Total:', v.materi.length);
}

// Construct the complete migration dataset
const finalMigrationData = {
  pelajaran_master: Object.values(mergedPelajaran).map(p => ({
    id: p.id,
    data: {
      materi: p.materi,
      updatedAt: p.updatedAt
    }
  })),
  setoran: b.setoran || [],
  stats: b.stats || [],
  settings: [
    {
      id: 'global',
      data: {
        default_semester: 2,
        updatedAt: new Date().toISOString()
      }
    }
  ]
};

fs.writeFileSync('data_siap_migrasi.json', JSON.stringify(finalMigrationData, null, 2), 'utf-8');
console.log('\n✅ File data_siap_migrasi.json berhasil dibuat!');
console.log('Siap ditransfer ke Firebase baru (muwajah-5101).');
