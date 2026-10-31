/* RUFT Bank — LocalStorage data layer */
const RUFT = window.RUFT || {};
window.RUFT = RUFT;

RUFT.Store = {
  KEYS: {
    USERS: "ruft_users",
    SESSION: "ruft_session",
    OTP: "ruft_otp",
    CARDS: "ruft_cards",
    TRANSACTIONS: "ruft_transactions",
    SETTINGS: "ruft_settings",
    FAVORITES: "ruft_favorites",
    LOANS: "ruft_loans",
    DEPOSITS: "ruft_deposits",
    TICKETS: "ruft_tickets",
    CHAT: "ruft_chat",
    THEME: "ruft_theme",
  },

  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove(key) {
    localStorage.removeItem(key);
  },

  // Users
  getUsers() {
    return this.get(this.KEYS.USERS, []);
  },
  saveUsers(users) {
    this.set(this.KEYS.USERS, users);
  },
  findUserByPhone(phone) {
    return this.getUsers().find((u) => u.phone === phone);
  },
  addUser(user) {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
    return user;
  },
  updateUser(phone, patch) {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.phone === phone);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...patch };
      this.saveUsers(users);
    }
  },

  // Session
  getSession() {
    return this.get(this.KEYS.SESSION);
  },
  setSession(user) {
    this.set(this.KEYS.SESSION, user);
  },
  clearSession() {
    this.remove(this.KEYS.SESSION);
  },
  currentUser() {
    const s = this.getSession();
    if (!s) return null;
    return this.findUserByPhone(s.phone) || s;
  },

  // OTP
  setOTP(phone, code, expiresAt) {
    this.set(this.KEYS.OTP, { phone, code, expiresAt });
  },
  getOTP() {
    return this.get(this.KEYS.OTP);
  },
  clearOTP() {
    this.remove(this.KEYS.OTP);
  },

  // Cards
  getCards(phone) {
    const all = this.get(this.KEYS.CARDS, {});
    return all[phone] || [];
  },
  saveCards(phone, cards) {
    const all = this.get(this.KEYS.CARDS, {});
    all[phone] = cards;
    this.set(this.KEYS.CARDS, all);
  },
  addCard(phone, card) {
    const cards = this.getCards(phone);
    cards.push(card);
    this.saveCards(phone, cards);
  },

  // Transactions
  getTransactions(phone) {
    const all = this.get(this.KEYS.TRANSACTIONS, {});
    return all[phone] || [];
  },
  saveTransactions(phone, txs) {
    const all = this.get(this.KEYS.TRANSACTIONS, {});
    all[phone] = txs;
    this.set(this.KEYS.TRANSACTIONS, all);
  },
  addTransaction(phone, tx) {
    const txs = this.getTransactions(phone);
    txs.unshift(tx);
    this.saveTransactions(phone, txs);
  },

  // Settings
  getSettings() {
    return this.get(this.KEYS.SETTINGS, {
      theme: "light",
      currency: "USD",
      language: "en",
    });
  },
  saveSettings(s) {
    this.set(this.KEYS.SETTINGS, s);
  },

  // Favorites
  getFavorites(phone) {
    const all = this.get(this.KEYS.FAVORITES, {});
    return all[phone] || [];
  },
  saveFavorites(phone, favs) {
    const all = this.get(this.KEYS.FAVORITES, {});
    all[phone] = favs;
    this.set(this.KEYS.FAVORITES, all);
  },

  // Loans
  getLoans(phone) {
    const all = this.get(this.KEYS.LOANS, {});
    return all[phone] || [];
  },
  saveLoans(phone, loans) {
    const all = this.get(this.KEYS.LOANS, {});
    all[phone] = loans;
    this.set(this.KEYS.LOANS, all);
  },

  // Deposits
  getDeposits(phone) {
    const all = this.get(this.KEYS.DEPOSITS, {});
    return all[phone] || [];
  },
  saveDeposits(phone, deps) {
    const all = this.get(this.KEYS.DEPOSITS, {});
    all[phone] = deps;
    this.set(this.KEYS.DEPOSITS, all);
  },

  // Tickets
  getTickets(phone) {
    const all = this.get(this.KEYS.TICKETS, {});
    return all[phone] || [];
  },
  saveTickets(phone, t) {
    const all = this.get(this.KEYS.TICKETS, {});
    all[phone] = t;
    this.set(this.KEYS.TICKETS, all);
  },

  // Chat
  getChat(phone) {
    const all = this.get(this.KEYS.CHAT, {});
    return all[phone] || [];
  },
  saveChat(phone, msgs) {
    const all = this.get(this.KEYS.CHAT, {});
    all[phone] = msgs;
    this.set(this.KEYS.CHAT, all);
  },

  // Seed demo data for new user
  seedDemo(phone, firstName) {
    // Seed balance via user record
    const user = this.findUserByPhone(phone);
    if (user && user.balance === undefined) {
      this.updateUser(phone, {
        balance: 48291.5,
        income: 8420,
        expense: 3180,
        savings: 12400,
        investments: 6800,
      });
    }
    // Seed transactions
    const txs = this.getTransactions(phone);
    if (txs.length === 0) {
      const demo = [
        {
          id: "t1",
          title: "Salary — RUFT Corp",
          category: "Salary",
          type: "income",
          amount: 5400,
          date: daysAgo(1),
          status: "completed",
        },
        {
          id: "t2",
          title: "Starbucks Coffee",
          category: "Food",
          type: "expense",
          amount: 12.5,
          date: daysAgo(1),
          status: "completed",
        },
        {
          id: "t3",
          title: "Netflix Subscription",
          category: "Entertainment",
          type: "expense",
          amount: 15.99,
          date: daysAgo(2),
          status: "completed",
        },
        {
          id: "t4",
          title: "Transfer to Anna",
          category: "Transfer",
          type: "transfer",
          amount: 200,
          date: daysAgo(2),
          status: "completed",
        },
        {
          id: "t5",
          title: "Uber Ride",
          category: "Transport",
          type: "expense",
          amount: 24.8,
          date: daysAgo(3),
          status: "completed",
        },
        {
          id: "t6",
          title: "Amazon Purchase",
          category: "Shopping",
          type: "expense",
          amount: 129.99,
          date: daysAgo(4),
          status: "completed",
        },
        {
          id: "t7",
          title: "Electricity Bill",
          category: "Bills",
          type: "expense",
          amount: 84.2,
          date: daysAgo(5),
          status: "completed",
        },
        {
          id: "t8",
          title: "Freelance Project",
          category: "Salary",
          type: "income",
          amount: 1200,
          date: daysAgo(6),
          status: "completed",
        },
        {
          id: "t9",
          title: "Grocery Store",
          category: "Food",
          type: "expense",
          amount: 67.4,
          date: daysAgo(7),
          status: "completed",
        },
        {
          id: "t10",
          title: "Gym Membership",
          category: "Bills",
          type: "expense",
          amount: 49,
          date: daysAgo(8),
          status: "completed",
        },
        {
          id: "t11",
          title: "Restaurant Dinner",
          category: "Food",
          type: "expense",
          amount: 86,
          date: daysAgo(10),
          status: "completed",
        },
        {
          id: "t12",
          title: "Book Store",
          category: "Shopping",
          type: "expense",
          amount: 34.5,
          date: daysAgo(12),
          status: "completed",
        },
        {
          id: "t13",
          title: "Investment Return",
          category: "Salary",
          type: "income",
          amount: 420,
          date: daysAgo(14),
          status: "completed",
        },
        {
          id: "t14",
          title: "Gas Station",
          category: "Transport",
          type: "expense",
          amount: 52,
          date: daysAgo(15),
          status: "completed",
        },
        {
          id: "t15",
          title: "Movie Tickets",
          category: "Entertainment",
          type: "expense",
          amount: 28,
          date: daysAgo(17),
          status: "completed",
        },
      ];
      this.saveTransactions(phone, demo);
    }
    // Seed cards
    const cards = this.getCards(phone);
    if (cards.length === 0) {
      const c1 = RUFT.Utils.generateCard("visa", "indigo", "Main");
      const c2 = RUFT.Utils.generateCard("mastercard", "slate", "Travel");
      this.saveCards(phone, [c1, c2]);
    }
    // Seed favorites
    const favs = this.getFavorites(phone);
    if (favs.length === 0) {
      this.saveFavorites(phone, [
        { name: "Anna Smith", phone: "+998901112233" },
        { name: "John Carter", phone: "+998914445566" },
        { name: "Maria Lee", phone: "+998937778899" },
      ]);
    }
  },

  clearAll() {
    Object.values(this.KEYS).forEach((k) => localStorage.removeItem(k));
  },
};

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

