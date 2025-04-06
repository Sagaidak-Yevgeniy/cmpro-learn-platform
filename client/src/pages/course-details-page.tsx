import { useState } from "react";
import { useParams, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  Video,
  FileText,
  ClipboardCheck,
  User,
  Star,
  ChevronLeft,
  Pencil,
  Trash,
  Upload
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CourseDetailsPage() {
  const { id } = useParams();
  const [searchParams] = useSearch();
  const isManageMode = new URLSearchParams(searchParams).get('manage') === 'true';
  const courseId = parseInt(id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedCourse, setEditedCourse] = useState(null);

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

  const isTeacher = user?.id === course.teacherId;

  const handleUpdateCourse = () => {
    updateCourseMutation.mutate(editedCourse);
  };

  const handleDeleteCourse = () => {
    deleteMutation.mutate();
  };

  if (isManageMode && isTeacher) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditMode(true);
                setEditedCourse({...course});
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash className="h-4 w-4 mr-2" />
              Удалить курс
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editMode ? "Редактирование курса" : course.title}</CardTitle>
            <CardDescription>
              {editMode ? "Измените информацию о курсе" : `Управление курсом | ${course.enrollments?.length || 0} студентов`}
            </CardDescription>
          </CardHeader>
          {editMode ? (
            <CardContent>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Название курса</label>
                  <Input
                    value={editedCourse?.title || ""}
                    onChange={(e) => setEditedCourse({ ...editedCourse, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Описание</label>
                  <Textarea
                    value={editedCourse?.description || ""}
                    onChange={(e) => setEditedCourse({ ...editedCourse, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditMode(false)}>Отмена</Button>
                  <Button onClick={handleUpdateCourse}>Сохранить</Button>
                </div>
              </form>
            </CardContent>
          ) : null}
        </Card>

        <Tabs defaultValue="materials">
          <TabsList>
            <TabsTrigger value="materials">Материалы</TabsTrigger>
            <TabsTrigger value="students">Студенты</TabsTrigger>
            <TabsTrigger value="assignments">Задания</TabsTrigger>
            <TabsTrigger value="tests">Тесты</TabsTrigger>
          </TabsList>

          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Материалы курса</CardTitle>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
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
                          <p className="text-sm text-gray-500">{material.description}</p>
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

          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Задания</CardTitle>
                  <Button>
                    <ClipboardCheck className="h-4 w-4 mr-2" />
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

          <TabsContent value="tests">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Тесты</CardTitle>
                  <Button>Создать тест</Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {course.tests?.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-4 border-b">
                      <div>
                        <p className="font-medium">{test.title}</p>
                        <p className="text-sm text-gray-500">{test.description}</p>
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
        </Tabs>

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

  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => window.history.back()}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Назад
      </Button>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge>{course.category}</Badge>
              {course.isActive ? (
                <Badge variant="success">Активный</Badge>
              ) : (
                <Badge variant="secondary">Неактивный</Badge>
              )}
            </div>
            <CardTitle className="text-2xl">{course.title}</CardTitle>
            <CardDescription className="text-lg">
              {course.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Длительность</p>
                  <p className="text-sm text-gray-500">{course.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Даты</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(course.startDate), 'dd MMM', { locale: ru })} -
                    {format(new Date(course.endDate), 'dd MMM yyyy', { locale: ru })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Студенты</p>
                  <p className="text-sm text-gray-500">{course.enrollments?.length || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Рейтинг</p>
                  <p className="text-sm text-gray-500">4.8/5.0</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}