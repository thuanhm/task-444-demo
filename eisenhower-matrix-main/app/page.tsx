import { redirect } from "next/navigation";

// Trang gốc: chuyển hướng về giao diện tiếng Việt
export default function RootPage() {
  redirect("/vi");
}
