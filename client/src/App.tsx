import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import CoursesPage from "@/pages/courses-page";
import MyCoursesPage from "@/pages/my-courses-page";
import CourseDetailsPage from "@/pages/course-details-page";
import TeacherDashboard from "@/pages/teacher-dashboard";
import { ProtectedRoute } from "./lib/protected-route";
import Header from "./components/layout/header";
import Footer from "./components/layout/footer";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/courses" component={CoursesPage} />
          <Route path="/courses/:id" component={CourseDetailsPage} />
          <ProtectedRoute path="/my-courses" component={MyCoursesPage} />
          <ProtectedRoute path="/teacher" component={TeacherDashboard} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
