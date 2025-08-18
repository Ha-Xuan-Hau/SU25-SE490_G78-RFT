import Image from "next/image";
import { Metadata } from "next";
import { Icon } from "@iconify/react/dist/iconify.js";

export const metadata: Metadata = {
  title: "404 Page | Property ",
};

const ErrorPage = () => {
  return (
    <>
      <section className="flex justify-center pb-0!">
        <Image
          src="/images/404.png"
          alt="404"
          width={490}
          height={450}
          unoptimized={true}
        />
      </section>
      <section className="text-center bg-cover relative overflow-x-hidden">
        <h2 className="text-dark text-52 relative font-bold dark:text-white ">
          Lost? Let’s Help You Find Your Need.
        </h2>
        <p className="text-lg text-dark/50 dark:text-white/50 font-normal w-full mx-auto">
          Looks like you’ve hit a dead end — but don’t worry, we’ll help you get
          back on track
        </p>
      </section>
    </>
  );
};

export default ErrorPage;
