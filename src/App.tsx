import TeachersPage from "./pages/admin/Teachers";
            <Route
              path="/admin/teachers"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <TeachersPage />
                </ProtectedRoute>
              }
            />
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthRedirect } from "@/components/auth/AuthRedirect";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import StudentsPage from "./pages/admin/Students";
import StudentOverviewPage from "./pages/admin/StudentOverview";
import UsersPage from "./pages/admin/Users";
import FinancialPage from "./pages/admin/Financial";
import ClassesPage from "./pages/admin/Classes";
import StudentHome from "./pages/student/StudentHome";
import StudentHistory from "./pages/student/StudentHistory";
import StudentFinancial from "./pages/student/StudentFinancial";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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

            {/* Student Routes - Protected */}
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
