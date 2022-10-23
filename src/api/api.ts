import Database from "better-sqlite3";
import { ipcRenderer } from "electron";
import * as fs from "fs";
import { Kysely, SqliteDialect } from "kysely";
import * as path from "path";
import { createMemoryHistory, createRouter, Router } from "vue-router/auto";

import { AlertsAPI } from "@/api/alerts";
import { AudioAPI } from "@/api/audio";
import { CommsAPI } from "@/api/comms";
import { ContentAPI } from "@/api/content/content";
import { GameAPI } from "@/api/game";
import { SessionAPI } from "@/api/session";
import { StoreAPI } from "@/api/store";
import { UtilsAPI } from "@/api/utils";
import { serverConfig } from "@/config/server";
import type { Account } from "@/model/account";
import { accountSchema } from "@/model/account";
import { CacheDatabase } from "@/model/cache-database";
import type { Info } from "@/model/info";
import type { SettingsType } from "@/model/settings";
import { settingsSchema } from "@/model/settings";
import { SerializePlugin } from "@/utils/serialize-json-plugin";

interface API {
    account: StoreAPI<Account>;
    alerts: AlertsAPI;
    audio: AudioAPI;
    cacheDb: Kysely<CacheDatabase>;
    comms: CommsAPI;
    content: ContentAPI;
    game: GameAPI;
    info: Info;
    router: Router;
    session: SessionAPI;
    settings: StoreAPI<SettingsType>;
    utils: UtilsAPI;
}

declare global {
    const api: API;
    interface Window {
        api: API;
    }
}

export async function apiInit() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.api = {} as any;

    api.utils = new UtilsAPI();

    api.info = await ipcRenderer.invoke("getInfo");

    api.settings = await new StoreAPI<SettingsType>("settings", settingsSchema, true).init();

    await fs.promises.mkdir(api.info.contentPath, {
        recursive: true,
    });

    api.session = new SessionAPI();

    api.router = createRouter({
        history: createMemoryHistory(),
    });

    api.router.beforeResolve(async (to) => {
        if (!to.meta?.offline && api.session.offlineMode.value) {
            api.alerts.alert({
                type: "notification",
                severity: "error",
                content: `Cannot open ${to.path} in offline mode`,
            });
            return false;
        }
        return true;
    });

    api.cacheDb = new Kysely<CacheDatabase>({
        dialect: new SqliteDialect({
            database: new Database(path.join(api.info.configPath, "cache.db")),
        }),
        plugins: [new SerializePlugin()],
        //log: ["query", "error"],
    });

    api.audio = new AudioAPI().init();

    api.account = await new StoreAPI<Account>("account", accountSchema).init();

    api.game = new GameAPI();

    api.comms = new CommsAPI(serverConfig);

    api.content = await new ContentAPI().init();

    api.alerts = new AlertsAPI();
}
