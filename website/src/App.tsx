import React from 'react';
import { MotionConfig } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProductShowcase } from './components/ProductShowcase';
import { ProductStorySection } from './components/ProductStorySection';
import { GuardrailsMatrix } from './components/GuardrailsMatrix';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import { BenchmarksSection } from './components/BenchmarksSection';
import { QuickstartSection } from './components/QuickstartSection';
import { SdkDocsSection } from './components/SdkDocsSection';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#09090b] text-[#f4f4f5]">
        <Navbar />
        <main>
          <HeroSection />
          <ProductShowcase />
          <ProductStorySection />
          <GuardrailsMatrix />
          <ComparisonMatrix />
          <BenchmarksSection />
          <QuickstartSection />
          <SdkDocsSection />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
};

export default App;
