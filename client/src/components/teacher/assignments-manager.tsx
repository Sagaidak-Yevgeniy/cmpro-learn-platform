import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Assignment, Submission } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ClipboardList, CheckCircle2, AlertCircle, FilePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import CreateAssignmentForm from "../teacher/create-assignment-form";

interface AssignmentsManagerProps {
  courseId: number;
}

export default function AssignmentsManager({ courseId }: AssignmentsManagerProps) {
  const [hasNewSubmissions, setHasNewSubmissions] = useState(false);
  
  useEffect(() => {
    const checkNewSubmissions = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/submissions/new`);
        if (response.ok) {
          const data = await response.json();
          setHasNewSubmissions(data.hasNew);
        }
      } catch (error) {
        console.error('Ошибка проверки новых работ:', error);
      }
    };
    
    checkNewSubmissions();
    const interval = setInterval(checkNewSubmissions, 60000); // Проверка каждую минуту
    
    return () => clearInterval(interval);
  }, [courseId]);
  const { toast } = useToast();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [grade, setGrade] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [createAssignmentDialogOpen, setCreateAssignmentDialogOpen] = useState(false);
  
  // Запрос для получения заданий курса
  const assignmentsQuery = useQuery<Assignment[]>({
    queryKey: ["/api/assignments", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/assignments?courseId=${courseId}`);
      if (!res.ok) throw new Error("Не удалось загрузить задания");
      return res.json();
    },
    enabled: Boolean(courseId),
  });
  
  // Запрос для получения работ по выбранному заданию
  const submissionsQuery = useQuery<Submission[]>({
    queryKey: ["/api/submissions", selectedAssignment?.id],
    queryFn: async () => {
      const res = await fetch(`/api/submissions?assignmentId=${selectedAssignment?.id}`);
      if (!res.ok) throw new Error("Не удалось загрузить работы студентов");
      return res.json();
    },
    enabled: Boolean(selectedAssignment),
  });
  
  // Мутация для обновления оценки и отзыва
  const gradeSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, grade, feedback }: { submissionId: number, grade: number, feedback: string }) => {
      const res = await apiRequest("PATCH", `/api/submissions/${submissionId}`, {
        grade,
        feedback
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Оценка сохранена",
        description: "Работа студента успешно проверена",
      });
      setGradeDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/submissions", selectedAssignment?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при сохранении оценки",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Обработчик отправки оценки
  const handleGradeSubmit = () => {
    if (!selectedSubmission || grade === null) return;
    
    gradeSubmissionMutation.mutate({
      submissionId: selectedSubmission.id,
      grade,
      feedback
    });
  };
  
  // Открытие диалога оценки
  const openGradeDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || null);
    setFeedback(submission.feedback || "");
    setGradeDialogOpen(true);
  };
  
  const handleCloseCreateDialog = (created: boolean) => {
    if (created) {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments", courseId] });
    }
    setCreateAssignmentDialogOpen(false);
  };
  
  // Расчет процента проверенных работ
  const getSubmissionStats = () => {
    if (!submissionsQuery.data) return { total: 0, graded: 0, percent: 0 };
    
    const total = submissionsQuery.data.length;
    const graded = submissionsQuery.data.filter(sub => sub.grade !== null).length;
    const percent = total > 0 ? Math.round((graded / total) * 100) : 0;
    
    return { total, graded, percent };
  };
  
  const submissionStats = getSubmissionStats();
  
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Управление заданиями</h2>
        <Button onClick={() => setCreateAssignmentDialogOpen(true)}>
          <FilePlus className="mr-2 h-4 w-4" />
          Создать задание
        </Button>
      </div>
      
      {/* Диалог создания задания */}
      <Dialog open={createAssignmentDialogOpen} onOpenChange={setCreateAssignmentDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создание нового задания</DialogTitle>
            <DialogDescription>
              Создайте задание для студентов курса с описанием и сроком выполнения.
            </DialogDescription>
          </DialogHeader>
          {courseId && 
            <CreateAssignmentForm courseId={courseId} onSuccess={() => handleCloseCreateDialog(true)} />
          }
        </DialogContent>
      </Dialog>
      
      {/* Список заданий */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignmentsQuery.isLoading ? (
          <div className="col-span-full flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : assignmentsQuery.isError ? (
          <div className="col-span-full text-center p-8 text-red-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Не удалось загрузить задания. Пожалуйста, попробуйте позже.</p>
          </div>
        ) : assignmentsQuery.data?.length === 0 ? (
          <div className="col-span-full text-center p-8 text-gray-500">
            <ClipboardList className="h-8 w-8 mx-auto mb-2" />
            <p>Заданий пока нет. Создайте первое задание для курса.</p>
          </div>
        ) : (
          assignmentsQuery.data?.map((assignment) => (
            <Card key={assignment.id} className={`hover:shadow-md transition-shadow ${selectedAssignment?.id === assignment.id ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader>
                <CardTitle>{assignment.title}</CardTitle>
                <CardDescription>
                  Срок сдачи: {formatDate(assignment.dueDate)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3">{assignment.description}</p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setSelectedAssignment(assignment)}
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Просмотреть работы
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      {/* Просмотр работ по выбранному заданию */}
      {selectedAssignment && (
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Работы: {selectedAssignment.title}</CardTitle>
                <CardDescription>
                  Срок сдачи: {formatDate(selectedAssignment.dueDate)}
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setSelectedAssignment(null)}>
                Назад к списку
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-6 bg-gray-100 p-4 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">Прогресс проверки:</p>
                  <Badge variant={submissionStats.percent === 100 ? "success" : "secondary"}>
                    {submissionStats.graded}/{submissionStats.total} работ ({submissionStats.percent}%)
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${submissionStats.percent}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Все работы</TabsTrigger>
                <TabsTrigger value="pending">Ожидают проверки</TabsTrigger>
                <TabsTrigger value="graded">Проверенные</TabsTrigger>
              </TabsList>
              
              {submissionsQuery.isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : submissionsQuery.isError ? (
                <div className="text-center p-8 text-red-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Не удалось загрузить работы студентов. Пожалуйста, попробуйте позже.</p>
                </div>
              ) : submissionsQuery.data?.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2" />
                  <p>Пока нет работ от студентов по этому заданию.</p>
                </div>
              ) : (
                <>
                  <TabsContent value="all">
                    <ScrollArea className="h-[400px]">
                      <SubmissionList 
                        submissions={submissionsQuery.data || []} 
                        onGrade={openGradeDialog} 
                      />
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="pending">
                    <ScrollArea className="h-[400px]">
                      <SubmissionList 
                        submissions={(submissionsQuery.data || []).filter(sub => sub.grade === null)} 
                        onGrade={openGradeDialog} 
                      />
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="graded">
                    <ScrollArea className="h-[400px]">
                      <SubmissionList 
                        submissions={(submissionsQuery.data || []).filter(sub => sub.grade !== null)} 
                        onGrade={openGradeDialog} 
                      />
                    </ScrollArea>
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      {/* Диалог выставления оценки */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Проверка работы студента</DialogTitle>
            <DialogDescription>
              Оцените работу и оставьте комментарий для студента.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Содержание работы:</h4>
                  <div className="mt-2 p-4 bg-gray-50 rounded-md max-h-[200px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{selectedSubmission.content}</pre>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="grade">Оценка (от 0 до 100)</Label>
                  <Input
                    id="grade"
                    type="number"
                    min="0"
                    max="100"
                    value={grade === null ? "" : grade}
                    onChange={(e) => setGrade(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="feedback">Комментарий к работе</Label>
                  <Textarea
                    id="feedback"
                    rows={4}
                    placeholder="Напишите комментарий для студента"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setGradeDialogOpen(false)}>
                  Отмена
                </Button>
                <Button 
                  type="button" 
                  onClick={handleGradeSubmit}
                  disabled={gradeSubmissionMutation.isPending}
                >
                  {gradeSubmissionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Сохранить оценку
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SubmissionListProps {
  submissions: Submission[];
  onGrade: (submission: Submission) => void;
}

function SubmissionList({ submissions, onGrade }: SubmissionListProps) {
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (submissions.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>В данной категории нет работ.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <Card key={submission.id}>
          <CardHeader className="py-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base">Студент #{submission.userId}</CardTitle>
                <CardDescription>
                  Отправлено: {formatDate(submission.submitted)}
                </CardDescription>
              </div>
              <Badge variant={submission.grade !== null ? "success" : "outline"}>
                {submission.grade !== null ? `Оценка: ${submission.grade}/100` : "Ожидает проверки"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-sm line-clamp-2">
              {submission.content}
            </div>
          </CardContent>
          <CardFooter className="py-3">
            <Button 
              variant={submission.grade !== null ? "outline" : "default"}
              size="sm"
              className="ml-auto"
              onClick={() => onGrade(submission)}
            >
              {submission.grade !== null ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Изменить оценку
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Проверить работу
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}