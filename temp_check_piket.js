
        // ============================================================
        // GANTI URL INI DENGAN DEPLOYMENT URL GOOGLE APPS SCRIPT ANDA
        // ============================================================
        const scriptURL = "https://script.google.com/macros/s/AKfycbzl5MBZ7tEu8mpXrS9UanBM9UadhgB_eGvycyXXM_fFn7vqJii4v8ZLASASSx51dM9C/exec";
        const PIN_USTADZ = "1234";

        // ─── Chart.js dark theme defaults ───
        Chart.defaults.color = '#8b949e';
        Chart.defaults.borderColor = '#30363d';

        let uniqueRayons = [];
        let piketHistory = [];
        let filteredPiketHistory = [];
        let listRayonOfficial = [];
        let currentTrackingFilter = 'all';

        // ─── PIN LOGIC ───
        let pinBuffer = "";

        function pinPress(digit) {
            if (pinBuffer.length >= 4) return;
            pinBuffer += digit;
            updatePinDots();
            if (pinBuffer.length === 4) setTimeout(pinSubmit, 150);
        }

        function pinClear() {
            pinBuffer = pinBuffer.slice(0, -1);
            updatePinDots();
        }

        function updatePinDots() {
            for (let i = 0; i < 4; i++) {
                document.getElementById('pd' + i).classList.toggle('filled', i < pinBuffer.length);
            }
        }

        function pinSubmit() {
            if (pinBuffer === PIN_USTADZ) {
                localStorage.setItem("auth_laporan", "verified");
                const overlay = document.getElementById('pinOverlay');
                overlay.style.transition = 'opacity 0.4s ease';
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.style.display = 'none';
                    initializeDashboard();
                }, 400);
            } else {
                const errEl = document.getElementById('pinError');
                errEl.style.display = 'flex';
                pinBuffer = "";
                updatePinDots();
                // Shake
                const card = document.querySelector('.pin-card');
                card.style.animation = 'none';
                card.style.transform = 'translateX(10px)';
                setTimeout(() => { card.style.transform = 'translateX(-10px)'; }, 60);
                setTimeout(() => { card.style.transform = 'translateX(6px)'; }, 120);
                setTimeout(() => { card.style.transform = 'translateX(0)'; }, 180);
                setTimeout(() => { errEl.style.display = 'none'; }, 2500);
            }
        }

        function logoutGuru() {
            localStorage.removeItem("auth_laporan");
            location.reload();
        }

        // ─── INIT ───
        $(document).ready(function () {
            window.addEventListener('online', () => { $('#offlineBanner').hide(); showToast("Koneksi internet pulih.", "success"); });
            window.addEventListener('offline', () => { $('#offlineBanner').show(); });

            if (localStorage.getItem("auth_laporan") === "verified") {
                $('#pinOverlay').hide();
                initializeDashboard();
            }

            document.addEventListener('keydown', e => {
                if ($('#pinOverlay').is(':visible')) {
                    if (e.key >= '0' && e.key <= '9') pinPress(e.key);
                    else if (e.key === 'Backspace') pinClear();
                    else if (e.key === 'Enter') pinSubmit();
                }
            });
        });

        function initializeDashboard() {
            const allBtn = document.querySelector('.date-shortcut[onclick*="all"]');
            setDateShortcut('all', allBtn);

            fetchRayonData();
            fetchListRayon();
            fetchHistoryData();
        }

        // ─── TAB SWITCH ───
        function switchTab(tab) {
            document.getElementById('tabAnalisis').classList.toggle('active', tab === 'analisis');
            document.getElementById('tabTabel').classList.toggle('active', tab === 'tabel');
            document.getElementById('panelAnalisis').classList.toggle('active', tab === 'analisis');
            document.getElementById('panelTabel').classList.toggle('active', tab === 'tabel');
        }

        // ─── DATA FETCHING ───
        function fetchRayonData() {
            $.ajax({
                url: scriptURL, type: 'POST',
                data: JSON.stringify({ action: "getSantri" }),
                contentType: 'text/plain',
                success: function (response) {
                    if (response.error) return;
                    const rayons = [...new Set(response.map(s => s.rayon).filter(Boolean))].sort();
                    uniqueRayons = rayons;
                    const select = $('#rayonFilterGuru');
                    select.find('option:not(:first)').remove();
                    rayons.forEach(r => select.append(`<option value="${r}">Rayon ${r}</option>`));
                }
            });
        }

        function fetchListRayon() {
            $.ajax({
                url: scriptURL, type: 'POST',
                data: JSON.stringify({ action: "getListRayon" }),
                contentType: 'text/plain',
                success: function (response) {
                    if (response && !response.error && response.length > 0) {
                        listRayonOfficial = response;
                        if (typeof filteredPiketHistory !== 'undefined') {
                            renderRayonTracker(filteredPiketHistory);
                        }
                    }
                }
            });
        }

        function fetchHistoryData() {
            showLoader("Mengambil data riwayat...");
            $.ajax({
                url: scriptURL, type: 'POST',
                data: JSON.stringify({ action: "getPiketHistory" }),
                contentType: 'text/plain',
                success: function (response) {
                    hideLoader();
                    if (response.error) { showToast("Gagal memuat laporan: " + response.error, "danger", 6000); return; }
                    piketHistory = response;
                    applyGlobalFilters();
                },
                error: function () {
                    hideLoader();
                    showToast("Koneksi gagal saat mengambil data laporan.", "danger", 6000);
                }
            });
        }

        // ─── FILTERS ───
        function setDateShortcut(type, btn) {
            document.querySelectorAll('.date-shortcut').forEach(b => b.classList.remove('active'));
            if (btn) btn.classList.add('active');

            const today = new Date();
            const fmt = d => d.toISOString().split('T')[0];
            let start = "", end = fmt(today);

            if (type === 'today') { start = end; }
            else if (type === '7days') { const d = new Date(); d.setDate(d.getDate() - 6); start = fmt(d); }
            else if (type === '30days') { const d = new Date(); d.setDate(d.getDate() - 29); start = fmt(d); }
            else { start = ""; end = ""; }

            $('#startDateFilter').val(start);
            $('#endDateFilter').val(end);
            applyGlobalFilters();
        }

        function applyGlobalFilters() {
            const searchVal = $('#searchGuru').val().toLowerCase();
            const rayonVal = $('#rayonFilterGuru').val();
            const startVal = $('#startDateFilter').val();
            const endVal = $('#endDateFilter').val();

            filteredPiketHistory = piketHistory.filter(item => {
                const itemDate = item.tanggal ? item.tanggal.split(" ")[0] : "";
                const searchText = `${item.nama} ${item.stambuk} ${item.kelas} ${item.alasan}`.toLowerCase();
                const matchSearch = !searchVal || searchText.includes(searchVal);
                const matchRayon = !rayonVal || String(item.rayon) === String(rayonVal);
                let matchDate = true;
                if (startVal && endVal) matchDate = (itemDate >= startVal && itemDate <= endVal);
                else if (startVal) matchDate = itemDate >= startVal;
                else if (endVal) matchDate = itemDate <= endVal;
                return matchSearch && matchRayon && matchDate;
            });

            calculateStats(filteredPiketHistory);
            renderGuruTable(filteredPiketHistory);
            renderAnalyticsCharts(filteredPiketHistory);
            renderLeaderboards(filteredPiketHistory);
            renderRayonTracker(filteredPiketHistory);
        }

        // ─── RAYON TRACKER ───
        function filterTracking(type, btn) {
            currentTrackingFilter = type;
            $('.badge-filter').removeClass('active');
            $(btn).addClass('active');
            renderRayonTracker(filteredPiketHistory);
        }

        function filterByRayonFromTracking(rayon) {
            $('#rayonFilterGuru').val(rayon);
            applyGlobalFilters();
            showToast(`Menampilkan data khusus Rayon ${rayon}`, "success");
            switchTab('tabel');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function renderRayonTracker(data) {
            let tipeSelect = $('#trackingTipeRayon');
            let izinSelect = $('#trackingJenisIzin');

            // Build options for Tipe Rayon dynamically if available
            if (tipeSelect.find('option').length <= 1 && listRayonOfficial.length > 0) {
                const uniqueTipe = [...new Set(listRayonOfficial.map(r => r.tipe).filter(Boolean))].sort();
                uniqueTipe.forEach(t => {
                    tipeSelect.append(`<option value="${t}">${t}</option>`);
                });
                tipeSelect.val('Rayon');
            }

            // Build options for Jenis Izin dynamically
            if (izinSelect.find('option').length <= 1 && piketHistory.length > 0) {
                const uniqueIzin = [...new Set(piketHistory.map(item => item.alasan || 'Piket Malam'))].sort();
                uniqueIzin.forEach(izin => {
                    izinSelect.append(`<option value="${izin}">${izin}</option>`);
                });
                izinSelect.val('Piket Malam');
            }

            const tipeRayonFilter = tipeSelect.val() || '';
            const jenisIzinFilter = izinSelect.val() || '';

            let filteredOfficial = listRayonOfficial;
            if (tipeRayonFilter) {
                filteredOfficial = listRayonOfficial.filter(r => (r.tipe || '').toLowerCase() === tipeRayonFilter.toLowerCase());
            }

            let rayons = [];
            if (filteredOfficial.length > 0 || (listRayonOfficial.length > 0 && tipeRayonFilter)) {
                rayons = filteredOfficial.map(r => r.nama_rayon);
            } else if (listRayonOfficial.length > 0) {
                rayons = listRayonOfficial.map(r => r.nama_rayon);
            } else {
                rayons = uniqueRayons;
            }

            rayons = [...new Set(rayons)].sort();

            const inputtedRayons = new Set();
            data.forEach(item => {
                if (!item.rayon) return;
                const alasan = item.alasan || 'Piket Malam';
                if (jenisIzinFilter && alasan !== jenisIzinFilter) return;
                inputtedRayons.add(String(item.rayon));
            });

            let sudahCount = 0;
            rayons.forEach(r => {
                if (inputtedRayons.has(r)) sudahCount++;
            });

            const total = rayons.length;
            const pct = total === 0 ? 0 : Math.round((sudahCount / total) * 100);

            $('#trackingStatsText').text(`${sudahCount}/${total} Rayon (${pct}%)`);
            $('#trackingProgressBar').css('width', `${pct}%`);

            const container = $('#trackingBadgesContainer');
            container.empty();

            if (total === 0) {
                container.html('<div style="color:var(--text-dim); font-size:12px; padding:10px;">Menunggu data rayon...</div>');
                return;
            }

            rayons.forEach(r => {
                const isSudah = inputtedRayons.has(r);
                if (currentTrackingFilter === 'sudah' && !isSudah) return;
                if (currentTrackingFilter === 'belum' && isSudah) return;

                const badgeClass = isSudah ? 'sudah' : 'belum';
                const icon = isSudah ? '<i class="ph-bold ph-check"></i>' : '<i class="ph-bold ph-warning-circle"></i>';

                const el = $(`<div class="tracking-badge ${badgeClass}" onclick="filterByRayonFromTracking('${r}')">${icon} ${r}</div>`);
                container.append(el);
            });
        }

        // ─── STATS ───
        function calculateStats(data) {
            $('#statTotalRows').text(data.length);
            const todayStr = new Date().toISOString().split('T')[0];
            let todayCount = 0;
            const rayonCounts = {};

            data.forEach(item => {
                if (item.tanggal && item.tanggal.startsWith(todayStr)) todayCount++;
                if (item.rayon) rayonCounts[item.rayon] = (rayonCounts[item.rayon] || 0) + 1;
            });

            $('#statToday').text(todayCount);

            let activeRayon = "—";
            let maxCount = 0;
            for (const r in rayonCounts) {
                if (rayonCounts[r] > maxCount) {
                    maxCount = rayonCounts[r];
                    activeRayon = `Rayon ${r}`;
                }
            }
            $('#statActiveRayon').text(activeRayon);
        }

        // ─── CHARTS ───
        let trendChartInst = null, jenisChartInst = null, rayonChartInst = null, kelasChartInst = null;

        function clearCharts() {
            [trendChartInst, jenisChartInst, rayonChartInst, kelasChartInst].forEach(c => c && c.destroy());
            trendChartInst = jenisChartInst = rayonChartInst = kelasChartInst = null;
            $('#smartInsightsText').text("Tidak ada data dalam rentang filter ini.");
        }

        function renderAnalyticsCharts(data) {
            if (data.length === 0) { clearCharts(); return; }

            // 1. Trend
            const datesSet = new Set();
            const tugasCounts = {}, izinCounts = {};
            data.forEach(item => {
                const d = item.tanggal ? item.tanggal.split(" ")[0] : "Unknown";
                datesSet.add(d);
                const a = (item.alasan || 'Piket Malam').toLowerCase();
                if (a.includes('piket') || a.includes('tugas') || a.includes('mandiri')) {
                    tugasCounts[d] = (tugasCounts[d] || 0) + 1;
                } else {
                    izinCounts[d] = (izinCounts[d] || 0) + 1;
                }
            });
            const sortedDates = Array.from(datesSet).sort().slice(-14);

            if (trendChartInst) trendChartInst.destroy();
            trendChartInst = new Chart(document.getElementById('trendChart'), {
                type: 'line',
                data: {
                    labels: sortedDates,
                    datasets: [
                        { label: 'Kehadiran / Piket', data: sortedDates.map(d => tugasCounts[d] || 0), borderColor: '#3fb950', backgroundColor: 'rgba(63,185,80,0.08)', borderWidth: 2.5, tension: 0.4, fill: true, pointBackgroundColor: '#3fb950', pointRadius: 4 },
                        { label: 'Izin / Sakit', data: sortedDates.map(d => izinCounts[d] || 0), borderColor: '#f85149', backgroundColor: 'rgba(248,81,73,0.08)', borderWidth: 2.5, tension: 0.4, fill: true, pointBackgroundColor: '#f85149', pointRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { family: 'Plus Jakarta Sans', size: 12 } } } },
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                    onClick: (e, els) => { if (els.length) showDrillDownModal(sortedDates[els[0].index], 'date', sortedDates[els[0].index]); }
                }
            });

            // 2. Doughnut
            const reasonCounts = {};
            data.forEach(item => {
                const r = item.alasan || 'Piket Malam';
                reasonCounts[r] = (reasonCounts[r] || 0) + 1;
            });
            const labelsIzin = Object.keys(reasonCounts);
            if (jenisChartInst) jenisChartInst.destroy();
            jenisChartInst = new Chart(document.getElementById('jenisIzinChart'), {
                type: 'doughnut',
                data: {
                    labels: labelsIzin,
                    datasets: [{ data: Object.values(reasonCounts), backgroundColor: ['#6366f1', '#3b82f6', '#3fb950', '#f97316', '#8b5cf6', '#f85149', '#ec4899', '#14b8a6'], borderWidth: 0 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '65%',
                    plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { family: 'Plus Jakarta Sans', size: 11 } } } },
                    onClick: (e, els) => { if (els.length) showDrillDownModal(`Alasan: ${labelsIzin[els[0].index]}`, 'reason', labelsIzin[els[0].index]); }
                }
            });

            // 3. Rayon bar
            const rayonCounts = {};
            data.forEach(item => { const r = item.rayon || 'Unknown'; rayonCounts[r] = (rayonCounts[r] || 0) + 1; });
            const sortedRayons = Object.keys(rayonCounts).sort();
            if (rayonChartInst) rayonChartInst.destroy();
            rayonChartInst = new Chart(document.getElementById('rayonChart'), {
                type: 'bar',
                data: { labels: sortedRayons, datasets: [{ label: 'Total', data: sortedRayons.map(r => rayonCounts[r]), backgroundColor: '#6366f1', borderRadius: 6 }] },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                    onClick: (e, els) => { if (els.length) showDrillDownModal(`Rayon ${sortedRayons[els[0].index]}`, 'rayon', sortedRayons[els[0].index]); }
                }
            });

            // 4. Kelas bar
            const kelasCounts = {};
            data.forEach(item => { const k = item.kelas || 'Unknown'; kelasCounts[k] = (kelasCounts[k] || 0) + 1; });
            const sortedKelas = Object.keys(kelasCounts).sort();
            if (kelasChartInst) kelasChartInst.destroy();
            kelasChartInst = new Chart(document.getElementById('kelasChart'), {
                type: 'bar',
                data: { labels: sortedKelas, datasets: [{ label: 'Total', data: sortedKelas.map(k => kelasCounts[k]), backgroundColor: '#3fb950', borderRadius: 6 }] },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                    onClick: (e, els) => { if (els.length) showDrillDownModal(`Kelas ${sortedKelas[els[0].index]}`, 'kelas', sortedKelas[els[0].index]); }
                }
            });

            generateSmartInsights(reasonCounts, rayonCounts, sortedDates, data);
        }

        // ─── SMART INSIGHTS ───
        function generateSmartInsights(reasonCounts, rayonCounts, sortedDates, data) {
            if (!sortedDates.length) return;
            const topRayon = Object.keys(rayonCounts).reduce((a, b) => rayonCounts[a] > rayonCounts[b] ? a : b);
            const topReason = Object.keys(reasonCounts).reduce((a, b) => reasonCounts[a] > reasonCounts[b] ? a : b);
            let totalTugas = 0, totalIzin = 0;
            data.forEach(item => {
                const a = (item.alasan || 'Piket Malam').toLowerCase();
                if (a.includes('piket') || a.includes('tugas') || a.includes('mandiri')) totalTugas++;
                else totalIzin++;
            });
            let ratioHtml = "";
            if (totalTugas > 0 && totalIzin > 0) {
                const pct = Math.round((totalIzin / totalTugas) * 100);
                if (pct > 50) ratioHtml = `<br><span style="color:var(--danger);"><i class="ph-fill ph-warning-octagon"></i> <strong>Peringatan:</strong> Rasio izin/sakit mencapai ${pct}% dibanding kehadiran tugas — perlu perhatian.</span>`;
                else ratioHtml = `<br><span style="color:var(--success);"><i class="ph-fill ph-check-circle"></i> <strong>Aman:</strong> Tingkat perizinan terkendali di rasio ${pct}% terhadap kehadiran tugas.</span>`;
            } else if (totalIzin > 0 && totalTugas === 0) {
                ratioHtml = `<br><span style="color:var(--danger);"><i class="ph-fill ph-warning-octagon"></i> <strong>Perhatian:</strong> 100% entri adalah Izin/Sakit tanpa kehadiran Tugas/Piket.</span>`;
            }
            $('#smartInsightsText').html(`Berdasarkan data yang dipilih, <strong>Rayon ${topRayon}</strong> memiliki pergerakan tertinggi (<strong>${rayonCounts[topRayon]} entri</strong>). Alasan terbanyak adalah <strong>"${topReason}"</strong> (${reasonCounts[topReason]} kasus).${ratioHtml}`);
        }

        // ─── DRILL DOWN ───
        function showDrillDownModal(title, type, value) {
            $('#drillDownTitle').text(`Rincian: ${title}`);
            const tbody = $('#drillDownTableBody');
            const thead = $('#drillDownThead');
            tbody.empty();

            const rows = filteredPiketHistory.filter(item => {
                if (type === 'date') return item.tanggal && item.tanggal.startsWith(value);
                if (type === 'reason') return (item.alasan || 'Piket Malam') === value;
                if (type === 'rayon') return String(item.rayon) === String(value);
                if (type === 'kelas') return String(item.kelas) === String(value);
                return false;
            });

            // Set dynamic header for aggregated view
            thead.html(`
                <tr>
                    <th style="background: var(--surface2); color: var(--text-dim); font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 12px 14px; letter-spacing: 0.6px;">Santri</th>
                    <th style="background: var(--surface2); color: var(--success); font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 12px 14px; letter-spacing: 0.6px;">Piket / Tugas</th>
                    <th style="background: var(--surface2); color: var(--danger); font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 12px 14px; letter-spacing: 0.6px;">Izin / Sakit</th>
                </tr>
            `);

            if (!rows.length) {
                tbody.html('<tr><td colspan="3" style="text-align:center; padding: 24px; color: var(--text-dim);">Tidak ada data tersedia.</td></tr>');
            } else {
                // Aggregate by Santri
                const santriMap = {};
                rows.forEach(item => {
                    const key = item.nama + '|||' + (item.kelas || '-');
                    if (!santriMap[key]) {
                        santriMap[key] = {
                            nama: item.nama,
                            kelas: item.kelas || '-',
                            piketTotal: 0,
                            piketDetails: {},
                            izinTotal: 0,
                            izinDetails: {}
                        };
                    }
                    const a = (item.alasan || 'Piket Malam').toLowerCase();
                    const raw = item.alasan || 'Piket Malam';
                    if (a.includes('piket') || a.includes('tugas') || a.includes('mandiri')) {
                        santriMap[key].piketTotal++;
                        santriMap[key].piketDetails[raw] = (santriMap[key].piketDetails[raw] || 0) + 1;
                    } else {
                        santriMap[key].izinTotal++;
                        santriMap[key].izinDetails[raw] = (santriMap[key].izinDetails[raw] || 0) + 1;
                    }
                });

                Object.values(santriMap).sort((a, b) => a.nama.localeCompare(b.nama)).forEach(s => {
                    const formatDetails = (details) => Object.entries(details).map(([k, v]) => `${v}× ${k}`).join('<br>');
                    const pDet = formatDetails(s.piketDetails) || '-';
                    const iDet = formatDetails(s.izinDetails) || '-';

                    tbody.append(`<tr>
                        <td style="vertical-align: top;">
                            <strong>${s.nama}</strong><br>
                            <span style="font-size:11px;color:var(--text-dim);">Kelas ${s.kelas}</span>
                        </td>
                        <td style="vertical-align: top;">
                            <div style="font-weight:800; color:var(--success); font-size:14px; margin-bottom:4px;">${s.piketTotal} kali</div>
                            <div style="font-size:11px; color:var(--text-dim); line-height:1.4;">${pDet}</div>
                        </td>
                        <td style="vertical-align: top;">
                            <div style="font-weight:800; color:var(--danger); font-size:14px; margin-bottom:4px;">${s.izinTotal} kali</div>
                            <div style="font-size:11px; color:var(--text-dim); line-height:1.4;">${iDet}</div>
                        </td>
                    </tr>`);
                });
            }
            new bootstrap.Modal(document.getElementById('modalDrillDown')).show();
        }

        // ─── LEADERBOARDS ───
        function renderLeaderboards(data) {
            const rajinMap = {}, pantauMap = {};
            data.forEach(item => {
                if (!item.nama) return;
                const key = item.nama + ' (' + (item.kelas || '?') + ')';
                const a = (item.alasan || 'Piket Malam').toLowerCase();
                const map = (a.includes('piket') || a.includes('tugas') || a.includes('mandiri')) ? rajinMap : pantauMap;
                if (!map[key]) map[key] = { total: 0, details: {} };
                map[key].total++;
                const raw = item.alasan || 'Piket Malam';
                map[key].details[raw] = (map[key].details[raw] || 0) + 1;
            });

            const renderLb = (containerId, entries, colorClass) => {
                const el = document.getElementById(containerId);
                el.innerHTML = '';
                if (!entries.length) {
                    el.innerHTML = `<div class="lb-empty">${colorClass === 'success' ? 'Belum ada kandidat apresiasi.' : 'Aman, tidak ada santri perlu dipantau.'}</div>`;
                    return;
                }
                entries.forEach((e, i) => {
                    const details = Object.entries(e[1].details).map(([k, v]) => `${v}× ${k}`).join(', ');
                    el.innerHTML += `
            <div class="lb-item">
              <div class="lb-rank">#${i + 1}</div>
              <div>
                <div class="lb-name">${e[0]}</div>
                <div class="lb-sub">${details}</div>
              </div>
              <span class="lb-count ${colorClass}">${e[1].total} kali</span>
            </div>`;
                });
            };

            renderLb('leaderboardRajin', Object.entries(rajinMap).sort((a, b) => b[1].total - a[1].total).slice(0, 5), 'success');
            renderLb('leaderboardPantauan', Object.entries(pantauMap).sort((a, b) => b[1].total - a[1].total).slice(0, 5), 'danger');
        }

        // ─── TABLE ───
        function renderGuruTable(data) {
            const tbody = document.getElementById('piketHistoryBody');
            tbody.innerHTML = '';
            const emptyEl = document.getElementById('emptyTableMessage');

            if (!data.length) {
                emptyEl.style.display = 'block';
                return;
            }
            emptyEl.style.display = 'none';

            data.forEach(item => {
                let displayTime = "—";
                if (item.tanggal) {
                    try {
                        const [datePart, timePart] = item.tanggal.split(" ");
                        const [y, m, d] = datePart.split("-");
                        displayTime = `${d}/${m} · ${(timePart || '').substring(0, 5)} WIB`;
                    } catch (e) { displayTime = item.tanggal; }
                }
                const tr = document.createElement('tr');
                tr.innerHTML = `
          <td style="color:var(--text-dim); font-size:12px;">${displayTime}</td>
          <td><strong>${item.stambuk}</strong></td>
          <td><strong>${item.nama}</strong></td>
          <td>${item.kelas}</td>
          <td><span class="badge-rayon">Rayon ${item.rayon}</span></td>
          <td><span class="badge-izin">${item.alasan || 'Piket Malam'}</span></td>
          <td><span style="font-size:12px; color:var(--text-dim);">${item.detail || '-'}</span></td>
        `;
                tbody.appendChild(tr);
            });
        }

        // ─── PRINT ABSEN ───
        function openModalPrintAbsen() {
            // Set default date to today
            const today = new Date().toISOString().split('T')[0];
            $('#absenPrintDate').val(today);
            
            // Populate reasons dynamically based on piketHistory
            const alasanSet = new Set();
            piketHistory.forEach(item => {
                if (item.alasan) alasanSet.add(item.alasan);
            });
            
            let opts = '<option value="Semua">Semua Jenis Perizinan</option>';
            // Add default ones if not in set just in case
            const defaults = ['Piket Malam', 'Tugas Mandiri', 'Izin Pulang', 'Sakit'];
            defaults.forEach(d => alasanSet.add(d));
            
            alasanSet.forEach(a => {
                opts += `<option value="${a}">${a}</option>`;
            });
            $('#absenPrintAlasan').html(opts);
        }

        function printAbsen() {
            const dateVal = $('#absenPrintDate').val();
            const alasanVal = $('#absenPrintAlasan').val();
            const titleVal = $('#absenPrintTitle').val() || 'Absensi Kehadiran';
            const sortVal = $('#absenPrintSort').val() || 'rayon_nama';
            const groupVal = $('#absenPrintGroup').val() || 'none';
            
            if (!dateVal) {
                showToast("Pilih tanggal terlebih dahulu!", "warning");
                return;
            }

            showLoader("Menyiapkan cetak absen...");
            
            // Filter using global piketHistory
            let data = piketHistory.filter(item => {
                if (item.tanggal && !item.tanggal.startsWith(dateVal)) return false;
                if (alasanVal !== 'Semua' && item.alasan !== alasanVal) return false;
                return true;
            });

            // Sorting Logic
            data.sort((a, b) => {
                // Group priority
                if (groupVal !== 'none') {
                    const gA = a[groupVal] || '';
                    const gB = b[groupVal] || '';
                    if (gA !== gB) return gA.localeCompare(gB);
                }

                // Sort fallback
                if (sortVal === 'rayon_nama') {
                    const rA = a.rayon || '';
                    const rB = b.rayon || '';
                    if (rA !== rB) return rA.localeCompare(rB);
                    const nA = a.nama || '';
                    const nB = b.nama || '';
                    return nA.localeCompare(nB);
                } else if (sortVal === 'kelas_nama') {
                    const kA = a.kelas || '';
                    const kB = b.kelas || '';
                    if (kA !== kB) return kA.localeCompare(kB);
                    const nA = a.nama || '';
                    const nB = b.nama || '';
                    return nA.localeCompare(nB);
                } else if (sortVal === 'rayon_kelas_nama') {
                    const rA = a.rayon || '';
                    const rB = b.rayon || '';
                    if (rA !== rB) return rA.localeCompare(rB);
                    const kA = a.kelas || '';
                    const kB = b.kelas || '';
                    if (kA !== kB) return kA.localeCompare(kB);
                    const nA = a.nama || '';
                    const nB = b.nama || '';
                    return nA.localeCompare(nB);
                } else {
                    const nA = a.nama || '';
                    const nB = b.nama || '';
                    return nA.localeCompare(nB);
                }
            });

            const tglIndo = new Date(dateVal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            const kop = `
        <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase; color: #000;">${titleVal}</h2>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #000;">Tanggal: ${tglIndo} &nbsp;|&nbsp; Perizinan: ${alasanVal}</p>
        </div>`;

            let tableRows = '';
            if (!data.length) {
                tableRows = `<tr><td colspan="7" style="text-align:center; padding:12px; border: 1px solid #000; color: #000;">Tidak ada data pada tanggal & perizinan ini.</td></tr>`;
            } else {
                let currentGroup = null;
                data.forEach((item, idx) => {
                    if (groupVal !== 'none') {
                        let groupKey = item[groupVal] || '-';
                        if (groupKey !== currentGroup) {
                            tableRows += `<tr><td colspan="7" style="border: 1px solid #000; padding: 10px; font-weight: bold; background-color: #f3f4f6; color: #000; text-transform: uppercase; text-align: left; -webkit-print-color-adjust: exact; print-color-adjust: exact;">${groupVal.toUpperCase()}: ${groupKey}</td></tr>`;
                            currentGroup = groupKey;
                        }
                    }

                    tableRows += `<tr>
            <td style="text-align:center; width:40px; border: 1px solid #000; padding: 8px; color: #000;">${idx + 1}</td>
            <td style="width:100px; text-align:center; border: 1px solid #000; padding: 8px; color: #000;">${item.stambuk || '-'}</td>
            <td style="border: 1px solid #000; padding: 8px; color: #000;">${item.nama || '-'}</td>
            <td style="width:70px; text-align:center; border: 1px solid #000; padding: 8px; color: #000;">${item.kelas || '-'}</td>
            <td style="width:90px; text-align:center; border: 1px solid #000; padding: 8px; color: #000;">${item.rayon || '-'}</td>
            <td style="width:120px; border: 1px solid #000; padding: 8px; color: #000;">${item.alasan || 'Piket Malam'}</td>
            <td style="width:80px; text-align:center; border: 1px solid #000; padding: 8px; color: #000;"></td>
          </tr>`;
                });
            }

            const tableSection = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-family: 'Times New Roman', Times, serif;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 10px; background-color: transparent !important; color: #000 !important; font-weight: bold;">NO</th>
              <th style="border: 1px solid #000; padding: 10px; background-color: transparent !important; color: #000 !important; font-weight: bold;">STAMBUK</th>
              <th style="border: 1px solid #000; padding: 10px; background-color: transparent !important; color: #000 !important; font-weight: bold; text-align: left;">NAMA LENGKAP</th>
              <th style="border: 1px solid #000; padding: 10px; background-color: transparent !important; color: #000 !important; font-weight: bold;">KELAS</th>
              <th style="border: 1px solid #000; padding: 10px; background-color: transparent !important; color: #000 !important; font-weight: bold;">RAYON</th>
              <th style="border: 1px solid #000; padding: 10px; background-color: transparent !important; color: #000 !important; font-weight: bold; text-align: left;">KETERANGAN</th>
              <th style="border: 1px solid #000; padding: 10px; background-color: transparent !important; color: #000 !important; font-weight: bold;">CEKLIST</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>`;

            const printStyle = `
        <style>
          @media print {
            @page { margin: 1.27cm; }
          }
        </style>`;

            const fullHtml = printStyle + `<div style="font-family: 'Times New Roman', Times, serif; color: #000;">` + kop + tableSection + `</div>`;
            $('#dedicatedPrintArea').html(fullHtml);

            hideLoader();
            setTimeout(() => window.print(), 400);
        }

        function exportExcel() {
            const dateVal = $('#absenPrintDate').val();
            const alasanVal = $('#absenPrintAlasan').val();
            const titleVal = $('#absenPrintTitle').val() || 'Absensi Kehadiran';
            const sortVal = $('#absenPrintSort').val() || 'rayon_nama';
            const groupVal = $('#absenPrintGroup').val() || 'none';
            
            if (!dateVal) {
                showToast("Pilih tanggal terlebih dahulu!", "warning");
                return;
            }

            showLoader("Menyiapkan Export Excel...");
            
            // Filter using global piketHistory
            let data = piketHistory.filter(item => {
                if (item.tanggal && !item.tanggal.startsWith(dateVal)) return false;
                if (alasanVal !== 'Semua' && item.alasan !== alasanVal) return false;
                return true;
            });

            // Sorting Logic
            data.sort((a, b) => {
                if (groupVal !== 'none') {
                    const gA = a[groupVal] || '';
                    const gB = b[groupVal] || '';
                    if (gA !== gB) return gA.localeCompare(gB);
                }

                if (sortVal === 'rayon_nama') {
                    const rA = a.rayon || '';
                    const rB = b.rayon || '';
                    if (rA !== rB) return rA.localeCompare(rB);
                    const nA = a.nama || '';
                    const nB = b.nama || '';
                    return nA.localeCompare(nB);
                } else if (sortVal === 'kelas_nama') {
                    const kA = a.kelas || '';
                    const kB = b.kelas || '';
                    if (kA !== kB) return kA.localeCompare(kB);
                    const nA = a.nama || '';
                    const nB = b.nama || '';
                    return nA.localeCompare(nB);
                } else if (sortVal === 'rayon_kelas_nama') {
                    const rA = a.rayon || '';
                    const rB = b.rayon || '';
                    if (rA !== rB) return rA.localeCompare(rB);
                    const kA = a.kelas || '';
                    const kB = b.kelas || '';
                    if (kA !== kB) return kA.localeCompare(kB);
                    const nA = a.nama || '';
                    const nB = b.nama || '';
                    return nA.localeCompare(nB);
                } else {
                    const nA = a.nama || '';
                    const nB = b.nama || '';
                    return nA.localeCompare(nB);
                }
            });

            const tglIndo = new Date(dateVal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            const ws_data = [];
            
            // Add Title Row
            ws_data.push([titleVal.toUpperCase(), "", "", "", "", "", ""]);
            ws_data.push([`Tanggal: ${tglIndo} | Perizinan: ${alasanVal}`, "", "", "", "", "", ""]);
            ws_data.push(["", "", "", "", "", "", ""]); 
            
            // Header Row
            const headers = ["NO", "STAMBUK", "NAMA LENGKAP", "KELAS", "RAYON", "KETERANGAN", "CEKLIST"];
            ws_data.push(headers);
            
            if (!data.length) {
                ws_data.push(["Tidak ada data pada tanggal & perizinan ini.", "", "", "", "", "", ""]);
            } else {
                let currentGroup = null;
                data.forEach((item, idx) => {
                    if (groupVal !== 'none') {
                        let groupKey = item[groupVal] || '-';
                        if (groupKey !== currentGroup) {
                            ws_data.push([`GROUP ${groupVal.toUpperCase()}: ${groupKey}`, "", "", "", "", "", ""]);
                            currentGroup = groupKey;
                        }
                    }

                    ws_data.push([
                        idx + 1,
                        item.stambuk || '-',
                        item.nama || '-',
                        item.kelas || '-',
                        item.rayon || '-',
                        item.alasan || 'Piket Malam',
                        ''
                    ]);
                });
            }

            const ws = XLSX.utils.aoa_to_sheet(ws_data);

            ws['!cols'] = [
                {wch: 5},   
                {wch: 15},  
                {wch: 35},  
                {wch: 10},  
                {wch: 20},  
                {wch: 25},  
                {wch: 10}   
            ];

            if(!ws['!merges']) ws['!merges'] = [];
            ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }); 
            ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }); 

            const headerStyle = {
                font: { bold: true, name: "Times New Roman", color: {rgb: "000000"} },
                border: {
                    top: {style: "thin", color: {auto: 1}},
                    bottom: {style: "thin", color: {auto: 1}},
                    left: {style: "thin", color: {auto: 1}},
                    right: {style: "thin", color: {auto: 1}}
                },
                alignment: { vertical: "center", horizontal: "center" }
            };

            const dataStyle = {
                font: { name: "Times New Roman" },
                border: {
                    top: {style: "thin", color: {auto: 1}},
                    bottom: {style: "thin", color: {auto: 1}},
                    left: {style: "thin", color: {auto: 1}},
                    right: {style: "thin", color: {auto: 1}}
                },
                alignment: { vertical: "center", horizontal: "left" }
            };

            const dataCenterStyle = {
                font: { name: "Times New Roman" },
                border: {
                    top: {style: "thin", color: {auto: 1}},
                    bottom: {style: "thin", color: {auto: 1}},
                    left: {style: "thin", color: {auto: 1}},
                    right: {style: "thin", color: {auto: 1}}
                },
                alignment: { vertical: "center", horizontal: "center" }
            };
            
            const titleStyle = {
                font: { bold: true, sz: 16, name: "Times New Roman" },
                alignment: { vertical: "center", horizontal: "center" }
            };

            const subTitleStyle = {
                font: { sz: 12, name: "Times New Roman" },
                alignment: { vertical: "center", horizontal: "center" }
            };

            const groupHeaderStyle = {
                font: { bold: true, name: "Times New Roman" },
                fill: { fgColor: { rgb: "E2E8F0" } }, 
                border: {
                    top: {style: "thin", color: {auto: 1}},
                    bottom: {style: "thin", color: {auto: 1}},
                    left: {style: "thin", color: {auto: 1}},
                    right: {style: "thin", color: {auto: 1}}
                },
                alignment: { vertical: "center", horizontal: "left" }
            };

            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellRef = XLSX.utils.encode_cell({c: C, r: R});
                    if (!ws[cellRef]) continue;

                    if (R === 0) {
                        ws[cellRef].s = titleStyle;
                    } else if (R === 1) {
                        ws[cellRef].s = subTitleStyle;
                    } else if (R === 3) {
                        ws[cellRef].s = headerStyle;
                    } else if (R > 3) {
                        const rowData = ws_data[R];
                        if (rowData[0] && typeof rowData[0] === 'string' && rowData[0].startsWith('GROUP')) {
                            ws[cellRef].s = groupHeaderStyle;
                            if (C === 0) {
                                ws['!merges'].push({ s: { r: R, c: 0 }, e: { r: R, c: 6 } });
                            }
                        } else {
                            if (C === 0 || C === 1 || C === 3 || C === 4 || C === 6) {
                                ws[cellRef].s = dataCenterStyle;
                            } else {
                                ws[cellRef].s = dataStyle;
                            }
                        }
                    }
                }
            }

            if (!data.length) {
                ws['!merges'].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 6 } }); 
            }

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Absensi");
            const filename = `Absensi_${titleVal.replace(/\s+/g, '_')}_${dateVal}.xlsx`;
            
            XLSX.writeFile(wb, filename);

            hideLoader();
        }

        // ─── PRINT ───
        function printReport() {
            showLoader("Menyiapkan laporan cetak...");

            const rayonVal = $('#rayonFilterGuru').val();
            const startVal = $('#startDateFilter').val();
            const endVal = $('#endDateFilter').val();
            const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const data = filteredPiketHistory;

            // ── Hitung statistik untuk print ──
            const todayStr = new Date().toISOString().split('T')[0];
            let todayCount = 0, tugasCount = 0, izinCount = 0;
            const rayonCounts = {}, alasanCounts = {};

            data.forEach(item => {
                if (item.tanggal && item.tanggal.startsWith(todayStr)) todayCount++;
                const a = (item.alasan || 'Piket Malam').toLowerCase();
                if (a.includes('piket') || a.includes('tugas') || a.includes('mandiri')) tugasCount++;
                else izinCount++;
                if (item.rayon) rayonCounts[item.rayon] = (rayonCounts[item.rayon] || 0) + 1;
                const al = item.alasan || 'Piket Malam';
                alasanCounts[al] = (alasanCounts[al] || 0) + 1;
            });

            const topRayon = Object.keys(rayonCounts).length
                ? Object.keys(rayonCounts).reduce((a, b) => rayonCounts[a] > rayonCounts[b] ? a : b) : '–';
            const topRayonCount = rayonCounts[topRayon] || 0;
            const topAlasan = Object.keys(alasanCounts).length
                ? Object.keys(alasanCounts).reduce((a, b) => alasanCounts[a] > alasanCounts[b] ? a : b) : '–';

            // ── Leaderboard data ──
            const rajinMap = {}, pantauMap = {};
            data.forEach(item => {
                if (!item.nama) return;
                const key = `${item.nama} (${item.kelas || '?'})`;
                const al = (item.alasan || 'Piket Malam').toLowerCase();
                const map = (al.includes('piket') || al.includes('tugas') || al.includes('mandiri')) ? rajinMap : pantauMap;
                if (!map[key]) map[key] = 0;
                map[key]++;
            });
            const top5Rajin = Object.entries(rajinMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
            const top5Pantau = Object.entries(pantauMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

            // ── KOP SURAT ──
            const kop = `
        <div class="pk-kop">
          <div class="pk-kop-logo">M</div>
          <div class="pk-kop-text">
            <h1>Yayasan Al-Muwajah</h1>
            <h2>Sistem Informasi Perizinan & Pemantauan Santri</h2>
            <p>Laporan Resmi · Dicetak pada: ${today}</p>
          </div>
        </div>`;

            // ── JUDUL ──
            const judulLaporan = `
        <div class="pk-title-box">
          <h3>Laporan Analitik Perizinan Santri</h3>
          <p>
            Periode: ${(startVal || endVal) ? `${startVal || 'Awal'} s.d. ${endVal || 'Akhir'}` : 'Semua Waktu'} &nbsp;|&nbsp;
            Rayon: ${rayonVal ? 'Rayon ' + rayonVal : 'Semua Rayon'} &nbsp;|&nbsp;
            Total Entri: ${data.length}
          </p>
        </div>`;

            // ── INFO GRID ──
            const periode = (startVal || endVal) ? `${startVal || '–'} s.d. ${endVal || '–'}` : 'Semua Waktu';
            const infoGrid = `
        <div class="pk-info-grid">
          <div class="pk-info-cell"><div class="pk-info-label">Periode Data</div><div class="pk-info-val">${periode}</div></div>
          <div class="pk-info-cell"><div class="pk-info-label">Filter Rayon</div><div class="pk-info-val">${rayonVal ? 'Rayon ' + rayonVal : 'Semua Rayon'}</div></div>
          <div class="pk-info-cell"><div class="pk-info-label">Rayon Teraktif</div><div class="pk-info-val">Rayon ${topRayon} (${topRayonCount} entri)</div></div>
          <div class="pk-info-cell"><div class="pk-info-label">Alasan Terbanyak</div><div class="pk-info-val">${topAlasan}</div></div>
        </div>`;

            // ── STATS ROW ──
            const statsRow = `
        <div class="pk-stats-row">
          <div class="pk-stat-cell"><div class="pk-stat-num">${data.length}</div><div class="pk-stat-lbl">Total Log</div></div>
          <div class="pk-stat-cell"><div class="pk-stat-num">${todayCount}</div><div class="pk-stat-lbl">Hari Ini</div></div>
          <div class="pk-stat-cell"><div class="pk-stat-num">${tugasCount}</div><div class="pk-stat-lbl">Piket/Tugas</div></div>
          <div class="pk-stat-cell"><div class="pk-stat-num">${izinCount}</div><div class="pk-stat-lbl">Izin/Sakit</div></div>
        </div>`;

            // ── INSIGHT ──
            const insightText = $('#smartInsightsText').text() || 'Data tidak tersedia.';
            const insightBox = `
        <div class="pk-section-title">A. Ringkasan & Analisis Cerdas</div>
        <div class="pk-insight-box">
          <div class="pk-insight-label">&#9670; Wawasan Otomatis Sistem</div>
          ${insightText}
        </div>`;

            // ── CHARTS (will be injected) ──
            const chartsSection = `
        <div class="pk-section-title">B. Visualisasi Data</div>
        <div class="pk-charts-row" id="pkChartsRow1"></div>
        <div class="pk-charts-row2" id="pkChartsRow2"></div>`;

            // ── LEADERBOARD ──
            const renderLbRows = (arr, emptyMsg) => {
                if (!arr.length) return `<div class="pk-lb-item"><span>${emptyMsg}</span></div>`;
                return arr.map(([name, count], i) =>
                    `<div class="pk-lb-item">
            <span class="pk-lb-rank">#${i + 1}</span>
            <span class="pk-lb-name">${name}</span>
            <span class="pk-lb-count">${count}×</span>
          </div>`).join('');
            };

            const lbSection = `
        <div class="pk-section-title">C. Pantauan Santri Menonjol</div>
        <div class="pk-lb-row">
          <div class="pk-lb-box">
            <div class="pk-lb-head">&#9651; Kandidat Apresiasi (Paling Rajin Piket)</div>
            ${renderLbRows(top5Rajin, 'Belum ada data.')}
          </div>
          <div class="pk-lb-box">
            <div class="pk-lb-head">&#9660; Pantauan Khusus (Sering Izin/Sakit)</div>
            ${renderLbRows(top5Pantau, 'Tidak ada santri perlu dipantau.')}
          </div>
        </div>`;

            // ── TABEL DATA (page 2) ──
            let tableRows = '';
            if (!data.length) {
                tableRows = `<tr><td colspan="7" style="text-align:center; padding:12px;">Tidak ada data pada rentang filter ini.</td></tr>`;
            } else {
                data.forEach((item, idx) => {
                    const tgl = item.tanggal ? item.tanggal.substring(0, 16).replace('T', ' ') : '–';
                    tableRows += `<tr>
            <td style="text-align:center; width:34px;">${idx + 1}</td>
            <td style="width:110px;">${tgl}</td>
            <td style="width:70px; text-align:center;">${item.stambuk || '–'}</td>
            <td>${item.nama || '–'}</td>
            <td style="width:50px; text-align:center;">${item.kelas || '–'}</td>
            <td style="width:70px; text-align:center;">${item.rayon || '–'}</td>
            <td style="width:110px;">${item.alasan || 'Piket Malam'}</td>
          </tr>`;
                });
            }

            const tableSection = `
        <div class="page-break"></div>
        <div class="pk-section-title">D. Lampiran Data Lengkap (${data.length} Entri)</div>
        <table class="pk-table">
          <thead><tr>
            <th>No</th><th>Tgl &amp; Waktu</th><th>Stambuk</th>
            <th>Nama Lengkap</th><th>Kelas</th><th>Rayon</th><th>Keterangan</th>
          </tr></thead>
          <tbody>${tableRows}</tbody>
          <tfoot><tr>
            <td colspan="3">Total Entri: <strong>${data.length}</strong></td>
            <td colspan="2">Piket/Tugas: <strong>${tugasCount}</strong></td>
            <td colspan="2">Izin/Sakit: <strong>${izinCount}</strong></td>
          </tr></tfoot>
        </table>`;

            // ── TANDA TANGAN ──
            const lokasiTtd = `Ponorogo, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
            const signature = `
        <div class="pk-signature" style="margin-top: 40px;">
          <div class="pk-sig-box">
            <p>${lokasiTtd}</p>
            <p>Dibuat Oleh,</p>
            <div class="pk-sig-space"></div>
            <p class="pk-sig-name">( ________________________ )</p>
            <p class="pk-sig-role">Petugas Piket / Musyrif</p>
          </div>
          <div class="pk-sig-box">
            <p>${lokasiTtd}</p>
            <p>Mengetahui,</p>
            <div class="pk-sig-space"></div>
            <p class="pk-sig-name">( ________________________ )</p>
            <p class="pk-sig-role">Kepala Bagian Keamanan</p>
          </div>
          <div class="pk-sig-box">
            <p>${lokasiTtd}</p>
            <p>Menyetujui,</p>
            <div class="pk-sig-space"></div>
            <p class="pk-sig-name">( ________________________ )</p>
            <p class="pk-sig-role">Pimpinan / Direktur</p>
          </div>
        </div>`;

            // ── ASSEMBLE ──
            const fullHtml = kop + judulLaporan + infoGrid + statsRow + insightBox + chartsSection + lbSection + tableSection + signature;
            $('#dedicatedPrintArea').html(fullHtml);

            // ── Inject charts as images ──
            setTimeout(() => {
                const tc = document.getElementById('trendChart');
                const ic = document.getElementById('jenisIzinChart');
                const rc = document.getElementById('rayonChart');
                const kc = document.getElementById('kelasChart');

                const row1 = document.getElementById('pkChartsRow1');
                const row2 = document.getElementById('pkChartsRow2');

                if (tc && ic && row1) {
                    row1.innerHTML = `
            <div class="pk-chart-box">
              <div class="pk-chart-title">&#9656; Tren Input Laporan Harian</div>
              <img src="${tc.toDataURL('image/png')}" style="max-height:160px;" />
            </div>
            <div class="pk-chart-box">
              <div class="pk-chart-title">&#9656; Distribusi Alasan Izin</div>
              <img src="${ic.toDataURL('image/png')}" style="max-height:160px;" />
            </div>`;
                }

                if (rc && kc && row2) {
                    row2.innerHTML = `
            <div class="pk-chart-box">
              <div class="pk-chart-title">&#9656; Analisis Per Rayon</div>
              <img src="${rc.toDataURL('image/png')}" style="max-height:130px;" />
            </div>
            <div class="pk-chart-box">
              <div class="pk-chart-title">&#9656; Analisis Per Kelas</div>
              <img src="${kc.toDataURL('image/png')}" style="max-height:130px;" />
            </div>`;
                }

                hideLoader();
                setTimeout(() => window.print(), 400);
            }, 600);
        }

        // ─── CSV EXPORT ───
        function downloadCSV() {
            if (!filteredPiketHistory.length) { showToast("Tidak ada data untuk didownload.", "warning"); return; }
            let csv = "data:text/csv;charset=utf-8,Tanggal,Stambuk,Nama,Kelas,Rayon,Alasan\n";
            filteredPiketHistory.forEach(item => {
                csv += `${item.tanggal || ''},${item.stambuk || ''},"${(item.nama || '').replace(/"/g, '""')}",${item.kelas || ''},${item.rayon || '}'},${(item.alasan || 'Piket Malam').replace(/,/g, ' ')}\n`;
            });
            const link = Object.assign(document.createElement('a'), { href: encodeURI(csv), download: `Laporan_Perizinan_${Date.now()}.csv` });
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        }

        // ─── LOADER ───
        function showLoader(text) { $('#loaderText').text(text); $('#loader').fadeIn(150); }
        function hideLoader() { $('#loader').fadeOut(150); }

        // ─── TOAST ───
        function showToast(message, type = "info", duration = 3200) {
            const id = "t" + Date.now();
            const iconMap = {
                success: `<i class="ph-fill ph-check-circle" style="color:var(--success); font-size:18px;"></i>`,
                danger: `<i class="ph-fill ph-x-circle" style="color:var(--danger); font-size:18px;"></i>`,
                warning: `<i class="ph-fill ph-warning" style="color:var(--warning); font-size:18px;"></i>`,
            };
            const el = $(`<div id="${id}" class="toast-item ${type}">${iconMap[type] || iconMap.warning}<span>${message}</span></div>`);
            $('#toastZone').append(el);
            setTimeout(() => {
                el.css({ opacity: 0, transform: 'translateY(8px)', transition: 'all 0.25s ease' });
                setTimeout(() => el.remove(), 280);
            }, duration);
        }

        // ─── SETTINGS ───
        let currentReasons = [];

        function loadSettingsUI() {
            showLoader("Memuat pengaturan...");
            $.ajax({
                url: scriptURL, type: 'POST',
                data: JSON.stringify({ action: "getSettings" }),
                contentType: 'text/plain',
                success: function (response) {
                    hideLoader();
                    if (response.reasons) { currentReasons = response.reasons; renderSettingsList(); }
                }
            });
        }

        function renderSettingsList() {
            const list = $('#settingsList');
            list.empty();
            currentReasons.forEach((r, idx) => {
                list.append(`<div class="settings-item"><span>${r}</span><button class="btn-del-reason" onclick="removeReason(${idx})"><i class="ph-bold ph-trash"></i></button></div>`);
            });
        }

        function addReason() {
            const val = $('#newReasonInput').val().trim();
            if (val) { currentReasons.push(val); $('#newReasonInput').val(''); renderSettingsList(); }
        }

        function removeReason(idx) { currentReasons.splice(idx, 1); renderSettingsList(); }

        function saveSettingsUI() {
            showLoader("Menyimpan...");
            $.ajax({
                url: scriptURL, type: 'POST',
                data: JSON.stringify({ action: "saveSettings", data: { reasons: currentReasons } }),
                contentType: 'text/plain',
                success: function (response) {
                    hideLoader();
                    if (response.message) {
                        showToast(response.message, "success");
                        bootstrap.Modal.getInstance(document.getElementById('modalSettings')).hide();
                    } else {
                        showToast(response.error, "danger");
                    }
                }
            });
        }
    
