export interface MultipleChoiceQuestion {
  question: string;
  choices: string[];
  answer: 'A' | 'B' | 'C' | 'D';
}

export interface EnumerationQuestion {
  question: string;
  answer: string[];
}

export interface ExplanationQuestion {
  question: string;
  answer: string;
}

export interface QuestionSet {
  multiple_choice: MultipleChoiceQuestion[];
  enumeration: EnumerationQuestion[];
  explanation: ExplanationQuestion[];
}

export interface AIProvider {
  summarize(text: string): Promise<string>;

  generateQuestions(text: string): Promise<QuestionSet>;

  answerQuestion(question: string, context: string): Promise<string>;
}
