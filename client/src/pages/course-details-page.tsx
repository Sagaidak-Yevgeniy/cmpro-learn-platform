import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
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
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

export default function CourseDetailsPage() {
  const { id } = useParams();
  const courseId = parseInt(id || "0");
  const { user } = useAuth();

  const { data: course, isLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
  });

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

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
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

          <Card>
            <CardHeader>
              <CardTitle>Действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isTeacher ? (
                <Button className="w-full" asChild>
                  <a href={`/courses/${courseId}?manage=true`}>
                    Управление курсом
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : isEnrolled ? (
                <>
                  <div>
                    <p className="text-sm font-medium mb-2">Ваш прогресс</p>
                    <Progress value={45} className="h-2" />
                    <p className="text-sm text-gray-500 mt-1">45% выполнено</p>
                  </div>
                  <Button className="w-full">
                    Продолжить обучение
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button className="w-full">
                  Записаться на курс
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}