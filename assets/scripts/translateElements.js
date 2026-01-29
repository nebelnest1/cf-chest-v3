import {
    getCurrentLanguage,
    getTranslations,
    loadFallbackTranslation
} from "./shared-YQCKGWFY.js";
import "./shared-MD6W23H5.js";
var translateElements = async (loadFallbackTranslation2, macroses, localePath) => {
    const lang = getCurrentLanguage();
    document.documentElement.setAttribute("lang", lang);
    if (["ar", "he", "fa", "ur", "az", "ku", "ff", "dv"].includes(lang)) {
        document.documentElement.setAttribute("dir", "rtl");
    }
    const translations = await getTranslations(loadFallbackTranslation2, localePath);
    const nonTranslatedKeys = [];
    Object.entries(translations).forEach((translation) => {
        const key = translation[0];
        let value = translation[1];
        const macros = macroses == null ? void 0 : macroses[key];
        value = macros ? value.replaceAll(macros.macros, macros.macrosValue) : value;
        const elementToTranslate = document.querySelectorAll(
            `[data-translate="${key}"]`
        );
        if (elementToTranslate == null ? void 0 : elementToTranslate.length) {
            elementToTranslate.forEach((element) => {
                if (element) {
                    const useHTML = element.hasAttribute("data-translate-html");
                    if (useHTML) {
                        element.innerHTML = value;
                    } else {
                        if (!element.childNodes.length) element.textContent = value;
                        element.childNodes.forEach((node) => {
                            if (node.nodeType === Node.TEXT_NODE) {
                                node.nodeValue = value;
                            }
                        });
                    }
                }
            });
            return;
        }
        nonTranslatedKeys.push(key);
    });
    if (nonTranslatedKeys.length) {
        console.warn(
            `Some keys from locales folder weren't used for translation when loading the landing page for the first time:`,
            nonTranslatedKeys.join(", ")
        );
    }
};
var _a, _b;
translateElements(loadFallbackTranslation, {
    you_have_10_seconds_tap_to_earn: {
        macros: "{seconds}",
        macrosValue: ((_a = APP_CONFIG.secondsLeftBeforeFinal) == null ? void 0 : _a.toString()) || "10"
    },
    you_have_10_seconds: {
        macros: "{seconds}",
        macrosValue: ((_b = APP_CONFIG.secondsLeftBeforeFinal) == null ? void 0 : _b.toString()) || "10"
    }
});