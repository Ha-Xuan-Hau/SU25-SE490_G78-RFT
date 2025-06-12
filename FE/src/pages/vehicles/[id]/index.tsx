"use client";
import React, { useState } from "react";
import { vehicleCar } from "@/apis/vehicles";
import { useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import Link from "next/link";
import Image from "next/image";

export default function VehicleDetail() {
  const params = useParams();
  const slug = params?.slug as string;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const item = vehicleCar.find((item) => item?.slug === slug);
  const images = item?.images || [];

  const goToPrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  return (
    <section className="!pt-20 pb-20 relative">
      {/* Tăng kích thước container chính lên max-w-[1440px] hoặc max-w-[1600px] */}
      <div className="container mx-auto max-w-[1440px] px-5 2xl:px-8">
        <div className="grid grid-cols-12 mt-8 gap-8">
          {/* Tăng độ rộng của hình ảnh chính */}
          <div className="lg:col-span-8 col-span-12 row-span-2 lg:block hidden">
            {item?.images && item?.images[0] && (
              <div className="">
                <Image
                  src={item.images[0]?.src}
                  alt="Main Property Image"
                  width={800} // Tăng kích thước ảnh
                  height={600} // Tăng kích thước ảnh
                  className="rounded-2xl w-full h-[600px] object-cover" // Tăng chiều cao ảnh và thêm object-cover
                  unoptimized={true}
                />
              </div>
            )}
          </div>
          <div className="lg:col-span-4 lg:block hidden">
            {item?.images && item?.images[1] && (
              <Image
                src={item.images[1]?.src}
                alt="Property Image 2"
                width={500} // Tăng kích thước ảnh
                height={600} // Tăng kích thước ảnh
                className="rounded-2xl w-full h-full object-cover" // Thêm object-cover
                unoptimized={true}
              />
            )}
          </div>
          <div className="lg:col-span-2 col-span-6 lg:block hidden">
            {item?.images && item?.images[2] && (
              <Image
                src={item.images[2]?.src}
                alt="Property Image 3"
                width={400}
                height={500}
                className="rounded-2xl w-full h-full object-cover" // Thêm object-cover
                unoptimized={true}
              />
            )}
          </div>
          <div className="lg:col-span-2 col-span-6 lg:block hidden">
            {item?.images && item?.images[3] && (
              <Image
                src={item.images[3]?.src}
                alt="Property Image 4"
                width={400}
                height={500}
                className="rounded-2xl w-full h-full object-cover" // Thêm object-cover
                unoptimized={true}
              />
            )}
          </div>
        </div>

        {/* Mobile Carousel */}
        <div className="lg:hidden relative mt-8">
          {item?.images && item?.images.length > 0 && (
            <div className="relative h-[350px] w-full">
              <Image
                src={item.images[currentImageIndex]?.src}
                alt={`Vehicle Image ${currentImageIndex + 1}`}
                fill
                className="rounded-xl object-cover"
                unoptimized={true}
              />

              {/* Navigation arrows */}
              <button
                onClick={goToPrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
                aria-label="Previous image"
              >
                <Icon icon="mdi:chevron-left" width={24} height={24} />
              </button>

              <button
                onClick={goToNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
                aria-label="Next image"
              >
                <Icon icon="mdi:chevron-right" width={24} height={24} />
              </button>

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1}/{images.length}
              </div>
            </div>
          )}
        </div>

        {/* Tăng khoảng cách giữa các phần */}
        <div className="grid grid-cols-12 items-end gap-8 mt-10">
          <div className="lg:col-span-8 col-span-12">
            <h1 className="lg:text-5xl text-4xl font-semibold text-dark dark:text-white">
              {item?.name}
            </h1>
            <div className="flex gap-2.5 mt-3">
              <Icon
                icon="solar:star-linear"
                width={24}
                height={24}
                className="text-primary"
              />
              <p className="text-lg text-dark dark:text-white">{item?.rate}</p>
              <Icon
                icon="ph:map-pin"
                width={24}
                height={24}
                className="text-dark/50 dark:text-white/50"
              />
              <p className="text-dark/50 dark:text-white/50 text-lg">
                {item?.location}
              </p>
            </div>
          </div>
        </div>

        {/* Tăng khoảng cách và làm rộng nội dung chính */}
        <div className="grid grid-cols-12 gap-10 mt-12">
          <div className="lg:col-span-8 col-span-12">
            <div className="py-10 my-10 border-y border-dark/10 dark:border-white/20 flex flex-col gap-10">
              <h3 className="text-3xl font-semibold">Đặc điểm</h3>
              {/* Tăng khoảng cách giữa các thông tin */}
              <div className="flex justify-between ">
                <div className="flex items-center gap-1">
                  <Icon icon={"solar:bed-linear"} width={24} height={24} />
                  <p className="text-xl font-normal text-black dark:text-white">
                    {item?.transmission}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Icon icon={"solar:bath-linear"} width={24} height={24} />
                  <p className="text-xl font-normal text-black dark:text-white">
                    {item?.seat} Ghế ngồi
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Icon
                    icon={"lineicons:arrow-all-direction"}
                    width={24}
                    height={24}
                  />
                  <p className="text-xl font-normal text-black dark:text-white">
                    {item?.fuel}
                  </p>
                </div>
              </div>
            </div>

            {/* Tăng kích thước văn bản mô tả */}
            <div className="flex flex-col gap-6">
              <h3 className="text-3xl font-semibold">Mô tả</h3>
              <p className="text-dark dark:text-white text-lg leading-relaxed">
                Mô tả của xe sẽ ở đây
              </p>
            </div>

            {/* Tăng khoảng cách và kích thước phần tính năng */}
            <div className="py-10 mt-10 border-t border-dark/5 dark:border-white/15">
              <h3 className="text-2xl font-medium">Các tiện nghi khác</h3>
              <div className="grid grid-cols-3 mt-8 gap-8">
                <div className="flex items-center gap-3">
                  <Icon
                    icon="ph:aperture"
                    width={28}
                    height={28}
                    className="text-dark dark:text-white"
                  />
                  <p className="text-lg dark:text-white text-dark">Bản đồ</p>
                </div>
                <div className="flex items-center gap-3">
                  <Icon
                    icon="ph:chart-pie-slice"
                    width={28}
                    height={28}
                    className="text-dark dark:text-white"
                  />
                  <p className="text-lg dark:text-white text-dark">Bluetooth</p>
                </div>
                <div className="flex items-center gap-3">
                  <Icon
                    icon="ph:television-simple"
                    width={28}
                    height={28}
                    className="text-dark dark:text-white"
                  />
                  <p className="text-lg dark:text-white text-dark">
                    Camera hành trình
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Icon
                    icon="ph:sun"
                    width={28}
                    height={28}
                    className="text-dark dark:text-white"
                  />
                  <p className="text-lg dark:text-white text-dark">
                    Camera lùi
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Icon
                    icon="ph:video-camera"
                    width={28}
                    height={28}
                    className="text-dark dark:text-white"
                  />
                  <p className="text-lg dark:text-white text-dark">
                    Cảm biến va chạm
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Icon
                    icon="ph:cloud"
                    width={28}
                    height={28}
                    className="text-dark dark:text-white"
                  />
                  <p className="text-lg dark:text-white text-dark">
                    Định vị GPS
                  </p>
                </div>
              </div>
            </div>

            <div className="py-10 mt-10 border-t border-gray-200 dark:border-white/15">
              <div className="mt-10">
                <h2 className="text-2xl font-medium">Giấy tờ thuê xe</h2>
                <div className="bg-amber-100 border-transparent rounded-md p-4 border-solid border-l-4 border-l-amber-600 mt-4">
                  <h4 className="flex items-center gap-1 text-gray-800 m-0 font-medium text-xl">
                    <span>Chọn 1 trong 2 hình thức</span>
                  </h4>
                  <div className="mt-4 font-bold flex flex-col gap-3 text-base">
                    <div className="flex gap-2 items-center">
                      <span>GPLX & CCCD gắn chip (đối chiếu)</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span>GPLX (đối chiếu) & Passport (giữ lại)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="font-medium text-2xl">Điều khoản</h2>
              <ul className="mt-4 text-lg">
                <li>Sử dụng xe đúng mục đích.</li>
                <li>
                  Không sử dụng xe thuê vào mục đích phi pháp, trái pháp luật.
                </li>
                <li>Không sử dụng xe thuê để cầm cố, thế chấp.</li>
                <li>Không hút thuốc, nhả kẹo cao su, xả rác trong xe.</li>
                <li>Không chở hàng quốc cấm dễ cháy nổ.</li>
                <li>Không chở hoa quả, thực phẩm nặng mùi trong xe.</li>
              </ul>
            </div>

            <div className="mt-10">
              <h2 className="font-medium text-2xl">Chính sách hủy chuyến</h2>
              <div className="mt-4 text-lg">
                Miễn phí hủy chuyến trong vòng 1 giờ sau khi đặt cọc
              </div>
            </div>

            <div className="py-10 mt-10 border-t border-dark/5 dark:border-white/15">
              <h3 className="text-2xl font-medium">Vị trí xe</h3>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2320.534507346019!2d105.52386053880565!3d21.012900697003527!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135abc60e7d3f19%3A0x2be9d7d0b5abcbf4!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBGUFQgSMOgIE7hu5lp!5e1!3m2!1svi!2s!4v1749099509938!5m2!1svi!2s"
                width="1114"
                height="500" // Tăng chiều cao bản đồ
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-2xl w-full mt-10" // Thêm margin-top
              ></iframe>
            </div>

            {/* <div className="py-10 mt-10 border-t border-dark/5 dark:border-white/15">
              <h3 className="text-2xl font-medium">Chủ xe</h3>
            </div> */}
          </div>

          {/* Tăng kích thước phần sidebar */}
          <div className="lg:col-span-4 col-span-12">
            <div className="bg-primary/10 p-10 rounded-2xl relative z-10 overflow-hidden">
              <h4 className="text-dark text-4xl font-medium dark:text-white mb-6">
                {item?.price} VND/Ngày
              </h4>

              {/* Ngày và giờ thuê xe */}
              <div className="mb-6">
                <label className="block text-dark text-xl dark:text-white font-medium mb-2">
                  Ngày và giờ thuê xe
                </label>
                <div className="flex gap-3">
                  <div className="w-2/3">
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-dark/10 dark:border-white/20 rounded-lg bg-white dark:bg-dark/90 text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="w-1/3">
                    <input
                      type="time"
                      className="w-full px-4 py-3 border border-dark/10 dark:border-white/20 rounded-lg bg-white dark:bg-dark/90 text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Ngày và giờ trả xe */}
              <div className="mb-6">
                <label className="block text-dark text-xl dark:text-white font-medium mb-2">
                  Ngày và giờ trả xe
                </label>
                <div className="flex gap-3">
                  <div className="w-2/3">
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-dark/10 dark:border-white/20 rounded-lg bg-white dark:bg-dark/90 text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="w-1/3">
                    <input
                      type="time"
                      className="w-full px-4 py-3 border border-dark/10 dark:border-white/20 rounded-lg bg-white dark:bg-dark/90 text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Nút đặt xe */}
              <Link
                href="#"
                className="py-4 px-8 bg-primary text-white rounded-full w-full block text-center hover:bg-dark duration-300 text-2xl hover:cursor-pointer font-medium"
              >
                Thuê xe
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
