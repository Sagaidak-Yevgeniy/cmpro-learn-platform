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
import { Loader2, Upload } from "lucide-react";

const uploadMaterialSchema = z.object({
  courseId: z.string().min(1, { message: "Выберите курс" }),
  title: z.string().min(1, { message: "Введите название материала" }),
  type: z.string().min(1, { message: "Выберите тип материала" }),
  description: z.string().optional(),
  content: z.string().min(1, { message: "Добавьте содержание материала" }),
  order: z.number().default(0),
});

type UploadMaterialFormValues = z.infer<typeof uploadMaterialSchema>;

interface UploadMaterialFormProps {
  courses: any[]; // Using any for simplicity
}

export default function UploadMaterialForm({ courses }: UploadMaterialFormProps) {
  const { toast } = useToast();
  const [fileContent, setFileContent] = useState<string | null>(null);
  
  const { data: materials } = useQuery({
    queryKey: [`/api/courses/${courses[0]?.id}/materials`],
    enabled: !!courses[0]?.id,
  });
  
  const form = useForm<UploadMaterialFormValues>({
    resolver: zodResolver(uploadMaterialSchema),
    defaultValues: {
      courseId: "",
      title: "",
      type: "",
      description: "",
      content: "",
      order: 0,
    },
  });
  
  const uploadMaterialMutation = useMutation({
    mutationFn: async (data: UploadMaterialFormValues) => {
      const res = await apiRequest("POST", "/api/materials", {
        ...data,
        courseId: parseInt(data.courseId),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Материал успешно загружен",
        description: "Материал был добавлен к курсу",
      });
      form.reset();
      setFileContent(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка загрузки материала",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: UploadMaterialFormValues) => {
    uploadMaterialMutation.mutate(values);
  };
  
  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      form.setValue("content", content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Выберите курс</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите курс" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Тип материала</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="lecture">Лекция</SelectItem>
                      <SelectItem value="presentation">Презентация</SelectItem>
                      <SelectItem value="lab">Лабораторная работа</SelectItem>
                      <SelectItem value="test">Тест</SelectItem>
                      <SelectItem value="additional">Дополнительные материалы</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="sm:col-span-6">
                  <FormLabel>Название материала</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-6">
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3} 
                      placeholder="Краткое описание материала"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="sm:col-span-6">
                  <FormLabel>Содержание материала</FormLabel>
                  {!fileContent ? (
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                            <span>Загрузить файл</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                          </label>
                          <p className="pl-1">или введите текст ниже</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          TXT, MD, HTML до 10MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 relative">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-green-600">Файл загружен</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setFileContent(null);
                            form.setValue("content", "");
                          }}
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  )}
                  <FormControl>
                    <Textarea 
                      rows={8}
                      placeholder={fileContent ? "Содержимое файла загружено" : "Введите содержание материала здесь"}
                      {...field}
                      className={fileContent ? "bg-gray-50" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Порядок отображения</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={uploadMaterialMutation.isPending}
            >
              {uploadMaterialMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Загрузить материал
            </Button>
          </div>
        </form>
      </Form>

      {materials && materials.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Загруженные материалы</h3>
          <div className="space-y-4">
            {materials.map((material: any) => (
              <div key={material.id} className="border rounded-lg p-4">
                <h4 className="font-medium">{material.title}</h4>
                <p className="text-sm text-gray-500">{material.description}</p>
                <div className="mt-2">
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                    {material.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
