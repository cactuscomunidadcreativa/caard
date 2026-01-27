/**
 * CAARD CMS - Carrusel/Slider Avanzado
 * Componente de carrusel para banners e imágenes con controles completos
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface CarouselSlide {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  textAlign?: "left" | "center" | "right";
  textColor?: string;
}

interface CarouselProps {
  slides: CarouselSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  showPlayPause?: boolean;
  height?: "sm" | "md" | "lg" | "xl" | "full" | "auto";
  effect?: "slide" | "fade" | "zoom";
  className?: string;
}

const heightClasses = {
  sm: "h-[300px] md:h-[400px]",
  md: "h-[400px] md:h-[500px]",
  lg: "h-[500px] md:h-[600px]",
  xl: "h-[600px] md:h-[700px]",
  full: "h-screen",
  auto: "min-h-[400px]",
};

export function Carousel({
  slides,
  autoPlay = true,
  autoPlayInterval = 5000,
  showArrows = true,
  showDots = true,
  showPlayPause = false,
  height = "lg",
  effect = "fade",
  className,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const goToNext = useCallback(() => {
    goToSlide((currentIndex + 1) % slides.length);
  }, [currentIndex, slides.length, goToSlide]);

  const goToPrevious = useCallback(() => {
    goToSlide((currentIndex - 1 + slides.length) % slides.length);
  }, [currentIndex, slides.length, goToSlide]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;
    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isPlaying, autoPlayInterval, goToNext, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrevious();
    }
  };

  if (!slides.length) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden w-full",
        heightClasses[height],
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          const textAlign = slide.textAlign || "center";
          const textAlignClass = {
            left: "text-left items-start",
            center: "text-center items-center",
            right: "text-right items-end",
          }[textAlign];

          return (
            <div
              key={slide.id || index}
              className={cn(
                "absolute inset-0 w-full h-full transition-all duration-700",
                effect === "fade" && (isActive ? "opacity-100 z-10" : "opacity-0 z-0"),
                effect === "slide" && (isActive ? "translate-x-0 z-10" : index < currentIndex ? "-translate-x-full z-0" : "translate-x-full z-0"),
                effect === "zoom" && (isActive ? "opacity-100 scale-100 z-10" : "opacity-0 scale-110 z-0")
              )}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear"
                style={{
                  backgroundImage: `url(${slide.image})`,
                  transform: isActive && effect !== "zoom" ? "scale(1.05)" : "scale(1)",
                }}
              />

              {/* Overlay */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: slide.overlayColor || "#000000",
                  opacity: (slide.overlayOpacity ?? 50) / 100,
                }}
              />

              {/* Content */}
              <div className={cn(
                "relative z-10 h-full flex flex-col justify-center px-4 md:px-8 lg:px-16",
                textAlignClass
              )}>
                <div className="max-w-4xl">
                  {slide.title && (
                    <h2
                      className={cn(
                        "text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 md:mb-6",
                        "animate-fade-in-up"
                      )}
                      style={{ color: slide.textColor || "#ffffff" }}
                    >
                      {slide.title}
                    </h2>
                  )}

                  {slide.subtitle && (
                    <p
                      className={cn(
                        "text-lg md:text-xl lg:text-2xl mb-4 md:mb-6 opacity-90",
                        "animate-fade-in-up animation-delay-200"
                      )}
                      style={{ color: slide.textColor || "#ffffff" }}
                    >
                      {slide.subtitle}
                    </p>
                  )}

                  {slide.description && (
                    <p
                      className={cn(
                        "text-base md:text-lg max-w-2xl mb-6 md:mb-8 opacity-80",
                        "animate-fade-in-up animation-delay-400",
                        textAlign === "center" && "mx-auto"
                      )}
                      style={{ color: slide.textColor || "#ffffff" }}
                    >
                      {slide.description}
                    </p>
                  )}

                  {/* Buttons */}
                  {(slide.buttonText || slide.secondaryButtonText) && (
                    <div className={cn(
                      "flex flex-col sm:flex-row gap-4",
                      "animate-fade-in-up animation-delay-600",
                      textAlign === "center" && "justify-center",
                      textAlign === "right" && "justify-end"
                    )}>
                      {slide.buttonText && slide.buttonUrl && (
                        <Button
                          asChild
                          size="lg"
                          className="h-12 md:h-14 px-6 md:px-8 bg-[#D66829] hover:bg-[#c45a22] text-white text-base md:text-lg rounded-xl shadow-xl"
                        >
                          <Link href={slide.buttonUrl}>
                            {slide.buttonText}
                          </Link>
                        </Button>
                      )}
                      {slide.secondaryButtonText && slide.secondaryButtonUrl && (
                        <Button
                          asChild
                          size="lg"
                          variant="outline"
                          className="h-12 md:h-14 px-6 md:px-8 border-2 border-white/50 bg-white/10 hover:bg-white/20 text-white text-base md:text-lg rounded-xl backdrop-blur-sm"
                        >
                          <Link href={slide.secondaryButtonUrl}>
                            {slide.secondaryButtonText}
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all backdrop-blur-sm group"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all backdrop-blur-sm group"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "w-8 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Play/Pause */}
      {showPlayPause && slides.length > 1 && (
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute bottom-6 right-6 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all backdrop-blur-sm"
          aria-label={isPlaying ? "Pausar" : "Reproducir"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
      )}

      {/* Progress bar */}
      {isPlaying && slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div
            key={currentIndex}
            className="h-full bg-[#D66829] carousel-progress"
            style={{
              width: "100%",
              animation: `carousel-progress ${autoPlayInterval}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}

// Carousel para galería de imágenes (thumbnails)
export function ImageCarousel({
  images,
  showThumbnails = true,
  className,
}: {
  images: { url: string; alt?: string; caption?: string }[];
  showThumbnails?: boolean;
  className?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images.length) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Image */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100">
        <img
          src={images[currentIndex].url}
          alt={images[currentIndex].alt || ""}
          className="w-full h-full object-cover"
        />
        {images[currentIndex].caption && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-sm">{images[currentIndex].caption}</p>
          </div>
        )}

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentIndex((i) => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all",
                index === currentIndex
                  ? "border-[#D66829] ring-2 ring-[#D66829]/20"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={image.url}
                alt={image.alt || ""}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
