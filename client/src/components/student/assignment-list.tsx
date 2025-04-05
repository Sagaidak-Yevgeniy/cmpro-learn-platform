import { Link } from "wouter";
import { format } from "date-fns";
import { FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  courseId: number;
  course?: {
    id: number;
    title: string;
  };
}

interface AssignmentListProps {
  assignments: Assignment[];
}

export default function AssignmentList({ assignments }: AssignmentListProps) {
  if (!assignments || assignments.length === 0) {
    return (
      <p className="text-gray-500">У вас пока нет ближайших заданий.</p>
    );
  }

  return (
    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
      {assignments.map((assignment) => {
        const dueDate = new Date(assignment.dueDate);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Choose text color based on due date
        let dueDateColor = "text-gray-500";
        if (daysUntilDue <= 1) {
          dueDateColor = "text-red-500";
        } else if (daysUntilDue <= 3) {
          dueDateColor = "text-orange-500";
        } else if (daysUntilDue <= 7) {
          dueDateColor = "text-yellow-600";
        }
        
        return (
          <li key={assignment.id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
            <div className="w-0 flex-1 flex items-center">
              <FileText className="flex-shrink-0 h-5 w-5 text-[#FF9800]" />
              <span className="ml-2 flex-1 w-0 truncate">
                {assignment.course && (
                  <span className="text-xs text-gray-500 block">
                    {assignment.course.title}
                  </span>
                )}
                {assignment.title}
              </span>
            </div>
            <div className="ml-4 flex-shrink-0 flex flex-col">
              <span className={`${dueDateColor} text-xs mb-1 flex items-center`}>
                <Calendar className="h-3 w-3 mr-1" />
                Срок: {format(dueDate, "dd.MM.yyyy")}
              </span>
              <Link href={`/courses/${assignment.courseId}`}>
                <Button 
                  variant="link" 
                  className="font-medium text-primary hover:text-primary/90 p-0 h-auto"
                >
                  Открыть
                </Button>
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
