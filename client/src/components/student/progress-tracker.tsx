import { Link } from "wouter";
import { format } from "date-fns";

interface ProgressTrackerProps {
  enrollment: {
    id: number;
    progress: number;
    courseId: number;
    course: {
      id: number;
      title: string;
      endDate: string;
    };
    completedTasks: number;
    totalTasks: number;
    nextDeadline?: string;
  };
}

export default function ProgressTracker({ enrollment }: ProgressTrackerProps) {
  const { progress, course, completedTasks, totalTasks, nextDeadline } = enrollment;
  const endDate = new Date(course.endDate);
  const formattedEndDate = format(endDate, "dd.MM.yyyy");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Link href={`/courses/${course.id}`}>
          <h4 className="font-medium hover:text-primary cursor-pointer">{course.title}</h4>
        </Link>
        <p className="text-sm text-gray-500">Срок завершения: {formattedEndDate}</p>
      </div>
      <div className="flex justify-between items-center">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700">{progress}%</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Выполнено заданий: {completedTasks}/{totalTasks}</span>
        {nextDeadline && (
          <span className="text-orange-600">
            Следующий дедлайн: {format(new Date(nextDeadline), 'dd.MM.yyyy')}
          </span>
        )}
      </div>
    </div>
  );
}