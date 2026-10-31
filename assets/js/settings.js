/* Settings page */
(function () {
  const Store = RUFT.Store;
  const UI = RUFT.UI;

  const user = UI.requireAuth();
  if (!user) return;

  document.addEventListener("DOMContentLoaded", () => {
    const s = Store.getSettings();
    document.getElementById("langSelect").value = s.language || "en";
    document.getElementById("currencySelect").value = s.currency || "USD";

    document.getElementById("langSelect").addEventListener("change", (e) => {
      const s = Store.getSettings();
      s.language = e.target.value;
      Store.saveSettings(s);
      UI.toast("Language updated", "success");
    });
    document
      .getElementById("currencySelect")
      .addEventListener("change", (e) => {
        const s = Store.getSettings();
        s.currency = e.target.value;
        Store.saveSettings(s);
        UI.toast("Currency updated", "success");
      });

    document.getElementById("clearDataBtn").addEventListener("click", () => {
      if (confirm("Clear all local demo data? This cannot be undone.")) {
        Store.clearAll();
        UI.toast("Data cleared", "info");
        setTimeout(() => (location.href = "index.html"), 600);
      }
    });
    document.getElementById("logoutBtn").addEventListener("click", () => {
      Store.clearSession();
      UI.toast("Signed out", "info");
      setTimeout(() => (location.href = "login.html"), 400);
    });
  });
})();
