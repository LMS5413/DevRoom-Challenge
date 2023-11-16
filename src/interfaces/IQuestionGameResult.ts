export interface IQuestionGameResult {
    userId: string;
    correctCount: number;
    incorrectCount: number;
    questionIndex: number;
    lastAnswer: string;
}