import { ReactNode } from "react";
import AdminLayout from "./admin-layout";

// This component re-exports AdminLayout to avoid circular dependencies
export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}