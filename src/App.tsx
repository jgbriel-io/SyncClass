import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthRedirect } from "@/components/auth/AuthRedirect";
import { setupAuthErrorHandler } from "@/lib/auth-error-handler";
import { validateEnvironment } from "@/lib/env-validator";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import StudentsPage from "./pages/admin/Students";
import StudentOverviewPage from "./pages/admin/StudentOverview";
import UsersPage from "./pages/admin/Users";
import FinancialPage from "./pages/admin/Financial";
import ClassesPage from "./pages/admin/Classes";
// import removido: TeachersPage de admin/Teachers
import StudentHome from "./pages/student/StudentHome";
import StudentHistory from "./pages/student/StudentHistory";
import StudentFinancial from "./pages/student/StudentFinancial";
import StudentPanel from "./pages/StudentPanel";
import NotFound from "./pages/NotFound";
import AdminTeachersPage from "./pages/admin/Teachers";
import TeacherHome from "./pages/teacher/TeacherHome";
import TeacherStudentsPage from "./pages/teacher/TeacherStudents";
import TeacherFinancialPage from "./pages/teacher/TeacherFinancial";
import TeacherOverviewPage from "./pages/teacher/TeacherOverview";
import TeacherPedagogicalPage from "./pages/teacher/TeacherPedagogical";

const queryClient = new QueryClient();

// Validate environment variables
validateEnvironment();

// Setup global auth error handler for refresh token errors
setupAuthErrorHandler();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes with auth redirect */}
            <Route
              path="/"
              element={
                <AuthRedirect>
                  <Navigate to="/login" replace />
                </AuthRedirect>
              }
            />
            <Route
              path="/login"
              element={
                <AuthRedirect>
                  <Login />
                </AuthRedirect>
              }
            />

            {/* Admin Routes - Protected */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <StudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/overview"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <StudentOverviewPage />
              </ProtectedRoute>
            }
            />
            <Route
              path="/admin/financial"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <FinancialPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/classes"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ClassesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/teachers"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminTeachersPage />
                </ProtectedRoute>
              }
            />

            {/* Teacher Routes - Protected */}
            <Route
              path="/teachers"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/students"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/overview"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/financial"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherFinancialPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/classes"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <TeacherPedagogicalPage />
                </ProtectedRoute>
              }
            />

            {/* Student Routes - Protected */}
            <Route
              path="/students"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/history"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/financial"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentFinancial />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
