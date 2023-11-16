import {ApplicationCommandOptionType, ChatInputCommandInteraction, Colors, EmbedBuilder} from "discord.js";
import {SuperClient} from "../SuperClient.ts";
import ProfileDatabase from "../databases/ProfileDatabase.ts";

export default {
    name: "profile",
    description: "Get a profile of a user.",
    options: [
        {
            name: "user",
            description: "User to get the profile from",
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    async execute(client: SuperClient, interaction: ChatInputCommandInteraction) {
        const user = interaction.options.getUser("user") ?? interaction.user;
        let profile = await ProfileDatabase.findOne({where: {userId: user.id}});
        if (!profile) {
            profile = await ProfileDatabase.create({
                userId: user.id,
                correctAnswers: 0,
                incorrectAnswers: 0,
                victoryCount: 0
            });
        }
        const embed = new EmbedBuilder()
            .setColor(Colors.Aqua)
            .setTitle(`${user.username}'s profile`)
            .addFields(
                [
                    {
                        name: "Correct answers",
                        value: profile.getDataValue("correctAnswers").toString(),
                        inline: true
                    },
                    {
                        name: "Incorrect answers",
                        value: profile.getDataValue("incorrectAnswers").toString(),
                        inline: true
                    },
                    {
                        name: "Victory count",
                        value: profile.getDataValue("victoryCount").toString(),
                        inline: false
                    }
                ]
            );
        await interaction.reply({embeds: [embed]});
    }
}