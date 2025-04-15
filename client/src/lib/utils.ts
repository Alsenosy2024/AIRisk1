import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  if (!date) return "";
  
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  if (!date) return "";
  
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(name: string): string {
  if (!name) return "";
  
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
}

export function downloadAsJson(data: any, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const getColorBySeverity = (severity: string) => {
  switch (severity) {
    case "Critical":
      return { bg: "bg-red-100", text: "text-red-800", color: "#EF4444" };
    case "High":
      return { bg: "bg-yellow-100", text: "text-yellow-800", color: "#F59E0B" };
    case "Medium":
      return { bg: "bg-blue-100", text: "text-blue-800", color: "#6366F1" };
    case "Low":
      return { bg: "bg-green-100", text: "text-green-800", color: "#10B981" };
    case "Very Low":
      return { bg: "bg-gray-100", text: "text-gray-800", color: "#9CA3AF" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-800", color: "#9CA3AF" };
  }
};

export const getColorByCategory = (category: string) => {
  switch (category) {
    case "Technical":
      return { bg: "bg-blue-100", text: "text-blue-800", color: "#3B82F6" };
    case "Financial":
      return { bg: "bg-green-100", text: "text-green-800", color: "#10B981" };
    case "Operational":
      return { bg: "bg-purple-100", text: "text-purple-800", color: "#8B5CF6" };
    case "Security":
      return { bg: "bg-red-100", text: "text-red-800", color: "#EF4444" };
    case "Organizational":
      return { bg: "bg-purple-100", text: "text-purple-800", color: "#8B5CF6" };
    case "External":
      return { bg: "bg-amber-100", text: "text-amber-800", color: "#F59E0B" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-800", color: "#9CA3AF" };
  }
};

export const getColorByStatus = (status: string) => {
  switch (status) {
    case "Identified":
      return { bg: "bg-gray-100", text: "text-gray-800" };
    case "Needs Mitigation":
      return { bg: "bg-yellow-100", text: "text-yellow-800" };
    case "In Progress":
      return { bg: "bg-green-100", text: "text-green-800" };
    case "Mitigated":
      return { bg: "bg-blue-100", text: "text-blue-800" };
    case "Closed":
      return { bg: "bg-gray-100", text: "text-gray-600" };
    case "Accepted":
      return { bg: "bg-purple-100", text: "text-purple-800" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-800" };
  }
};
