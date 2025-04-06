import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, CheckCircle, Loader2, Trash2, UserPlus, UserMinus, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import UploadMaterialForm from "@/components/teacher/upload-material-form";
import AssignmentsManager from "@/components/teacher/assignments-manager";
import TestConstructor from "@/components/teacher/test-constructor";
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
  const [selectedTest, setSelectedTest] = useState<number | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editInfoDialogOpen, setEditInfoDialogOpen] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: [`/api/student/stats`] });
      window.location.href = '/my-courses';
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
      setDeleteDialogOpen(false);
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

  const handleEditTest = (testId: number) => {
    setSelectedTest(testId);
    setCreateTestDialogOpen(true);
  };

  const handleDeleteTest = async (testId: number) => {
    try {
      const response = await apiRequest("DELETE", `/api/courses/${courseId}/tests/${testId}`);
      if (!response.ok) throw new Error("Failed to delete test");
      queryClient.invalidateQueries([`/api/courses/${courseId}`]);
      toast({
        title: "Успешно",
        description: "Тест удален"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить тест",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMaterial = async (materialId: number) => {
    try {
      const response = await apiRequest("DELETE", `/api/courses/${courseId}/materials/${materialId}`);
      if (!response.ok) throw new Error("Failed to delete material");
      queryClient.invalidateQueries([`/api/courses/${courseId}`]);
      toast({
        title: "Успешно",
        description: "Материал удален"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить материал",
        variant: "destructive"
      });
    }
  };

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
    }
  };

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
                  <CardHeader>
                    <CardTitle>Материалы курса</CardTitle>
                    <CardDescription>
                      Загруженные материалы: {course.materials?.length || 0}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <UploadMaterialForm courses={[course]} />
                      {course.materials && course.materials.length > 0 ? (
                        <div className="space-y-4">
                          {course.materials.map((material) => (
                            <Card key={material.id}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="font-medium">{material.title}</h4>
                                    <p className="text-sm text-gray-500">{material.description}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => window.open(material.url, '_blank')}>
                                      Просмотреть
                                    </Button>
                                    <Button variant="destructive" onClick={() => handleDeleteMaterial(material.id)}>
                                      Удалить
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center">Материалы пока не загружены</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assignments">
                <AssignmentsManager courseId={courseId} />
              </TabsContent>

              <TabsContent value="tests">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Управление тестами</CardTitle>
                        <CardDescription>
                          Всего тестов: {course.tests?.length || 0}
                        </CardDescription>
                      </div>
                      <Button onClick={() => setCreateTestDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Создать тест
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <TestConstructor courseId={courseId} /> {/* Added TestConstructor component */}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="students">
                <Card>
                  <CardHeader>
                    <CardTitle>Управление студентами</CardTitle>
                    <CardDescription>Placeholder for student management functionality</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Placeholder for student management UI */}
                    <p>Functionality for managing students will be added here.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="info">
                <Card>
                  <CardHeader>
                    <CardTitle>Информация о курсе</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium">Описание курса</h3>
                        <p className="text-gray-600 mt-1">{course.description}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Длительность</h3>
                        <p className="text-gray-600 mt-1">{course.duration}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Даты проведения</h3>
                        <p className="text-gray-600 mt-1">
                          {format(new Date(course.startDate), 'dd.MM.yyyy')} - {format(new Date(course.endDate), 'dd.MM.yyyy')}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium">Статистика</h3>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-500">Студентов записано</p>
                            <p className="text-2xl font-bold">{course.enrollments?.length || 0}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-500">Материалов</p>
                            <p className="text-2xl font-bold">{course.materials?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
              <Card>
                <CardHeader>
                  <CardTitle>Информация о курсе</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Описание курса</h3>
                      <p className="text-gray-600 mt-1">{course.description}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Длительность</h3>
                      <p className="text-gray-600 mt-1">{course.duration}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Даты проведения</h3>
                      <p className="text-gray-600 mt-1">
                        {format(new Date(course.startDate), 'dd.MM.yyyy')} - {format(new Date(course.endDate), 'dd.MM.yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                                  <a href={material.url} target="_blank" rel="noopener noreferrer">
                                    <Button>Открыть материал</Button>
                                  </a>
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
                      <CardTitle>Тесты</CardTitle>
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
                                  <Button variant="outline">Начать тест</Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
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
          <TestConstructor courseId={courseId} testId={selectedTest} />
        </DialogContent>
      </Dialog>
    </div>
  );
}