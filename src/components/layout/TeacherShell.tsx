import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import TeacherLayout from "@/components/layout/TeacherLayout";

const ContentLoader = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export default function TeacherShell() {
  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <TeacherLayout>
        <Suspense fallback={<ContentLoader />}>
          <Outlet />
        </Suspense>
      </TeacherLayout>
    </ProtectedRoute>
  );
}
