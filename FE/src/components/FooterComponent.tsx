import Link from "next/link";
import { Icon } from "@iconify/react";
import { FooterLinks } from "@/apis/footerlinks";
import Image from "next/image";

const FooterComponent = () => {
  return (
    <footer className="relative z-10 bg-dark">
      <div className="container mx-auto max-w-8xl pt-14 px-4 sm:px-6 lg:px-8">
        <div className="py-16 border-b border-white/10">
          <div className="grid grid-cols-12 sm:gap-10 gap-y-6">
            {/* Column 1 - Logo & Contact */}
            <div className="md:col-span-3 sm:col-span-6 col-span-8">
              <div className="mb-6">
                <Image
                  src="/images/rft-logo2.png"
                  alt="Rent For Travel Logo"
                  width={150}
                  height={68}
                  unoptimized={true}
                />
              </div>
              <p className="text-white/60 text-base mb-6">
                Hi vọng mang đến trải nghiệm cho thuê xe tự lái và có lái tốt
                nhất đến cho khách du lịch sử dụng dịch vụ của chúng tôi.
              </p>
              <div className="flex space-x-4">
                <Link
                  href="https://facebook.com"
                  className="text-white/40 hover:text-primary"
                >
                  <Icon icon="ri:facebook-fill" width={20} height={20} />
                </Link>
                <Link
                  href="https://twitter.com"
                  className="text-white/40 hover:text-primary"
                >
                  <Icon icon="ri:twitter-fill" width={20} height={20} />
                </Link>
                <Link
                  href="https://instagram.com"
                  className="text-white/40 hover:text-primary"
                >
                  <Icon icon="ri:instagram-fill" width={20} height={20} />
                </Link>
              </div>
            </div>

            {/* Column 2 - Quick Links */}
            <div className="md:col-span-3 sm:col-span-6 col-span-12">
              <h3 className="text-white text-xl font-medium mb-6">
                Tra cứu nhanh
              </h3>
              <div className="flex flex-col gap-4 w-fit">
                {FooterLinks.slice(0, 3).map((item, index) => (
                  <div key={index}>
                    <Link
                      href={item.href}
                      className="text-white/40 text-base hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3 - Services */}
            <div className="md:col-span-3 sm:col-span-6 col-span-12">
              <h3 className="text-white text-xl font-medium mb-6">Dịch vụ</h3>
              <div className="flex flex-col gap-4 w-fit">
                {FooterLinks.slice(3, 5).map((item, index) => (
                  <div key={index}>
                    <Link
                      href={item.href}
                      className="text-white/40 text-base hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 4 - Contact CTA */}
            <div className="md:col-span-3 sm:col-span-6 col-span-12">
              <h3 className="text-white text-xl font-medium mb-6">
                Thông tin liên hệ
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <Icon
                    icon="ph:phone"
                    className="text-primary mt-1"
                    width={18}
                    height={18}
                  />
                  <span className="text-white/60 text-base">
                    0944 495 583
                    <br />
                    Hỗ trợ: 7AM - 10PM
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Icon
                    icon="ph:envelope-simple"
                    className="text-primary mt-1"
                    width={18}
                    height={18}
                  />
                  <span className="text-white/60 text-base">
                    rftteam@gmail.com
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Icon
                    icon="ph:map-pin"
                    className="text-primary mt-1"
                    width={18}
                    height={18}
                  />
                  <span className="text-white/60 text-base">
                    Đại học FPT, Khu công nghệ cao Hòa Lạc, Hà Nội, Việt Nam
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterComponent;
