
import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  Pencil,
  Trash,
  Upload,
  FileText,
  User,
  Plus,
  Video,
  BookOpen,
  ClipboardCheck,
} from "lucide-react";

export default function CourseManagementPage() {
  const { id } = useParams();
  const courseId = parseInt(id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("materials");
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
    return <div>Загрузка...</div>;
  }

  if (!course) {
    return <div>Курс не найден</div>;
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
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setEditMode(true);
            setEditedCourse({...course});
          }}>
            <Pencil className="h-4 w-4 mr-2" />
            Редактировать
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash className="h-4 w-4 mr-2" />
            Удалить курс
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{course.title}</CardTitle>
          <CardDescription>Управление курсом | {course.enrollments?.length || 0} студентов</CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="lectures">Лекции</TabsTrigger>
          <TabsTrigger value="materials">Материалы</TabsTrigger>
          <TabsTrigger value="assignments">Задания</TabsTrigger>
          <TabsTrigger value="tests">Тесты</TabsTrigger>
          <TabsTrigger value="students">Студенты</TabsTrigger>
        </TabsList>

        <TabsContent value="lectures">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Лекции курса</CardTitle>
                <Button onClick={() => {
                  setContentType("lecture");
                  setAddContentDialog(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить лекцию
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Материалы курса</CardTitle>
                <Button onClick={() => {
                  setContentType("material");
                  setAddContentDialog(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить материал
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Задания</CardTitle>
                <Button onClick={() => {
                  setContentType("assignment");
                  setAddContentDialog(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать задание
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Тесты</CardTitle>
                <Button onClick={() => {
                  setContentType("test");
                  setAddContentDialog(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать тест
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Студенты курса</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
