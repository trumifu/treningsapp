// Registrerer appens service worker
// Dette gjør at appen kan fungere offline og installeres som PWA.

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./service-worker.js")
            .then(() => {
                console.log("PWA: Service worker registrert.");
            })
            .catch(error => {
                console.error("PWA: Kunne ikke registrere service worker:", error);
            });
    });
}