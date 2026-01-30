import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthRedirect } from "@/components/auth/AuthRedirect";
import { Loader2 } from "lucide-react";

// Eager loading - páginas críticas (login)
import Login from "./pages/Login";

// Lazy loading - páginas administrativas
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const StudentsPage = lazy(() => import("./pages/admin/Students"));
const StudentOverviewPage = lazy(() => import("./pages/admin/StudentOverview"));
const UsersPage = lazy(() => import("./pages/admin/Users"));
const FinancialPage = lazy(() => import("./pages/admin/Financial"));
const ClassesPage = lazy(() => import("./pages/admin/Classes"));
const AdminTeachersPage = lazy(() => import("./pages/admin/Teachers"));

// Lazy loading - páginas de professor
const TeacherHome = lazy(() => import("./pages/teacher/TeacherHome"));
const TeacherStudentsPage = lazy(() => import("./pages/teacher/TeacherStudents"));
const TeacherFinancialPage = lazy(() => import("./pages/teacher/TeacherFinancial"));
const TeacherOverviewPage = lazy(() => import("./pages/teacher/TeacherOverview"));
const TeacherPedagogicalPage = lazy(() => import("./pages/teacher/TeacherPedagogical"));

// Lazy loading - páginas de estudante
const StudentHome = lazy(() => import("./pages/student/StudentHome"));
const StudentHistory = lazy(() => import("./pages/student/StudentHistory"));
const StudentFinancial = lazy(() => import("./pages/student/StudentFinancial"));
const StudentPanel = lazy(() => import("./pages/StudentPanel"));

// Lazy loading - outras páginas
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
