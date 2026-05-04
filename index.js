
```javascript
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

const client = new Anthropic();

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

async function generateQuizQuestion(): Promise<QuizQuestion> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a general knowledge quiz question in JSON format with the following structure:
{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "The correct option text",
  "explanation": "A brief explanation of the correct answer"
}

Make sure the question is interesting and educational. Return ONLY the JSON object.`,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse quiz question");
  }

  return JSON.parse(jsonMatch[0]) as QuizQuestion;
}

function createreadline() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function askQuestion(
  rl: readline.Interface,
  question: string
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function main() {
  console.log("\n🎯 Welcome to the General Knowledge Quiz!\n");
  console.log(
    "Answer questions to test your knowledge and earn points.\n"
  );

  const rl = createreadline();

  try {
    const numQuestionsStr = await askQuestion(
      rl,
      "How many questions would you like to answer? (1-10): "
    );
    let numQuestions = parseInt(numQuestionsStr);

    if (isNaN(numQuestions) || numQuestions < 1 || numQuestions > 10) {
      numQuestions = 5;
      console.log("Invalid input. Setting to 5 questions.\n");
    }

    let score = 0;
    const questionResults: Array<{
      question: string;
      userAnswer: string;
      correct: boolean;
      explanation: string;
    }> = [];

    for (let i = 0; i < numQuestions; i++) {
      console.log(`\n📝 Question ${i + 1} of ${numQuestions}`);
      console.log("Generating question...\n");

      const quizQuestion = await generateQuizQuestion();

      console.log(`❓ ${quizQuestion.question}\n`);
      quizQuestion.options.forEach((option, index) => {
        console.log(`${String.fromCharCode(97 + index)}) ${option}`);
      });

      const userInput = await askQuestion(rl, "\nYour answer (a/b/c/d): ");

      const answerMap: { [key: string]: number } = {
        a: 0,
        b: 1,
        c: 2,
        d: 3,
      };

      let selectedOption = "";
      if (answerMap[userInput] !== undefined) {
        selectedOption = quizQuestion.options[answerMap[userInput]];
      }

      const isCorrect =
        selectedOption.toLowerCase() ===
        quizQuestion.correctAnswer.toLowerCase();

      if (isCorrect) {
        score++;
        console.log("✅ Correct!");
      } else {
        console.log(`❌ Incorrect. The correct answer was: ${quizQuestion.correctAnswer}`);
      }

      console.log(`📚 ${quizQuestion.explanation}`);

      questionResults.push({
        question: quizQuestion.question,
        userAnswer: selectedOption || "No answer",
        correct: isCorrect,
        explanation: quizQuestion.explanation,
      });
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 QUIZ RESULTS");
    console.log("=".repeat(50));
    console.log(`Total Questions: ${numQuestions}`);
    console.log(`Correct Answers: ${score}`);
    console.log(`Incorrect Answers: ${numQuestions - score}`);
    console.log(
      `Score: ${Math.round((score / numQuestions) * 100)}% (${score}/${numQuestions})`
    );

    if (score === numQuestions) {
      console.log("🏆 Perfect Score! You're a knowledge master!");
    } else if (score >= numQuestions * 0.8) {
      console.log("🥇 Excellent! You scored very well!");
    } else if (score >= numQuestions * 0.6) {
      console.log("🥈 Good job! Keep practicing!");
    } else if (score >= numQuestions * 0.4) {
      console.log("🥉 Not bad, but there's room for improvement!");
    } else {
      console.log("💪 Keep learning! Every attempt makes you smarter!");
    }

    console.log("\n" + "=".repeat(50));
    console.log("DETAILED RESULTS");
    console.log("=".repeat(50));
    questionResults.forEach((result, index) => {
      console.log(`\nQuestion ${index + 1}: ${result.question}`);
      console.log(`Your answer: ${result.userAnswer}`);
      console.log(
        `Result: ${result.correct ? "✅ Correct" : "❌ Incorrect"}`
      );
      console.log(`Explanation