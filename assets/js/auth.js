/* RUFT Bank — Auth: register, OTP, login */
(function () {
  const Store = RUFT.Store;
  const Utils = RUFT.Utils;
  const UI = RUFT.UI;

  const VALID_PREFIXES = [
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
  ];

  // ===== Phone formatting helper =====
  function attachPhoneFormatter(inputId, errorId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener("input", (e) => {
      let raw = e.target.value.replace(/\D/g, "");
      // Cap at 9 digits
      raw = raw.slice(0, 9);
      e.target.value = Utils.formatPhone(raw);
      if (errorId) document.getElementById(errorId).textContent = "";
    });
    input.addEventListener("blur", () => {
      const raw = input.value.replace(/\D/g, "");
      if (raw.length === 0) return;
      if (raw.length < 9) {
        if (errorId)
          document.getElementById(errorId).textContent =
            "Phone number must be 9 digits after +998";
      } else if (!VALID_PREFIXES.includes(raw.slice(0, 2))) {
        if (errorId)
          document.getElementById(errorId).textContent =
            "Invalid Uzbekistan prefix. Allowed: " + VALID_PREFIXES.join(", ");
      }
    });
  }

  // ===== Register =====
  const regForm = document.getElementById("registerForm");
  if (regForm) {
    attachPhoneFormatter("regPhone", "regPhoneError");

    regForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      const first = document.getElementById("regFirstName").value.trim();
      const last = document.getElementById("regLastName").value.trim();
      const phoneRaw = document
        .getElementById("regPhone")
        .value.replace(/\D/g, "");
      const pwd = document.getElementById("regPassword").value;
      const confirm = document.getElementById("regConfirm").value;
      const agree = document.getElementById("agreeTerms").checked;

      // Reset
      [
        "regFirstNameError",
        "regLastNameError",
        "regPhoneError",
        "regPasswordError",
        "regConfirmError",
      ].forEach((id) => (document.getElementById(id).textContent = ""));

      if (!first) {
        document.getElementById("regFirstNameError").textContent =
          "First name is required";
        ok = false;
      }
      if (!last) {
        document.getElementById("regLastNameError").textContent =
          "Last name is required";
        ok = false;
      }
      if (!Utils.isValidUzPhone(phoneRaw)) {
        document.getElementById("regPhoneError").textContent =
          "Enter a valid Uzbekistan phone number";
        ok = false;
      } else if (Store.findUserByPhone("+998" + phoneRaw)) {
        document.getElementById("regPhoneError").textContent =
          "This phone is already registered";
        ok = false;
      }
      if (pwd.length < 8) {
        document.getElementById("regPasswordError").textContent =
          "Password must be at least 8 characters";
        ok = false;
      }
      if (pwd !== confirm) {
        document.getElementById("regConfirmError").textContent =
          "Passwords do not match";
        ok = false;
      }
      if (!agree) {
        UI.toast("Please agree to the Terms and Privacy Policy", "error");
        ok = false;
      }

      if (!ok) return;

      // Save pending registration and open OTP
      const pending = {
        firstName: first,
        lastName: last,
        phone: "+998" + phoneRaw,
        password: pwd,
        createdAt: new Date().toISOString(),
      };
      sessionStorage.setItem("ruft_pending", JSON.stringify(pending));
      openOtpModal(pending.phone);
    });
  }

  // ===== OTP =====
  let otpInterval = null;
  function generateOTP() {
    return String(Utils.randInt(100000, 999999));
  }
  function openOtpModal(phone) {
    // Generate NEW OTP each time modal opens
    const code = generateOTP();
    const expiresAt = Date.now() + 60000;
    Store.setOTP(phone, code, expiresAt);

    const modal = document.getElementById("otpModal");
    if (!modal) return;
    document.getElementById("otpPhoneDisplay").textContent = phone;
    document.getElementById("otpDemoCode").textContent = code;
    document.getElementById("otpError").textContent = "";

    // Reset inputs
    document
      .querySelectorAll("#otpInputs input")
      .forEach((i) => (i.value = ""));
    document.querySelectorAll("#otpInputs input")[0]?.focus();

    UI.openModal("otpModal");
    startOtpTimer(expiresAt);
    document.getElementById("otpResendBtn").disabled = true;
  }

  function startOtpTimer(expiresAt) {
    if (otpInterval) clearInterval(otpInterval);
    const timerEl = document.getElementById("otpTimer");
    const resendBtn = document.getElementById("otpResendBtn");
    function tick() {
      const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      timerEl.textContent = left + "s";
      if (left <= 0) {
        clearInterval(otpInterval);
        resendBtn.disabled = false;
        timerEl.textContent = "expired";
      }
    }
    tick();
    otpInterval = setInterval(tick, 500);
  }

  // OTP input behavior
  const otpInputs = document.querySelectorAll("#otpInputs input");
  otpInputs.forEach((inp, idx) => {
    inp.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "");
      if (e.target.value && idx < otpInputs.length - 1)
        otpInputs[idx + 1].focus();
    });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && idx > 0)
        otpInputs[idx - 1].focus();
    });
    inp.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData)
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);
      text.split("").forEach((ch, i) => {
        if (otpInputs[i]) otpInputs[i].value = ch;
      });
      if (otpInputs[text.length - 1]) otpInputs[text.length - 1].focus();
    });
  });

  document.getElementById("otpVerifyBtn")?.addEventListener("click", () => {
    const entered = Array.from(otpInputs)
      .map((i) => i.value)
      .join("");
    const stored = Store.getOTP();
    const errEl = document.getElementById("otpError");
    if (!stored) {
      errEl.textContent = "Session expired. Please try again.";
      return;
    }
    if (Date.now() > stored.expiresAt) {
      errEl.textContent = "Code expired. Please resend.";
      return;
    }
    if (entered.length !== 6) {
      errEl.textContent = "Please enter the full 6-digit code.";
      return;
    }
    if (entered !== stored.code) {
      errEl.textContent = "Invalid verification code.";
      return;
    }

    // Success: create user
    const pending = JSON.parse(
      sessionStorage.getItem("ruft_pending") || "null",
    );
    if (!pending) {
      errEl.textContent = "Registration session lost.";
      return;
    }

    const user = {
      ...pending,
      id: "u_" + Date.now(),
      balance: 48291.5,
      income: 8420,
      expense: 3180,
      savings: 12400,
      investments: 6800,
      email: "",
      dob: "",
      address: "",
    };
    Store.addUser(user);
    Store.setSession({ phone: user.phone });
    Store.clearOTP();
    sessionStorage.removeItem("ruft_pending");
    if (otpInterval) clearInterval(otpInterval);

    // Seed demo data
    Store.seedDemo(user.phone, user.firstName);

    UI.closeModal("otpModal");
    UI.toast("Account created successfully! Welcome to RUFT Bank.", "success");
    setTimeout(() => (location.href = "dashboard.html"), 600);
  });

  document.getElementById("otpResendBtn")?.addEventListener("click", () => {
    const pending = JSON.parse(
      sessionStorage.getItem("ruft_pending") || "null",
    );
    if (!pending) return;
    // Invalidate previous OTP, generate new one
    const code = generateOTP();
    const expiresAt = Date.now() + 60000;
    Store.setOTP(pending.phone, code, expiresAt);
    document.getElementById("otpDemoCode").textContent = code;
    document.getElementById("otpError").textContent = "";
    document
      .querySelectorAll("#otpInputs input")
      .forEach((i) => (i.value = ""));
    otpInputs[0]?.focus();
    startOtpTimer(expiresAt);
    document.getElementById("otpResendBtn").disabled = true;
    UI.toast("New code sent", "info");
  });

  document.getElementById("otpCancelBtn")?.addEventListener("click", () => {
    if (otpInterval) clearInterval(otpInterval);
    Store.clearOTP();
    UI.closeModal("otpModal");
  });

  // Invalidate OTP on page unload
  window.addEventListener("beforeunload", () => {
    // Keep OTP stored so refresh invalidates naturally via expiresAt check + new generation on reopen
  });

  // ===== Login =====
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    attachPhoneFormatter("loginPhone", "loginPhoneError");

    // Pre-fill demo
    document.getElementById("loginPhone").value = "90 123 45 67";

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const phoneRaw = document
        .getElementById("loginPhone")
        .value.replace(/\D/g, "");
      const pwd = document.getElementById("loginPassword").value;
      document.getElementById("loginPhoneError").textContent = "";
      document.getElementById("loginPasswordError").textContent = "";

      if (!Utils.isValidUzPhone(phoneRaw)) {
        document.getElementById("loginPhoneError").textContent =
          "Enter a valid Uzbekistan phone number";
        return;
      }
      const phone = "+998" + phoneRaw;
      const user = Store.findUserByPhone(phone);
      if (!user) {
        document.getElementById("loginPhoneError").textContent =
          "No account found with this number";
        return;
      }
      if (user.password !== pwd) {
        document.getElementById("loginPasswordError").textContent =
          "Incorrect password";
        return;
      }

      Store.setSession({ phone: user.phone });
      UI.toast("Welcome back, " + user.firstName + "!", "success");
      setTimeout(() => (location.href = "dashboard.html"), 400);
    });
  }
})();
