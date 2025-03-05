import { ReactNode } from "react";
import AdminLayout from "./admin-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}