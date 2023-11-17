import {ICommands} from "../interfaces/ICommands.ts";
import {
    ActionRowBuilder,
    ApplicationCommandOptionType, ButtonBuilder,
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    ComponentType, ButtonStyle, ActionRow, ButtonComponent, ButtonInteraction
} from "discord.js";
import {SuperClient} from "../SuperClient.ts";
import {generateQuestions} from "../utils/generateQuestions.ts";
import {IQuestionGameResult} from "../interfaces/IQuestionGameResult.ts";
import {createAlternativesRow} from "../utils/createAlternativesRow.ts";
import ProfileDatabase from "../databases/ProfileDatabase.ts";

export default {
    name: "questions",
    description: "Questions command",
    options: [
        {
            name: "questions",
            description: "Amount of questions to be asked",
            type: ApplicationCommandOptionType.Integer,
            max_value: 200,
            min_value: 5,
            required: false
        },
        {
            name: "seconds",
            description: "Seconds to answer questions",
            type: ApplicationCommandOptionType.Integer,
            required: false
        }
    ],
    async execute(client: SuperClient, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({fetchReply: true});
        const questions = await generateQuestions(interaction.options.getInteger("questions") ?? 5);
        var answers = 0;
        let participants: IQuestionGameResult[] = [];
        
        const timeMiliseconds = (interaction.options.getInteger("seconds") ?? 30) * 1000;

        const embed = new EmbedBuilder()
            .setTitle("Questions")
            .setDescription(`${questions[answers].question} \n \nPlayers has <t:${~~((Date.now() + (timeMiliseconds)) / 1000)}:R> seconds to answer this question.`)
            .setColor(Colors.Aqua)
            .setFooter({text: `Question ${answers + 1}/${questions.length}`});
        const rows = createAlternativesRow(questions[answers].correct_answer, questions[answers].incorrect_answers);
        let message = await interaction.editReply({embeds: [embed], components: rows});
        let collector = message.createMessageComponentCollector({
            time: timeMiliseconds, componentType: ComponentType.Button
        });

        collector.on("collect", async (button) => addQuestion(button));
        collector.on("end", async (collected, reason) => endGame(collected, reason));

        const addQuestion = (button: ButtonInteraction) => {
            const participant = participants.find((participant) => participant.userId === button.user.id);
            const isCorrect = button.customId === questions[answers].correct_answer;
            if (!participant) {
                participants.push({
                    userId: button.user.id,
                    correctCount: isCorrect ? 1 : 0,
                    incorrectCount: !isCorrect ? 1 : 0,
                    questionIndex: answers,
                    lastAnswer: button.customId
                });
                button.reply({content: "You answered the question!", ephemeral: true})
                return;
            }
            if (participant.questionIndex === answers) {
                button.reply({content: "You already answered this question!", ephemeral: true});
                return;
            }
            if (isCorrect) participant.correctCount++;
            else participant.incorrectCount++;
            participant.lastAnswer = button.customId;
            participant.questionIndex = answers;
            participants[participants.findIndex((participant) => participant.userId === button.user.id)] = participant;
            button.reply({content: "You answered the question!", ephemeral: true})
        }
        const endGame = async (collected: any, reason: string) => {
            if (reason === "end_game") {
                const maxCorrectPoint = participants.reduce((a, b) => a.correctCount > b.correctCount ? a : b).correctCount;
                const winners = participants.filter((x) => x.correctCount === maxCorrectPoint);

                embed.setDescription("Game ended!");
                embed.setDescription(`The game ended! Here are the results:\n \n${participants
                    .sort((a, b) => b.correctCount - a.correctCount)
                    .map((participant, index) => `**${index + 1}°** <@${participant.userId}>: ${participant.correctCount} correct answers.`)
                    .join("\n") ?? "No one answered correctly."}`
                );
                embed.setFooter(null);
                await message.edit({embeds: [embed], components: []});
                for (const participant of participants) {
                    const profile = await ProfileDatabase.findOne({where: {userId: participant.userId}});
                    const pointVictorySum = winners.some((x) => x.userId === participant.userId) ? 1 : 0;

                    if (!profile) {
                        await ProfileDatabase.create({
                            userId: participant.userId,
                            correctAnswers: participant.correctCount,
                            incorrectAnswers: participant.incorrectCount,
                            victoryCount: pointVictorySum
                        });
                        continue;
                    }
                    await profile.update({
                        correctAnswers: profile.getDataValue("correctAnswers") + participant.correctCount,
                        incorrectAnswers: profile.getDataValue("incorrectAnswers") + participant.incorrectCount,
                        victoryCount: profile.getDataValue("victoryCount") + pointVictorySum
                    });
                }
                collector.stop("stopped");
                return;
            }
            if (reason === "time") {
                const usersAnswered = participants.filter((x) => x.questionIndex === answers);
                if (!usersAnswered.find(x => participants.some((x2) => x2.userId === x.userId))) {
                    const usersNotAnswered = participants.filter((x) => !usersAnswered.some((x2) => x2.userId === x.userId));
                    for (const user of usersNotAnswered) {
                        user.incorrectCount++;
                        participants[participants.findIndex((x) => x.userId === user.userId)] = user;
                    }
                }

                const correctAnswered = usersAnswered.filter((x) => x.lastAnswer === questions[answers].correct_answer);
                const incorrectAnswered = usersAnswered.filter((x) => x.lastAnswer !== questions[answers].correct_answer);

                let rows = message.components.map((x) => ActionRowBuilder.from(x as any) as ActionRowBuilder<ButtonBuilder>);
                for (const row of rows) {
                    for (const component of row.components) {
                        component.setDisabled(true);
                        component.setStyle(component.data.label === questions[answers].correct_answer ? ButtonStyle.Success : ButtonStyle.Danger)
                    }
                }
                embed.setDescription("Time's up!");
                embed.setDescription(`The time's up! Here are the results:\n \n**Question:** ${questions[answers].question}\n \n**Correct answers:** ${correctAnswered.length > 0 ? correctAnswered.map((x) => `<@${x.userId}>`).join(", ") : "No one answered correctly."}\n**Incorrect answers:** ${incorrectAnswered.length > 0 ? incorrectAnswered.map((x) => `<@${x.userId}>`).join(", ") : "No one answered incorrectly."} \n \nStarting the next question in 5 seconds...`);
                embed.setFooter(null);
                await message.edit({embeds: [embed], components: rows});
                answers++;
                setTimeout(async () => {
                    if (answers === questions.length) {
                        collector.stop("end_game");
                        collector.emit("end", collected, "end_game");
                        return;
                    }
                    collector = message.createMessageComponentCollector({
                        time: timeMiliseconds, componentType: ComponentType.Button
                    });

                    collector.on("collect", async (button) => addQuestion(button));
                    collector.on("end", async (collected, reason) => endGame(collected, reason));

                    const embed = new EmbedBuilder()
                        .setTitle("Questions")
                        .setDescription(`${questions[answers].question} \n \nPlayers has <t:${~~((Date.now() + (timeMiliseconds)) / 1000)}:R> seconds to answer this question.`)
                        .setColor(Colors.Aqua)
                        .setFooter({text: `Question ${answers + 1}/${questions.length}`});
                    const rows = createAlternativesRow(questions[answers].correct_answer, questions[answers].incorrect_answers);
                    message = await message.edit({embeds: [embed], components: rows});
                }, 5000);
                return;
            }
        }
    }
} as ICommands