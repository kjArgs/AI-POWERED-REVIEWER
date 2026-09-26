export interface Question {
  question: string;
  choices: string[];
  answer: string;
}

export interface AIProvider {
  summarize(text: string): Promise<string>;

  generateQuestions(text: string): Promise<Question[]>;

  answerQuestion(question: string, context: string): Promise<string>;
}
