import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User as UserIcon, Settings, BookOpen, Home, List } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="text-primary font-bold text-2xl cursor-pointer">Учебная Платформа</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/" className={`${location === '/' ? 'border-primary text-gray-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-primary'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Главная
              </Link>
              <Link href="/courses" className={`${location === '/courses' || location.includes('/courses/') ? 'border-primary text-gray-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-primary'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Курсы
              </Link>
              {user && user.role === "student" && (
                <Link href="/my-courses" className={`${location === '/my-courses' ? 'border-primary text-gray-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-primary'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Мои курсы
                </Link>
              )}
              {user && user.role === "teacher" && (
                <Link href="/teacher" className={`${location === '/teacher' ? 'border-primary text-gray-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-primary'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Панель преподавателя
                </Link>
              )}
            </nav>
          </div>

          {/* User menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-gray-300 transition duration-150 ease-in-out">
                    <Avatar>
                      <AvatarImage src={user.avatar || ""} alt={user.name} />
                      <AvatarFallback className="bg-primary text-white">
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-4 py-2 text-sm text-gray-700">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.username}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {user.role === "teacher" && (
                    <Link href="/teacher">
                      <DropdownMenuItem>
                        <BookOpen className="mr-2 h-4 w-4" />
                        <span>Мои курсы</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Профиль</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Настройки</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Выйти</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex space-x-2">
                <Link href="/auth">
                  <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                    Войти
                  </Button>
                </Link>
                <Link href="/auth?tab=register">
                  <Button className="bg-primary text-white hover:bg-primary/90">
                    Регистрация
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2">
                  <List className="h-6 w-6" />
                  <span className="sr-only">Открыть меню</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="py-4">
                  <div className="space-y-1 px-2 pb-3 pt-2">
                    <Link href="/" className="flex items-center gap-3 text-primary rounded-md px-3 py-2 text-base font-medium">
                      <Home className="h-5 w-5" />
                      Главная
                    </Link>
                    <Link href="/courses" className="flex items-center gap-3 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-md px-3 py-2 text-base font-medium">
                      <BookOpen className="h-5 w-5" />
                      Курсы
                    </Link>
                    {user && user.role === "student" && (
                      <Link href="/my-courses" className="flex items-center gap-3 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-md px-3 py-2 text-base font-medium">
                        <BookOpen className="h-5 w-5" />
                        Мои курсы
                      </Link>
                    )}
                    {user && user.role === "teacher" && (
                      <Link href="/teacher" className="flex items-center gap-3 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-md px-3 py-2 text-base font-medium">
                        <BookOpen className="h-5 w-5" />
                        Панель преподавателя
                      </Link>
                    )}
                  </div>

                  {user ? (
                    <div className="pt-4 pb-3 border-t border-gray-200">
                      <div className="flex items-center px-4">
                        <div className="flex-shrink-0">
                          <Avatar>
                            <AvatarImage src={user.avatar || ""} alt={user.name} />
                            <AvatarFallback className="bg-primary text-white">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="ml-3">
                          <div className="text-base font-medium text-gray-800">{user.name}</div>
                          <div className="text-sm font-medium text-gray-500">{user.username}</div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1 px-2">
                        <button className="flex w-full items-center gap-3 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-md px-3 py-2 text-base font-medium">
                          <UserIcon className="h-5 w-5" />
                          Профиль
                        </button>
                        <button className="flex w-full items-center gap-3 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-md px-3 py-2 text-base font-medium">
                          <Settings className="h-5 w-5" />
                          Настройки
                        </button>
                        <button 
                          className="flex w-full items-center gap-3 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-md px-3 py-2 text-base font-medium"
                          onClick={() => logoutMutation.mutate()}
                          disabled={logoutMutation.isPending}
                        >
                          <LogOut className="h-5 w-5" />
                          Выйти
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 pb-3 border-t border-gray-200 px-4">
                      <Link href="/auth">
                        <Button variant="outline" className="w-full mb-2">
                          Войти
                        </Button>
                      </Link>
                      <Link href="/auth?tab=register">
                        <Button className="w-full">
                          Регистрация
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}