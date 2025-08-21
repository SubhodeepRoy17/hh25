"use client"

import { useEffect, useRef } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCode({ value, size = 128, className = '' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Dynamically import QR code library
        const QRCodeLib = await import('qrcode');
        
        if (canvasRef.current) {
          await QRCodeLib.toCanvas(canvasRef.current, value, {
            width: size,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [value, size]);

  return (
    <div className={`inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="border border-gray-200 rounded-lg"
      />
    </div>
  );
}