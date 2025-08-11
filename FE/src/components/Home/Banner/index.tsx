"use client";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useState } from "react";
import Link from "next/link";

const Banner: React.FC = () => {
  const [activeService, setActiveService] = useState("self-drive");

  return (
    <section className="relative min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/bg-landing.png"
          alt="RFT Background"
          fill
          priority={true}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-20 items-center">
          {/* Column 1: Text Content */}
          <div className="text-white lg:col-span-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              RFT - Cùng Bạn
              <br />
              Đến Mọi Hành Trình
            </h1>
            <p className="text-lg md:text-xl font-medium mb-8">
              Trải nghiệm sự khác biệt từ{" "}
              <span className="text-yellow-400 font-semibold">hơn 10.000</span>{" "}
              xe gia đình đời mới khắp Việt Nam
            </p>
          </div>

          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Column 2: Service Showcase */}
          <div className="bg-white rounded-xl shadow-2xl p-6 lg:col-span-2">
            {/* Header - Giới thiệu dịch vụ */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Bạn đang tìm xe?
              </h2>
            </div>

            {/* Service Options - Showcase style */}
            <div className="space-y-4 mb-6">
              {/* Self Drive Service */}
              <div
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all duration-300 ${
                  activeService === "self-drive"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                }`}
                onClick={() => setActiveService("self-drive")}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-full ${
                      activeService === "self-drive"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Icon icon="mdi:car-key" width={24} height={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Xe Tự Lái
                    </h3>
                    <p className="text-sm text-gray-600">
                      Tự do lái xe theo lịch trình của bạn
                    </p>
                  </div>
                </div>
              </div>

              {/* Driver Service */}
              <div
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all duration-300 ${
                  activeService === "driver"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                }`}
                onClick={() => setActiveService("driver")}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-full ${
                      activeService === "driver"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Icon icon="mdi:account-tie-hat" width={24} height={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Xe Có Tài Xế
                    </h3>
                    <p className="text-sm text-gray-600">
                      Thoải mái tận hưởng chuyến đi
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Types Available */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Icon
                  icon="mdi:check-circle"
                  className="text-green-500"
                  width={16}
                />
                Loại xe có sẵn:
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeService === "self-drive" ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                      <Icon icon="mdi:car" width={14} />Ô tô
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                      <Icon icon="mdi:motorcycle" width={14} />
                      Xe máy
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                      <Icon icon="mdi:bicycle" width={14} />
                      Xe đạp
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                    <Icon icon="mdi:car" width={14} />Ô tô
                  </span>
                )}
              </div>
            </div>

            {/* Call to Action */}
            <div className="space-y-3">
              <Link href="/vehicles" className="block">
                <button className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white rounded-lg py-4 px-6 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group">
                  <Icon icon="mdi:magnify" width={20} />
                  Khám Phá Xe Ngay
                  <Icon
                    icon="mdi:arrow-right"
                    width={16}
                    className="group-hover:translate-x-1 transition-transform duration-200"
                  />
                </button>
              </Link>

              <p className="text-center text-xs text-gray-500">
                Tìm kiếm và đặt xe phù hợp với nhu cầu của bạn
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
