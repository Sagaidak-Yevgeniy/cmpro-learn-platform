import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, Loader2, X, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Схема формы для создания курса
const createCourseSchema = z.object({
  title: z.string().min(5, { message: "Название должно содержать минимум 5 символов" }),
  description: z.string().min(20, { message: "Описание должно содержать минимум 20 символов" }),
  category: z.string().min(1, { message: "Выберите категорию курса" }),
  duration: z.string().min(1, { message: "Укажите длительность курса" }),
  startDate: z.date({ required_error: "Выберите дату начала курса" }),
  endDate: z.date({ required_error: "Выберите дату окончания курса" }),
  imageUrl: z.string().nullable(),
  imageFile: z.any().nullable(), // Added imageFile to the schema
  isActive: z.boolean().default(true),
});

// Валидация дат
const formSchema = createCourseSchema.refine(
  (data) => data.startDate < data.endDate,
  {
    message: "Дата окончания должна быть позже даты начала",
    path: ["endDate"],
  }
);

type CreateCourseFormValues = z.infer<typeof formSchema>;

interface CreateCourseFormProps {
  onSuccess?: (data: CreateCourseFormValues & { imageFile?: File }) => void;
}

export default function CreateCourseForm({ onSuccess }: CreateCourseFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Added state for selected file


  // Инициализация формы
  const form = useForm<CreateCourseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      duration: "",
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      imageUrl: null,
      imageFile: null, // Added default value for imageFile
      isActive: true,
    },
  });

  // Мутация для создания курса
  const createCourseMutation = useMutation({
    mutationFn: async (data: CreateCourseFormValues) => {
      console.log("Данные формы для создания курса:", data);

      // Проверяем, что все обязательные поля заполнены
      if (!data.title || !data.description || !data.category || !data.duration || !data.startDate || !data.endDate) {
        throw new Error("Заполните все обязательные поля");
      }

      // Преобразуем даты в строку ISO для корректной передачи на сервер
      const formattedData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        teacherId: user?.id,
      };

      console.log("Форматированные данные для отправки:", formattedData);

      const res = await apiRequest("POST", "/api/courses", formattedData);
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Ошибка ответа сервера:", errorData);
        throw new Error(errorData.message || "Ошибка при создании курса");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Курс успешно создан",
        description: "Вы можете добавить материалы к нему в разделе 'Загрузка материалов'",
      });
      form.reset();
      setImagePreview(null);
      setSelectedFile(null); // Reset selectedFile
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      onSuccess?.({});
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при создании курса",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Обработчик отправки формы
  const onSubmit = async (values: CreateCourseFormValues) => {
    try {
      const courseData = await createCourseMutation.mutateAsync(values);
      onSuccess?.({ ...courseData, imageFile: selectedFile });
    } catch (error) {
      console.error("Ошибка при создании курса:", error);
    }
  };

  // Обработчик загрузки изображения
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверка размера файла (макс. 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: "Ошибка загрузки изображения",
        description: "Размер файла превышает 1MB",
        variant: "destructive",
      });
      return;
    }

    // В реальном приложении здесь должна быть загрузка на сервер
    // Сейчас просто покажем превью и сохраним имя файла как imageUrl
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      form.setValue("imageUrl", file.name); // В реальном приложении здесь будет URL
      form.setValue("imageFile", file); //Added to store file object
      setSelectedFile(file); //Update selectedFile state
    };
    reader.readAsDataURL(file);
  };

  // Удаление изображения
  const removeImage = () => {
    setImagePreview(null);
    form.setValue("imageUrl", null);
    form.setValue("imageFile", null); //Added to clear imageFile value
    setSelectedFile(null); //Reset selectedFile state

  };

  return (
    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
        Создание нового курса
      </h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="sm:col-span-6">
                  <FormLabel>Название курса</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите название курса" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Категория</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="programming">Программирование</SelectItem>
                      <SelectItem value="business">Бизнес и менеджмент</SelectItem>
                      <SelectItem value="science">Наука и технологии</SelectItem>
                      <SelectItem value="humanities">Гуманитарные науки</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Длительность</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: 8 недель, 2 месяца" {...field} />
                  </FormControl>
                  <FormDescription>
                    Укажите общую продолжительность курса
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Дата начала</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Дата окончания</FormLabel>
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
                        disabled={(date) =>
                          date < new Date() ||
                          (form.getValues("startDate") && date < form.getValues("startDate"))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-6">
                  <FormLabel>Описание курса</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="Подробное описание курса, его программа и результаты обучения"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Минимум 20 символов. Подробно опишите, чему научатся студенты.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem className="sm:col-span-6">
                  <FormLabel>Изображение курса</FormLabel>
                  <div className="mt-1">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview?.startsWith("data:") ? imagePreview : `/images/${imagePreview}`}
                          alt="Preview"
                          className="object-cover rounded-md h-40 w-full sm:w-64"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label htmlFor="course-image" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                              <span>Загрузить изображение</span>
                              <input
                                id="course-image"
                                name="course-image"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={handleImageUpload}
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF до 1MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <FormDescription>
                    Добавьте изображение, которое иллюстрирует ваш курс.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="sm:col-span-6 flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Опубликовать курс</FormLabel>
                    <FormDescription>
                      Если включено, курс будет доступен для записи студентам
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createCourseMutation.isPending}
            >
              {createCourseMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Создать курс
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}