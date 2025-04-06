import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import CourseList from "@/components/courses/course-list";
import { Course } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CourseCard from "@/components/courses/course-card";


export default function HomePage() {
  const { user } = useAuth();

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    enabled: !user // Only fetch featured courses for guests
  });

  // If user is authenticated, redirect to appropriate dashboard
  if (user) {
    if (user.role === "teacher") {
      return <TeacherHomePage />;
    } else {
      return <StudentHomePage />;
    }
  }

  return (
    <main>
      {/* Hero section */}
      <div className="relative">
        <div className="absolute inset-0">
          <img 
            className="h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&h=500&q=80" 
            alt="Образование" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-800 mix-blend-multiply" aria-hidden="true"></div>
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Учебная платформа для всех
          </h1>
          <p className="mt-6 max-w-xl text-xl text-gray-100">
            Получайте новые знания, совершенствуйте навыки и расширяйте свои горизонты с нашими онлайн-курсами.
          </p>
          <div className="mt-10">
            <Link href="/courses">
              <Button size="lg" className="bg-[#FF9800] hover:bg-orange-600 text-white px-8 py-3 rounded-md shadow-md hover:shadow-lg transition duration-300">
                Начать обучение
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Почему выбирают нас</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="ml-4 text-xl font-medium text-gray-900">Современные курсы</h3>
            </div>
            <div className="mt-4 text-base text-gray-600">
              Все материалы регулярно обновляются и соответствуют современным стандартам образования.
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="ml-4 text-xl font-medium text-gray-900">Индивидуальный подход</h3>
            </div>
            <div className="mt-4 text-base text-gray-600">
              Каждый студент может выстраивать своё обучение по индивидуальной траектории.
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="ml-4 text-xl font-medium text-gray-900">Квалифицированные преподаватели</h3>
            </div>
            <div className="mt-4 text-base text-gray-600">
              С вами работают профессионалы с большим опытом преподавания и практики.
            </div>
          </div>
        </div>
      </div>

      {/* Categories section */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">Популярные категории</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/courses?category=programming" className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition duration-300 cursor-pointer">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#00BCD4] text-white mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Программирование</h3>
              <p className="text-sm text-gray-600">{courses?.filter(c => c.category === 'programming').length || 0} курсов</p>
            </Link>

            <Link href="/courses?category=business" className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition duration-300 cursor-pointer">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#FF9800] text-white mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Бизнес и менеджмент</h3>
              <p className="text-sm text-gray-600">{courses?.filter(c => c.category === 'business').length || 0} курсов</p>
            </Link>

            <Link href="/courses?category=science" className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition duration-300 cursor-pointer">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Наука и инженерия</h3>
              <p className="text-sm text-gray-600">{courses?.filter(c => c.category === 'science').length || 0} курсов</p>
            </Link>

            <Link href="/courses?category=humanities" className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition duration-300 cursor-pointer">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#48BB78] text-white mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Языки и гуманитарные науки</h3>
              <p className="text-sm text-gray-600">{courses?.filter(c => c.category === 'humanities').length || 0} курсов</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Courses section */}
      {courses && courses.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">Популярные курсы</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Replaced CourseList with CourseCard mapping */}
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <Link href="/courses" className="no-underline">
              <Button className="px-8">Смотреть все курсы</Button>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

function StudentHomePage() {
  const { data: stats } = useQuery({
    queryKey: ["/api/student/stats"],
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Панель студента</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Мои курсы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.enrolledCourses || 0}</div>
            <p className="text-sm text-muted-foreground">Активных курсов</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Прогресс</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.completedAssignments || 0}/{stats?.totalAssignments || 0}
            </div>
            <p className="text-sm text-muted-foreground">Выполнено заданий</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Средний балл</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.courseData?.reduce((acc, course) => acc + (course.grade || 0), 0) / (stats?.courseData?.length || 1)}%
            </div>
            <p className="text-sm text-muted-foreground">По всем курсам</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Последние курсы</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.courseData?.slice(0, 3).map((enrollment) => (
              <Link 
                key={enrollment.courseId} 
                href={`/courses/${enrollment.courseId}`}
                className="block p-4 hover:bg-muted rounded-lg mb-2 last:mb-0"
              >
                <div className="font-medium">{enrollment.course.title}</div>
                <div className="text-sm text-muted-foreground">
                  Прогресс: {enrollment.progress}%
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function TeacherHomePage() {
  const { data: stats } = useQuery({
    queryKey: ["/api/teacher/stats"],
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Панель преподавателя</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Мои курсы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalCourses || 0}</div>
            <p className="text-sm text-muted-foreground">Активных курсов</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Студенты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-sm text-muted-foreground">Всего студентов</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Проверка</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.pendingSubmissions || 0}</div>
            <p className="text-sm text-muted-foreground">Работ на проверке</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Активные курсы</CardTitle>
            <Link href="/teacher">
              <Button variant="ghost">Все курсы</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.courses?.slice(0, 3).map((course) => (
              <div key={course.id} className="p-4 hover:bg-muted rounded-lg mb-2 last:mb-0">
                <div className="font-medium">{course.title}</div>
                <div className="text-sm text-muted-foreground">
                  {course.studentCount} студентов
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}