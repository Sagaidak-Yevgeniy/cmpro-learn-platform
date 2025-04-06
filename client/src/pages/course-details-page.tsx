import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  Video,
  FileText,
  Star,
  ChevronLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function CourseDetailsPage() {
  const { id } = useParams();
  const courseId = parseInt(id || "0");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
  });

  const isTeacher = course ? user?.id === course.teacherId : false;
  const isEnrolled = course ? course.enrollments?.some(e => e.userId === user?.id) : false;

  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}/materials`],
    enabled: !!isEnrolled || !!isTeacher, //This line was changed
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}/assignments`],
    enabled: !!isEnrolled && !!courseId,
  });

  const isLoading = courseLoading || materialsLoading || assignmentsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Курс не найден</h2>
        </div>
      </div>
    );
  }

  const handleEnroll = async () => {
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: courseId
        })
      });

      if (response.ok) {
        toast({
          title: "Успешно!",
          description: "Вы записались на курс",
        });
        window.location.href = '/my-courses';
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: error.message || "Не удалось записаться на курс",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось записаться на курс",
      });
    }
  };

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

      <div className="grid gap-6 md:grid-cols-3">
        {course.imageUrl && (
          <div className="md:col-span-3 overflow-hidden rounded-xl h-[300px] relative">
            <img 
              src={`/uploads/${course.imageUrl}`}
              alt={course.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-course.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <p className="text-lg text-white/90">{course.description}</p>
            </div>
          </div>
        )}

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge>{course.category}</Badge>
                {new Date(course.startDate) <= new Date() && new Date(course.endDate) >= new Date() ? (
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
                    <p className="text-sm text-gray-500">{course.studentCount}</p>
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
              <CardTitle>Программа курса</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Лекции</p>
                    <p className="text-sm text-gray-500">{course.lectures?.length || 0} видеолекций</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Материалы</p>
                    <p className="text-sm text-gray-500">{course.materials?.length || 0} документов</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Video className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Практика</p>
                    <p className="text-sm text-gray-500">{course.assignments?.length || 0} заданий</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Преподаватель</CardTitle>
              <CardDescription>{course.teacher?.name || "Преподаватель не указан"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{course.teacher?.name}</p>
                  <p className="text-sm text-gray-500">{course.teacher?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          
        </div>

        {isEnrolled && materials && assignments && (
          <div className="mt-8 grid gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Статус обучения</CardTitle>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="success">Вы учитесь на этом курсе</Badge>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/enrollments/${courseId}`, {
                          method: 'DELETE'
                        });
                        if (response.ok) {
                          toast({
                            title: "Успешно",
                            description: "Вы покинули курс",
                          });
                          window.location.href = '/my-courses';
                        }
                      } catch (error) {
                        toast({
                          variant: "destructive",
                          title: "Ошибка",
                          description: "Не удалось покинуть курс",
                        });
                      }
                    }}
                  >
                    Покинуть курс
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Материалы курса</CardTitle>
              </CardHeader>
              <CardContent>
                {materials.length > 0 ? (
                  <div className="space-y-4">
                    {materials.map((material) => (
                      <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{material.title}</h3>
                          <p className="text-sm text-gray-500">{material.description}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Открыть
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Материалы пока не добавлены</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Задания</CardTitle>
              </CardHeader>
              <CardContent>
                {assignments.length > 0 ? (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{assignment.title}</h3>
                          <p className="text-sm text-gray-500">
                            Срок сдачи: {format(new Date(assignment.dueDate), 'dd.MM.yyyy')}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Перейти к заданию
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Задания пока не добавлены</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}