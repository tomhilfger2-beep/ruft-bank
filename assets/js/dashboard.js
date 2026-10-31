/* Dashboard page */
(function () {
  const Store = RUFT.Store;
  const Utils = RUFT.Utils;
  const UI = RUFT.UI;

  const user = UI.requireAuth();
  if (!user) return;

  document.addEventListener("DOMContentLoaded", () => {
    // Greeting
    const h = new Date().getHours();
    const greet =
      h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    document.getElementById("greeting").textContent =
      `${greet}, ${user.firstName} 👋`;

    // Stats
    document.getElementById("statBalance").textContent = Utils.formatMoney(
      user.balance || 0,
    );
    document.getElementById("statIncome").textContent = Utils.formatMoney(
      user.income || 0,
    );
    document.getElementById("statExpense").textContent = Utils.formatMoney(
      user.expense || 0,
    );
    document.getElementById("statSavings").textContent = Utils.formatMoney(
      user.savings || 0,
    );

    // Cards
    renderCards();
    // Transactions
    renderRecentTx();
    // AI insights
    renderAIInsights();
    // Rates
    renderRates();
    // Charts
    if (window.RUFTCharts) {
      RUFTCharts.renderSpendingChart("spendingChart");
      RUFTCharts.renderCategoryChart("categoryChart");
    }
  });

  function renderCards() {
    const host = document.getElementById("dashCards");
    if (!host) return;
    const cards = Store.getCards(user.phone).slice(0, 3);
    let html = "";
    cards.forEach((c) => {
      html += `
        <div class="mini-card ${c.color}">
          <div class="mini-card-top">
            <div class="mini-card-chip"></div>
            <div class="mini-card-brand">${c.type === "humo" ? '<span class="mini-wm humo">HUMO</span>' : c.type === "uzcard" ? '<span class="mini-wm uzcard">UZCARD</span>' : `<i class="fa-brands fa-cc-${c.type === "mastercard" ? "mastercard" : "visa"}"></i>`}</div>
          </div>
          <div class="mini-card-number">${Utils.maskCardNumber(c.number)}</div>
          <div class="mini-card-bottom">
            <div><small>Card Holder</small><div class="mini-card-name">${Utils.escapeHtml(user.firstName)} ${Utils.escapeHtml(user.lastName)}</div></div>
            <div><small>Expires</small><div>${c.month}/${String(c.year).slice(-2)}</div></div>
          </div>
        </div>
      `;
    });
    html += `<a href="cards.html" class="add-card-mini"><i class="fa-solid fa-plus"></i><span>Add new card</span></a>`;
    host.innerHTML = html;
  }

  function renderRecentTx() {
    const host = document.getElementById("recentTx");
    if (!host) return;
    const txs = Store.getTransactions(user.phone).slice(0, 6);
    if (txs.length === 0) {
      host.innerHTML =
        '<p style="color:var(--text-3);text-align:center;padding:20px;">No transactions yet</p>';
      return;
    }
    host.innerHTML = txs.map((tx) => txItemHTML(tx)).join("");
  }

  function txItemHTML(tx) {
    const icon =
      tx.type === "income"
        ? "fa-arrow-down"
        : tx.type === "transfer"
          ? "fa-paper-plane"
          : "fa-arrow-up";
    const sign = tx.type === "income" ? "+" : "-";
    const cls = tx.type === "income" ? "positive" : "negative";
    const date = new Date(tx.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `
      <div class="tx-item">
        <div class="tx-icon ${tx.type}"><i class="fa-solid ${icon}"></i></div>
        <div class="tx-info">
          <strong>${Utils.escapeHtml(tx.title)}</strong>
          <small>${Utils.escapeHtml(tx.category)} • ${date}</small>
        </div>
        <div class="tx-amount ${cls}">${sign}${Utils.formatMoney(tx.amount)}</div>
      </div>
    `;
  }

  function renderAIInsights() {
    const host = document.getElementById("aiInsights");
    if (!host) return;
    const txs = Store.getTransactions(user.phone);
    const expenses = txs.filter((t) => t.type === "expense");
    const totalExp = expenses.reduce((a, b) => a + b.amount, 0);
    const food = expenses
      .filter((t) => t.category === "Food")
      .reduce((a, b) => a + b.amount, 0);
    const insights = [
      {
        icon: "fa-lightbulb",
        text: RUFT.i18n.t("You've spent <strong>{0}</strong> this month. You're <strong>18% under</strong> your budget — great job!", [Utils.formatMoney(totalExp)]),
      },
      {
        icon: "fa-utensils",
        text: RUFT.i18n.t("<strong>{0}</strong> went to food & dining. Consider meal-prepping to save ~<strong>$120/month</strong>.", [Utils.formatMoney(food)]),
      },
      {
        icon: "fa-piggy-bank",
        text: RUFT.i18n.t("If you save <strong>$200/month</strong> more, you'll hit your <strong>$20,000</strong> goal in <strong>4 months</strong>."),
      },
      {
        icon: "fa-credit-card",
        text: RUFT.i18n.t("Your <strong>RUFT Visa</strong> earned <strong>$42 cashback</strong> this month. Keep using it for daily purchases."),
      },
    ];
    host.innerHTML = insights
      .map(
        (i) => `
      <div class="ai-insight">
        <div class="ai-insight-icon"><i class="fa-solid ${i.icon}"></i></div>
        <div class="ai-insight-text">${i.text}</div>
      </div>
    `,
      )
      .join("");
  }

  function renderRates() {
    const host = document.getElementById("ratesGrid");
    if (!host) return;
    const rates = [
      { from: "USD", to: "UZS", rate: 12645, change: +0.12 },
      { from: "EUR", to: "USD", rate: 1.087, change: -0.08 },
      { from: "GBP", to: "USD", rate: 1.274, change: +0.21 },
      { from: "RUB", to: "USD", rate: 0.011, change: -0.34 },
      { from: "BTC", to: "USD", rate: 67420, change: +2.14 },
      { from: "ETH", to: "USD", rate: 3512, change: +1.08 },
    ];
    host.innerHTML = rates
      .map(
        (r) => `
      <div class="rate-item">
        <div>
          <strong>${r.from}/${r.to}</strong>
          <small>${r.rate.toLocaleString("en-US", { maximumFractionDigits: r.rate < 10 ? 4 : 2 })}</small>
        </div>
        <div class="rate-change ${r.change >= 0 ? "up" : "down"}">
          <i class="fa-solid fa-${r.change >= 0 ? "arrow-up" : "arrow-down"}"></i>
          ${Math.abs(r.change).toFixed(2)}%
        </div>
      </div>
    `,
      )
      .join("");
  }
})();
