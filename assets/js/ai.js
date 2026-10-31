/* AI Assistant — uz / ru / en */
(function () {
  const Store = RUFT.Store;
  const Utils = RUFT.Utils;
  const T = (s, v) => RUFT.i18n.t(s, v);
  const tr = (s) => RUFT.i18n.translate(s);

  document.addEventListener("DOMContentLoaded", () => {
    const fab = document.getElementById("aiFab");
    const panel = document.getElementById("aiPanel");
    const body = document.getElementById("aiBody");
    const form = document.getElementById("aiForm");
    const input = document.getElementById("aiInput");
    const closeBtn = document.getElementById("aiClose");
    if (!fab || !panel) return;

    fab.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      if (!panel.hidden && body.children.length === 0) {
        addBot(T("Hi! I'm RUFT AI. Ask me about your balance, spending, budget tips, transactions, or cards."));
      }
    });
    closeBtn?.addEventListener("click", () => (panel.hidden = true));

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      addUser(q);
      input.value = "";
      setTimeout(() => addBot(answer(q)), 400);
    });

    function addUser(text) {
      const d = document.createElement("div");
      d.className = "chat-msg user";
      d.textContent = text;
      body.appendChild(d);
      body.scrollTop = body.scrollHeight;
    }
    function addBot(text) {
      const d = document.createElement("div");
      d.className = "chat-msg bot";
      d.innerHTML = text;
      body.appendChild(d);
      body.scrollTop = body.scrollHeight;
    }

    // Kalit so'zlar: inglizcha, ruscha, o'zbekcha
    const K = {
      balance: /balance|how much|account|баланс|сколько|счёт|счет|balans|hisob|qancha/,
      spend: /spend|expense|spent|трат|расход|xarajat|sarf/,
      budget: /budget|save|saving|бюджет|эконом|сбереж|копи|byudjet|tejash|jamg/,
      tx: /transaction|recent|history|транзакц|истори|операц|tranzaksiya|tarix|so'nggi|songgi/,
      card: /card|карт|karta/,
      income: /income|earn|salary|доход|зарплат|заработ|daromad|maosh/,
      hello: /hello|\bhi\b|hey|привет|здравствуй|салом|salom|assalom/,
      help: /help|what can you do|помощ|помоги|что ты умеешь|yordam|nima qila/,
    };

    function answer(q) {
      const user = Store.currentUser();
      if (!user) return T("Please sign in first.");
      const ql = q.toLowerCase();
      const txs = Store.getTransactions(user.phone);
      const cards = Store.getCards(user.phone);
      const M = Utils.formatMoney;

      if (K.balance.test(ql)) {
        return T("Your current balance is <strong>{0}</strong>. Income this month: {1}. Savings: {2}.", [M(user.balance || 0), M(user.income || 0), M(user.savings || 0)]);
      }
      if (K.spend.test(ql)) {
        const exp = txs.filter((t) => t.type === "expense");
        const total = exp.reduce((a, b) => a + b.amount, 0);
        const top = exp.sort((a, b) => b.amount - a.amount)[0];
        return T("You've spent <strong>{0}</strong> this month across {1} transactions. Your largest expense was <strong>{2}</strong> ({3}).", [M(total), exp.length, Utils.escapeHtml(tr(top?.title || "—")), M(top?.amount || 0)]);
      }
      if (K.budget.test(ql)) {
        return T("💡 <strong>3 tips to save more:</strong><br>1) Set a monthly food budget of $400.<br>2) Cancel unused subscriptions (you have 3).<br>3) Auto-transfer $200 to savings on payday.");
      }
      if (K.tx.test(ql)) {
        const recent = txs.slice(0, 3).map((t) => `• ${Utils.escapeHtml(tr(t.title))} — ${M(t.amount)}`).join("<br>");
        return T("Recent activity:<br>{0}", [recent || T("None yet.")]);
      }
      if (K.card.test(ql)) {
        if (cards.length === 0) return T("You don't have any cards yet. <a href=\"cards.html\" style=\"color:var(--primary)\">Create one →</a>");
        const list = cards.map((c) => "• " + T("{0} ending {1} ({2})", [c.type.toUpperCase(), c.number.slice(-4), tr(c.status || (c.frozen ? "frozen" : "active"))])).join("<br>");
        return T("You have <strong>{0}</strong> card(s):<br>{1}", [cards.length, list]);
      }
      if (K.income.test(ql)) {
        return T("Your monthly income is <strong>{0}</strong>. Main sources: Salary, Freelance, Investment returns.", [M(user.income || 0)]);
      }
      if (K.hello.test(ql)) {
        return T("Hello {0}! 👋 How can I help you today?", [Utils.escapeHtml(user.firstName)]);
      }
      if (K.help.test(ql)) {
        return T("I can help with:<br>• Balance & account info<br>• Spending analysis<br>• Budget & saving tips<br>• Transaction search<br>• Card information<br>• Recent activity");
      }
      return T("I'm not sure about that. Try asking about your balance, spending, budget tips, or recent transactions.");
    }
  });
})();
