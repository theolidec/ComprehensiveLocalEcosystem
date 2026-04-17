import React from 'react';
import Hero from './Hero';
import ProductGrid from './ProductGrid';
import Features from './Features';

function Home() {
  return (
    <>
        <div style={{ flex: 1 }}>
          <Hero />
          <ProductGrid />
          <Features />
        </div>
    </>
  );
}

export default Home;
