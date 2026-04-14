import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Check, X } from 'lucide-react';
import { smartCropService } from '@/services/smartCropService';
import { toast } from 'sonner';

interface CoverPhotoCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => Promise<boolean> | boolean;
  aspectRatio?: number; // 3 for desktop (3:1), 4/3 for mobile drawer
  displayMode?: 'cover' | 'contain';
}

// Desktop default: 3:1 wide banner
const DEFAULT_ASPECT_RATIO = 3;
const MAX_OUTPUT_DIMENSION = 1920;

export const CoverPhotoCropModal = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = DEFAULT_ASPECT_RATIO,
  displayMode = 'cover',
}: CoverPhotoCropModalProps) => {
  const isContainMode = displayMode === 'contain';
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [scale, setScale] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageOrientation, setImageOrientation] = useState<'landscape' | 'portrait' | 'square'>(
    'landscape',
  );
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      setNaturalDimensions({ width: naturalWidth, height: naturalHeight });

      // Detect orientation
      const orientation = smartCropService.detectOrientation(naturalWidth, naturalHeight);
      setImageOrientation(orientation);

      if (isContainMode) {
        // Contain mode: select entire image by default (no forced crop)
        const initialCrop: Crop = { unit: '%', x: 0, y: 0, width: 100, height: 100 };
        setCrop(initialCrop);
        setCompletedCrop(initialCrop);
        setScale(1);
      } else {
        // Cover mode: smart crop to target aspect ratio
        const smartCrop = smartCropService.calculateSmartCrop(
          naturalWidth,
          naturalHeight,
          aspectRatio,
        );

        const initialCrop: Crop = {
          unit: '%',
          x: smartCrop.x,
          y: smartCrop.y,
          width: smartCrop.width,
          height: smartCrop.height,
        };

        setCrop(initialCrop);
        setCompletedCrop(initialCrop);
        setScale(smartCrop.scale);
      }
    },
    [aspectRatio, isContainMode],
  );

  const updatePreview = useCallback(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) return;

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelCrop = {
      x: (completedCrop.x / 100) * image.naturalWidth,
      y: (completedCrop.y / 100) * image.naturalHeight,
      width: (completedCrop.width / 100) * image.naturalWidth,
      height: (completedCrop.height / 100) * image.naturalHeight,
    };

    if (isContainMode) {
      // Contain mode preview: show cropped region inside a 3:1 hero container
      const heroWidth = 600;
      const heroHeight = Math.round(heroWidth / aspectRatio);
      canvas.width = heroWidth;
      canvas.height = heroHeight;

      // Fill with dark background (matches hero bg)
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, heroWidth, heroHeight);

      // Calculate contain-fit dimensions within the hero
      const cropAspect = pixelCrop.width / pixelCrop.height;
      const heroAspect = heroWidth / heroHeight;
      let drawW: number, drawH: number, drawX: number, drawY: number;

      if (cropAspect > heroAspect) {
        // Wider than hero — fit to width
        drawW = heroWidth;
        drawH = heroWidth / cropAspect;
        drawX = 0;
        drawY = (heroHeight - drawH) / 2;
      } else {
        // Taller than hero — fit to height
        drawH = heroHeight;
        drawW = heroHeight * cropAspect;
        drawX = (heroWidth - drawW) / 2;
        drawY = 0;
      }

      ctx.drawImage(
        image,
        pixelCrop.x / scale,
        pixelCrop.y / scale,
        pixelCrop.width / scale,
        pixelCrop.height / scale,
        drawX,
        drawY,
        drawW,
        drawH,
      );
    } else {
      // Cover mode preview: fill the preview canvas
      const previewWidth = 600;
      const previewHeight = Math.round(previewWidth / aspectRatio);

      canvas.width = previewWidth;
      canvas.height = previewHeight;

      ctx.drawImage(
        image,
        pixelCrop.x / scale,
        pixelCrop.y / scale,
        pixelCrop.width / scale,
        pixelCrop.height / scale,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }
  }, [completedCrop, scale, aspectRatio, isContainMode]);

  React.useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  const handleSave = async () => {
    if (!imgRef.current) return;
    if (!isContainMode && !completedCrop) return;

    setIsProcessing(true);

    try {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      if (isContainMode) {
        // Contain mode: output the full image (or cropped region) at natural aspect ratio,
        // resized to max MAX_OUTPUT_DIMENSION on the longest side
        const crop = completedCrop ?? { x: 0, y: 0, width: 100, height: 100 };
        const srcX = ((crop.x / 100) * image.naturalWidth) / scale;
        const srcY = ((crop.y / 100) * image.naturalHeight) / scale;
        const srcW = ((crop.width / 100) * image.naturalWidth) / scale;
        const srcH = ((crop.height / 100) * image.naturalHeight) / scale;

        // Scale to fit within MAX_OUTPUT_DIMENSION
        const longestSide = Math.max(srcW, srcH);
        const outputScale =
          longestSide > MAX_OUTPUT_DIMENSION ? MAX_OUTPUT_DIMENSION / longestSide : 1;
        const outputWidth = Math.round(srcW * outputScale);
        const outputHeight = Math.round(srcH * outputScale);

        canvas.width = outputWidth;
        canvas.height = outputHeight;

        ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, outputWidth, outputHeight);
      } else {
        // Cover mode: forced aspect ratio crop, 1200px wide output
        const pixelCrop = {
          x: (completedCrop!.x / 100) * image.naturalWidth,
          y: (completedCrop!.y / 100) * image.naturalHeight,
          width: (completedCrop!.width / 100) * image.naturalWidth,
          height: (completedCrop!.height / 100) * image.naturalHeight,
        };

        const outputWidth = 1200;
        const outputHeight = Math.round(outputWidth / aspectRatio);

        canvas.width = outputWidth;
        canvas.height = outputHeight;

        ctx.drawImage(
          image,
          pixelCrop.x / scale,
          pixelCrop.y / scale,
          pixelCrop.width / scale,
          pixelCrop.height / scale,
          0,
          0,
          canvas.width,
          canvas.height,
        );
      }

      canvas.toBlob(
        async blob => {
          if (!blob) {
            toast.error('Failed to process image. Try a different photo or smaller file size.');
            setIsProcessing(false);
            return;
          }

          const result = onCropComplete(blob);
          const success = await Promise.resolve(result);
          if (success) {
            onClose();
          }
          setIsProcessing(false);
        },
        'image/jpeg',
        0.9,
      );
    } catch (error) {
      console.error('Error cropping image:', error);
      setIsProcessing(false);
    }
  };

  // Get orientation-specific guidance text
  const getOrientationHint = (): string => {
    if (isContainMode) {
      return 'Full image mode — your photo will be shown in its original proportions';
    }
    if (imageOrientation === 'portrait') {
      return 'Portrait photo detected – centered vertically for best fit';
    }
    if (imageOrientation === 'landscape') {
      return 'Landscape photo – drag to adjust vertical position';
    }
    return 'Drag to adjust position';
  };

  const modalTitle = isContainMode ? 'Preview Cover Photo' : 'Adjust Cover Photo';

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-background border-border flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-foreground">{modalTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {/* Orientation hint */}
          <p className="text-sm text-muted-foreground px-1">{getOrientationHint()}</p>

          {isContainMode ? (
            /* Contain mode: show full image with optional zoom, no crop overlay */
            <div className="relative bg-muted rounded-lg overflow-hidden flex items-center justify-center min-h-[200px] max-h-[40vh]">
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Photo preview"
                onLoad={onImageLoad}
                crossOrigin="anonymous"
                style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
                className="max-w-full max-h-[40vh] object-contain"
              />
            </div>
          ) : (
            /* Cover mode: crop area with aspect ratio lock */
            <div className="relative bg-muted rounded-lg overflow-hidden flex items-center justify-center min-h-[200px] max-h-[40vh]">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
                aspect={aspectRatio}
                className="max-h-[40vh]"
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  crossOrigin="anonymous"
                  style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
                  className="max-w-full max-h-[40vh] object-contain"
                />
              </ReactCrop>
            </div>
          )}

          {/* Zoom Control */}
          <div className="flex items-center gap-4 px-2">
            <ZoomOut size={18} className="text-muted-foreground flex-shrink-0" />
            <Slider
              value={[scale]}
              onValueChange={([value]) => setScale(value)}
              min={1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn size={18} className="text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground w-12 flex-shrink-0">
              {scale.toFixed(1)}x
            </span>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This is how your trip cover will appear:
            </p>
            <div className="bg-muted rounded-lg overflow-hidden">
              <canvas
                ref={previewCanvasRef}
                className="w-full h-auto"
                style={{ aspectRatio: `${aspectRatio}/1` }}
              />
            </div>
          </div>
        </div>

        {/* Actions - Fixed at bottom */}
        <div
          className="flex-shrink-0 flex justify-end gap-3 pt-3 border-t border-border"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            <X size={16} className="mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Check size={16} className="mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
