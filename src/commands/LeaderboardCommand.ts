import {ChatInputCommandInteraction, Colors, EmbedBuilder} from "discord.js";
import {SuperClient} from "../SuperClient.ts";
import ProfileDatabase from "../databases/ProfileDatabase.ts";

export default {
    name: "leaderboard",
    description: "Get top 10 leaderboard of correct answers.",
    async execute(client: SuperClient, interaction: ChatInputCommandInteraction) {
        const profiles = await ProfileDatabase.findAll({order: [["correctAnswers", "DESC"]], limit: 10});
        const embed = new EmbedBuilder()
            .setColor(Colors.Aqua)
            .setTitle("Leaderboard - Top 10 correct answers")
            .setDescription(
                profiles.filter(x => x.getDataValue("correctAnswers") > 0).map((profile, index) => {
                    return `${index + 1}. <@${profile.getDataValue("userId")}> - ${profile.getDataValue("correctAnswers")}`;
                }).join("\n") || "No one has answered correctly yet."
            );
        await interaction.reply({embeds: [embed]});
    }
}