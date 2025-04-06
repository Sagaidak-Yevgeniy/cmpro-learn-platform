import { Course } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, User } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface CourseCardProps {
  course: Course;
  isTeacher?: boolean; // Added isTeacher prop
}

export default function CourseCard({ course, isTeacher }: CourseCardProps) {
  const categoryColors: Record<string, string> = {
    programming: "bg-blue-500/10 text-blue-700 border-blue-200",
    business: "bg-amber-500/10 text-amber-700 border-amber-200",
    science: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    humanities: "bg-purple-500/10 text-purple-700 border-purple-200",
  };

  const categoryColor = categoryColors[course.category] || "bg-slate-500/10 text-slate-700 border-slate-200";
  const startDate = new Date(course.startDate);
  const endDate = new Date(course.endDate);
  const isActive = startDate <= new Date() && endDate >= new Date();

  return (
    <Card className="group overflow-hidden bg-card hover:shadow-xl transition-all duration-300">
      <div className="relative h-48">
        {course.imageUrl ? (
          <img 
            src={`/uploads/${course.imageUrl}`}
            alt={course.title} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = '/public/placeholder-course.jpg';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/90 to-primary text-white text-xl font-bold p-4 text-center">
            {course.title}
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="secondary" className={`${categoryColor}`}>
            {course.category}
          </Badge>
          {isActive && <Badge variant="success">Активный</Badge>}
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight line-clamp-1">{course.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{course.studentCount || 0} студентов</span>
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              <Calendar className="inline h-4 w-4 mr-1" />
              {format(startDate, 'dd.MM.yyyy')}
            </div>
            {isTeacher ? (
              <Link href={`/courses/${course.id}/manage`}>
                <Button size="sm" className="w-full">
                  Управление
                </Button>
              </Link>
            ) : (
              <Link href={`/courses/${course.id}`}>
                <Button variant="outline" size="sm">
                  Подробнее
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}