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
  // Map categories to colors
  const categoryColors: Record<string, string> = {
    programming: "bg-blue-100 text-blue-800",
    business: "bg-yellow-100 text-yellow-800",
    science: "bg-green-100 text-green-800",
    humanities: "bg-purple-100 text-purple-800",
  };

  const categoryColor = categoryColors[course.category] || "bg-gray-100 text-gray-800";

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="h-40 bg-gray-200">
        {course.imageUrl ? (
          <img 
            src={`/uploads/${course.imageUrl}`}
            alt={course.title} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-course.jpg';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary to-blue-700 text-white text-xl font-bold p-4 text-center">
            {course.title}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <Badge className={`${categoryColor} mb-2`}>
          {course.category}
        </Badge>
        <h3 className="text-lg font-medium text-gray-900 mb-1">{course.title}</h3>
        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
          {course.description}
        </p>
        <div className="mt-3 flex items-center text-sm text-gray-500">
          <Clock className="mr-1.5 h-5 w-5 text-gray-400" />
          <span>{course.duration}</span>
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <Calendar className="mr-1.5 h-5 w-5 text-gray-400" />
          <span>
            {format(new Date(course.startDate), 'dd.MM.yyyy')} - {format(new Date(course.endDate), 'dd.MM.yyyy')}
          </span>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">
              <User className="h-4 w-4" />
            </div>
            <span className="ml-2 text-xs text-gray-500">Преподаватель: {course.teacher?.name || "Не указан"}</span>
          </div>
          <div className="flex items-center"> {/*Added div for better spacing*/}
            <Link href={`/courses/${course.id}`}>
              <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10 mr-2"> {/*Added margin right*/}
                Подробнее
              </Button>
            </Link>
            {isTeacher && (
              <Button 
                variant="default"
                onClick={() => window.location.href = `/courses/${course.id}?manage=true`}
              >
                Управление курсом
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}