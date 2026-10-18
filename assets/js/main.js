/* =========================================================
   王鹏飞 · 个人网站交互
   原生 JS，无依赖
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(pointer: fine)");

  /* ---------- 年份 ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- 滚动进场 ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* 兜底：极少数环境里 IntersectionObserver 不会及时回调，
     这里按元素位置补一次，保证首屏内容不会一直隐身。 */
  function markVisibleReveals() {
    var vh = window.innerHeight || 0;
    revealEls.forEach(function (el) {
      if (el.classList.contains("is-in")) return;
      var rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.94 && rect.bottom > 0) el.classList.add("is-in");
    });
  }

  var revealTicking = false;
  function requestRevealCheck() {
    if (revealTicking) return;
    revealTicking = true;
    window.requestAnimationFrame(function () {
      markVisibleReveals();
      revealTicking = false;
    });
  }

  window.setTimeout(markVisibleReveals, 80);
  window.addEventListener("scroll", requestRevealCheck, { passive: true });
  window.addEventListener("resize", requestRevealCheck);
  window.addEventListener("load", requestRevealCheck);

  /* ---------- 顶部进度条 / 导航阴影 ---------- */
  var header = document.getElementById("siteHeader");
  var progressBar = document.getElementById("progressBar");
  var scrollTicking = false;

  function updateScrollUI() {
    var y = window.scrollY || window.pageYOffset || 0;
    var max = root.scrollHeight - window.innerHeight;

    if (progressBar) {
      progressBar.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    }
    if (header) {
      header.classList.toggle("is-scrolled", y > 8);
    }
    scrollTicking = false;
  }

  window.addEventListener("scroll", function () {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollUI);
  }, { passive: true });

  window.addEventListener("resize", updateScrollUI);
  updateScrollUI();

  /* ---------- 导航高亮 ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("#siteNav a"));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute("href")); })
    .filter(Boolean);

  function setActiveNav(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActiveNav(entry.target.id);
      });
    }, { rootMargin: "-42% 0px -52% 0px", threshold: 0 });

    sections.forEach(function (section) { navObserver.observe(section); });
  }

  /* ---------- 移动端菜单 ---------- */
  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");
  var navLabel = navToggle ? navToggle.querySelector(".nav-toggle-label") : null;

  function setNav(open) {
    if (!navToggle) return;
    body.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    if (navLabel) navLabel.textContent = open ? "关闭" : "菜单";

    if (open && siteNav) {
      var firstLink = siteNav.querySelector("a");
      if (firstLink) firstLink.focus({ preventScroll: true });
    }
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      setNav(!body.classList.contains("nav-open"));
    });
  }

  if (siteNav) {
    siteNav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setNav(false);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (body.classList.contains("nav-open")) {
      setNav(false);
      if (navToggle) navToggle.focus();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 880 && body.classList.contains("nav-open")) setNav(false);
  });

  /* ---------- 复制邮箱 ---------- */
  var EMAIL = "wangpengfei@example.com";
  var toast = document.getElementById("toast");
  var toastTimer = 0;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  function legacyCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(area);
    if (!ok) throw new Error("copy-failed");
  }

  function copyEmail() {
    var task;
    if (navigator.clipboard && window.isSecureContext) {
      task = navigator.clipboard.writeText(EMAIL);
    } else {
      task = new Promise(function (resolve, reject) {
        try { legacyCopy(EMAIL); resolve(); } catch (err) { reject(err); }
      });
    }
    task.then(function () {
      showToast("邮箱已复制：" + EMAIL);
    }).catch(function () {
      showToast("复制失败，请手动选择邮箱地址");
    });
  }

  document.querySelectorAll("[data-copy-email]").forEach(function (button) {
    button.addEventListener("click", copyEmail);
  });

  /* ---------- 杭州时间 ---------- */
  var localTimeEl = document.getElementById("localTime");
  var contactTimeEl = document.getElementById("contactTime");
  var timeFull = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  });
  var timeShort = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false
  });

  function tickClock() {
    var now = new Date();
    if (localTimeEl) localTimeEl.textContent = timeFull.format(now);
    if (contactTimeEl) contactTimeEl.textContent = timeShort.format(now);
  }

  if (localTimeEl || contactTimeEl) {
    tickClock();
    window.setInterval(tickClock, 1000);
  }

  /* ---------- 卡片轻微倾斜 ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    document.querySelectorAll("[data-tilt-wrap]").forEach(function (wrap) {
      var target = wrap.querySelector("[data-tilt]");
      if (!target) return;

      var frame = 0;

      wrap.addEventListener("pointermove", function (event) {
        var rect = wrap.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var px = (event.clientX - rect.left) / rect.width - 0.5;
        var py = (event.clientY - rect.top) / rect.height - 0.5;

        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(function () {
          target.style.setProperty("--ry", (px * 9).toFixed(2) + "deg");
          target.style.setProperty("--rx", (-py * 7).toFixed(2) + "deg");
        });
      });

      function resetTilt() {
        window.cancelAnimationFrame(frame);
        target.style.setProperty("--ry", "0deg");
        target.style.setProperty("--rx", "0deg");
      }

      wrap.addEventListener("pointerleave", resetTilt);
      wrap.addEventListener("pointercancel", resetTilt);
    });
  }
})();
