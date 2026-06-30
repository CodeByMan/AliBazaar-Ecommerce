import React from "react";

const brandName = "AliBazaar";

const PreLoader = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="AliBazaar is loading"
      className="fixed inset-0 z-999999 flex min-h-screen w-screen items-center justify-center bg-blue px-6"
    >
      <div className="text-center">
        <div
          className="flex items-center justify-center text-4xl font-bold tracking-tight text-white sm:text-5xl"
          aria-hidden="true"
        >
          {brandName.split("").map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="alibazaar-wave-letter inline-block"
              style={{
                animation: "alibazaar-wave 1.15s ease-in-out infinite",
                animationDelay: `${index * 0.09}s`,
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        <span className="sr-only">AliBazaar is loading</span>
      </div>

      <style>{`
        @keyframes alibazaar-wave {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.78;
          }
          30% {
            transform: translateY(-9px);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .alibazaar-wave-letter {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PreLoader;
