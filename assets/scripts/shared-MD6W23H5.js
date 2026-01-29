var ERROR_STANDART_TYPE = ((ERROR_STANDART_TYPE2) => {
    ERROR_STANDART_TYPE2["Error"] = "Error";
    ERROR_STANDART_TYPE2["RangeError"] = "RangeError";
    ERROR_STANDART_TYPE2["ReferenceError"] = "ReferenceError";
    ERROR_STANDART_TYPE2["SecurityError"] = "SecurityError";
    ERROR_STANDART_TYPE2["SyntaxError"] = "SyntaxError";
    ERROR_STANDART_TYPE2["TypeError"] = "TypeError";
    ERROR_STANDART_TYPE2["Unknown"] = "Unknown";
    return ERROR_STANDART_TYPE2;
})(ERROR_STANDART_TYPE || {});
var ERROR_UNHANDLEDREJECTION_TYPE = ((ERROR_UNHANDLEDREJECTION_TYPE2) => {
    ERROR_UNHANDLEDREJECTION_TYPE2["rejectionhandled"] = "rejectionhandled";
    ERROR_UNHANDLEDREJECTION_TYPE2["unhandledrejection"] = "unhandledrejection";
    return ERROR_UNHANDLEDREJECTION_TYPE2;
})(ERROR_UNHANDLEDREJECTION_TYPE || {});
var setErrorSyncMetrics = () => {
    const syncMetric = window.syncMetric;
    if (!syncMetric) {
        console.log("Sync metric is not initialized");
        return;
    }
    const handleError = (err) => {
        if (err.filename.includes("extension")) {
            return;
        }
        const errorMessage = `errorMessage: ${err.message}, lineNumber: ${err.lineno}, columnNumber: ${err.colno}, file: ${err.filename}`;
        const errorSubType = err.error.name && Object.values(ERROR_STANDART_TYPE).includes(err.error.name) ? err.error.name : "Unknown";
        syncMetric({
            event: "error",
            errorMessage,
            errorSubType,
            errorType: "JS"
        });
    };
    const handleRejection = (e) => {
        var _a, _b, _c;
        if (typeof e.reason === "object" && ((_b = (_a = e.reason) == null ? void 0 : _a.stack) == null ? void 0 : _b.includes("extension"))) {
            return;
        }
        const errorMessage = typeof e.reason === "object" && ((_c = e.reason) == null ? void 0 : _c.message) ? e.reason.message : JSON.stringify(e.reason);
        const errorType = e.type;
        const errorSubType = Object.values(ERROR_UNHANDLEDREJECTION_TYPE).includes(errorType) ? errorType : "Unknown";
        syncMetric({
            event: "unhandledRejection",
            errorMessage,
            errorSubType,
            errorType: "JS"
        });
    };
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
};
setErrorSyncMetrics();