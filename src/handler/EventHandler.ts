import {ClientEvents} from "discord.js";
import {SuperClient} from "../SuperClient.ts";

export class EventHandler<Key extends keyof ClientEvents> {
    constructor(
        public name: Key,
        public run: (client: SuperClient, ...args: ClientEvents[Key]) => any
    ) {}
}