
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
}

export default function TestConstructor({ courseId }: { courseId: number }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addQuestion = () => {
    setQuestions([...questions, { text: "", options: ["", ""], correctAnswer: 0 }]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push("");
    setQuestions(newQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    setQuestions(newQuestions);
  };

  const createTestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/courses/${courseId}/tests`, { questions });
      if (!res.ok) {
        throw new Error("Ошибка при создании теста");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Тест успешно создан" });
      setQuestions([]);
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/tests`] });
    },
    onError: () => {
      toast({ 
        title: "Ошибка при создании теста",
        variant: "destructive"
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Конструктор тестов</h2>
        <Button onClick={addQuestion}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить вопрос
        </Button>
      </div>

      {questions.map((question, qIndex) => (
        <div key={qIndex} className="border rounded-lg p-4 space-y-4">
          <Textarea
            value={question.text}
            onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
            placeholder="Текст вопроса"
          />
          
          <div className="space-y-2">
            {question.options.map((option, oIndex) => (
              <div key={oIndex} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => {
                    const newQuestions = [...questions];
                    newQuestions[qIndex].options[oIndex] = e.target.value;
                    setQuestions(newQuestions);
                  }}
                  placeholder={`Вариант ${oIndex + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(qIndex, oIndex)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => addOption(qIndex)}>
              Добавить вариант
            </Button>
            <select
              className="border rounded px-2"
              value={question.correctAnswer}
              onChange={(e) => updateQuestion(qIndex, "correctAnswer", parseInt(e.target.value))}
            >
              {question.options.map((_, index) => (
                <option key={index} value={index}>
                  Правильный ответ: {index + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {questions.length > 0 && (
        <Button 
          onClick={() => createTestMutation.mutate()} 
          disabled={createTestMutation.isPending}
        >
          {createTestMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Создать тест
        </Button>
      )}
    </div>
  );
}
