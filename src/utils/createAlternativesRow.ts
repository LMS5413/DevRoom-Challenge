import {ActionRowBuilder, ButtonBuilder, ButtonStyle} from "discord.js";

export function createAlternativesRow(correctAnswer: string, incorrectAnswer: string[]): ActionRowBuilder<ButtonBuilder>[] {
    const alternatives = shuffle([correctAnswer, ...incorrectAnswer]);
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (const alternative of alternatives) {
        if (!rows[rows.length - 1] || rows[rows.length - 1].components.length === 5) rows.push(new ActionRowBuilder());
        rows[rows.length - 1].addComponents(new ButtonBuilder().setCustomId(alternative).setLabel(alternative).setStyle(ButtonStyle.Primary));
    }
    return rows;
}
const shuffle = (array: any[]) => {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}
