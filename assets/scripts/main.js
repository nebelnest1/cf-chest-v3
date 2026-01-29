import {
    makeExit
} from "./shared-HVIKRAJP.js";
import {
    parseConfig
} from "./shared-JTAB4EAH.js";
import {
    getTranslations,
    loadFallbackTranslation
} from "./shared-YQCKGWFY.js";
import "./shared-MD6W23H5.js";
var CURRENT_QUESTION_KEY = "step";

function removeUrlParameter(paramKey) {
    const url = window.location.href;
    const r = new URL(url);
    r.searchParams.delete(paramKey);
    const newUrl = r.href;
    window.history.replaceState(window.history.state, "", newUrl);
}
var getCurrentStepFromURL = (key = CURRENT_QUESTION_KEY, shouldDeleteKey = true) => {
    const url = new URL(window.location.href);
    const step = url.searchParams.get(key);
    if (shouldDeleteKey) removeUrlParameter(key);
    return step;
};
var tabUnderClick = async (config, newTabParamValue, key = CURRENT_QUESTION_KEY) => {
    const newTab = new URL(window.location.href);
    newTab.searchParams.append(key, newTabParamValue.toString());
    makeExit({
            ...config,
            tabUnderClick: {
                ...config.tabUnderClick,
                newTab: {
                    url: newTab.toString()
                }
            }
        },
        "tabUnderClick"
    );
};
(() => {
    const config = parseConfig(APP_CONFIG);
    console.log("CONFIG:", config);
    if (!config) return;
    const BONUS_MIN = 499;
    const BONUS_MAX = 9999;
    const HIDE_IMAGE_HAND_CLICK_COUNT = 2;
    const GAME_CLICKER_TIME = APP_CONFIG.secondsLeftBeforeFinal || 10;
    const GAME_CLICKER_TIME_FINAL = 90;
    const TIMEOUT = 1e3;
    const URL_PARAMS = {
        step: "step"
    };
    const classNameBlur = "blur";
    const classNameGame = "game";
    const classNameGameFinalScreen = "game-final-screen";
    const classNameGameMainBonusContainer = "game__main__bonus-container";
    const classNameGameMainBonusValue = "game__main__bonus-value";
    const classNameGameMainImage = "game__main__image";
    const classNameGameMainImageHand = "game__main__image-hand";
    const classNameGameMainImageRotate1 = "game__main__image-rotate-1";
    const classNameGameMainImageRotate2 = "game__main__image-rotate-2";
    const classNameGameProgress = "game__progress";
    const classNameGameProgressBar = "game__progress__bar";
    const classNameGameProgressValue = "game__progress__value";
    const classNameGameHeaderProgressValue = "game__progress__value-header";
    const classNameGameHeaderText = "game__header__text";
    const classNameHidden = "hidden";
    const classNameModal = "modal";
    const classNameModalWindowButton = "modal__window__button";
    const classNameVisible = "visible";
    let elGame;
    let elGameFinalScreen;
    let elGameFinalScreenTimer;
    let elGameMainBonusContainer;
    let elGameMainImage;
    let elGameMainImageHand;
    let elGameProgress;
    let elGameProgressBar;
    let elGameProgressValue;
    let elModalWindow;
    let elModalWindowButton;
    let elGameHeaderProgressValue;

    function show(el) {
        if (el) {
            el.classList.remove(classNameHidden);
            el.classList.add(classNameVisible);
        }
    }

    function hide(el) {
        if (el) {
            el.classList.remove(classNameVisible);
            el.classList.add(classNameHidden);
        }
    }

    function parseTime(time) {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor(time / 60) % 60;
        const seconds = time % 60;
        const pad = (n) => n.toString().padStart(2, "0");
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    function setText(el, text) {
        if (el) {
            el.innerText = text;
        }
    }
    async function updateTranslationWithParams(element, key, params) {
        if (!element) return;
        const translations = await getTranslations(loadFallbackTranslation);
        let value = translations[key];
        Object.entries(params).forEach(([paramKey, paramValue]) => {
            value = value.replace(new RegExp(`{${paramKey}}`, "g"), paramValue.toString());
        });
        element.textContent = value;
    }

    function gameClickerTimer(onTimeOut) {
        let time = 0;
        setText(elGameProgressValue, `${GAME_CLICKER_TIME - time}`);
        const INTERVAL_ID = setInterval(() => {
            time += 1;
            if (time === GAME_CLICKER_TIME + 1) {
                clearInterval(INTERVAL_ID);
                onTimeOut();
            } else {
                const remainingTime = GAME_CLICKER_TIME - time;
                setText(elGameProgressValue, `${remainingTime}`);
                updateTranslationWithParams(
                    elGameHeaderProgressValue,
                    (elGameHeaderProgressValue == null ? void 0 : elGameHeaderProgressValue.getAttribute("data-translate")) || "", {
                        seconds: remainingTime
                    }
                );
                if (elGameProgressBar) {
                    elGameProgressBar.style.width = `${time / GAME_CLICKER_TIME * 100}%`;
                }
            }
        }, TIMEOUT);
    }

    function finalScreen() {
        show(elGameFinalScreen);
        let timeLeft = GAME_CLICKER_TIME_FINAL;
        const updateTimer = () => {
            updateTranslationWithParams(
                elGameFinalScreenTimer,
                (elGameFinalScreenTimer == null ? void 0 : elGameFinalScreenTimer.getAttribute("data-translate")) || "", {
                    final_seconds: parseTime(timeLeft)
                }
            );
            if (timeLeft > 0) {
                timeLeft--;
                setTimeout(updateTimer, TIMEOUT);
            }
        };
        updateTimer();
        document.addEventListener("click", () => {
            makeExit(config, "mainExit");
        });
    }

    function gameClickerRotateMainImage() {
        if (elGameMainImage == null ? void 0 : elGameMainImage.classList.contains(classNameGameMainImageRotate1)) {
            elGameMainImage.classList.remove(classNameGameMainImageRotate1);
            elGameMainImage.classList.add(classNameGameMainImageRotate2);
        } else if (elGameMainImage == null ? void 0 : elGameMainImage.classList.contains(classNameGameMainImageRotate2)) {
            elGameMainImage.classList.remove(classNameGameMainImageRotate2);
            elGameMainImage.classList.add(classNameGameMainImageRotate1);
        } else if (elGameMainImage) {
            elGameMainImage.classList.add(classNameGameMainImageRotate1);
        }
    }

    function gameClickerGenerateBonus() {
        const randomValue = `+${getRandomInt(BONUS_MIN, BONUS_MAX)}`;
        if (elGameMainBonusContainer) {
            const el = document.createElement("div");
            el.classList.add(classNameGameMainBonusValue);
            el.innerText = randomValue;
            el.style.left = `${getRandomInt(0, 90)}%`;
            el.style.top = `${getRandomInt(0, 90)}%`;
            elGameMainBonusContainer.append(el);
        }
    }
    const removeModalAndBlur = () => {
        hide(elModalWindow);
        if (elGame) {
            elGame.classList.remove(classNameBlur);
        }
    };
    const startGame = () => {
        document.removeEventListener("click", startGame);
        show(elGameProgress);
        let clickCount = 0;

        function gameClickerOnClick() {
            clickCount += 1;
            if (clickCount === HIDE_IMAGE_HAND_CLICK_COUNT) {
                hide(elGameMainImageHand);
            }
            gameClickerRotateMainImage();
            gameClickerGenerateBonus();
        }
        gameClickerTimer(() => {
            document.removeEventListener("click", gameClickerOnClick);
            finalScreen();
        });
        document.addEventListener("click", gameClickerOnClick);
    };

    function gameClickerStart() {
        removeModalAndBlur();
        document.addEventListener("click", startGame);
    }

    function onModalWindowClose(e) {
        e.preventDefault();
        if (elModalWindowButton) {
            elModalWindowButton.removeEventListener("click", onModalWindowClose);
        }
        tabUnderClick(config, URL_PARAMS.step);
    }

    function init() {
        elGame = document.querySelector(`.${classNameGame}`);
        elGameFinalScreen = document.querySelector(`.${classNameGameFinalScreen}`);
        elGameFinalScreenTimer = document.querySelector(`.${classNameGameHeaderText}`);
        elGameMainBonusContainer = document.querySelector(`.${classNameGameMainBonusContainer}`);
        elGameMainImage = document.querySelector(`.${classNameGameMainImage}`);
        elGameMainImageHand = document.querySelector(`.${classNameGameMainImageHand}`);
        elGameProgress = document.querySelector(`.${classNameGameProgress}`);
        elGameProgressBar = document.querySelector(`.${classNameGameProgressBar}`);
        elGameProgressValue = document.querySelector(`.${classNameGameProgressValue}`);
        elModalWindow = document.querySelector(`.${classNameModal}`);
        elModalWindowButton = document.querySelector(`.${classNameModalWindowButton}`);
        elGameHeaderProgressValue = document.querySelector(`.${classNameGameHeaderProgressValue}`);
        const stepGame = getCurrentStepFromURL();
        if (stepGame === URL_PARAMS.step) {
            gameClickerStart();
        } else if (elModalWindowButton) {
            elModalWindowButton.addEventListener("click", onModalWindowClose);
        }
    }
    init();
})();