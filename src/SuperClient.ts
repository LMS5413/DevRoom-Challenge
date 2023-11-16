import {Client, ClientOptions, Collection} from "discord.js";
import {readdirSync} from "fs";
import {join} from "path/posix";
import {ICommands} from "./interfaces/ICommands.ts";
import {IEvent} from "./interfaces/IEvent.ts";
import {Sequelize} from "sequelize";

export class SuperClient extends Client {

    private commands = new Collection<string, ICommands>();
    public static database: Sequelize;

    constructor(options: ClientOptions) {
        super(options);
    }

    start() {
        this.connectDatabase();
        this.loadEvents();
        this.on("ready", () => this.loadCommands());
        this.login(process.env.TOKEN);
    }

    private async loadEvents() {
        const files = readdirSync(join(__dirname, "events"));
        for (const file of files) {
            const event = (await import((join(__dirname, "events", file)))).default as IEvent;
            this.on(event.name, event.run.bind(null, this));
        }
    }

    private async loadCommands() {
        const files = readdirSync(join(__dirname, "commands"));
        for (const file of files) {
            const command = (await require((join(__dirname, "commands", file)))).default as ICommands;
            this.commands.set(command.name, command);
            await this.application!!.commands.create({
                name: command.name,
                description: command.description,
                options: command.options
            });
        }
        this.on("interactionCreate", (interaction) => {
            if (!interaction.isChatInputCommand()) return;
            const command = this.commands.get(interaction.commandName);
            if (!command) return;
            command.execute(this, interaction);
        });
    }

    private connectDatabase() {
        SuperClient.database = new Sequelize({
            dialect: "mysql",
            database: process.env.MYSQL_DATABASE,
            username: process.env.MYSQL_USERNAME,
            password: process.env.MYSQL_PASSWORD,
            host: process.env.MYSQL_HOST,
            port: parseInt(process.env.MYSQL_PORT ?? "3306"),
            logging: false,
            define: {
                timestamps: false
            }
        });
    }
}