/* Transactions page */
(function () {
  const Store = RUFT.Store;
  const Utils = RUFT.Utils;
  const UI = RUFT.UI;

  const user = UI.requireAuth();
  if (!user) return;

  const PAGE_SIZE = 8;
  let currentPage = 1;
  let filtered = [];

  document.addEventListener("DOMContentLoaded", () => {
    filtered = Store.getTransactions(user.phone);

    // Pre-fill search from global
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) document.getElementById("txSearch").value = q;

    document.getElementById("txSearch").addEventListener("input", apply);
    document.getElementById("txTypeFilter").addEventListener("change", apply);
    document
      .getElementById("txCategoryFilter")
      .addEventListener("change", apply);

    document.getElementById("exportCsv").addEventListener("click", exportCsv);
    document.getElementById("exportPdf").addEventListener("click", exportPdf);

    apply();
  });

  function apply() {
    const q = document.getElementById("txSearch").value.toLowerCase();
    const type = document.getElementById("txTypeFilter").value;
    const cat = document.getElementById("txCategoryFilter").value;
    const all = Store.getTransactions(user.phone);
    filtered = all.filter((t) => {
      if (
        q &&
        !(
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        )
      )
        return false;
      if (type && t.type !== type) return false;
      if (cat && t.category !== cat) return false;
      return true;
    });
    currentPage = 1;
    render();
  }

  function render() {
    const body = document.getElementById("txBody");
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const start = (currentPage - 1) * PAGE_SIZE;
    const slice = filtered.slice(start, start + PAGE_SIZE);

    if (slice.length === 0) {
      body.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-3);">No transactions found</td></tr>`;
    } else {
      body.innerHTML = slice
        .map((tx) => {
          const icon =
            tx.type === "income"
              ? "fa-arrow-down"
              : tx.type === "transfer"
                ? "fa-paper-plane"
                : "fa-arrow-up";
          const sign = tx.type === "income" ? "+" : "-";
          const cls = tx.type === "income" ? "positive" : "negative";
          const date = new Date(tx.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          const statusBadge =
            tx.status === "completed"
              ? '<span class="badge">Completed</span>'
              : tx.status === "pending"
                ? '<span class="badge pending">Pending</span>'
                : '<span class="badge failed">Failed</span>';
          return `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="tx-icon ${tx.type}" style="width:36px;height:36px;font-size:.9rem;"><i class="fa-solid ${icon}"></i></div>
                <div><strong style="font-size:.9rem;">${Utils.escapeHtml(tx.title)}</strong><br><small>${Utils.escapeHtml(tx.description || "")}</small></div>
              </div>
            </td>
            <td>${Utils.escapeHtml(tx.category)}</td>
            <td>${date}</td>
            <td><span class="tx-amount ${cls}">${sign}${Utils.formatMoney(tx.amount, tx.currency)}</span></td>
            <td>${statusBadge}</td>
          </tr>
        `;
        })
        .join("");
    }

    // Pagination
    const pag = document.getElementById("txPagination");
    let html = "";
    html += `<button ${currentPage === 1 ? "disabled" : ""} data-p="${currentPage - 1}"><i class="fa-solid fa-chevron-left"></i></button>`;
    for (let i = 1; i <= pages; i++) {
      if (
        pages > 7 &&
        i > 2 &&
        i < pages - 1 &&
        Math.abs(i - currentPage) > 1
      ) {
        if (i === 3 || i === pages - 2) html += `<button disabled>…</button>`;
        continue;
      }
      html += `<button class="${i === currentPage ? "active" : ""}" data-p="${i}">${i}</button>`;
    }
    html += `<button ${currentPage === pages ? "disabled" : ""} data-p="${currentPage + 1}"><i class="fa-solid fa-chevron-right"></i></button>`;
    pag.innerHTML = html;
    pag.querySelectorAll("button[data-p]").forEach((b) =>
      b.addEventListener("click", () => {
        const p = parseInt(b.dataset.p);
        if (p >= 1 && p <= pages) {
          currentPage = p;
          render();
        }
      }),
    );
  }

  function exportCsv() {
    const rows = [["Title", "Category", "Type", "Date", "Amount", "Status"]];
    filtered.forEach((t) =>
      rows.push([
        t.title,
        t.category,
        t.type,
        new Date(t.date).toISOString(),
        t.amount,
        t.status,
      ]),
    );
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadFile("transactions.csv", csv, "text/csv");
    UI.toast("CSV exported", "success");
  }

  function exportPdf() {
    // Simple printable HTML-as-PDF
    const win = window.open("", "_blank");
    const rows = filtered
      .map(
        (t) => `
      <tr>
        <td>${Utils.escapeHtml(t.title)}</td>
        <td>${Utils.escapeHtml(t.category)}</td>
        <td>${new Date(t.date).toLocaleDateString()}</td>
        <td>${t.type === "income" ? "+" : "-"}${Utils.formatMoney(t.amount)}</td>
        <td>${t.status}</td>
      </tr>
    `,
      )
      .join("");
    win.document.write(`
      <html><head><title>Transactions</title>
      <style>body{font-family:Arial;padding:30px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#f5f5f5;}</style>
      </head><body>
      <h1>RUFT Bank — Transactions</h1>
      <p>${Utils.escapeHtml(user.firstName)} ${Utils.escapeHtml(user.lastName)} • ${user.phone}</p>
      <table><thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=()=>window.print();<\/script>
      </body></html>
    `);
    win.document.close();
  }

  function downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }
})();
