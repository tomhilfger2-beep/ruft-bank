/* Shared Chart.js renderers */
(function () {
  const Store = RUFT.Store;

  function getThemeColors() {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    return {
      text: isDark ? "#cbd5e1" : "#475569",
      grid: isDark ? "rgba(255,255,255,.06)" : "rgba(15,23,42,.06)",
    };
  }

  function baseOptions() {
    const c = getThemeColors();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: c.text,
            font: { family: "Plus Jakarta Sans", size: 12 },
            boxWidth: 12,
            padding: 16,
          },
        },
      },
      scales: {
        x: { ticks: { color: c.text }, grid: { color: c.grid } },
        y: { ticks: { color: c.text }, grid: { color: c.grid } },
      },
    };
  }

  function renderSpendingChart(id) {
    const ctx = document.getElementById(id);
    if (!ctx || typeof Chart === "undefined") return;
    const opts = baseOptions();
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((x) => RUFT.i18n.t(x)),
        datasets: [
          {
            label: RUFT.i18n.t("Income"),
            data: [6200, 7100, 6800, 7900, 8200, 8420, 9100],
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,.15)",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
          },
          {
            label: RUFT.i18n.t("Expenses"),
            data: [4100, 3800, 4500, 3200, 3900, 3180, 3600],
            borderColor: "#f43f5e",
            backgroundColor: "rgba(244,63,94,.12)",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
          },
        ],
      },
      options: {
        ...opts,
        plugins: {
          ...opts.plugins,
          tooltip: { mode: "index", intersect: false },
        },
      },
    });
  }

  function renderCategoryChart(id) {
    const ctx = document.getElementById(id);
    if (!ctx || typeof Chart === "undefined") return;
    const opts = baseOptions();
    delete opts.scales;
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Food", "Shopping", "Transport", "Bills", "Entertainment"].map((x) => RUFT.i18n.t(x)),
        datasets: [
          {
            data: [420, 310, 180, 260, 140],
            backgroundColor: [
              "#6366f1",
              "#ec4899",
              "#f59e0b",
              "#06b6d4",
              "#10b981",
            ],
            borderWidth: 0,
          },
        ],
      },
      options: { ...opts, cutout: "65%" },
    });
  }

  function renderIncExpChart(id) {
    const ctx = document.getElementById(id);
    if (!ctx || typeof Chart === "undefined") return;
    const opts = baseOptions();
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((x) => RUFT.i18n.t(x)),
        datasets: [
          {
            label: RUFT.i18n.t("Income"),
            data: [5800, 6200, 7100, 6800, 7900, 8200, 8420],
            backgroundColor: "#10b981",
            borderRadius: 8,
          },
          {
            label: RUFT.i18n.t("Expenses"),
            data: [3900, 4100, 3800, 4500, 3200, 3900, 3180],
            backgroundColor: "#f43f5e",
            borderRadius: 8,
          },
        ],
      },
      options: opts,
    });
  }

  function renderGrowthChart(id) {
    const ctx = document.getElementById(id);
    if (!ctx || typeof Chart === "undefined") return;
    const opts = baseOptions();
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((x) => RUFT.i18n.t(x)),
        datasets: [
          {
            label: RUFT.i18n.t("Net Growth"),
            data: [1900, 2100, 3300, 2300, 4700, 4300, 5240],
            borderColor: "#6366f1",
            backgroundColor: (context) => {
              const chart = context.chart;
              const { ctx: c, chartArea } = chart;
              if (!chartArea) return null;
              const g = c.createLinearGradient(
                0,
                chartArea.top,
                0,
                chartArea.bottom,
              );
              g.addColorStop(0, "rgba(99,102,241,.4)");
              g.addColorStop(1, "rgba(99,102,241,0)");
              return g;
            },
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: "#6366f1",
          },
        ],
      },
      options: opts,
    });
  }

  function renderSavingsChart(id) {
    const ctx = document.getElementById(id);
    if (!ctx || typeof Chart === "undefined") return;
    const opts = baseOptions();
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((x) => RUFT.i18n.t(x)),
        datasets: [
          {
            label: RUFT.i18n.t("Savings"),
            data: [6200, 7400, 8100, 9200, 10400, 11600, 12400],
            borderColor: "#06b6d4",
            backgroundColor: "rgba(6,182,212,.15)",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
          },
        ],
      },
      options: opts,
    });
  }

  function renderCategoryBarChart(id) {
    const ctx = document.getElementById(id);
    if (!ctx || typeof Chart === "undefined") return;
    const opts = baseOptions();
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Food", "Shopping", "Transport", "Bills", "Entertainment"].map((x) => RUFT.i18n.t(x)),
        datasets: [
          {
            label: RUFT.i18n.t("Spent"),
            data: [420, 310, 180, 260, 140],
            backgroundColor: [
              "#6366f1",
              "#ec4899",
              "#f59e0b",
              "#06b6d4",
              "#10b981",
            ],
            borderRadius: 8,
          },
        ],
      },
      options: {
        ...opts,
        indexAxis: "y",
        plugins: { ...opts.plugins, legend: { display: false } },
      },
    });
  }

  function renderAdminUsersChart(id) {
    const ctx = document.getElementById(id);
    if (!ctx || typeof Chart === "undefined") return;
    const opts = baseOptions();
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((x) => RUFT.i18n.t(x)),
        datasets: [
          {
            label: RUFT.i18n.t("Users"),
            data: [1200, 1450, 1680, 1890, 2050, 2240, 2410],
            borderColor: "#6366f1",
            backgroundColor: "rgba(99,102,241,.15)",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
          },
        ],
      },
      options: opts,
    });
  }

  function renderAdminVolChart(id) {
    const ctx = document.getElementById(id);
    if (!ctx || typeof Chart === "undefined") return;
    const opts = baseOptions();
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((x) => RUFT.i18n.t(x)),
        datasets: [
          {
            label: RUFT.i18n.t("Volume ($M)"),
            data: [1.8, 2.1, 2.4, 2.2, 2.9, 3.1, 3.4],
            backgroundColor: "#06b6d4",
            borderRadius: 8,
          },
        ],
      },
      options: opts,
    });
  }

  window.RUFTCharts = {
    renderSpendingChart,
    renderCategoryChart,
    renderIncExpChart,
    renderGrowthChart,
    renderSavingsChart,
    renderCategoryBarChart,
    renderAdminUsersChart,
    renderAdminVolChart,
  };
})();