RUFT.Utils = {
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  randDigits(n) {
    let s = "";
    for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
    return s;
  },
  formatMoney(n, currency = "USD") {
    const sym = { USD: "$", EUR: "€", UZS: "so'm", GBP: "£" }[currency] || "$";
    return (
      sym +
      " " +
      Number(n).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  },
  formatPhone(raw) {
    // raw is digits after +998 (9 digits)
    const d = String(raw).replace(/\D/g, "");
    if (d.length < 2) return d;
    if (d.length < 5) return d.slice(0, 2) + " " + d.slice(2);
    if (d.length < 7)
      return d.slice(0, 2) + " " + d.slice(2, 5) + " " + d.slice(5);
    if (d.length < 9)
      return (
        d.slice(0, 2) +
        " " +
        d.slice(2, 5) +
        " " +
        d.slice(5, 7) +
        " " +
        d.slice(7)
      );
    return (
      d.slice(0, 2) +
      " " +
      d.slice(2, 5) +
      " " +
      d.slice(5, 7) +
      " " +
      d.slice(7, 9)
    );
  },
  isValidUzPhone(digits) {
    // digits = 9 digits after +998
    if (!/^\d{9}$/.test(digits)) return false;
    const prefix = digits.slice(0, 2);
    return [
      "90",
      "91",
      "93",
      "94",
      "95",
      "97",
      "98",
      "99",
      "33",
      "77",
      "88",
    ].includes(prefix);
  },
  generateCard(type, color, name) {
    const number = RUFT.Utils.randDigits(16);
    const month = String(RUFT.Utils.randInt(1, 12)).padStart(2, "0");
    const year = String(RUFT.Utils.randInt(2027, 2035));
    const cvv = RUFT.Utils.randDigits(3);
    return {
      id: "c_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      type,
      color,
      name: name || "",
      number,
      month,
      year,
      cvv,
      status: "active",
      createdAt: new Date().toISOString(),
    };
  },
  maskCardNumber(num) {
    return num.slice(0, 4) + " •••• •••• " + num.slice(-4);
  },
  initials(first, last) {
    return ((first || "")[0] || "") + ((last || "")[0] || "");
  },
  escapeHtml(s) {
    return String(s || "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  },
};
