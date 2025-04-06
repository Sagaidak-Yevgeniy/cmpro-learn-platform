import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, CheckCircle, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import UploadMaterialForm from "@/components/teacher/upload-material-form";
import AssignmentsManager from "@/components/teacher/assignments-manager";
import TestConstructor from "@/components/teacher/test-constructor";
import CourseFeedback from "@/components/courses/course-feedback";
import CourseChat from "@/components/chat/course-chat";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";


export default function CourseDetailsPage() {
  const { id } = useParams();
  const courseId = parseInt(id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: course } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
  });

  if (!course) {
    return <div>Загрузка...</div>;
  }

  const isTeacher = user?.role === "teacher" && user?.id === course.teacherId;
  const isStudent = user?.role === "student";

  const downloadMaterial = async (materialId: number) => {
    try {
      const response = await apiRequest("GET", `/api/materials/${materialId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "material.txt"; // Simplified download name
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch(error) {
      console.error("Error downloading material:", error);
      toast({ title: "Ошибка загрузки материала", description: "Пожалуйста, попробуйте позже", variant: "destructive" });
    }
  };


  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-2">
            {course.category}
          </span>
          <h1 className="text-2xl font-bold text-white">{course.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
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
            <p className="text-gray-600">{course.description}</p>
          </div>
        </Card>

        {isTeacher ? (
          <Tabs defaultValue="materials" className="space-y-6">
            <TabsList>
              <TabsTrigger value="materials">Материалы</TabsTrigger>
              <TabsTrigger value="assignments">Задания</TabsTrigger>
              <TabsTrigger value="tests">Тесты</TabsTrigger>
            </TabsList>

            <TabsContent value="materials">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Управление материалами</h2>
                  <UploadMaterialForm courses={[course]} />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="assignments">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Управление заданиями</h2>
                  <AssignmentsManager courseId={courseId} />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="tests">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Конструктор тестов</h2>
                  <TestConstructor courseId={courseId} />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="p-6">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="feedback">Отзывы</TabsTrigger>
              <TabsTrigger value="materials">Материалы</TabsTrigger>
              <TabsTrigger value="assignments">Задания</TabsTrigger>
              <TabsTrigger value="chat">Чат</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div>
                <h2 className="text-xl font-bold mb-3">Описание курса</h2>
                <p className="text-gray-700 whitespace-pre-line">{course.description}</p>
              </div>
            </TabsContent>

            <TabsContent value="materials" className="space-y-6">
                <h2 className="text-xl font-bold mb-3">Учебные материалы</h2>
                {course.materials && course.materials.length > 0 ? (
                  <div className="grid gap-4">
                    {course.materials.map((material) => (
                      <Card key={material.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{material.title}</h3>
                              {material.description && (
                                <p className="text-sm text-gray-500 mt-1">{material.description}</p>
                              )}
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-2">
                                {material.type}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(material.url, '_blank')}
                              >
                                Открыть
                              </Button>
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => downloadMaterial(material.id)}
                              >
                                Скачать
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    На данный момент нет доступных материалов для этого курса.
                  </p>
                )}
            </TabsContent>

            <TabsContent value="assignments" className="space-y-6">
              <>
                <h2 className="text-xl font-bold mb-3">Задания</h2>
                {course.assignments && course.assignments.length > 0 ? (
                  <div className="grid gap-4">
                    {course.assignments.map((assignment) => (
                      <Card key={assignment.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{assignment.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {assignment.description.length > 100 
                                  ? `${assignment.description.slice(0, 100)}...` 
                                  : assignment.description}
                              </p>
                              <div className="flex items-center mt-2 text-sm text-orange-700">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>
                                  Срок сдачи: {format(new Date(assignment.dueDate), 'dd.MM.yyyy')}
                                </span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">Открыть</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    На данный момент нет доступных заданий для этого курса.
                  </p>
                )}
              </>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-6">
              <CourseFeedback courseId={courseId} isEnrolled={true} />
            </TabsContent>

            <TabsContent value="chat" className="space-y-6">
              <>
                <h2 className="text-xl font-bold mb-3">Чат курса</h2>
                <CourseChat courseId={courseId} />
              </>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}