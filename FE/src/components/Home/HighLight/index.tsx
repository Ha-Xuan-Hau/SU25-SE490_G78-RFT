"use client";

import type React from "react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const featuredLocations = [
  {
    id: 1,
    name: "Hồ Chí Minh",
    image: "/images/hightlight/hcm.jpg",
  },
  {
    id: 2,
    name: "Đà Nẵng",
    image: "/images/hightlight/da_nang.jpg",
  },
  {
    id: 3,
    name: "Hà Nội",
    image: "/images/hightlight/ha_noi.jpg",
  },
  {
    id: 4,
    name: "Bình Dương",
    image: "/images/hightlight/binh_duong.jpg",
  },
  {
    id: 5,
    name: "Hải Phòng",
    image: "/images/hightlight/hai_phong.jpg",
  },
  {
    id: 6,
    name: "Nha Trang",
    image: "/images/hightlight/nha_trang.jpg",
  },
  {
    id: 7,
    name: "Đà Lạt",
    image: "/images/hightlight/da_lat.jpg",
  },
  {
    id: 8,
    name: "Vũng Tàu",
    image: "/images/hightlight/vung_tau.jpg",
  },
  {
    id: 9,
    name: "Phú Quốc",
    image: "/images/hightlight/phu_quoc.jpg",
  },
  {
    id: 10,
    name: "Quảng Ninh",
    image: "/images/hightlight/quang_ninh.jpg",
  },
  {
    id: 11,
    name: "Thanh Hóa",
    image: "/images/hightlight/thanh_hoa.jpg",
  },
  {
    id: 12,
    name: "Nam Định",
    image: "/images/hightlight/nam_dinh.jpg",
  },
  {
    id: 13,
    name: "Thừa Thiên Huế",
    image: "/images/hightlight/hue.jpg",
  },
];

const HighLight: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll =
        direction === "left"
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });
    }
  };

  // Auto slide effect
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } =
          scrollContainerRef.current;

        // Nếu đã scroll đến cuối, quay lại đầu
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollContainerRef.current.scrollTo({
            left: 0,
            behavior: "smooth",
          });
        } else {
          // Scroll sang phải
          scroll("right");
        }
      }
    }, 3000); // Tự động chuyển sau mỗi 3 giây

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section className="pt-12 pb-6 bg-white">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <h2 className="text-3xl font-bold text-center mb-8">
          Địa Điểm Nổi Bật
        </h2>

        <div
          className="flex items-center gap-4"
          onMouseEnter={() => setIsPaused(true)} // Dừng khi hover
          onMouseLeave={() => setIsPaused(false)} // Tiếp tục khi không hover
        >
          {/* Previous Button */}
          <button
            onClick={() => {
              scroll("left");
              setIsPaused(true); // Dừng auto slide khi user tương tác
              setTimeout(() => setIsPaused(false), 5000); // Resume sau 5 giây
            }}
            className="flex-shrink-0 bg-white hover:bg-gray-100 rounded-full p-2 shadow-md border border-gray-200 transition-all"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide flex-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {featuredLocations.map((location) => (
              <div key={location.id} className="flex-none group cursor-pointer">
                <div className="relative w-[240px] h-[185px] rounded-lg overflow-hidden">
                  <Image
                    src={location.image || "/placeholder.svg"}
                    alt={location.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-medium text-lg">
                      {location.name}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => {
              scroll("right");
              setIsPaused(true); // Dừng auto slide khi user tương tác
              setTimeout(() => setIsPaused(false), 5000); // Resume sau 5 giây
            }}
            className="flex-shrink-0 bg-white hover:bg-gray-100 rounded-full p-2 shadow-md border border-gray-200 transition-all"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HighLight;
