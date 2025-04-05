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
        <CreateCourseForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}