import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pencil, User, ClipboardCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Plus,
  Video,
  FileText,
  Book,
  TestTube,
  Users,
  Settings,
  Trash,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function CourseManagementPage() {
  const { id } = useParams();
  const courseId = parseInt(id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [addContentDialog, setAddContentDialog] = useState(false);
  const [contentType, setContentType] = useState("");
  const [contentForm, setContentForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    duration: "",
    fileUrl: "",
    type: "",
    passingScore: "",
    timeLimit: "",
    order: ""
  });

  const { data: course, isLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
    enabled: Boolean(courseId)
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("PUT", `/api/courses/${courseId}`, data);
      if (!response.ok) throw new Error("Ошибка при обновлении курса");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Курс обновлен",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
    },
  });

  const addLectureMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", `/api/courses/${courseId}/lectures`, data);
      if (!response.ok) throw new Error("Ошибка при добавлении лекции");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Лекция добавлена",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      setAddContentDialog(false);
      setContentForm({
        title: "",
        description: "",
        videoUrl: "",
        duration: "",
        fileUrl: "",
        type: "",
        passingScore: "",
        timeLimit: "",
        order: ""
      });
    },
  });

  const addMaterialMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", `/api/courses/${courseId}/materials`, data);
      if (!response.ok) throw new Error("Ошибка при добавлении материала");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Материал добавлен",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      setAddContentDialog(false);
      setContentForm({
        title: "",
        description: "",
        videoUrl: "",
        duration: "",
        fileUrl: "",
        type: "",
        passingScore: "",
        timeLimit: "",
        order: ""
      });
    },
  });

  const addTestMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", `/api/courses/${courseId}/tests`, data);
      if (!response.ok) throw new Error("Ошибка при создании теста");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Тест создан",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      setAddContentDialog(false);
      setContentForm({
        title: "",
        description: "",
        videoUrl: "",
        duration: "",
        fileUrl: "",
        type: "",
        passingScore: "",
        timeLimit: "",
        order: ""
      });
    },
  });

  const handleContentSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;

      if (!title || !description) {
        toast({
          title: "Ошибка",
          description: "Заполните все обязательные поля",
          variant: "destructive"
        });
        return;
      }

      switch (contentType) {
        case "lecture": {
          const videoUrl = formData.get("videoUrl") as string;
          const duration = parseInt(formData.get("duration") as string);
          const order = parseInt(formData.get("order") as string) || 0;

          if (!videoUrl || isNaN(duration)) {
            toast({
              title: "Ошибка",
              description: "Укажите корректную ссылку на видео и длительность",
              variant: "destructive"
            });
            return;
          }

          await addLectureMutation.mutateAsync({
            title,
            description,
            videoUrl,
            duration,
            order
          });
          break;
        }
        case "material": {
          const type = formData.get("type") as string;
          const fileUrl = formData.get("fileUrl") as string;
          const order = parseInt(formData.get("order") as string) || 0;

          if (!type || !fileUrl) {
            toast({
              title: "Ошибка",
              description: "Укажите тип материала и ссылку на файл",
              variant: "destructive"
            });
            return;
          }

          await addMaterialMutation.mutateAsync({
            title,
            description,
            type,
            fileUrl,
            order
          });
          break;
        }
        case "test": {
          const passingScore = parseInt(formData.get("passingScore") as string);
          const timeLimit = parseInt(formData.get("timeLimit") as string);
          const order = parseInt(formData.get("order") as string) || 0;

          if (isNaN(passingScore) || isNaN(timeLimit) || passingScore < 0 || passingScore > 100) {
            toast({
              title: "Ошибка",
              description: "Укажите корректный проходной балл (0-100) и время на выполнение",
              variant: "destructive"
            });
            return;
          }

          await addTestMutation.mutateAsync({
            title,
            description,
            passingScore,
            timeLimit,
            order
          });
          break;
        }
      }

      queryClient.invalidateQueries([`/api/courses/${courseId}`]);
      setAddContentDialog(false);
      setContentForm({
        title: "",
        description: "",
        videoUrl: "",
        duration: "",
        fileUrl: "",
        type: "",
        passingScore: "",
        timeLimit: "",
        order: ""
      });

    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const ContentDialog = () => (
    <Dialog open={addContentDialog} onOpenChange={setAddContentDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {contentType === "lecture" && "Добавить лекцию"}
            {contentType === "material" && "Добавить материал"}
            {contentType === "test" && "Создать тест"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleContentSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              name="title"
              value={contentForm.title}
              onChange={handleInputChange}
              placeholder="Название"
              required
            />
            <Textarea
              name="description"
              value={contentForm.description}
              onChange={handleInputChange}
              placeholder="Описание"
              required
            />
            {contentType === "lecture" && (
              <div className="space-y-2">
                <Input
                  name="videoUrl"
                  value={contentForm.videoUrl}
                  onChange={handleInputChange}
                  type="url"
                  placeholder="Ссылка на видео"
                  required
                />
                <Input
                  name="duration"
                  value={contentForm.duration}
                  onChange={handleInputChange}
                  type="number"
                  placeholder="Длительность (минут)"
                  required
                />
                <Input
                  name="order"
                  value={contentForm.order}
                  onChange={handleInputChange}
                  type="number"
                  placeholder="Порядок"
                />
              </div>
            )}
            {contentType === "material" && (
              <div className="space-y-2">
                <Input
                  name="fileUrl"
                  value={contentForm.fileUrl}
                  onChange={handleInputChange}
                  type="url"
                  placeholder="Ссылка на файл"
                  required
                />
                <Input
                  name="type"
                  value={contentForm.type}
                  onChange={handleInputChange}
                  placeholder="Тип материала"
                  required
                />
                <Input
                  name="order"
                  value={contentForm.order}
                  onChange={handleInputChange}
                  type="number"
                  placeholder="Порядок"
                />
              </div>
            )}
            {contentType === "test" && (
              <div className="space-y-2">
                <Input
                  name="passingScore"
                  value={contentForm.passingScore}
                  onChange={handleInputChange}
                  type="number"
                  placeholder="Проходной балл"
                  required
                />
                <Input
                  name="timeLimit"
                  value={contentForm.timeLimit}
                  onChange={handleInputChange}
                  type="number"
                  placeholder="Время на выполнение (минут)"
                  required
                />
                <Input
                  name="order"
                  value={contentForm.order}
                  onChange={handleInputChange}
                  type="number"
                  placeholder="Порядок"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddContentDialog(false)}>
              Отмена
            </Button>
            <Button type="submit">Сохранить</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/teacher">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{course?.title}</h1>
          <p className="text-gray-500">Панель управления курсом</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Статистика курса</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-2xl font-bold">{course?.enrollments?.length || 0}</p>
                <p className="text-sm text-gray-500">Студентов</p>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{course?.materials?.length || 0}</p>
                <p className="text-sm text-gray-500">Материалов</p>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{course?.assignments?.length || 0}</p>
                <p className="text-sm text-gray-500">Заданий</p>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 gap-4">
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="lectures">Лекции</TabsTrigger>
              <TabsTrigger value="materials">Материалы</TabsTrigger>
              <TabsTrigger value="tests">Тесты</TabsTrigger>
              <TabsTrigger value="students">Студенты</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>О курсе</CardTitle>
                  <CardDescription>Основная информация о курсе</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Описание курса</label>
                      <p className="mt-1 text-gray-600">{course?.description}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Прогресс курса</label>
                      <Progress 
                        value={
                          ((course?.materials?.length || 0) + 
                          (course?.lectures?.length || 0) + 
                          (course?.tests?.length || 0)) / 30 * 100
                        } 
                        className="mt-2" 
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {((course?.materials?.length || 0) + 
                        (course?.lectures?.length || 0) + 
                        (course?.tests?.length || 0))} материалов загружено
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lectures" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Видеолекции</CardTitle>
                    <CardDescription>Управление видеолекциями курса</CardDescription>
                  </div>
                  <Button onClick={() => {
                    setContentType("lecture");
                    setAddContentDialog(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить лекцию
                  </Button>
                </CardHeader>
                <CardContent>
                  {!course?.lectures?.length ? (
                    <div className="text-center py-8">
                      <Video className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="mt-4 text-gray-500">Лекции пока не добавлены</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      {course.lectures?.map((lecture) => (
                        <div key={lecture.id} className="flex items-center justify-between p-4 border-b">
                          <div className="flex items-center gap-3">
                            <Video className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{lecture.title}</p>
                              <p className="text-sm text-gray-500">{lecture.duration} минут</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4 mr-2" />
                              Редактировать
                            </Button>
                            <Button variant="destructive" size="sm">
                              <Trash className="h-4 w-4 mr-2" />
                              Удалить
                            </Button>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="materials" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Материалы курса</CardTitle>
                  <Button onClick={() => {
                    setContentType("material");
                    setAddContentDialog(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить материал
                  </Button>
                </CardHeader>
                <CardContent>
                  {!course?.materials?.length ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="mt-4 text-gray-500">Материалы пока не добавлены</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      {course.materials?.map((material) => (
                        <div key={material.id} className="flex items-center justify-between p-4 border-b">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{material.title}</p>
                              <p className="text-sm text-gray-500">{material.type}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">Редактировать</Button>
                            <Button variant="destructive" size="sm">Удалить</Button>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tests" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Тесты</CardTitle>
                  <Button onClick={() => {
                    setContentType("test");
                    setAddContentDialog(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать тест
                  </Button>
                </CardHeader>
                <CardContent>
                  {!course?.tests?.length ? (
                    <div className="text-center py-8">
                      <TestTube className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="mt-4 text-gray-500">Тесты пока не добавлены</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      {course.tests?.map((test) => (
                        <div key={test.id} className="flex items-center justify-between p-4 border-b">
                          <div>
                            <p className="font-medium">{test.title}</p>
                            <p className="text-sm text-gray-500">
                              Проходной балл: {test.passingScore}%
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">Статистика</Button>
                            <Button variant="destructive" size="sm">Удалить</Button>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Студенты курса</CardTitle>
                </CardHeader>
                <CardContent>
                  {!course?.enrollments?.length ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="mt-4 text-gray-500">Студенты пока не зарегистрированы</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      {course.enrollments?.map((enrollment) => (
                        <div key={enrollment.id} className="flex items-center justify-between p-4 border-b">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{enrollment.user?.name}</p>
                              <p className="text-sm text-gray-500">{enrollment.user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-sm font-medium">Прогресс</p>
                              <Progress value={enrollment.progress || 0} className="w-24" />
                            </div>
                            <Button variant="destructive" size="sm">Отчислить</Button>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => {
                setContentType("material");
                setAddContentDialog(true);
              }}>
                <FileText className="h-4 w-4 mr-2" />
                Добавить материал
              </Button>
              <Button className="w-full" onClick={() => {
                setContentType("lecture");
                setAddContentDialog(true);
              }}>
                <Video className="h-4 w-4 mr-2" />
                Добавить лекцию
              </Button>
              <Button className="w-full" onClick={() => {
                setContentType("test");
                setAddContentDialog(true);
              }}>
                <TestTube className="h-4 w-4 mr-2" />
                Создать тест
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Настройки курса</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Название курса</label>
                  <Input 
                    value={course.title} 
                    onChange={(e) => {
                      const updatedCourse = { ...course, title: e.target.value };
                      updateCourseMutation.mutate(updatedCourse);
                    }}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Описание</label>
                  <Textarea 
                    value={course.description}
                    onChange={(e) => {
                      const updatedCourse = { ...course, description: e.target.value };
                      updateCourseMutation.mutate(updatedCourse);
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Изображение курса</label>
                  <div className="mt-2">
                    {course.imageUrl ? (
                      <div className="relative">
                        <img 
                          src={course.imageUrl.startsWith('http') ? course.imageUrl : `/uploads/${course.imageUrl}`}
                          alt={course.title}
                          className="w-full h-40 object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/600x400/png?text=Курс';
                          }}
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            const updatedCourse = { ...course, imageUrl: null };
                            updateCourseMutation.mutate(updatedCourse);
                          }}
                        >
                          Удалить
                        </Button>
                      </div>
                    ) : null}
                    <Input
                      type="file"
                      accept="image/*"
                      className="mt-2"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const formData = new FormData();
                        formData.append("image", file);

                        try {
                          const response = await fetch(`/api/courses/${course.id}/image`, {
                            method: "PUT",
                            body: formData,
                          });

                          if (!response.ok) {
                            throw new Error("Ошибка при загрузке изображения");
                          }

                          const result = await response.json();
                          queryClient.invalidateQueries([`/api/courses/${course.id}`]);
                          toast({
                            title: "Успешно",
                            description: "Изображение курса обновлено",
                          });
                        } catch (error) {
                          toast({
                            title: "Ошибка",
                            description: "Не удалось загрузить изображение",
                            variant: "destructive",
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ContentDialog />
    </div>
  );
}