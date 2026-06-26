import { cn } from "@/lib/utils";

type DashboardSidebarNavItemStyleOptions = {
  isActive?: boolean;
  isCompact?: boolean;
};

export function dashboardSidebarNavItemClassName({
  isActive = false,
  isCompact = false,
}: DashboardSidebarNavItemStyleOptions): string {
  return cn(
    "flex w-full items-center rounded-xl border-2 border-transparent py-2.5 text-lg font-medium transition-[transform,background-color,color] duration-200 ease-out",
    isCompact ? "justify-center gap-0 px-2" : "gap-3 px-3",
    isActive
      ? "bg-[#DDF4FF] border-[#1CB0F6] dark:bg-[#1CB0F6]/15 dark:text-[#49c0f8]"
      : cn(
          "text-muted-foreground",
          "hover:bg-muted hover:text-foreground",
          isCompact ? "hover:translate-x-0" : "hover:translate-x-1",
        ),
  );
}
