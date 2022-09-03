import { Database, DemoProcessor } from "bar-db";
import { app } from "electron";
import fs from "fs";
import path from "path";
import { Sequelize } from "sequelize";

import { ReplayData } from "$/model/replay";

export class ReplayManager {
    protected db?: LocalBARDatabase;
    protected replayProcessor: DemoProcessor;

    constructor(contentPath: string) {
        this.db = new LocalBARDatabase({
            host: "",
            username: "",
            password: "",
            port: 123,
            alterDbSchema: true,
            initMemoryStore: false,
            syncModel: true,
            createSchemaDiagram: false,
            logSQL: false,
        });

        const demosDir = path.join(contentPath, "demos");
        this.replayProcessor = new CustomDemoProcessor(this.db, demosDir);
    }

    public async init() {
        await this.db?.init();

        return this;
    }

    public async saveReplay(replayData: ReplayData) {
        //
    }
}

class LocalBARDatabase extends Database {
    protected override async initDatabase() {
        this.sequelize = new Sequelize({
            dialect: "sqlite",
            storage: path.join(app.getPath("userData"), "store", "replays.db"),
            logging: this.config.logSQL ? console.log : false,
        });

        try {
            await this.sequelize.authenticate();
            console.log("Database connection has been established successfully.");
        } catch (error) {
            console.log("Unable to connect to the database:", error);
            throw error;
        }
    }
}

class CustomDemoProcessor extends DemoProcessor {
    protected processedDemos: string[] = [];

    constructor(db: LocalBARDatabase, demoDir: string) {
        super({
            db,
            dir: demoDir,
            fileExt: [".sdfz"],
        });
    }

    public override async init() {
        const processedDemos = await this.db.schema.demo.findAll();

        const demos = await fs.promises.readdir(this.config.dir);
        //this.processedDemos = await
    }

    public override async processFiles() {
        //
    }
}
