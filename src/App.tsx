import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthRedirect } from "@/components/auth/AuthRedirect";
import { Loader2 } from "lucide-react";

// Eager - login e fluxo de senha (páginas públicas)
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Lazy - shells por role (carrega só Admin OU Professor OU Aluno conforme rota)
const AdminShell = lazy(() => import("@/components/layout/AdminShell"));
const TeacherShell = lazy(() => import("@/components/layout/TeacherShell"));
const StudentShell = lazy(() => import("@/components/layout/StudentShell"));

// Lazy - páginas administrativas
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const StudentsPage = lazy(() => import("./pages/admin/Students"));
const OverviewPage = lazy(() => import("./pages/admin/Overview"));
const UsersPage = lazy(() => import("./pages/admin/Users"));
const FinancialPage = lazy(() => import("./pages/admin/Financial"));
const ClassesPage = lazy(() => import("./pages/admin/Classes"));
const AdminTeachersPage = lazy(() => import("./pages/admin/Teachers"));
const AdminActivitiesPage = lazy(() => import("./pages/admin/Activities"));

// Lazy loading - páginas de professor
const TeacherHome = lazy(() => import("./pages/teacher/TeacherHome"));
const TeacherStudentsPage = lazy(() => import("./pages/teacher/TeacherStudents"));
const TeacherFinancialPage = lazy(() => import("./pages/teacher/TeacherFinancial"));
const TeacherOverviewPage = lazy(() => import("./pages/teacher/TeacherOverview"));
const TeacherClassesPage = lazy(() => import("./pages/teacher/TeacherClasses"));
const TeacherActivitiesPage = lazy(() => import("./pages/teacher/TeacherActivities"));

// Lazy loading - páginas de estudante
const StudentHome = lazy(() => import("./pages/student/StudentHome"));
const StudentHistory = lazy(() => import("./pages/student/StudentHistory"));
const StudentFinancial = lazy(() => import("./pages/student/StudentFinancial"));
const StudentCheckout = lazy(() => import("./pages/student/StudentCheckout"));
const StudentActivitiesPage = lazy(() => import("./pages/student/StudentActivities"));
const StudentPanel = lazy(() => import("./pages/StudentPanel"));

// Lazy loading - outras páginas
const NotFound = lazy(() => import("./pages/NotFound"));
const Policies = lazy(() => import("./pages/Policies"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 min - evita refetch desnecessário
      refetchOnWindowFocus: false, // evita "piscada" ao trocar de aba
      refetchOnReconnect: true,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
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
            <Route
              path="/esqueci-senha"
              element={
                <AuthRedirect>
                  <ForgotPassword />
                </AuthRedirect>
              }
            />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            
            {/* Policies - Página pública */}
            <Route path="/policies" element={<Policies />} />

            {/* Admin Routes - layout persistente evita piscada ao trocar abas */}
            <Route path="/admin" element={<AdminShell />}>
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route path="financial" element={<FinancialPage />} />
              <Route path="classes" element={<ClassesPage />} />
              <Route path="activities" element={<AdminActivitiesPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="teachers" element={<AdminTeachersPage />} />
              <Route path="policies" element={<Policies />} />
            </Route>

            {/* Teacher Routes - layout persistente */}
            <Route path="/teachers" element={<TeacherShell />}>
              <Route index element={<TeacherHome />} />
            </Route>
            <Route path="/teacher" element={<TeacherShell />}>
              <Route index element={<TeacherHome />} />
              <Route path="students" element={<TeacherStudentsPage />} />
              <Route path="overview" element={<TeacherOverviewPage />} />
              <Route path="financial" element={<TeacherFinancialPage />} />
              <Route path="classes" element={<TeacherClassesPage />} />
              <Route path="activities" element={<TeacherActivitiesPage />} />
              <Route path="policies" element={<Policies />} />
            </Route>

            {/* Student Routes - layout persistente */}
            <Route path="/students" element={<StudentShell />}>
              <Route index element={<StudentPanel />} />
            </Route>
            <Route path="/student" element={<StudentShell />}>
              <Route index element={<StudentHome />} />
              <Route path="history" element={<StudentHistory />} />
              <Route path="financial" element={<StudentFinancial />} />
              <Route path="financial/checkout/:recordId" element={<StudentCheckout />} />
              <Route path="activities" element={<StudentActivitiesPage />} />
              <Route path="policies" element={<Policies />} />
            </Route>

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
