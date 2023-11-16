import {SuperClient} from "./src/SuperClient";

const client = new SuperClient({
    intents: [
        "Guilds",
        "GuildMessages",
        "MessageContent",
        "GuildMembers"
    ]
});
client.start();