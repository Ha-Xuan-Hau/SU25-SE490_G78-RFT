import type React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface CourseStatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  bgColor: string;
  textColor: string;
}

export default function CourseStatsCard({
  title,
  value,
  icon: Icon,
  bgColor,
  textColor,
}: CourseStatsCardProps) {
  return (
    <Card
      className={`relative overflow-hidden rounded-lg shadow-sm ${bgColor}`}
    >
      <CardContent className="p-4 flex flex-col items-start text-white">
        <div className="absolute top-4 right-4 opacity-20">
          <Icon className="w-16 h-16" />
        </div>
        <div className="text-3xl font-bold mb-1" style={{ color: textColor }}>
          {value}
        </div>
        <p className="text-sm" style={{ color: textColor }}>
          {title}
        </p>
      </CardContent>
    </Card>
  );
}
