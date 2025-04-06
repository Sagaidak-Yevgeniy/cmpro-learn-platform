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
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

// Компонент для отображения информации о курсе
function CourseInfo({ course, isEnrolled, onEnroll }) {
  return (
    <div className="space-y-8">
      {/* Основная информация */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
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

        <Card>
          <CardHeader>
            <CardTitle>Преподаватель</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">{course.teacher?.name}</p>
                <p className="text-sm text-gray-500">{course.teacher?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Прогресс и статистика */}
      {isEnrolled && (
        <Card>
          <CardHeader>
            <CardTitle>Ваш прогресс</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Общий прогресс</span>
                  <span className="text-sm text-gray-500">60%</span>
                </div>
                <Progress value={60} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-primary/5">
                  <BookOpen className="h-5 w-5 text-primary mb-2" />
                  <p className="text-sm font-medium">Материалы</p>
                  <p className="text-2xl font-bold">12/20</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5">
                  <ClipboardCheck className="h-5 w-5 text-primary mb-2" />
                  <p className="text-sm font-medium">Задания</p>
                  <p className="text-2xl font-bold">8/15</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5">
                  <FileText className="h-5 w-5 text-primary mb-2" />
                  <p className="text-sm font-medium">Тесты</p>
                  <p className="text-2xl font-bold">5/10</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isEnrolled && (
        <Card>
          <CardContent className="pt-6">
            <Button onClick={onEnroll} className="w-full" size="lg">
              Записаться на курс
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Компонент для управления курсом
function CourseManagement({ course }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="materials">Материалы</TabsTrigger>
          <TabsTrigger value="videos">Видео</TabsTrigger>
          <TabsTrigger value="assignments">Задания</TabsTrigger>
          <TabsTrigger value="tests">Тесты</TabsTrigger>
          <TabsTrigger value="students">Студенты</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Материалы курса</CardTitle>
                  <CardDescription>
                    Управление лекциями и дополнительными материалами
                  </CardDescription>
                </div>
                <Button>Добавить материал</Button>
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
                      <Button variant="outline" size="sm">Редактировать</Button>
                      <Button variant="destructive" size="sm">Удалить</Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Видеоматериалы</CardTitle>
                  <CardDescription>
                    Управление видеолекциями и записями занятий
                  </CardDescription>
                </div>
                <Button>Добавить видео</Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {course.videos?.map((video) => (
                  <div key={video.id} className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{video.title}</p>
                        <p className="text-sm text-gray-500">{video.duration}</p>
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

        {/* Аналогичные TabsContent для assignments, tests и students */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Задания</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {course.assignments?.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border-b">
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-gray-500">{assignment.description}</p>
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
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Тесты</CardTitle>
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
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Студенты</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {course.enrollments?.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-4 border-b">
                    <div>
                      <p className="font-medium">{enrollment.user?.name}</p>
                      <p className="text-sm text-gray-500">{enrollment.user?.email}</p>
                    </div>
                    <div>
                      <Button variant="destructive" size="sm">Удалить</Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

// Основной компонент страницы
export default function CourseDetailsPage() {
  const { id } = useParams();
  const [searchParams] = useSearch();
  const isManageMode = new URLSearchParams(searchParams).get('manage') === 'true';
  const courseId = parseInt(id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [createTestDialogOpen, setCreateTestDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<number | null>(null);


  const { data: course, isLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/enrollments`, {
        courseId: courseId
      });
      if (!response.ok) throw new Error("Ошибка при записи на курс");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Вы записались на курс",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось записаться на курс",
        variant: "destructive"
      });
    }
  });

  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const response = await apiRequest("DELETE", `/api/courses/${courseId}/students/${studentId}`);
      if (!response.ok) throw new Error("Ошибка при удалении студента");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Студент удален из курса",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      setDeleteDialogOpen(false);
    },
    onError: (err) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить студента: ${err.message}`,
        variant: "destructive"
      });
    }
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
    onError: (err) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить курс: ${err.message}`,
        variant: "destructive"
      });
    }
  });

  const handleDeleteCourse = () => {
    deleteMutation.mutate();
  };

  const handleRemoveStudent = (studentId: number) => {
    setSelectedStudentId(studentId);
    setDeleteDialogOpen(true);
  };

  const confirmRemoveStudent = () => {
    if (selectedStudentId) {
      removeStudentMutation.mutate(selectedStudentId);
    }
  };

  const handleEditTest = (testId: number) => {
    setSelectedTest(testId);
    setCreateTestDialogOpen(true);
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (!course) {
    return <div>Курс не найден</div>;
  }

  const isTeacher = user?.id === course.teacherId;
  const isEnrolled = course.enrollments?.some(e => e.userId === user?.id);

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

      {isManageMode && isTeacher ? (
        <CourseManagement course={course} />
      ) : (
        <CourseInfo
          course={course}
          isEnrolled={isEnrolled}
          onEnroll={() => enrollMutation.mutate()}
        />
      )}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Подтверждение действия</DialogTitle>
            <DialogDescription>
              {selectedStudentId
                ? "Вы действительно хотите отчислить этого студента?"
                : "Вы действительно хотите удалить этот курс? Это действие нельзя отменить."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={selectedStudentId ? confirmRemoveStudent : handleDeleteCourse}
            >
              {selectedStudentId ? "Отчислить" : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createTestDialogOpen} onOpenChange={setCreateTestDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTest ? "Редактирование теста" : "Создание теста"}
            </DialogTitle>
            <DialogDescription>
              {selectedTest ? "Измените параметры теста" : "Создайте тест для проверки знаний студентов"}
            </DialogDescription>
          </DialogHeader>
          {/*  TestConstructor component would go here if needed, but it's not included in the edited snippet  */}
        </DialogContent>
      </Dialog>
    </div>
  );
}