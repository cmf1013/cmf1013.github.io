/* ============================================================
   האתר — התנהגות. קטן, בלי ספריות.
   מצב בהיר/כהה · תפריט בנייד · חשיפה בגלילה · חלון רכישה · דף הורדות · יצירת קשר
   ============================================================ */
(function () {
  "use strict";
  var C = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- מצב תצוגה ---------- */
  function setTheme(t, save) {
    document.documentElement.setAttribute("data-theme", t);
    if (save) { try { localStorage.setItem("theme", t); } catch (e) {} }
    $$(".theme-btn").forEach(function (b) { b.setAttribute("aria-label", t === "dark" ? "מעבר למצב בהיר" : "מעבר למצב כהה"); b.title = b.getAttribute("aria-label"); });
  }
  $$(".theme-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
    });
  });
  setTheme(document.documentElement.getAttribute("data-theme") || "dark", false);

  /* ---------- תפריט בנייד ---------- */
  var burger = $(".burger");
  if (burger) burger.addEventListener("click", function () {
    var open = document.body.classList.toggle("nav-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $$(".menu a").forEach(function (a) { a.addEventListener("click", function () { document.body.classList.remove("nav-open"); }); });

  /* ---------- העמוד הנוכחי בתפריט ---------- */
  var here = location.pathname.split("/").pop() || "index.html";
  $$(".menu a").forEach(function (a) { if ((a.getAttribute("href") || "").split("#")[0] === here) a.setAttribute("aria-current", "page"); });

  /* ---------- חשיפה בגלילה ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".rv").forEach(function (el) { io.observe(el); });
  } else { $$(".rv").forEach(function (el) { el.classList.add("in"); }); }

  /* ---------- שנה בתחתית ---------- */
  $$(".year").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- הורדות: גרסה, גודל ---------- */
  if (C.downloads) {
    Object.keys(C.downloads).forEach(function (k) {
      var d = C.downloads[k];
      var a = $('[data-dl="' + k + '"]'); if (a) { a.href = d.url; }
      var s = $('[data-dl-size="' + k + '"]'); if (s) s.textContent = d.size || "";
      var h = $('[data-dl-sha="' + k + '"]'); if (h) h.textContent = d.sha256 || "";
    });
    $$(".version").forEach(function (el) { el.textContent = C.version || ""; });
  }

  /* ---------- רכישה ---------- */
  var PLANS = { personal: "אישי — 199 ₪", business: "עסקי — 449 ₪", pro: "פרו — 899 ₪",
                services_personal: "חידוש שירותים — אישי, 79 ₪ לשנה", services_business: "חידוש שירותים — עסקי, 99 ₪ לשנה", services_pro: "חידוש שירותים — פרו, 199 ₪ לשנה",
                pack100: "100 קרדיטים — 19 ₪", pack500: "500 קרדיטים — 79 ₪" };
  var modal = $("#buyModal");
  function openBuy(plan) {
    if (!modal) return;
    var sel = $("#buyPlan"); if (sel && plan) sel.value = plan;
    $("#buyMsg").innerHTML = "";
    $("#buyForm").style.display = C.api ? "" : "none";
    $("#buyOffline").style.display = C.api ? "none" : "";
    modal.classList.add("on"); document.body.style.overflow = "hidden";
    var first = $("#buyEmail"); if (first && C.api) setTimeout(function () { first.focus(); }, 50);
  }
  function closeBuy() { if (!modal) return; modal.classList.remove("on"); document.body.style.overflow = ""; }
  $$("[data-buy]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); openBuy(b.getAttribute("data-buy")); }); });
  if (modal) {
    $$("[data-close]", modal).forEach(function (b) { b.addEventListener("click", closeBuy); });
    modal.addEventListener("click", function (e) { if (e.target === modal) closeBuy(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeBuy(); });
    var form = $("#buyForm");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("#buyEmail").value.trim().toLowerCase(), email2 = $("#buyEmail2").value.trim().toLowerCase();
      var phone = $("#buyPhone").value.trim(), plan = $("#buyPlan").value, provider = ($('input[name="prov"]:checked') || {}).value || "card";
      var msg = $("#buyMsg");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.innerHTML = '<div class="alert bad">כתובת המייל לא תקינה</div>'; return; }
      if (email !== email2) { msg.innerHTML = '<div class="alert bad">שתי כתובות המייל לא זהות — הרישיון נרשם על הכתובת הזו, אז חשוב שתהיה מדויקת</div>'; return; }
      msg.innerHTML = '<div class="alert ok">מעבירים לדף התשלום המאובטח…</div>';
      var btn = $("#buyGo"); btn.disabled = true;
      fetch(C.api.replace(/\/+$/, "") + "/buy", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan, email: email, phone: phone, provider: provider }) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (!x.ok || !x.j.url) throw new Error(x.j.error || "השרת לא החזיר כתובת תשלום");
          location.href = x.j.url;
        })
        .catch(function (err) { btn.disabled = false; msg.innerHTML = '<div class="alert bad">' + esc(err.message) + '</div>'; });
    });
  }

  /* ---------- יצירת קשר ---------- */
  var cf = $("#contactForm");
  if (cf) cf.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#cName").value.trim(), email = $("#cEmail").value.trim(), text = $("#cText").value.trim(), msg = $("#cMsg");
    if (!text) { msg.innerHTML = '<div class="alert bad">כתבי לנו כמה מילים</div>'; return; }
    var body = "שם: " + name + "\nמייל: " + email + "\n\n" + text;
    if (C.api) {
      fetch(C.api.replace(/\/+$/, "") + "/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name, email: email, text: text }) })
        .then(function (r) { if (!r.ok) throw new Error("x"); msg.innerHTML = '<div class="alert ok">ההודעה נשלחה. עונים בדרך כלל תוך יום עבודה.</div>'; cf.reset(); })
        .catch(function () { location.href = "mailto:" + C.email + "?subject=" + encodeURIComponent("פנייה מהאתר") + "&body=" + encodeURIComponent(body); });
    } else {
      location.href = "mailto:" + C.email + "?subject=" + encodeURIComponent("פנייה מהאתר") + "&body=" + encodeURIComponent(body);
    }
  });

  /* ---------- העתקה ---------- */
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = $(b.getAttribute("data-copy")); if (!t) return;
      navigator.clipboard.writeText(t.textContent.trim()).then(function () { b.textContent = "הועתק ✓"; setTimeout(function () { b.textContent = "העתקה"; }, 1600); });
    });
  });

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
})();
