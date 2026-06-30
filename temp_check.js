
      const scriptURL = "https://script.google.com/macros/s/AKfycbwoClgF8MIJC-iDsNcnNESrZHMGHZMRUx1Mdoxj0LA7Ytz2YEeCBAgNBoO133bBF_F5/exec";
      let globalDashboardData = [];
      let chartPelajaranInstance = null;
      let chartKelasInstance = null;
      const PIN_DASHBOARD = "1234";

      function showDashboardPinModal() {
        document.getElementById("inputPinDashboard").value = "";
        new bootstrap.Modal(document.getElementById("modalPinDashboard")).show();
      }

      async function verifyDashboardPin() {
        const pin = document.getElementById("inputPinDashboard").value;
        if (pin !== PIN_DASHBOARD) {
          alert("PIN Salah!");
          return;
        }
        bootstrap.Modal.getInstance(document.getElementById("modalPinDashboard")).hide();
        openDashboard();
      }

      async function openDashboard() {
        document.getElementById("dashboardSection").style.display = "block";
        const btnBtn = document.getElementById("dashTotalLaporan");
        btnBtn.innerHTML = '<i class="ph-duotone ph-spinner ph-spin"></i>';
        try {
          const res = await fetch(scriptURL, { method: "POST", body: JSON.stringify({ action: "getAllProgress" }) });
          const data = await res.json();
          globalDashboardData = data;
          renderDashboard(data);
        } catch (err) {
          alert("Gagal mengambil data dashboard.");
          closeDashboard();
        }
      }

      function closeDashboard() {
        window.location.href = "index.html";
      }

      function renderDashboard(data) {
        document.getElementById("dashTotalLaporan").innerText = data.length;
        const santriSet = new Set();
        const kelasCount = {};
        const pelajaranCount = {};
        data.forEach(d => {
          if (d.stambuk) santriSet.add(d.stambuk);
          if (d.kelas) kelasCount[d.kelas] = (kelasCount[d.kelas] || 0) + 1;
          if (d.pelajaran) pelajaranCount[d.pelajaran] = (pelajaranCount[d.pelajaran] || 0) + 1;
        });
        document.getElementById("dashTotalSantri").innerText = santriSet.size;
        document.getElementById("dashTotalKelas").innerText = Object.keys(kelasCount).length;
        document.getElementById("dashTotalPelajaran").innerText = Object.keys(pelajaranCount).length;
        renderChartPelajaran(pelajaranCount);
        renderChartKelas(kelasCount);
      }

      function renderChartPelajaran(dataObj) {
        const ctx = document.getElementById('chartPelajaran').getContext('2d');
        if (chartPelajaranInstance) chartPelajaranInstance.destroy();
        const sortedKeys = Object.keys(dataObj).sort((a, b) => dataObj[b] - dataObj[a]);
        const sortedValues = sortedKeys.map(k => dataObj[k]);
        chartPelajaranInstance = new Chart(ctx, {
          type: 'bar',
          data: { labels: sortedKeys, datasets: [{ label: 'Jumlah Laporan', data: sortedValues, backgroundColor: '#ea580c', borderRadius: 6 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, onClick: (e, elements) => { if (elements.length > 0) drillDownDashboard('pelajaran', sortedKeys[elements[0].index]); } }
        });
      }

      function renderChartKelas(dataObj) {
        const ctx = document.getElementById('chartKelas').getContext('2d');
        if (chartKelasInstance) chartKelasInstance.destroy();
        const sortedKeys = Object.keys(dataObj).sort();
        const sortedValues = sortedKeys.map(k => dataObj[k]);
        chartKelasInstance = new Chart(ctx, {
          type: 'bar',
          data: { labels: sortedKeys, datasets: [{ label: 'Total Laporan', data: sortedValues, backgroundColor: '#0ea5e9', borderRadius: 6 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, onClick: (e, elements) => { if (elements.length > 0) drillDownDashboard('kelas', sortedKeys[elements[0].index]); } }
        });
      }

      function drillDownDashboard(filterType, filterValue) {
        const filtered = globalDashboardData.filter(d => d[filterType] === filterValue);
        document.getElementById("modalDetailTitle").innerText = `Detail: ${filterValue} (${filtered.length} Data)`;
        const tbody = document.getElementById("detailDashboardBody");
        tbody.innerHTML = "";
        filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        filtered.forEach(d => {
          let dateStr = "";
          try {
            const dt = new Date(d.tanggal);
            if (isNaN(dt.getTime())) dateStr = d.tanggal;
            else dateStr = `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
          } catch (e) { dateStr = d.tanggal; }
          tbody.innerHTML += `<tr><td style="white-space:nowrap;">${dateStr}</td><td class="fw-bold">${d.nama}</td><td>${d.kelas}</td><td>${d.pelajaran}</td><td><span style="font-size:11px;" class="badge bg-light text-dark border mb-1">${d.jenis}</span><br/>${d.judul}</td></tr>`;
        });
        new bootstrap.Modal(document.getElementById("modalDetailDashboard")).show();
      }

      const applyTheme = (dark) => {
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
        document.getElementById("iconTheme").innerHTML = dark
          ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m8.66-10h-1M4.34 12h-1m15.07-6.07l-.71.71M6.34 17.66l-.71.71m12.02 0l-.71-.71M6.34 6.34l-.71-.71M12 8a4 4 0 100 8 4 4 0 000-8z"/>`
          : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>`;
      };
      const savedTheme = localStorage.getItem("theme") === "dark";
      applyTheme(savedTheme);
      document.getElementById("btnTheme").addEventListener("click", () => {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        applyTheme(!isDark);
        localStorage.setItem("theme", !isDark ? "dark" : "light");
      });

      window.addEventListener("load", () => {
        showDashboardPinModal();
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.register("service-worker.js").catch(err => console.warn("SW failed:", err));
        }
      });
      window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); });
    
