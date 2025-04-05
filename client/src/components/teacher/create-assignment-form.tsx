import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Схема формы для создания задания
const createAssignmentSchema = z.object({
  title: z.string().min(5, { message: "Название должно содержать минимум 5 символов" }),
  description: z.string().min(20, { message: "Описание должно содержать минимум 20 символов" }),
  dueDate: z.date({ required_error: "Выберите дату сдачи задания" })
    .refine(date => date > new Date(), {
      message: "Дата сдачи должна быть в будущем"
    }),
});

type CreateAssignmentFormValues = z.infer<typeof createAssignmentSchema>;

interface CreateAssignmentFormProps {
  courseId: number;
  onSuccess?: () => void;
}

export default function CreateAssignmentForm({ courseId, onSuccess }: CreateAssignmentFormProps) {
  const { toast } = useToast();
  
  // Инициализация формы
  const form = useForm<CreateAssignmentFormValues>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14)), // По умолчанию 2 недели на выполнение
    },
  });
  
  // Мутация для создания задания
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: CreateAssignmentFormValues) => {
      // Преобразуем дату в строку ISO для корректной передачи на сервер
      const formattedData = {
        ...data,
        dueDate: data.dueDate.toISOString(),
        courseId,
      };
      
      const res = await apiRequest("POST", "/api/assignments", formattedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Задание успешно создано",
        description: "Студенты смогут приступить к его выполнению",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при создании задания",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Обработчик отправки формы
  const onSubmit = (values: CreateAssignmentFormValues) => {
    createAssignmentMutation.mutate(values);
  };

  return (
    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
        Создание нового задания
      </h3>
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
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Срок сдачи</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd MMMM yyyy", { locale: ru })
                        ) : (
                          <span>Выберите дату</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Выберите дату, до которой студенты должны выполнить задание
                </FormDescription>
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
                    rows={5} 
                    placeholder="Подробно опишите, что должны сделать студенты, критерии оценки и требования к работе"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Минимум 20 символов. Чем подробнее описание, тем лучше результат.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createAssignmentMutation.isPending}
            >
              {createAssignmentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Создать задание
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}