import { defaultBoxes, defaultMapBoxes } from "@/config/default-boxes";
import { AbstractBattle } from "$/model/battle/abstract-battle";
import { Bot, StartBox, StartPosType } from "$/model/battle/types";
import { User } from "$/model/user";

export class OfflineBattle extends AbstractBattle {
    public leave() {
        api.session.offlineBattle.value = null;
        api.session.onlineUser.battleStatus.battleId = -1;
        api.router.replace("/home");
    }

    public start() {
        api.game.launch(this);
    }

    public setEngine(engineVersion: string) {
        this.battleOptions.engineVersion = engineVersion;
    }

    public setGame(gameVersion: string) {
        this.battleOptions.gameVersion = gameVersion;
    }

    public setMap(map: string) {
        this.battleOptions.map = map;

        const boxes = defaultMapBoxes()[map] ?? defaultBoxes().NorthVsSouth;

        this.setStartBoxes(boxes);
    }

    public setStartPosType(startPosType: StartPosType) {
        this.battleOptions.startPosType = startPosType;
    }

    public setStartBoxes(startBoxes: StartBox[]) {
        this.battleOptions.startBoxes = startBoxes;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public setGameOptions(options: Record<string, any>) {
        this.battleOptions.gameOptions = options;
    }

    public addBot(bot: Bot) {
        this.bots.push(bot);
        this.fixIds();
    }

    public removeBot(bot: Bot) {
        this.bots.splice(this.bots.indexOf(bot), 1);
        this.fixIds();
    }

    public playerToSpectator(player: User) {
        player.battleStatus.isSpectator = true;
        this.fixIds();
    }

    public spectatorToPlayer(spectator: User, teamId: number) {
        spectator.battleStatus.isSpectator = false;
        spectator.battleStatus.teamId = teamId;
        this.fixIds();
    }

    public setContenderTeam(contender: User | Bot, teamId: number) {
        if ("userId" in contender) {
            contender.battleStatus.teamId = teamId;
        } else {
            contender.teamId = teamId;
        }
        this.fixIds();
    }

    public setBotOptions(botName: string, options: Record<string, unknown>) {
        const bot = this.getParticipantByName(botName) as Bot;
        bot.aiOptions = options;
    }

    protected fixIds() {
        const contenders = this.contenders.value;

        const playerIds = Array.from(new Set(contenders.map((c) => ("userId" in c ? c.battleStatus.playerId : c.playerId))).values()).sort();
        const teamIds = Array.from(new Set(contenders.map((c) => ("userId" in c ? c.battleStatus.teamId : c.teamId))).values()).sort();
        for (const contender of contenders) {
            const newPlayerId = playerIds.indexOf("userId" in contender ? contender.battleStatus.playerId : contender.playerId);
            "userId" in contender ? (contender.battleStatus.playerId = newPlayerId) : (contender.playerId = newPlayerId);

            const newTeamId = teamIds.indexOf("userId" in contender ? contender.battleStatus.teamId : contender.teamId);
            "userId" in contender ? (contender.battleStatus.teamId = newTeamId) : (contender.teamId = newTeamId);
        }
    }

    // protected setBoxes(mapFileName: string) {
    //     if (this.battleOptions.startPosType === StartPosType.Boxes) {
    //         const boxes: StartBox[] | undefined = clone(defaultMapBoxes()[mapFileName]);
    //         if (boxes) {
    //             this.battleOptions.startBoxes[0] = boxes[0];
    //             this.battleOptions.startBoxes[1] = boxes[1];
    //         } else {
    //             this.battleOptions.startBoxes[0] = { xPercent: 0, yPercent: 0, widthPercent: 0.25, heightPercent: 1 };
    //             this.battleOptions.startBoxes[1] = { xPercent: 0.75, yPercent: 0, widthPercent: 0.25, heightPercent: 1 };
    //         }
    //     }
    // }

    // protected configureTeams(teamPreset: TeamPreset) {
    //     if (teamPreset === TeamPreset.Standard) {
    //         this.teams.length = 2;
    //         this.battleOptions.startPosType = StartPosType.Boxes;
    //     } else if (teamPreset === TeamPreset.FFA) {
    //         this.teams.length = this.participants.length;
    //         this.battleOptions.startPosType = StartPosType.Fixed; // TODO: should be random?
    //     } else if (teamPreset === TeamPreset.TeamFFA) {
    //         this.battleOptions.startPosType = StartPosType.Fixed;
    //     }
    // }
}
