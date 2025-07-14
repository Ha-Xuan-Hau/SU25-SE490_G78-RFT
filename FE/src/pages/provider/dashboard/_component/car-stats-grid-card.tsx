import { Card, CardContent } from "@/components/ui/card";
import CarStatsCard from "./car-stats-card";
import { Car, Key, Gauge, CarFront } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming cn utility is available

export default function CarStatsGridCard() {
  const stats = [
    {
      title: "Xe hoạt động",
      value: "150",
      icon: Car,
      bgColor: "bg-green-500",
      iconColor: "text-green-500",
    },
    {
      title: "Xe đang thuê",
      value: "80",
      icon: Key,
      bgColor: "bg-blue-600",
      iconColor: "text-blue-600",
    },
    {
      title: "Xe đang chạy",
      value: "65",
      icon: Gauge,
      bgColor: "bg-teal-500",
      iconColor: "text-teal-500",
    },
    {
      title: "Tổng tất cả xe",
      value: "200",
      icon: CarFront,
      bgColor: "bg-yellow-500",
      iconColor: "text-yellow-500",
    },
  ];

  return (
    <Card className="rounded-lg shadow-sm overflow-hidden">
      <CardContent className="p-0 grid grid-cols-2 h-full">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={cn(
              "relative",
              { "border-r border-b border-gray-200": index === 0 }, // Top-left: right and bottom border
              { "border-b border-gray-200": index === 1 }, // Top-right: bottom border
              { "border-r border-gray-200": index === 2 }, // Bottom-left: right border
              // No border for bottom-right (index 3)
              { "rounded-tl-lg": index === 0 },
              { "rounded-tr-lg": index === 1 },
              { "rounded-bl-lg": index === 2 },
              { "rounded-br-lg": index === 3 }
            )}
          >
            <CarStatsCard {...stat} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
