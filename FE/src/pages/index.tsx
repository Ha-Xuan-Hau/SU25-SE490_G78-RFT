import Vehicle from "@/components/Home/Vehicle";
import FAQ from "@/components/Home/FAG";
import More from "@/components/Home/More";
import Banner from "@/components/Home/Banner";
import HighLight from "@/components/Home/HighLight";

export default function HomePage() {
  return (
    <main>
      <Banner />
      <Vehicle />
      <HighLight />
      <More />
      <FAQ />
    </main>
  );
}
