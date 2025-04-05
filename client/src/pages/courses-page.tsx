import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Course } from "@shared/schema";
import CourseList from "@/components/courses/course-list";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CategoryType = "all" | "programming" | "business" | "science" | "humanities";

export default function CoursesPage() {
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });
  
  const [searchParams] = useSearch();
  const initialCategory = (searchParams?.category as CategoryType) || "all";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(initialCategory);

  const filteredCourses = courses?.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categoryLabels: Record<CategoryType, string> = {
    all: "Все категории",
    programming: "Программирование",
    business: "Бизнес и менеджмент",
    science: "Наука и инженерия",
    humanities: "Языки и гуманитарные науки"
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Каталог курсов
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Выберите курс, который подходит именно вам
        </p>
      </div>

      {/* Search and filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex items-center relative flex-grow">
          <Search className="absolute left-3 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск курсов..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <Select
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as CategoryType)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredCourses && filteredCourses.length > 0 ? (
        <CourseList courses={filteredCourses} />
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">
            Курсы не найдены
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Попробуйте изменить параметры поиска.
          </p>
          {searchTerm || selectedCategory !== "all" ? (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
            >
              Сбросить фильтры
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
