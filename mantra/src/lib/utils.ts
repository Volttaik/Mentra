import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function generateContributionGrid(): number[] {
  const grid: number[] = [];
  for (let i = 0; i < 364; i++) {
    const rand = Math.random();
    if (rand < 0.3) grid.push(0);
    else if (rand < 0.5) grid.push(1);
    else if (rand < 0.7) grid.push(2);
    else if (rand < 0.85) grid.push(3);
    else grid.push(4);
  }
  return grid;
}
