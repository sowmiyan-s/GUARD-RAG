import React, { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProductShowcase } from './components/ProductShowcase';
import { ProductStorySection } from './components/ProductStorySection';
import { GuardrailsMatrix } from './components/GuardrailsMatrix';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import { QuickstartSection } from './components/QuickstartSection';
import { DocsPage, DOC_SECTIONS } from './components/DocsPage';
import { Footer } from './components/Footer';

function parseDocsHash(): { isDocs: boolean; sectionId: string } {
  const hash = window.location.hash;
  if (hash.startsWith('#/docs')) {
    const slug = hash.replace(/^#\/docs\/?/, '').trim();
    const valid = DOC_SECTIONS.some((s) => s.id === slug);
    return { isDocs: true, sectionId: valid ? slug : DOC_SECTIONS[0].id };
  }
  return { isDocs: false, sectionId: DOC_SECTIONS[0].id };
}

export const App: React.FC = () => {
  const [route, setRoute] = useState(parseDocsHash);

  useEffect(() => {
    const onHashChange = () => setRoute(parseDocsHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const openDocs = (sectionId = DOC_SECTIONS[0].id) => {
    window.location.hash = `#/docs/${sectionId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goHome = (anchor?: string) => {
    if (anchor) {
      window.location.hash = anchor;
    } else {
      window.location.hash = '#/';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#060709] text-[#f4f4f5]">
        <Navbar isDocs={route.isDocs} onOpenDocs={() => openDocs()} onGoHome={goHome} />
        {route.isDocs ? (
          <DocsPage
            activeSectionId={route.sectionId}
            onSelectSection={(id) => openDocs(id)}
            onBackHome={() => goHome()}
          />
        ) : (
          <main>
            <HeroSection onOpenDocs={() => openDocs()} />
            <ProductShowcase />
            <ProductStorySection />
            <GuardrailsMatrix />
            <ComparisonMatrix />
            <QuickstartSection />
          </main>
        )}
        <Footer onOpenDocs={openDocs} />
      </div>
    </MotionConfig>
  );
};

export default App;
