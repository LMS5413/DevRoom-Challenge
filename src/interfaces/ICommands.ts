import {ApplicationCommandOptionData, ChatInputCommandInteraction, PermissionFlags} from "discord.js";
import {SuperClient} from "../SuperClient.ts";

export interface ICommands {
    name: string;
    description: string;
    options?: ApplicationCommandOptionData[];
    permission?: PermissionFlags | PermissionFlags[];
    execute(client: SuperClient, interaction: ChatInputCommandInteraction): void;
}