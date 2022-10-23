import "primevue/resources/primevue.min.css";
import "flag-icons/css/flag-icons.min.css";
import "primeicons/primeicons.css";
import "@/assets/styles/styles.scss";

import PrimeVue from "primevue/config";
import Tooltip from "primevue/tooltip";
import type { TransitionProps } from "vue";
import { createApp } from "vue";
import { createI18n } from "vue-i18n";

import { apiInit } from "@/api/api";
import App from "@/App.vue";
import { clickAwayDirective } from "@/utils/click-away-directive";

declare module "vue-router/auto" {
    interface RouteMeta {
        title?: string;
        order?: number;
        offline?: boolean;
        empty?: boolean;
        blurBg?: boolean;
        transition?: TransitionProps;
    }
}

(async () => {
    await apiInit();

    await setupVue();

    api.router.replace("/");

    window.addEventListener("keydown", (event) => {
        if (event.code === "F11") {
            event.preventDefault();
            api.settings.model.fullscreen.value = !api.settings.model.fullscreen.value;
        }
    });

    window.addEventListener("beforeunload", async (event) => {
        console.debug("beforeunload", event);
        event.preventDefault();
        if (api.comms.isConnected.value) {
            //await api.comms.request("c.auth.disconnect", {});
            api.comms.disconnect();
        }
        return event;
    });
})();

const myLocale = Intl.DateTimeFormat().resolvedOptions().locale.split("-")[0];

const localeFiles = require.context("@/assets/language", true, /\.json$/).keys();
const messages: Record<string, Record<string, string>> = {};
for (const key of localeFiles) {
    const fileLocale = key.split("/")[1].split(".")[0];
    messages[fileLocale] = require(`@/assets/language/${fileLocale}.json`);
}

const i18n = createI18n({
    locale: myLocale,
    fallbackLocale: "en",
    messages,
    legacy: false,
});

async function setupVue() {
    const app = createApp(App);

    app.use(api.router);
    app.use(PrimeVue);
    app.use(i18n);

    app.directive("click-away", clickAwayDirective);
    app.directive("tooltip", Tooltip);

    app.mount("#app");

    if (process.env.NODE_ENV !== "production") {
        app.config.globalProperties.window = window;
    }
}
