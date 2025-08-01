import FAQ from "@/components/Home/FAG";
import More from "@/components/Home/More";
import Banner from "@/components/Home/Banner";
import Car from "@/components/Home/Car";
import Bicycle from "@/components/Bicycle";
import Motorbike from "@/components/Home/Motorbike";

export default function HomePage() {
  return (
    <main>
      <Banner />
      <Car />
      <Motorbike />
      <Bicycle />
      <More />
      <FAQ />
    </main>
  );
}
