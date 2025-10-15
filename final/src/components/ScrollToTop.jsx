import React, { useState, useEffect, memo } from 'react';
import { ArrowUp } from 'lucide-react';

const ScrollToTop = memo(({ 
  showAfter = 400, 
  className = "", 
  smooth = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down beyond the threshold
      if (window.pageYOffset > showAfter) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [showAfter]);

  const scrollToTop = () => {
    if (smooth) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo(0, 0);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <style>{`
        .scroll-to-top-enter {
          opacity: 0;
          transform: translateY(20px);
        }
        
        .scroll-to-top-appear {
          animation: fadeInUp 0.3s ease-out forwards;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .scroll-to-top-disappear {
          animation: fadeOutDown 0.3s ease-in forwards;
        }
        
        @keyframes fadeOutDown {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(20px);
          }
        }
      `}</style>
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border-2 border-white scroll-to-top-appear ${className}`}
        aria-label="Scroll to top"
        title="Go to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </>
  );
});

ScrollToTop.displayName = "ScrollToTop";

export default ScrollToTop;
