"use client";

import BestSeller from "./BestSeller";
import Categories from "./Categories";
import CounDown from "./Countdown";
import Hero from "./Hero";
import NewArrival from "./NewArrivals";
import PromoBanner from "./PromoBanner";
import Testimonials from "./Testimonials";
import Newsletter from "../Common/Newsletter";
import { useProducts } from "@/hooks/useProducts";

const Home = () => {
  const { products, categories, categoryItems, loading, error, retry } = useProducts();
  const newArrivals = [...products].sort((a, b) => b.id - a.id).slice(0, 8);
  const bestSellers = products.slice(0, 6);

  return (
    <main>
      <Hero products={products.slice(0, 5)} loading={loading} />
      <Categories categories={categories} categoryItems={categoryItems} products={products} loading={loading} />
      <NewArrival products={newArrivals} loading={loading} error={error} retry={retry} />
      <PromoBanner products={products.slice(0, 3)} />
      <BestSeller products={bestSellers} loading={loading} error={error} retry={retry} />
      <CounDown product={products[3] || products[0]} />
      <Testimonials />
      <Newsletter />
    </main>
  );
};

export default Home;
