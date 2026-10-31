/* Cards Page - Complete Functionality */
(function () {
  const Store = RUFT.Store;
  const Utils = RUFT.Utils;
  const UI = RUFT.UI;

  const user = UI.requireAuth();
  if (!user) return;

  let selectedCardType = "visa";
  let currentSettingsCardId = null;

  // ---- Brand helpers (Humo / Uzcard) ----
  function brandIcon(type) {
    if (type === "humo") return '<span class="wm wm-humo">HUMO<i></i></span>';
    if (type === "uzcard") return '<span class="wm wm-uzcard">UZCARD</span>';
    return `<i class="fa-brands fa-cc-${type}"></i>`;
  }
  function detectBrand(num) {
    if (/^9860/.test(num)) return "humo";
    if (/^8600/.test(num)) return "uzcard";
    if (/^4/.test(num)) return "visa";
    if (/^(5[1-5]|2[2-7])/.test(num)) return "mastercard";
    return null;
  }
  function setType(type) {
    selectedCardType = type;
    document.querySelectorAll(".type-option").forEach((o) => {
      o.classList.toggle("active", o.dataset.type === type);
    });
  }

  // Initialize
  document.addEventListener("DOMContentLoaded", () => {
    renderCards();
    setupModal();
    setupFormValidation();
    setupSettingsDropdown();
  });

  // Render Cards Grid
  function renderCards() {
    const grid = document.getElementById("cardsGrid");
    const cards = Store.getCards(user.phone);

    let html = "";

    // Render existing cards
    cards.forEach((card, index) => {
      const isBrand = card.type === "humo" || card.type === "uzcard";
      const gradientClass =
        isBrand && !card.recolored
          ? `brand-${card.type}`
          : card.recolored
            ? `card-gradient-${(parseInt(card.gradientIndex || 0) % 6) + 1}`
            : `card-gradient-${(index % 6) + 1}`;
      const frozenClass = card.frozen ? "frozen" : "";

      html += `
        <div class="card-item" data-id="${card.id}">
          <div class="credit-card ${gradientClass} ${frozenClass}">
            <div class="card-chip"></div>
            <div class="card-number">${formatCardNumber(card.number)}</div>
            <div class="card-bottom">
              <div class="card-holder">
                <small>Card Holder</small>
                <span>${Utils.escapeHtml(card.holder)}</span>
              </div>
              <div class="card-expiry">
                <small>Expires</small>
                <span>${card.expiry}</span>
              </div>
              <div class="card-brand">
                ${brandIcon(card.type)}
              </div>
            </div>
          </div>
          <div class="card-actions">
            <button class="action-btn" data-action="freeze" data-id="${card.id}">
              <i class="fa-solid fa-snowflake"></i>
              <span>${card.frozen ? "Unfreeze" : "Freeze"}</span>
            </button>
            <button class="action-btn" data-action="copy" data-id="${card.id}">
              <i class="fa-solid fa-copy"></i>
              <span>Copy</span>
            </button>
            <button class="action-btn" data-action="settings" data-id="${card.id}">
              <i class="fa-solid fa-gear"></i>
              <span>Settings</span>
            </button>
            <button class="action-btn" data-action="delete" data-id="${card.id}">
              <i class="fa-solid fa-trash"></i>
              <span>Delete</span>
            </button>
          </div>
        </div>
      `;
    });

    // Add empty card placeholder
    html += `
      <div class="empty-card" id="emptyCard">
        <i class="fa-solid fa-plus"></i>
        <span>Add New Card</span>
      </div>
    `;

    grid.innerHTML = html;

    // Attach event listeners
    attachCardActions();
    document.getElementById("emptyCard").addEventListener("click", openModal);
  }

  // Attach Card Action Listeners
  function attachCardActions() {
    document.querySelectorAll(".action-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const action = btn.dataset.action;
        const cardId = btn.dataset.id;

        switch (action) {
          case "freeze":
            toggleFreeze(cardId);
            break;
          case "copy":
            copyCardNumber(cardId);
            break;
          case "settings":
            showSettings(e, cardId);
            break;
          case "delete":
            confirmDelete(cardId);
            break;
        }
      });
    });
  }

  // Freeze/Unfreeze Card
  function toggleFreeze(cardId) {
    const cards = Store.getCards(user.phone);
    const card = cards.find((c) => c.id === cardId);
    if (card) {
      card.frozen = !card.frozen;
      Store.saveCards(user.phone, cards);
      renderCards();
      showToast(card.frozen ? "Card frozen" : "Card unfrozen", "info");
    }
  }

  // Copy Card Number
  function copyCardNumber(cardId) {
    const cards = Store.getCards(user.phone);
    const card = cards.find((c) => c.id === cardId);
    if (card) {
      navigator.clipboard
        .writeText(card.number)
        .then(() => {
          showToast("Card number copied to clipboard", "success");
        })
        .catch(() => {
          showToast("Failed to copy", "error");
        });
    }
  }

  // Show Settings Dropdown
  function showSettings(e, cardId) {
    e.stopPropagation();
    currentSettingsCardId = cardId;
    const dropdown = document.getElementById("settingsDropdown");
    const rect = e.target.getBoundingClientRect();

    dropdown.style.top = `${rect.bottom + 8}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.classList.add("active");
  }

  // Setup Settings Dropdown
  function setupSettingsDropdown() {
    const dropdown = document.getElementById("settingsDropdown");

    dropdown.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", () => {
        const action = item.dataset.action;
        handleSettingsAction(action);
        dropdown.classList.remove("active");
      });
    });

    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
      if (
        !dropdown.contains(e.target) &&
        !e.target.closest('[data-action="settings"]')
      ) {
        dropdown.classList.remove("active");
      }
    });
  }

  // Handle Settings Actions
  function handleSettingsAction(action) {
    const cards = Store.getCards(user.phone);
    const card = cards.find((c) => c.id === currentSettingsCardId);
    if (!card) return;

    switch (action) {
      case "rename":
        const newName = prompt("Enter new card name:", card.holder);
        if (newName && newName.trim()) {
          card.holder = newName.trim().toUpperCase();
          Store.saveCards(user.phone, cards);
          renderCards();
          showToast("Card renamed successfully", "success");
        }
        break;
      case "replace":
        card.number = generateCardNumber(card.type);
        Store.saveCards(user.phone, cards);
        renderCards();
        showToast("Card number replaced", "success");
        break;
      case "color":
        // Cycle through gradients
        const currentIndex = parseInt(card.gradientIndex || 0);
        card.gradientIndex = (currentIndex + 1) % 6;
        if (card.type === "humo" || card.type === "uzcard") card.recolored = true;
        Store.saveCards(user.phone, cards);
        renderCards();
        showToast("Card color changed", "success");
        break;
    }
  }

  // Confirm Delete
  function confirmDelete(cardId) {
    if (confirm("Are you sure you want to delete this card?")) {
      const cards = Store.getCards(user.phone).filter((c) => c.id !== cardId);
      Store.saveCards(user.phone, cards);
      renderCards();
      showToast("Card deleted successfully", "success");
    }
  }

  // Setup Modal
  function setupModal() {
    const modal = document.getElementById("addCardModal");
    const openBtn = document.getElementById("openModalBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    openBtn.addEventListener("click", openModal);
    cancelBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  function openModal() {
    const modal = document.getElementById("addCardModal");
    modal.classList.add("active");
    resetForm();
  }

  function closeModal() {
    const modal = document.getElementById("addCardModal");
    modal.classList.remove("active");
    resetForm();
  }

  function resetForm() {
    document.getElementById("cardForm").reset();
    document.getElementById("previewNumber").textContent =
      "•••• •••• •••• ••••";
    document.getElementById("previewHolder").textContent = "YOUR NAME";
    document.getElementById("previewExpiry").textContent = "MM/YY";
    document.getElementById("previewBrand").innerHTML =
      brandIcon("visa");
    document.getElementById("previewCard").classList.remove("brand-humo", "brand-uzcard");
    selectedCardType = "visa";
    document.querySelectorAll(".type-option").forEach((opt) => {
      opt.classList.toggle("active", opt.dataset.type === "visa");
    });
    clearErrors();
    document.getElementById("saveBtn").disabled = true;
  }

  // Setup Form Validation
  function setupFormValidation() {
    const holderInput = document.getElementById("cardHolder");
    const numberInput = document.getElementById("cardNumber");
    const expiryInput = document.getElementById("cardExpiry");
    const cvvInput = document.getElementById("cardCVV");
    const form = document.getElementById("cardForm");

    // Card Holder - Letters only, uppercase preview
    holderInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, "").toUpperCase();
      updatePreview();
      validateForm();
    });

    // Card Number - Auto format with spaces
    numberInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      value = value.substring(0, 16);

      // Format with spaces
      let formatted = "";
      for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += " ";
        formatted += value[i];
      }

      e.target.value = formatted;
      const detected = detectBrand(value);
      if (detected) setType(detected);
      updatePreview();
      validateForm();
    });

    // Expiry - Auto format MM/YY
    expiryInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");

      if (value.length >= 2) {
        value = value.substring(0, 2) + "/" + value.substring(2, 4);
      }

      e.target.value = value;
      updatePreview();
      validateForm();
    });

    // CVV - Only 3 digits
    cvvInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").substring(0, 3);
      validateForm();
    });

    // Card Type Selection
    document.querySelectorAll(".type-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        document
          .querySelectorAll(".type-option")
          .forEach((o) => o.classList.remove("active"));
        opt.classList.add("active");
        selectedCardType = opt.dataset.type;
        updatePreview();
      });
    });

    // Form Submit
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (validateForm(true)) {
        saveCard();
      }
    });
  }

  // Update Live Preview
  function updatePreview() {
    const holder = document.getElementById("cardHolder").value || "YOUR NAME";
    const number =
      document.getElementById("cardNumber").value || "•••• •••• •••• ••••";
    const expiry = document.getElementById("cardExpiry").value || "MM/YY";

    document.getElementById("previewHolder").textContent = holder;
    document.getElementById("previewNumber").textContent =
      number
        .padEnd(19, "•")
        .replace(/(.{4})/g, "$1 ")
        .trim() || "•••• •••• •••• ••••";
    document.getElementById("previewExpiry").textContent = expiry;
    const pc = document.getElementById("previewCard");
    pc.classList.remove("brand-humo", "brand-uzcard");
    if (selectedCardType === "humo" || selectedCardType === "uzcard")
      pc.classList.add(`brand-${selectedCardType}`);
    document.getElementById("previewBrand").innerHTML = brandIcon(selectedCardType);
  }

  // Validate Form
  function validateForm(showErrors = false) {
    const holder = document.getElementById("cardHolder").value.trim();
    const number = document
      .getElementById("cardNumber")
      .value.replace(/\s/g, "");
    const expiry = document.getElementById("cardExpiry").value;
    const cvv = document.getElementById("cardCVV").value;

    let isValid = true;

    // Holder validation
    if (!holder || !/^[A-Z\s]+$/.test(holder)) {
      if (showErrors)
        document.getElementById("holderError").textContent =
          "Enter valid name (letters only)";
      isValid = false;
    } else {
      document.getElementById("holderError").textContent = "";
    }

    // Number validation
    if (!/^\d{16}$/.test(number)) {
      if (showErrors)
        document.getElementById("numberError").textContent =
          "Enter 16-digit card number";
      isValid = false;
    } else {
      document.getElementById("numberError").textContent = "";
    }

    // Expiry validation
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      if (showErrors)
        document.getElementById("expiryError").textContent =
          "Enter MM/YY format";
      isValid = false;
    } else {
      const [month, year] = expiry.split("/").map(Number);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;

      if (
        year < currentYear ||
        (year === currentYear && month < currentMonth)
      ) {
        if (showErrors)
          document.getElementById("expiryError").textContent = "Card expired";
        isValid = false;
      } else {
        document.getElementById("expiryError").textContent = "";
      }
    }

    // CVV validation
    if (!/^\d{3}$/.test(cvv)) {
      if (showErrors)
        document.getElementById("cvvError").textContent = "Enter 3-digit CVV";
      isValid = false;
    } else {
      document.getElementById("cvvError").textContent = "";
    }

    document.getElementById("saveBtn").disabled = !isValid;
    return isValid;
  }

  function clearErrors() {
    document.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
  }

  // Save Card
  function saveCard() {
    const holder = document.getElementById("cardHolder").value.trim();
    const number = document
      .getElementById("cardNumber")
      .value.replace(/\s/g, "");
    const expiry = document.getElementById("cardExpiry").value;
    const cvv = document.getElementById("cardCVV").value;

    const cards = Store.getCards(user.phone);
    const newCard = {
      id: "card_" + Date.now(),
      holder,
      number,
      expiry,
      cvv,
      type: selectedCardType,
      frozen: false,
      gradientIndex: cards.length % 6,
      createdAt: new Date().toISOString(),
    };

    cards.push(newCard);
    Store.saveCards(user.phone, cards);

    closeModal();
    renderCards();
    showToast("Card added successfully", "success");
  }

  // Generate Random Card Number
  function generateCardNumber(type) {
    const prefix = { humo: "9860", uzcard: "8600", visa: "4", mastercard: "5" }[type] || "";
    let number = prefix;
    while (number.length < 16) {
      number += Math.floor(Math.random() * 10);
    }
    return number;
  }

  // Format Card Number for Display
  function formatCardNumber(number) {
    return number.replace(/(.{4})/g, "$1 ").trim();
  }

  // Toast Notification
  function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icon =
      type === "success"
        ? "fa-circle-check"
        : type === "error"
          ? "fa-circle-xmark"
          : "fa-circle-info";

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${Utils.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100px)";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
})();
