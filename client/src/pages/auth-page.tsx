import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();

  // Redirect to home if already logged in
  if (user) {
    if (user.role === "teacher") {
      setLocation("/teacher");
    } else {
      setLocation("/");
    }
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="w-full lg:w-1/2 max-w-md mx-auto lg:mx-0">
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Добро пожаловать в Учебную Платформу
              </h1>

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Вход</TabsTrigger>
                  <TabsTrigger value="register">Регистрация</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <LoginForm />
                </TabsContent>
                
                <TabsContent value="register">
                  <RegisterForm />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="w-full lg:w-1/2 max-w-lg mx-auto lg:mx-0">
            <div className="rounded-lg overflow-hidden shadow-xl">
              <div className="relative bg-gradient-to-r from-primary to-blue-700 p-8 text-white">
                <h2 className="text-3xl font-bold mb-4">Учебная платформа для всех</h2>
                <p className="text-lg mb-6">
                  Получайте новые знания, совершенствуйте навыки и расширяйте свои 
                  горизонты с нашими онлайн-курсами.
                </p>

                <div className="space-y-4 mt-8">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-white rounded-full p-2">
                      <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">Современные курсы</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-white rounded-full p-2">
                      <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">Индивидуальный подход</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-white rounded-full p-2">
                      <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">Квалифицированные преподаватели</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
