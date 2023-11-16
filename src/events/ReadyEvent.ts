import {EventHandler} from "../handler/EventHandler.ts";

export default new EventHandler("ready", async (client) => {
    console.log(`The bot ${client.user?.username} is ready!`);
})