/**
 * ISL Learning Quiz Component
 * Quick assessments after watching a sign lesson
 * Types: identify, match, multiple_choice, camera_task
 */
import { useState, useRef, useEffect } from "react";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QuizQuestion } from "@/types";

interface QuizProps {
  questions: QuizQuestion[];
  title?: string;
  onComplete?: (score: number, totalQuestions: number) => void;
  autoAdvance?: boolean;
}

interface AnswerState {
  questionIndex: number;
  selectedAnswer: string | null;
  isAnswered: boolean;
  isCorrect: boolean | null;
}

export function Quiz({
  questions,
  title = "Quick Check",
  onComplete,
  autoAdvance = true,
}: QuizProps) {
  const [state, setState] = useState<AnswerState>({
    questionIndex: 0,
    selectedAnswer: null,
    isAnswered: false,
    isCorrect: null,
  });
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!questions || questions.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No quiz questions available for this lesson.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[state.questionIndex];
  const isLastQuestion = state.questionIndex === questions.length - 1;
  const progress = Math.round(
    ((state.questionIndex + 1) / questions.length) * 100,
  );

  const handleSelectAnswer = (answer: string) => {
    if (state.isAnswered) return; // Already answered

    const isCorrect = answer === currentQuestion.answer;
    setState({
      ...state,
      selectedAnswer: answer,
      isAnswered: true,
      isCorrect,
    });

    if (isCorrect) {
      setScore(score + 1);
    }

    // Auto-advance after 2 seconds
    if (autoAdvance) {
      autoAdvanceTimer.current = setTimeout(() => {
        if (isLastQuestion) {
          setIsComplete(true);
          onComplete?.(isCorrect ? score + 1 : score, questions.length);
        } else {
          handleNextQuestion();
        }
      }, 2000);
    }
  };

  const handleNextQuestion = () => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }

    if (isLastQuestion) {
      setIsComplete(true);
      onComplete?.(score, questions.length);
    } else {
      setState({
        questionIndex: state.questionIndex + 1,
        selectedAnswer: null,
        isAnswered: false,
        isCorrect: null,
      });
    }
  };

  const handleRestart = () => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    setState({
      questionIndex: 0,
      selectedAnswer: null,
      isAnswered: false,
      isCorrect: null,
    });
    setScore(0);
    setIsComplete(false);
  };

  // Quiz Complete Screen
  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-lg">{title} — Complete!</CardTitle>
            <Badge variant={passed ? "default" : "secondary"}>
              {percentage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Result Animation */}
          <div className="flex flex-col items-center justify-center py-6">
            <div
              className={`relative h-20 w-20 rounded-full flex items-center justify-center mb-4 ${
                passed
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-yellow-100 dark:bg-yellow-900"
              }`}
            >
              {passed ? (
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-300" />
              ) : (
                <XCircle className="h-12 w-12 text-yellow-600 dark:text-yellow-300" />
              )}
            </div>

            <h3 className="text-2xl font-bold text-center mb-2">
              {passed ? "Excellent! 🎉" : "Good effort! 💪"}
            </h3>

            <p className="text-center text-muted-foreground mb-4">
              You scored {score} out of {questions.length} correct
            </p>

            {!passed && (
              <p className="text-sm text-center text-muted-foreground px-4">
                Watch the sign video again carefully and try to understand each movement,
                then you can retake the quiz.
              </p>
            )}
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-green-100/50 dark:bg-green-900/30 p-3 text-center">
              <p className="text-sm text-muted-foreground">Correct</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {score}
              </p>
            </div>
            <div className="rounded-lg bg-red-100/50 dark:bg-red-900/30 p-3 text-center">
              <p className="text-sm text-muted-foreground">Incorrect</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {questions.length - score}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleRestart} variant="outline" className="flex-1">
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake Quiz
            </Button>
            {passed && (
              <Button className="flex-1">Continue Learning →</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Quiz Question Screen
  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-base">
            {title} — Question {state.questionIndex + 1}/{questions.length}
          </CardTitle>
          <span className="text-xs font-medium text-muted-foreground">
            {progress}%
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-teal-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Question */}
        <div>
          <h3 className="font-semibold text-foreground leading-relaxed mb-1">
            {currentQuestion.prompt}
          </h3>
          {currentQuestion.hint && !state.isAnswered && (
            <p className="text-sm text-muted-foreground italic">
              💡 Hint: {currentQuestion.hint}
            </p>
          )}
        </div>

        {/* Answer Options */}
        <div className="space-y-2">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = state.selectedAnswer === option;
            const isCorrectAnswer = option === currentQuestion.answer;
            let buttonClasses =
              "w-full text-left justify-start p-3 h-auto font-normal transition-all";

            if (state.isAnswered) {
              if (isCorrectAnswer) {
                buttonClasses +=
                  " bg-green-100/50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100";
              } else if (isSelected && !state.isCorrect) {
                buttonClasses +=
                  " bg-red-100/50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100";
              } else {
                buttonClasses +=
                  " opacity-60 bg-muted/50 border-transparent";
              }
            } else {
              buttonClasses +=
                "bg-muted/50 border-muted hover:border-primary hover:bg-primary/5";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(option)}
                disabled={state.isAnswered}
                className={`border rounded-lg ${buttonClasses}`}
              >
                <div className="flex items-center gap-3 w-full">
                  <div
                    className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      state.isAnswered && isCorrectAnswer
                        ? "border-green-600 bg-green-600"
                        : state.isAnswered && isSelected && !state.isCorrect
                          ? "border-red-600 bg-red-600"
                          : "border-muted-foreground"
                    }`}
                  >
                    {state.isAnswered && isCorrectAnswer && (
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    )}
                    {state.isAnswered && isSelected && !state.isCorrect && (
                      <XCircle className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm leading-relaxed">{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {state.isAnswered && (
          <div
            className={`rounded-lg p-3 ${
              state.isCorrect
                ? "bg-green-100/50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                : "bg-blue-100/50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                state.isCorrect
                  ? "text-green-800 dark:text-green-200"
                  : "text-blue-800 dark:text-blue-200"
              }`}
            >
              {state.isCorrect
                ? "✓ Correct! Well done."
                : "Watch the sign video again and try once more."}
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        {state.isAnswered && (
          <Button
            onClick={handleNextQuestion}
            className="w-full"
            variant={state.isCorrect ? "default" : "outline"}
          >
            {isLastQuestion ? "See Results" : "Next Question"} →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
