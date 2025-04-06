
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, FileText, Video, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function CourseMaterialsPage() {
  const { id } = useParams();
  const courseId = parseInt(id || "0");

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
  });

  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}/materials`],
  });

  const isLoading = courseLoading || materialsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => window.history.back()}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Назад к курсу
      </Button>

      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{course?.title}</h1>
            <p className="text-gray-500">Материалы курса</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Учебные материалы</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {materials && materials.length > 0 ? (
                <div className="space-y-4">
                  {materials.map((material: any) => (
                    <Card key={material.id} className="group hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 p-3 rounded-lg">
                            {material.type === 'video' ? (
                              <Video className="h-6 w-6 text-primary" />
                            ) : (
                              <FileText className="h-6 w-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium mb-1">{material.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {material.type === 'video' ? 'Видео' : 'Документ'}
                              </Badge>
                              {material.duration && (
                                <span className="text-sm text-gray-500">
                                  {material.duration} мин
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => window.open(`/uploads/${material.fileUrl}`, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Скачать
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Материалы пока не добавлены
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
