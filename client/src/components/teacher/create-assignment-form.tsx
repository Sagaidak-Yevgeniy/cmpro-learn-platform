import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertAssignmentSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

// Создаем собственный тип для формы
type FormValues = {
  courseId: number;
  title: string;
  description: string;
  dueDate: string;
};

// Создаем схему валидации
const formSchema = z.object({
  courseId: z.number(),
  title: z.string().min(3, {
    message: "Название должно содержать не менее 3 символов"
  }),
  description: z.string().min(10, {
    message: "Описание должно содержать не менее 10 символов"
  }),
  dueDate: z.string().refine((date) => {
    const now = new Date();
    const dueDate = new Date(date);
    return dueDate > now;
  }, {
    message: "Срок выполнения должен быть в будущем"
  })
});

interface CreateAssignmentFormProps {
  courseId: number;
  onClose: (created: boolean) => void;
}

export default function CreateAssignmentForm({ courseId, onClose }: CreateAssignmentFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: courseId,
      title: "",
      description: "",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Дефолт: неделя вперед
    }
  });
  
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      setLoading(true);
      try {
        const res = await apiRequest("POST", "/api/assignments", {
          ...data,
          dueDate: new Date(data.dueDate) // Преобразуем строку в Date при отправке
        });
        return await res.json();
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Задание создано",
        description: "Новое задание успешно добавлено в курс",
      });
      onClose(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при создании задания",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: FormValues) => {
    createAssignmentMutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название задания</FormLabel>
              <FormControl>
                <Input placeholder="Введите название задания" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание задания</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Подробно опишите задание, требования и критерии оценки"
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Срок сдачи</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onClose(false)}>
            Отмена
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Создать задание
          </Button>
        </div>
      </form>
    </Form>
  );
}