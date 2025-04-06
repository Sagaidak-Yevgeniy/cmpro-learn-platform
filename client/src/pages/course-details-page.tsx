
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, CheckCircle, Loader2, Trash2, UserPlus, UserMinus, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import UploadMaterialForm from "@/components/teacher/upload-material-form";
import AssignmentsManager from "@/components/teacher/assignments-manager";
import TestConstructor from "@/components/teacher/test-constructor";
import CourseFeedback from "@/components/courses/course-feedback";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const { data: course, isLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/courses/${courseId}/enroll`);
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

  const isTeacher = user?.role === "teacher" && user?.id === course.teacherId;
  const isStudent = user?.role === "student";
  const isEnrolled = course.enrollments?.some(e => e.userId === user?.id);

  const handleEnroll = () => {
    enrollMutation.mutate();
  };

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
      setDeleteDialogOpen(false);
    }
  };

  // Вкладка информации о курсе
  const InfoTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <User className="h-5 w-5 text-gray-400" />
              <span>Преподаватель: {course.teacher?.name || "Не указан"}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span>
                {format(new Date(course.startDate), 'dd.MM.yyyy')} - {format(new Date(course.endDate), 'dd.MM.yyyy')}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Clock className="h-5 w-5 text-gray-400" />
              <span>{course.duration}</span>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="font-medium mb-2">Описание курса:</h3>
            <p className="text-gray-600 whitespace-pre-line">{course.description}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Отзывы студентов</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseFeedback courseId={courseId} isEnrolled={isEnrolled} />
        </CardContent>
      </Card>
    </div>
  );

  const header = (
    <div className="bg-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-2">
          {course.category}
        </span>
        <h1 className="text-2xl font-bold text-white">{course.title}</h1>
        {isStudent && !isEnrolled && (
          <Button 
            onClick={handleEnroll} 
            className="mt-4"
            disabled={enrollMutation.isPending}
          >
            {enrollMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Записаться на курс
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {header}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isTeacher && isManageMode ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Управление курсом</h2>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить курс
              </Button>
            </div>
            
            <Tabs defaultValue="materials" className="space-y-6">
              <TabsList>
                <TabsTrigger value="materials">Материалы</TabsTrigger>
                <TabsTrigger value="assignments">Задания</TabsTrigger>
                <TabsTrigger value="tests">Тесты</TabsTrigger>
                <TabsTrigger value="students">Студенты</TabsTrigger>
                <TabsTrigger value="info">Информация</TabsTrigger>
              </TabsList>

              <TabsContent value="materials">
                <Card>
                  <CardContent className="p-6">
                    <UploadMaterialForm courseId={courseId} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assignments">
                <AssignmentsManager courseId={courseId} />
              </TabsContent>

              <TabsContent value="tests">
                <Card>
                  <CardContent className="p-6">
                    <TestConstructor courseId={courseId} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="students">
                <Card>
                  <CardHeader>
                    <CardTitle>Управление студентами</CardTitle>
                    <CardDescription>
                      Всего студентов: {course.enrollments?.length || 0}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {course.enrollments && course.enrollments.length > 0 ? (
                        <div className="space-y-4">
                          {course.enrollments.map((enrollment) => (
                            <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <p className="font-medium">{enrollment.user?.name}</p>
                                <p className="text-sm text-gray-500">{enrollment.user?.email}</p>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveStudent(enrollment.userId)}
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Отчислить
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center">На курс пока никто не записался</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="info">
                <InfoTab />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Tabs defaultValue="info" className="space-y-6">
            <TabsList>
              <TabsTrigger value="info">О курсе</TabsTrigger>
              {isEnrolled && (
                <>
                  <TabsTrigger value="materials">Материалы</TabsTrigger>
                  <TabsTrigger value="assignments">Задания</TabsTrigger>
                  <TabsTrigger value="tests">Тесты</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="info">
              <InfoTab />
            </TabsContent>

            {isEnrolled && (
              <>
                <TabsContent value="materials">
                  <Card>
                    <CardHeader>
                      <CardTitle>Учебные материалы</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {course.materials && course.materials.length > 0 ? (
                        <div className="space-y-4">
                          {course.materials.map((material) => (
                            <Card key={material.id}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h3 className="font-medium">{material.title}</h3>
                                    <p className="text-sm text-gray-500">{material.description}</p>
                                  </div>
                                  <Button onClick={() => window.open(material.url, '_blank')}>
                                    Открыть
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">Материалы пока не добавлены</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="assignments">
                  <Card>
                    <CardHeader>
                      <CardTitle>Задания курса</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {course.assignments && course.assignments.length > 0 ? (
                        <div className="space-y-4">
                          {course.assignments.map((assignment) => (
                            <Card key={assignment.id}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h3 className="font-medium">{assignment.title}</h3>
                                    <p className="text-sm text-gray-500">{assignment.description}</p>
                                    <p className="text-sm text-orange-600 mt-2">
                                      Срок сдачи: {format(new Date(assignment.dueDate), 'dd.MM.yyyy')}
                                    </p>
                                  </div>
                                  <Button variant="outline">Открыть задание</Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">Заданий пока нет</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tests">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Тесты</CardTitle>
                        <Button onClick={() => setCreateTestDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Создать тест
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {course.tests && course.tests.length > 0 ? (
                        <div className="space-y-4">
                          {course.tests.map((test) => (
                            <Card key={test.id}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h3 className="font-medium">{test.title}</h3>
                                    <p className="text-sm text-gray-500">{test.description}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline"
                                      onClick={() => handleEditTest(test.id)}
                                    >
                                      Редактировать
                                    </Button>
                                    <Button 
                                      variant="destructive"
                                      onClick={() => handleDeleteTest(test.id)}
                                    >
                                      Удалить
                                    </Button>
                                    <Button variant="outline">
                                      Начать тест
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Нет тестов
                          </h3>
                          <p className="text-gray-500 mb-4">
                            Создайте первый тест для этого курса
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Dialog open={createTestDialogOpen} onOpenChange={setCreateTestDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Создание теста</DialogTitle>
                        <DialogDescription>
                          Создайте тест для проверки знаний студентов
                        </DialogDescription>
                      </DialogHeader>
                      <TestConstructor courseId={courseId} />
                    </DialogContent>
                  </Dialog>
                </TabsContent>
                      ) : (
                        <p className="text-gray-500">Тестов пока нет</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение действия</DialogTitle>
            <DialogDescription>
              {selectedStudentId 
                ? "Вы действительно хотите отчислить этого студента?"
                : "Вы действительно хотите удалить этот курс? Это действие нельзя отменить."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
    </div>
  );
}
