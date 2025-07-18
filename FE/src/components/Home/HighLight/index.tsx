"use client"; // This component uses client-side hooks like useState and useRef

import type React from "react";
import Image from "next/image";
import { Card } from "antd"; // Import Ant Design Card
import { useRef, useEffect, useState } from "react";

const featuredLocations = [
  {
    id: 1,
    name: "TP. Hồ Chí Minh",
    cars: "5000+ xe",
    image: "/images/hcm.jpg",
  },
  {
    id: 2,
    name: "Hà Nội",
    cars: "2500+ xe",
    image: "/placeholder.svg",
  },
  {
    id: 3,
    name: "Đà Nẵng",
    cars: "500+ xe",
    image: "/placeholder.svg",
  },
  {
    id: 5,
    name: "Hải Phòng",
    cars: "300+ xe",
    image: "/placeholder.svg",
  },
  {
    id: 8,
    name: "Nha Trang",
    cars: "100+ xe",
    image: "/placeholder.svg",
  },
  {
    id: 9,
    name: "Đà Lạt",
    cars: "100+ xe",
    image: "/placeholder.svg",
  },
  {
    id: 10,
    name: "Vũng Tàu",
    cars: "80+ xe",
    image: "/placeholder.svg",
  },
  {
    id: 11,
    name: "Phú Quốc",
    cars: "70+ xe",
    image: "/placeholder.svg",
  },
  {
    id: 12,
    name: "Quảng Ninh",
    cars: "60+ xe",
    image: "/placeholder.svg",
  },
  {
    id: 13,
    name: "Thanh Hóa",
    cars: "50+ xe",
    image: "/placeholder.svg",
  },
];

const HighLight: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollAmount, setScrollAmount] = useState(0);

  // Calculate scroll amount dynamically based on the first card's width
  useEffect(() => {
    const calculateScrollAmount = () => {
      if (
        scrollContainerRef.current &&
        scrollContainerRef.current.firstElementChild
      ) {
        const cardWidth =
          scrollContainerRef.current.firstElementChild.getBoundingClientRect()
            .width;
        const gap = 16; // Assuming space-x-4 means 16px gap
        setScrollAmount(cardWidth + gap);
      }
    };

    calculateScrollAmount();
    window.addEventListener("resize", calculateScrollAmount);

    return () => {
      window.removeEventListener("resize", calculateScrollAmount);
    };
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } =
          scrollContainerRef.current;

        // Check if we are at the end of the scrollable area
        // Use a small tolerance for floating point comparisons
        if (scrollLeft + clientWidth >= scrollWidth - 5) {
          // If at the end, scroll back to the beginning
          scrollContainerRef.current.scrollTo({
            left: 0,
            behavior: "smooth",
          });
        } else {
          // Otherwise, scroll to the next position
          scrollContainerRef.current.scrollBy({
            left: scrollAmount,
            behavior: "smooth",
          });
        }
      }
    }, 2000); // Scroll every 2 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [scrollAmount]); // Re-run effect if scrollAmount changes

  return (
    <section
      id="highlights"
      className="container max-w-8xl mx-auto px-5 2xl:px-0 py-12 md:py-24 lg:py-32 bg-white"
    >
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-8">
          Địa Điểm Nổi Bật
        </h2>
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto space-x-4"
            // Inline styles for hiding scrollbar (Firefox, IE/Edge)
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Custom CSS for Webkit browsers (Chrome, Safari) to hide scrollbar */}
            <style jsx>{`
              .overflow-x-auto::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {featuredLocations.map((location) => (
              <div
                key={location.id}
                className="flex-none w-[calc(100%-32px)] sm:w-[calc(50%-16px)] lg:w-[calc(33.33%-16px)] xl:w-[calc(25%-12px)]"
              >
                <Card
                  className="relative h-64 w-full overflow-hidden rounded-xl shadow-lg"
                  bodyStyle={{ padding: 0 }} // Remove default Ant Design Card padding
                >
                  <Image
                    src={location.image || "/placeholder.svg"}
                    alt={location.name}
                    width={400}
                    height={300}
                    className="absolute inset-0 h-full w-full object-cover object-center [clip-path:polygon(0_0,100%_0,100%_85%,0%_100%)]"
                  />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-semibold">{location.name}</h3>
                    <p className="text-sm">{location.cars}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HighLight;
