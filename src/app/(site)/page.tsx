import { Hero } from "@/components/home/Hero";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { About } from "@/components/home/About";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Differentials } from "@/components/home/Differentials";
import { Gallery } from "@/components/home/Gallery";
import { FAQ } from "@/components/home/FAQ";
import { FinalCta } from "@/components/home/FinalCta";
import { getFeaturedProducts } from "@/lib/data/products";
import { getEffectiveAdminUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const [featuredProducts, adminUser] = await Promise.all([
    getFeaturedProducts(),
    getEffectiveAdminUser(),
  ]);

  return (
    <>
      <Hero />
      <FeaturedProducts products={featuredProducts} isAdmin={Boolean(adminUser)} />
      <About />
      <HowItWorks />
      <Differentials />
      <Gallery />
      <FAQ />
      <FinalCta />
    </>
  );
}
