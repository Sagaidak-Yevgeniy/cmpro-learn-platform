import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [isAddingLecture, setIsAddingLecture] = useState(false);
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedCourse, setEditedCourse] = useState(null);
  const [addContentDialog, setAddContentDialog] = useState(false);
  const [contentType, setContentType] = useState("");

  const { data: course, isLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
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
      setEditMode(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/courses/${courseId}`);
      if (!response.ok) throw new Error("Ошибка при удалении курса");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Курс удален",
      });
      window.location.href = "/teacher";
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleUpdateCourse = () => {
    updateCourseMutation.mutate(editedCourse);
  };

  const handleDeleteCourse = () => {
    deleteMutation.mutate();
  };

  const ContentDialog = () => (
    <Dialog open={addContentDialog} onOpenChange={setAddContentDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {contentType === "lecture" && "Добавить лекцию"}
            {contentType === "material" && "Добавить материал"}
            {contentType === "test" && "Создать тест"}
            {contentType === "assignment" && "Добавить задание"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input placeholder="Название" />
            <Textarea placeholder="Описание" />
            {contentType === "lecture" && (
              <div className="space-y-2">
                <Input type="url" placeholder="Ссылка на видео" />
                <Input type="number" placeholder="Длительность (минут)" />
              </div>
            )}
            {contentType === "material" && (
              <div className="space-y-2">
                <Input type="file" />
                <Input placeholder="Тип материала" />
              </div>
            )}
            {contentType === "test" && (
              <div className="space-y-2">
                <Input type="number" placeholder="Проходной балл" />
                <Input type="number" placeholder="Время на выполнение (минут)" />
              </div>
            )}
            {contentType === "assignment" && (
              <div className="space-y-2">
                <Input type="datetime-local" />
                <Input type="number" placeholder="Максимальный балл" />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAddContentDialog(false)}>
            Отмена
          </Button>
          <Button>Сохранить</Button>
        </DialogFooter>
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
                <p className="text-2xl font-bold">{course?.students?.length || 0}</p>
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
                      <Progress value={65} className="mt-2" />
                      <p className="text-sm text-gray-500 mt-1">65% материалов загружено</p>
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
                  {course?.lectures?.length === 0 ? (
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
                  {course?.materials?.length === 0 ? (
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

            <TabsContent value="assignments" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Задания</CardTitle>
                  <Button onClick={() => {
                    setContentType("assignment");
                    setAddContentDialog(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать задание
                  </Button>
                </CardHeader>
                <CardContent>
                  {course?.assignments?.length === 0 ? (
                    <div className="text-center py-8">
                      <Book className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="mt-4 text-gray-500">Задания пока не добавлены</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      {course.assignments?.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between p-4 border-b">
                          <div>
                            <p className="font-medium">{assignment.title}</p>
                            <p className="text-sm text-gray-500">
                              Срок сдачи: {format(new Date(assignment.dueDate), 'dd MMM yyyy', { locale: ru })}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <ClipboardCheck className="h-4 w-4 mr-2" />
                              Проверить работы
                            </Button>
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
                  {course?.tests?.length === 0 ? (
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
                  {course?.enrollments?.length === 0 ? (
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
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => {
                setEditMode(true);
                setEditedCourse({...course});
              }}>
                <Settings className="h-4 w-4 mr-2" />
                Редактировать курс
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <ContentDialog />
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удаление курса</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить этот курс? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteCourse}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}