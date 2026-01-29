var getCurrentLanguage = () => {
    const urlParams = window.location.search;
    const paramLang = new URLSearchParams(urlParams).get("lang");
    const userBrowserLang = navigator.language.split("-")[0];
    return paramLang || userBrowserLang || "en";
};
var translationsCache = {};
var localePathCache;
var getTranslations = async (loadFallbackTranslation2, localePath) => {
    const lang = getCurrentLanguage();
    if (!translationsCache[lang] || localePathCache !== localePath) {
        localePathCache = localePath;
        translationsCache[lang] = (async () => {
            try {
                const response = await fetch(
                    localePath ? `${localePath}/${lang}.json` : `./locales/${lang}.json`
                );
                return await response.json();
            } catch (error) {
                if (error instanceof Error && window.syncMetric) {
                    window.syncMetric({
                        event: "error",
                        errorMessage: error.message,
                        errorType: "CUSTOM",
                        errorSubType: "GetTranslations"
                    });
                }
                return await loadFallbackTranslation2();
            }
        })();
    }
    return translationsCache[lang];
};
var loadFallbackTranslation = async () => {
    return await import("./shared-7UHMBXNQ.js").then((m) => m.default);
};

export {
    getCurrentLanguage,
    getTranslations,
    loadFallbackTranslation
};