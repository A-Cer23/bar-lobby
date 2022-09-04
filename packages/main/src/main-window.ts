import { BrowserWindow, screen, shell } from "electron";
import { watch } from "vue";

import type { StoreAPI } from "$/api/store";
import type { SettingsType } from "$/model/settings";

declare const __static: string;

const isProd = process.env.NODE_ENV === "production";

export class MainWindow {
    public window: BrowserWindow;

    protected settings: StoreAPI<SettingsType>;

    constructor(settings: StoreAPI<SettingsType>) {
        this.settings = settings;

        this.window = new BrowserWindow({
            title: "Beyond All Reason",
            fullscreen: this.settings.model.fullscreen.value,
            frame: true,
            show: false,
            //icon: path.join(__static, "icon.png"),
            minWidth: 1440,
            minHeight: 900,
            darkTheme: true,
            paintWhenInitiallyHidden: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                nodeIntegrationInSubFrames: true,
                nodeIntegrationInWorker: true,
                webSecurity: false,
                backgroundThrottling: false,
            },
        });

        this.window.once("ready-to-show", () => this.show());

        this.window.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: "deny" };
        });

        this.window.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
            callback({ requestHeaders: { Origin: "*", ...details.requestHeaders } });
        });

        this.window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
            const obj = { responseHeaders: { ...details.responseHeaders } };
            if (!obj.responseHeaders["Access-Control-Allow-Origin"] && !obj.responseHeaders["access-control-allow-origin"]) {
                obj.responseHeaders["Access-Control-Allow-Origin"] = ["*"];
            }
            callback(obj);
        });

        watch(this.settings.model.displayIndex, (displayIndex) => this.setDisplay(displayIndex));
        watch(this.settings.model.fullscreen, (fullscreen) => {
            this.window.setFullScreen(fullscreen);
            this.window.maximize();
        });

        this.init();
    }

    public async init() {
        // if (process.env.WEBPACK_DEV_SERVER_URL) {
        //     await this.window.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
        //     if (!process.env.IS_TEST) this.window.webContents.openDevTools();
        // } else {
        //     createProtocol("bar");
        //     await this.window.loadURL("bar://./index.html");
        //     await autoUpdater.checkForUpdatesAndNotify();
        // }
        const pageUrl =
            import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL !== undefined ? import.meta.env.VITE_DEV_SERVER_URL : new URL("../renderer/dist/index.html", "file://" + __dirname).toString();

        await this.window.loadURL(pageUrl);

        console.log(import.meta.env.DEV);
        console.log(import.meta.env.VITE_DEV_SERVER_URL);

        if (import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL !== undefined) {
            this.window.webContents.openDevTools();
        } else {
            // await autoUpdater.checkForUpdatesAndNotify({
            //     title: "BAR Lobby Updated",
            //     body: "The Beyond All Reason lobby has been updated to the latest version.",
            // });
        }
    }

    public show() {
        this.setDisplay(this.settings.model.displayIndex.value);

        this.window.setMenuBarVisibility(false);

        this.window.show();
        this.window.focus();
    }

    public setDisplay(displayIndex: number) {
        const display = screen.getAllDisplays()[displayIndex];
        if (display) {
            const { x, y, width, height } = display.bounds;
            this.window.setPosition(x, y);
            this.window.setSize(width, height);
            this.window.maximize();
            this.settings.model.displayIndex.value = displayIndex;
        }
    }
}
