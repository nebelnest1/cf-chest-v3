/* common.js — FULL MONOLITHIC VERSION (Back-Fix + Clone + Multi-Exit) [BACK FIXED] */

(() => {
  "use strict";

  const safe = (fn) => { try { return fn(); } catch { return undefined; } };

  const replaceTo = (url) => {
    try { window.location.replace(url); } catch { window.location.href = url; }
  };

  const openTab = (url) => {
    try {
      const w = window.open(url, "_blank");
      if (w) { try { w.opener = null; } catch {} }
      return w || null;
    } catch { return null; }
  };

  const curUrl = new URL(window.location.href);
  const getSP = (k, def = "") => curUrl.searchParams.get(k) ?? def;
  const CLONE_PARAM = "__cl";
  const isClone = getSP(CLONE_PARAM) === "1";

  // ---------------------------
  // Tracking params
  // ---------------------------
  const IN = {
    pz: getSP("pz"), tb: getSP("tb"), tb_reverse: getSP("tb_reverse"), ae: getSP("ae"),
    z: getSP("z"), var: getSP("var"), var_1: getSP("var_1"), var_2: getSP("var_2"), var_3: getSP("var_3"),
    b: getSP("b"), campaignid: getSP("campaignid"), abtest: getSP("abtest"), rhd: getSP("rhd", "1"),
    s: getSP("s"), ymid: getSP("ymid"), wua: getSP("wua"), cid: getSP("cid"), geo: getSP("geo"),
  };

  const qsFromObj = (obj) => {
    const qs = new URLSearchParams();
    Object.entries(obj || {}).forEach(([k, v]) => {
      if (v != null && String(v) !== "") qs.set(k, String(v));
    });
    return qs;
  };

  const getTimezoneName = () => safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone) || "";
  const getTimezoneOffset = () => safe(() => new Date().getTimezoneOffset()) ?? 0;

  const buildCmeta = () => {
    try {
      const html = document.documentElement;
      const payload = {
        dataVer: html.getAttribute("data-version") || html.dataset.version || "",
        landingName: html.getAttribute("data-landing-name") || html.dataset.landingName || "",
      };
      return btoa(JSON.stringify(payload));
    } catch { return ""; }
  };

  // ---------------------------
  // Config Normalizer
  // ---------------------------
  const normalizeConfig = (appCfg) => {
    if (!appCfg || typeof appCfg !== "object" || !appCfg.domain) return null;
    const cfg = { domain: appCfg.domain };
    const ensure = (name) => (cfg[name] ||= {});

    Object.entries(appCfg).forEach(([k, v]) => {
      if (v == null || v === "" || k === "domain") return;

      let m = k.match(/^([a-zA-Z0-9]+)_(currentTab|newTab)_(zoneId|url)$/);
      if (m) {
        const [, name, tab, field] = m;
        const ex = ensure(name);
        (ex[tab] ||= {}).domain = field === "zoneId" ? cfg.domain : ex[tab].domain;
        ex[tab][field] = v;
        return;
      }

      m = k.match(/^([a-zA-Z0-9]+)_(count|timeToRedirect|pageUrl)$/);
      if (m) { ensure(m[1])[m[2]] = v; return; }

      m = k.match(/^([a-zA-Z0-9]+)_(zoneId|url)$/);
      if (m) {
        const [, name, field] = m;
        const ex = ensure(name);
        const tab = (name === "tabUnderClick") ? "newTab" : "currentTab";
        (ex[tab] ||= {}).domain = field === "zoneId" ? cfg.domain : ex[tab].domain;
        ex[tab][field] = v;
      }
    });

    return cfg;
  };

  // ---------------------------
  // URL Builders
  // ---------------------------
  const buildExitQSFast = ({ zoneId }) => {
    const base = {
      ymid: IN.var_1 || IN.var || "", var: IN.var_2 || IN.z || "", var_3: IN.var_3 || "",
      b: IN.b || "", campaignid: IN.campaignid || "", click_id: IN.s || "", rhd: IN.rhd || "1",
      btz: getTimezoneName(), bto: String(getTimezoneOffset()),
      cmeta: buildCmeta(), pz: IN.pz || "", tb: IN.tb || "", tb_reverse: IN.tb_reverse || "",
      ae: IN.ae || "",
    };
    if (zoneId != null && String(zoneId) !== "") base.zoneid = String(zoneId);
    return qsFromObj(base);
  };

  const generateAfuUrlFast = (zoneId, domain) => {
    const host = String(domain || "").trim();
    if (!host) return "";
    const base = host.startsWith("http") ? host : `https://${host}`;
    const url = new URL(base.replace(/\/+$/, "") + "/afu.php");
    url.search = buildExitQSFast({ zoneId }).toString();
    return url.toString();
  };

  // ---------------------------
  // BACK (FIXED)
  // ---------------------------

  // One-shot guard: avoid inflating history by multiple initBack calls
  let __backInited = false;

  // Prevent re-entrant firing when forcing load
  let __backFiring = false;

  const pushBackStates = (url, count) => {
    try {
      const n = Math.max(0, parseInt(count, 10) || 0);
      const originalUrl = window.location.href;

      for (let i = 0; i < n; i++) {
        window.history.pushState({ __isBack: true }, "Please wait...", url);
      }
      window.history.pushState(null, document.title, originalUrl);
    } catch {}
  };

  // Same idea as your v10: compute default back.html in the same directory
  const getDefaultBackHtmlUrl = () => {
    const { origin, pathname } = window.location;
    let dir = pathname.replace(/\/(index|back)\.html$/i, "");
    if (dir.endsWith("/")) dir = dir.slice(0, -1);
    if (!dir) return `${origin}/back.html`;
    return `${origin}${dir}/back.html`;
  };

  const initBackFast = (cfg) => {
    if (__backInited) return;
    const b = cfg?.back?.currentTab;
    if (!b) return;

    __backInited = true;

    const count = cfg.back?.count ?? 10;
    const pageUrl = cfg.back?.pageUrl || getDefaultBackHtmlUrl();

    // Build back page absolute URL relative to current page (safe for absolute/relative)
    const page = new URL(pageUrl, window.location.href);

    const qs = buildExitQSFast({ zoneId: b.zoneId });
    if (b.url) qs.set("url", String(b.url));
    else {
      qs.set("z", String(b.zoneId));
      qs.set("domain", String(b.domain || cfg.domain || ""));
    }
    page.search = qs.toString();

    pushBackStates(page.toString(), count);
  };

  // Critical piece: pushState does NOT load back.html; force-load it on popstate back step
  window.addEventListener("popstate", (e) => {
    if (e?.state && e.state.__isBack && !__backFiring) {
      __backFiring = true;
      // At this moment address bar already contains back.html?... -> force actual navigation
      replaceTo(window.location.href);
    }
  });

  // ---------------------------
  // Exits
  // ---------------------------
  const resolveUrlFast = (ex, cfg) => {
    if (!ex) return "";
    if (ex.url) return String(ex.url);
    if (ex.zoneId && (ex.domain || cfg?.domain)) return generateAfuUrlFast(ex.zoneId, ex.domain || cfg.domain);
    return "";
  };

  const runExitDualTabsFast = (cfg, name, withBack = true) => {
    const ex = cfg?.[name];
    if (!ex) return;
    const ctUrl = resolveUrlFast(ex.currentTab, cfg);
    const ntUrl = resolveUrlFast(ex.newTab, cfg);

    if (withBack) initBackFast(cfg);
    if (ntUrl) openTab(ntUrl);
    if (ctUrl) { setTimeout(() => replaceTo(ctUrl), 40); }
  };

  const runExitCurrentTabFast = (cfg, name, withBack = true) => {
    const ex = cfg?.[name]?.currentTab;
    if (!ex) return;
    const url = resolveUrlFast(ex, cfg);
    if (!url) return;
    if (withBack) { initBackFast(cfg); setTimeout(() => replaceTo(url), 40); }
    else { replaceTo(url); }
  };

  const run = (cfg, name) => {
    if (cfg?.[name]?.newTab) return runExitDualTabsFast(cfg, name, true);
    return runExitCurrentTabFast(cfg, name, true);
  };

  // ---------------------------
  // Reverse / Autoexit
  // ---------------------------
  const initReverse = (cfg) => {
    if (!cfg?.reverse?.currentTab) return;
    safe(() => window.history.pushState({ __rev: 1 }, "", window.location.href));
    window.addEventListener("popstate", (e) => {
      // Do not hijack back stack steps
      if (e?.state && e.state.__isBack) return;
      runExitCurrentTabFast(cfg, "reverse", false);
    });
  };

  const initAutoexit = (cfg) => {
    if (!cfg?.autoexit?.currentTab) return;
    const sec = parseInt(cfg.autoexit.timeToRedirect, 10) || 90;
    let armed = false;
    const trigger = () => { if (document.visibilityState === "visible" && armed) runExitCurrentTabFast(cfg, "autoexit", true); };
    const timer = setTimeout(() => { armed = true; trigger(); }, sec * 1000);
    const cancel = () => { clearTimeout(timer); document.removeEventListener("visibilitychange", trigger); };
    document.addEventListener("visibilitychange", trigger);
    ["mousemove", "click", "scroll"].forEach(ev => document.addEventListener(ev, cancel, { once: true }));
  };

  // ---------------------------
  // Clone / Micro handoff
  // ---------------------------
  const buildCloneUrl = () => {
    const u = new URL(window.location.href);
    u.searchParams.set(CLONE_PARAM, "1");
    return u.toString();
  };

  const runMicroHandoff = (cfg) => {
    if (isClone) { run(cfg, "mainExit"); return; }
    openTab(buildCloneUrl());
    const ex = cfg?.tabUnderClick?.newTab || cfg?.tabUnderClick?.currentTab;
    const monetUrl = resolveUrlFast(ex, cfg);
    if (monetUrl) {
      initBackFast(cfg);
      setTimeout(() => replaceTo(monetUrl), 40);
    } else {
      run(cfg, "mainExit");
    }
  };

  // ---------------------------
  // Click map
  // ---------------------------
  const initClickMap = (cfg) => {
    let fired = false;
    const microTargets = new Set(["chest_play", "chest_lost", "banner_close", "modal_stay"]);

    document.addEventListener("click", (e) => {
      const t = e.target?.closest?.("[data-target]")?.getAttribute("data-target") || "";

      // If this is clone, ensure back is armed (one-shot)
      if (isClone) initBackFast(cfg);

      if (isClone) {
        if (fired) return; fired = true;
        e.preventDefault(); e.stopPropagation();
        run(cfg, "mainExit"); return;
      }

      if (microTargets.has(t)) {
        e.preventDefault(); e.stopPropagation();
        runMicroHandoff(cfg); return;
      }

      if (fired) return; fired = true;
      e.preventDefault();
      run(cfg, "mainExit");
    }, true);
  };

  // ---------------------------
  // Boot
  // ---------------------------
  const boot = () => {
    if (typeof window.APP_CONFIG === "undefined") return;
    const cfg = normalizeConfig(window.APP_CONFIG);
    if (!cfg) return;

    window.LANDING_EXITS = { cfg, run: (name) => run(cfg, name) };

    // Optional: warm-up only once; safe due to one-shot guard
    const warmUp = () => { initBackFast(cfg); };
    ["touchstart", "mousedown", "scroll"].forEach(ev => window.addEventListener(ev, warmUp, { once: true }));

    initClickMap(cfg);
    initAutoexit(cfg);
    initReverse(cfg);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
