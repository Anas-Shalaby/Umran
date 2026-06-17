import { NavigationProgressBar } from "@/components/navigation-progress-bar";

export default function DashboardLayout({ children }) {
  return (
    <>
      <NavigationProgressBar />
      {children}
    </>
  );
}
