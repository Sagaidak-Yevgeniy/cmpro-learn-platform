import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const feedbackSchema = z.object({
  content: z.string().min(5, "Отзыв должен содержать минимум 5 символов").max(500, "Максимальная длина отзыва - 500 символов"),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

interface CourseFeedbackProps {
  courseId: number;
  courseName: string;
}

export default function CourseFeedback({ courseId, courseName }: CourseFeedbackProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      content: "",
    },
  });
  
  const feedbackMutation = useMutation({
    mutationFn: async (values: FeedbackFormValues) => {
      const res = await apiRequest("POST", `/api/courses/${courseId}/feedback`, {
        ...values,
        courseId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/feedback`] });
      setOpen(false);
      form.reset();
      toast({
        title: "Отзыв отправлен",
        description: "Спасибо за ваш отзыв о курсе!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при отправке отзыва",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: FeedbackFormValues) => {
    feedbackMutation.mutate(values);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="ml-2">
          <MessageCircle className="h-4 w-4 mr-1" />
          Оставить отзыв
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Отзыв о курсе "{courseName}"</DialogTitle>
          <DialogDescription>
            Поделитесь своим мнением о курсе. Ваш отзыв поможет нам улучшить качество обучения.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ваш отзыв</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Поделитесь своими впечатлениями о курсе..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit"
                disabled={feedbackMutation.isPending}
              >
                {feedbackMutation.isPending ? "Отправка..." : "Отправить отзыв"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}