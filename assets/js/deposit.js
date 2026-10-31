/* Deposits page */
(function () {
  const Store = RUFT.Store;
  const Utils = RUFT.Utils;
  const UI = RUFT.UI;

  const user = UI.requireAuth();
  if (!user) return;

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("calcDepBtn").addEventListener("click", calcDep);
    calcDep();

    document.getElementById("openDepForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const plan = document.getElementById("odPlan").value;
      const amount = parseFloat(document.getElementById("odAmount").value);
      const currency = document.getElementById("odCurrency").value;
      if (!amount || amount < 50)
        return UI.toast("Minimum deposit is $50", "error");

      const rateMatch = plan.match(/([\d.]+)%/);
      const rate = rateMatch ? parseFloat(rateMatch[1]) : 6.5;
      const termMatch = plan.match(/(\d+)M/);
      const term = termMatch ? parseInt(termMatch[1]) : 12;

      const deps = Store.getDeposits(user.phone);
      const maturity = new Date();
      maturity.setMonth(maturity.getMonth() + term);
      const interest = amount * (rate / 100) * (term / 12);
      deps.push({
        id: "d_" + Date.now(),
        plan,
        principal: amount,
        currency,
        rate,
        term,
        interest,
        maturity: maturity.toISOString(),
        status: "active",
        createdAt: new Date().toISOString(),
      });
      Store.saveDeposits(user.phone, deps);

      // Deduct from balance
      if ((user.balance || 0) >= amount) {
        Store.updateUser(user.phone, { balance: user.balance - amount });
        user.balance -= amount;
      }

      UI.toast("Deposit opened successfully!", "success");
      e.target.reset();
      renderDeposits();
    });

    renderDeposits();
  });

  function calcDep() {
    const P = parseFloat(document.getElementById("dcPrincipal").value) || 0;
    const r = (parseFloat(document.getElementById("dcRate").value) || 0) / 100;
    const t = (parseInt(document.getElementById("dcTerm").value) || 0) / 12;
    const n = parseInt(document.getElementById("dcCompound").value) || 12;
    const final = P * Math.pow(1 + r / n, n * t);
    const interest = final - P;
    const apy = (Math.pow(1 + r / n, n) - 1) * 100;
    document.getElementById("drInterest").textContent =
      Utils.formatMoney(interest);
    document.getElementById("drFinal").textContent = Utils.formatMoney(final);
    document.getElementById("drApy").textContent = apy.toFixed(2) + "%";
  }

  function renderDeposits() {
    const host = document.getElementById("myDeposits");
    if (!host) return;
    const deps = Store.getDeposits(user.phone);
    if (deps.length === 0) {
      host.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-3);">No deposits yet</td></tr>`;
      return;
    }
    host.innerHTML = deps
      .map((d) => {
        const mat = new Date(d.maturity).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        return `
        <tr>
          <td>${Utils.escapeHtml(d.plan)}</td>
          <td>${Utils.formatMoney(d.principal, d.currency)}</td>
          <td>${d.rate}%</td>
          <td>${mat}</td>
          <td>${Utils.formatMoney(d.interest, d.currency)}</td>
          <td><span class="badge">Active</span></td>
        </tr>
      `;
      })
      .join("");
  }
})();
