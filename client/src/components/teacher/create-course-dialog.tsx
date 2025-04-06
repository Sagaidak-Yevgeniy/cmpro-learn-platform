import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import CreateCourseForm from "./create-course-form";

export default function CreateCourseDialog() {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="inline-flex items-center">
          <PlusCircle className="mr-2 h-5 w-5" />
          Создать новый курс
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создание нового курса</DialogTitle>
          <DialogDescription>
            Заполните информацию о курсе CodeMastersPRO. Все поля, отмеченные звездочкой (*), обязательны для заполнения.
          </DialogDescription>
        </DialogHeader>
        <CreateCourseForm 
          onSuccess={async (course) => {
            try {
              if (course.imageFile) {
                const formData = new FormData();
                formData.append("image", course.imageFile);
                
                const response = await fetch(`/api/courses/${course.id}/image`, {
                  method: "PUT",
                  body: formData,
                });
                
                if (!response.ok) {
                  throw new Error("Ошибка при загрузке изображения");
                }
              }
              setOpen(false);
            } catch (error) {
              console.error("Ошибка при загрузке изображения:", error);
            }
          }} 
        />
      </DialogContent>
    </Dialog>
  );
}