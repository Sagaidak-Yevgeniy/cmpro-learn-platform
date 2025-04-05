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
  };
}

export default function ProgressTracker({ enrollment }: ProgressTrackerProps) {
  const { progress, course } = enrollment;
  const endDate = new Date(course.endDate);
  const formattedEndDate = format(endDate, "dd.MM.yyyy");
  
  // Choose color based on progress
  let progressColor = "bg-primary";
  if (progress < 30) {
    progressColor = "bg-red-500";
  } else if (progress < 70) {
    progressColor = "bg-orange-500";
  } else if (progress >= 70) {
    progressColor = "bg-green-500";
  }

  return (
    <div className="flex justify-between items-center">
      <div>
        <Link href={`/courses/${course.id}`}>
          <h4 className="font-medium hover:text-primary cursor-pointer">{course.title}</h4>
        </Link>
        <p className="text-sm text-gray-500">Срок завершения: {formattedEndDate}</p>
      </div>
      <div className="flex items-center">
        <div className="w-48 bg-gray-200 rounded-full h-2.5 mr-3">
          <div 
            className={`${progressColor} h-2.5 rounded-full`} 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="text-sm font-medium text-gray-700">{progress}%</span>
      </div>
    </div>
  );
}
