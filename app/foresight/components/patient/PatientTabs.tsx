"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export type PatientTabKey =
  | "overview"
  | "carePlan"
  | "encounters"
  | "serviceElements"
  | "activity"
  | "messages";

const TABS: { key: PatientTabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "carePlan", label: "Care Plan" },
  { key: "encounters", label: "Encounters" },
  { key: "serviceElements", label: "Service Elements" },
  { key: "activity", label: "Activity" },
  { key: "messages", label: "Messages" },
];

/**
 * Patient detail section switcher built on shadcn's NavigationMenu.
 * Items are controlled buttons (no route navigation) — clicking just flips
 * the parent's `value` state.
 */
export function PatientTabs({
  value,
  onChange,
}: {
  value: PatientTabKey;
  onChange: (v: PatientTabKey) => void;
}) {
  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        {TABS.map((t) => {
          const active = t.key === value;
          return (
            <NavigationMenuItem key={t.key}>
              <NavigationMenuLink
                asChild
                active={active}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "rounded-full px-4 text-xs font-medium",
                  active
                    ? "bg-foresight text-white hover:bg-foresight-dark hover:text-white focus:bg-foresight focus:text-white data-[active=true]:bg-foresight data-[active=true]:text-white"
                    : "text-brand-700 bg-transparent hover:bg-foresight/10 hover:text-foresight-dark focus:bg-foresight/10 focus:text-foresight-dark",
                )}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onChange(t.key)}
                >
                  {t.label}
                </button>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
