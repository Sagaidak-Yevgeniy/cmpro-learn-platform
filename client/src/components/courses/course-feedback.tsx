import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CourseFeedback as CourseFeedbackType, insertCourseFeedbackSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { Star, StarIcon, MessageSquare, MessageSquarePlus } from "lucide-react";

// Расширяем схему с дополнительной валидацией
const feedbackFormSchema = insertCourseFeedbackSchema.extend({
  content: z.string().min(10, "Отзыв должен содержать минимум 10 символов").max(500, "Отзыв не должен превышать 500 символов"),
  rating: z.number().min(1, "Оценка должна быть минимум 1").max(5, "Оценка не должна превышать 5")
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

interface CourseReviewsProps {
  courseId: number;
  isEnrolled?: boolean;
}

const CourseFeedback: React.FC<CourseReviewsProps> = ({ courseId, isEnrolled = false }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Получение отзывов к курсу
  const { data: feedbacks, isLoading: feedbacksLoading } = useQuery<CourseFeedbackType[]>({
    queryKey: [`/api/courses/${courseId}/feedbacks`],
    enabled: !!courseId,
  });

  // Получение отзыва пользователя к курсу (если есть)
  const { data: userFeedback } = useQuery<CourseFeedbackType>({
    queryKey: [`/api/courses/${courseId}/feedbacks/my`],
    enabled: !!user && !!courseId && isEnrolled,
  });

  // Настройка формы с react-hook-form и zod
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      courseId,
      content: userFeedback?.content || "",
      rating: userFeedback?.rating || 5,
    },
  });

  // Мутация для добавления/обновления отзыва
  const feedbackMutation = useMutation({
    mutationFn: async (values: FeedbackFormValues) => {
      if (userFeedback) {
        // Обновление существующего отзыва
        const res = await apiRequest("PATCH", `/api/feedbacks/${userFeedback.id}`, values);
        return await res.json();
      } else {
        // Создание нового отзыва
        const res = await apiRequest("POST", "/api/feedbacks", values);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/feedbacks`] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/feedbacks/my`] });
      toast({
        title: userFeedback ? "Отзыв обновлен" : "Отзыв добавлен",
        description: userFeedback ? "Ваш отзыв был успешно обновлен" : "Ваш отзыв был успешно добавлен",
      });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось ${userFeedback ? "обновить" : "добавить"} отзыв: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Обработчик отправки формы
  const onSubmit = (values: FeedbackFormValues) => {
    feedbackMutation.mutate(values);
  };

  if (feedbacksLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Star className="h-6 w-6 mr-2 text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground">Загрузка отзывов...</p>
      </div>
    );
  }

  // Функция для отображения звезд рейтинга
  const RatingStars = ({ rating }: { rating: number | null }) => {
    if (rating === null) return null;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };
  
  // Компонент диалогового окна для добавления/редактирования отзыва
  const FeedbackDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          onClick={() => form.reset({ 
            courseId, 
            content: userFeedback?.content || "", 
            rating: userFeedback?.rating || 5 
          })}
          variant="outline"
          className="gap-2"
        >
          {userFeedback ? (
            <>
              <MessageSquare className="h-4 w-4" />
              Редактировать отзыв
            </>
          ) : (
            <>
              <MessageSquarePlus className="h-4 w-4" />
              Оставить отзыв
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{userFeedback ? "Редактировать отзыв" : "Оставить отзыв о курсе"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Оценка</FormLabel>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        type="button"
                        variant="ghost"
                        className="p-0 h-8 w-8"
                        onClick={() => field.onChange(star)}
                      >
                        <Star 
                          className={`h-6 w-6 ${
                            field.value >= star ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                          }`}
                        />
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ваш отзыв</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Поделитесь своим мнением о курсе..." 
                      className="resize-none min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Осталось символов: {500 - field.value.length}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button 
                type="submit" 
                disabled={feedbackMutation.isPending}
              >
                {feedbackMutation.isPending ? (
                  <>
                    <span className="mr-2">Сохранение</span>
                    <Star className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  "Сохранить отзыв"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium flex items-center gap-2">
          <Star className="h-5 w-5" /> 
          Отзывы о курсе ({feedbacks?.length || 0})
        </h3>
        
        {isEnrolled && user && (
          <FeedbackDialog />
        )}
      </div>

      {feedbacks && feedbacks.length > 0 ? (
        <div className="grid gap-4">
          {feedbacks.map((feedback) => (
            <Card key={feedback.id} className={feedback.userId === user?.id ? "border-primary/20" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-medium">
                      {feedback.userId === user?.id ? "Ваш отзыв" : `Студент #${feedback.userId}`}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(feedback.createdAt), "dd.MM.yyyy")}
                    </CardDescription>
                  </div>
                  <RatingStars rating={feedback.rating} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{feedback.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <p className="text-center text-muted-foreground mb-2">
              У этого курса пока нет отзывов.
            </p>
            {isEnrolled && user && (
              <p className="text-center text-sm">
                Будьте первым, кто оставит отзыв!
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseFeedback;