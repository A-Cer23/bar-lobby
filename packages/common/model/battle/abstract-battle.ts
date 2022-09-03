import { useNow } from "@vueuse/core";
import { formatDuration } from "date-fns";
import { groupBy } from "jaz-ts-utils";
import { computed, ComputedRef, reactive, shallowReactive, watch } from "vue";

import { BattleOptions, Bot, StartBox, StartPosType } from "$/model/battle/types";
import { MapData } from "$/model/map-data";
import { User } from "$/model/user";

export interface BattleConfig {
    battleOptions: BattleOptions;
    bots: Bot[];
    users: User[];
}

export abstract class AbstractBattle {
    public readonly battleOptions: BattleOptions;
    public readonly bots: Bot[];
    public readonly users: User[];

    // helpers
    public readonly participants: ComputedRef<Array<User | Bot>>;
    public readonly contenders: ComputedRef<Array<User | Bot>>;
    public readonly players: ComputedRef<Array<User>>;
    public readonly spectators: ComputedRef<Array<User>>;
    public readonly teams: ComputedRef<Map<number, Array<User | Bot>>>;
    public readonly founder: ComputedRef<User>;
    public readonly friendlyRuntime: ComputedRef<string | null>;
    public readonly map: ComputedRef<MapData | null>;

    constructor(config: BattleConfig) {
        this.battleOptions = reactive(config.battleOptions);
        this.bots = shallowReactive(config.bots);
        this.users = shallowReactive(config.users);

        this.participants = computed(() => [...this.bots, ...this.users]);
        this.contenders = computed(() => this.participants.value.filter((participant) => ("userId" in participant ? !participant.battleStatus.isSpectator : true)));
        this.players = computed(() => this.users.filter((user) => !user.battleStatus.isSpectator));
        this.spectators = computed(() => this.users.filter((user) => user.battleStatus.isSpectator));
        this.teams = computed(() => {
            const teams = groupBy(this.contenders.value, (player) => ("userId" in player ? player.battleStatus.teamId : player.teamId));
            const sortedTeams = new Map([...teams.entries()].sort());
            return sortedTeams;
        });
        this.founder = computed(() => api.session.getUserById(this.battleOptions.founderId)!);
        this.friendlyRuntime = computed(() => {
            if (!this.battleOptions.startTime) {
                return null;
            }
            const ms = useNow({ interval: 1000 }).value.getTime() - this.battleOptions.startTime.getTime();
            const runtimeDate = new Date(ms);
            const hours = runtimeDate.getHours() - 1;
            const minutes = runtimeDate.getMinutes();
            const seconds = runtimeDate.getSeconds();
            return `Running for ${formatDuration({ hours, minutes, seconds })}`;
        });
        this.map = computed(() => api.content.maps.getMapByScriptName(this.battleOptions.map));
    }

    public getTeamParticipants(teamId: number): Array<User | Bot> {
        return this.contenders.value.filter((contender) => ("userId" in contender ? contender.battleStatus.teamId === teamId : contender.teamId === teamId));
    }

    public getParticipantByName(name: string): User | Bot | undefined {
        return this.participants.value.find((participant) => {
            const isBot = !("userId" in participant);
            if (isBot) {
                if (participant.name === name) {
                    return true;
                }
            } else {
                if (api.session.getUserById(participant.userId)?.username === name) {
                    return true;
                }
            }
            return false;
        });
    }

    public open() {
        watch(
            () => this.battleOptions.engineVersion,
            (engineVersion) => {
                api.content.engine.downloadEngine(engineVersion);
            },
            {
                immediate: true,
            }
        );

        watch(
            () => this.battleOptions.gameVersion,
            (gameVersion) => {
                // TODO: when prd supports it, dl specific game version here
                api.content.game.updateGame();
            },
            {
                immediate: true,
            }
        );

        watch(
            () => this.battleOptions.map,
            (mapScriptName) => {
                api.content.maps.installMapByScriptName(mapScriptName);
            },
            {
                immediate: true,
            }
        );
    }

    public abstract leave(): void;
    public abstract start(): void;
    public abstract setMap(map: string): void;
    public abstract setGame(gameVersion: string): void;
    public abstract setEngine(engineVersion: string): void;
    public abstract setStartPosType(startPosType: StartPosType): void;
    public abstract setStartBoxes(startBoxes: StartBox[]): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public abstract setGameOptions(options: Record<string, any>): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public abstract setBotOptions(botName: string, options: Record<string, any>): void;
    public abstract addBot(bot: Bot): void;
    public abstract removeBot(bot: Bot): void;
    public abstract playerToSpectator(player: User): void;
    public abstract spectatorToPlayer(spectator: User, teamId: number): void;
    public abstract setContenderTeam(contender: User | Bot, teamId: number): void;
}
