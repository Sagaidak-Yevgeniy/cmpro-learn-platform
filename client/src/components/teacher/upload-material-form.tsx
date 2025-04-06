import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  title: z.string().min(1, "Введите название материала"),
  file: z.instanceof(File).optional(),
});

type UploadMaterialFormValues = z.infer<typeof formSchema>;

interface Course {
  id: number;
  title: string;
}

export default function UploadMaterialForm({ courses }: { courses: Course[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<UploadMaterialFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (values: UploadMaterialFormValues) => {
      if (!selectedFile) {
        throw new Error("Выберите файл для загрузки");
      }

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("file", selectedFile);
      formData.append("courseId", courses[0].id.toString());

      const res = await fetch("/api/materials/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Ошибка при загрузке материала");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Материал успешно загружен" });
      form.reset();
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courses[0].id}/materials`] });
    },
    onError: () => {
      toast({
        title: "Ошибка при загрузке материала",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: UploadMaterialFormValues) => {
    uploadMutation.mutate(values);
  };

  const { data: materials } = useQuery({
    queryKey: [`/api/courses/${courses[0].id}/materials`],
  });

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название материала</FormLabel>
                <FormControl>
                  <Input placeholder="Введите название" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Файл материала</FormLabel>
            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/90">
                    <span>Загрузить файл</span>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                {selectedFile && (
                  <p className="text-sm text-gray-500">
                    Выбран файл: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={uploadMutation.isPending || !selectedFile}
          >
            {uploadMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Загрузить материал
          </Button>
        </form>
      </Form>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Загруженные материалы</h3>
        {materials?.length > 0 ? (
          <div className="space-y-4">
            {materials.map((material: any) => (
              <div
                key={material.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <span>{material.title}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/uploads/${material.fileUrl}`, '_blank')}
                >
                  Скачать
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Материалы пока не загружены</p>
        )}
      </div>
    </div>
  );
}