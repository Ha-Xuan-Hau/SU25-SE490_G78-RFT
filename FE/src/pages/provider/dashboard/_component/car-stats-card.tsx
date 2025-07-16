import type React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface CarStatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  bgColor: string;
}

export default function CarStatsCard({
  title,
  value,
  icon: Icon,
  bgColor,
}: CarStatsCardProps) {
  return (
    <Card
      className={`relative overflow-hidden rounded-lg shadow-sm ${bgColor} h-full`}
    >
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="absolute top-4 right-4 opacity-20">
          <Icon className="w-16 h-16 text-white" />
        </div>
        <div className="text-3xl font-bold text-white">{value}</div>
        <p className="text-sm text-white opacity-80">{title}</p>
      </CardContent>
    </Card>
  );
}
