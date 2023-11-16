import {IQuestions} from "../interfaces/IQuestions.ts";

export async function generateQuestions(amount: number, questionsCached?: IQuestions[]): Promise<IQuestions[]> {
    const questions = (await (await fetch(`https://opentdb.com/api.php?amount=${amount}&encode=url3986`)).json() as any).results as IQuestions[];
    const questionsRepeateds = (questionsCached ?? []).filter((question) => questions.some((question2) => question.question === question2.question));
    if (questionsRepeateds.length > 0) {
        questionsCached = questions?.filter((question) => !questionsRepeateds.some((question2) => question.question === question2.question));
        await generateQuestions(questionsRepeateds.length, questionsCached);
        return questionsCached;
    }
    return questions.map((question) => ({
        question: decodeURIComponent(question.question),
        correct_answer: decodeURIComponent(question.correct_answer),
        incorrect_answers: question.incorrect_answers.map((incorrect) => decodeURIComponent(incorrect)),
        category: decodeURIComponent(question.category),
        type: decodeURIComponent(question.type),
        difficulty: decodeURIComponent(question.difficulty)
    }));
}