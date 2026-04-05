import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  lazy?: boolean;
  placeholder?: string;
  aspectRatio?: string;
  sizes?: string;
  priority?: boolean;
  fit?: 'cover' | 'contain';
  showBlurBackdrop?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc,
  lazy = true,
  placeholder,
  aspectRatio,
  sizes,
  priority = false,
  fit = 'cover',
  showBlurBackdrop = false,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  // Intersection Observer for lazy loading — useLayoutEffect guarantees the ref
  // is attached before we call observe(), preventing the race where useEffect
  // fires before the wrapper div is in the DOM (seen in Capacitor WebView).
  useLayoutEffect(() => {
    if (!lazy || priority || isInView) return;

    const node = imgRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px',
        threshold: 0.01,
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoaded(false);
      return;
    }

    setHasError(true);
    setIsLoaded(true);
  };

  // Generate srcSet for responsive images
  const generateSrcSet = (baseSrc: string) => {
    if (!baseSrc.includes('http')) return undefined;

    // For external images, we can't generate different sizes
    // In a real app, you'd integrate with an image optimization service
    return undefined;
  };

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden',
        aspectRatio && `aspect-[${aspectRatio}]`,
        className,
      )}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div
          className={cn(
            'absolute inset-0 bg-muted animate-pulse',
            'flex items-center justify-center',
          )}
        >
          {placeholder ? (
            <div className="text-muted-foreground text-sm">{placeholder}</div>
          ) : (
            <div className="w-8 h-8 bg-muted-foreground/20 rounded animate-pulse" />
          )}
        </div>
      )}

      {/* Error state - silently show empty background */}
      {hasError && <div className="absolute inset-0 bg-transparent" />}

      {isInView && showBlurBackdrop && !hasError && (
        <img
          src={currentSrc}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover blur-md scale-105 opacity-45"
        />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={currentSrc}
          alt={alt}
          srcSet={generateSrcSet(currentSrc)}
          sizes={sizes}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            'w-full h-full',
            fit === 'contain' ? 'object-contain' : 'object-cover',
          )}
          {...props}
        />
      )}
    </div>
  );
};
