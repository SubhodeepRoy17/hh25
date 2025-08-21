"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { X, CheckCircle2, AlertCircle, CameraOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface QrScannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScanSuccess?: (data: string) => void
}

export default function QrScannerModal({
  open,
  onOpenChange,
  onScanSuccess
}: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [scanResult, setScanResult] = useState<"success" | "error" | null>(null)
  const [scanMessage, setScanMessage] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [isCameraAvailable, setIsCameraAvailable] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [cameraError, setCameraError] = useState<string>("")
  const { toast } = useToast()

  const handleQRScan = useCallback(async (qrData: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (!qrData || qrData.trim().length === 0) {
        throw new Error('Invalid QR code data');
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/listings/verify-pickup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ qrCode: qrData })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Verification failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      setScanResult("success");
      setScanMessage(`Pickup verified! ${result.tokensEarned || 0} tokens earned.`);
      
      if (onScanSuccess) {
        onScanSuccess(qrData);
      }
      
      toast({
        title: "Pickup Verified",
        description: `Successfully verified pickup. ${result.tokensEarned || 0} tokens earned.`,
      });
      
      setTimeout(() => {
        onOpenChange(false);
        setScanResult(null);
        setScanMessage("");
        setIsProcessing(false);
      }, 2000);
      
    } catch (error) {
      console.error('QR verification error:', error);
      setScanResult("error");
      setScanMessage(error instanceof Error ? error.message : "Invalid QR code. Please try again.");
      
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid QR code",
        variant: "destructive"
      });
      
      setTimeout(() => {
        setScanResult(null);
        setScanMessage("");
        setIsProcessing(false);
      }, 3000);
    }
  }, [isProcessing, onScanSuccess, toast, onOpenChange]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraError("");
      setIsCameraAvailable(true);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsScanning(true);
      return true;
      
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError(error instanceof Error ? error.message : 'Camera access failed');
      setIsCameraAvailable(false);
      stopCamera();
      return false;
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    let isMounted = true;
    let scanner: any = null;

    const initializeScanner = async () => {
      try {
        // Start camera first
        const cameraStarted = await startCamera();
        if (!cameraStarted || !isMounted) return;

        // Load QR library after camera is ready
        try {
          const { BrowserQRCodeReader } = await import('@zxing/browser');
          const codeReader = new BrowserQRCodeReader();
          
          if (!videoRef.current || !isMounted) return;

          scanner = await codeReader.decodeFromVideoDevice(
            undefined, 
            videoRef.current,
            (result: any, error: any) => {
              if (result && !isProcessing && isMounted) {
                handleQRScan(result.getText());
              }
              if (error && isMounted && !error.message?.includes('NotFoundException')) {
                console.warn('QR scan warning:', error);
              }
            }
          );
        } catch (libraryError) {
          console.error('QR library error:', libraryError);
          if (isMounted) {
            setScanResult("error");
            setScanMessage("QR scanner failed to initialize");
          }
        }
      } catch (error) {
        console.error('Scanner initialization error:', error);
      }
    };

    initializeScanner();

    return () => {
      isMounted = false;
      if (scanner && typeof scanner.stop === 'function') {
        scanner.stop();
      }
      stopCamera();
    };
  }, [open, handleQRScan, isProcessing, startCamera, stopCamera]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-zinc-900 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Scan Pickup QR Code</h3>
          <button 
            aria-label="Close" 
            className="p-1 rounded hover:bg-white/10" 
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {scanResult ? (
          <div className="text-center py-8">
            {scanResult === "success" ? (
              <div className="space-y-4">
                <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto" />
                <div>
                  <h4 className="text-lg font-semibold text-emerald-100">Success!</h4>
                  <p className="text-gray-300">{scanMessage}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <AlertCircle className="h-16 w-16 text-red-400 mx-auto" />
                <div>
                  <h4 className="text-lg font-semibold text-red-100">Scan Failed</h4>
                  <p className="text-gray-300">{scanMessage}</p>
                </div>
                <Button onClick={() => setScanResult(null)} className="mt-4">
                  Try Again
                </Button>
              </div>
            )}
          </div>
        ) : !isCameraAvailable ? (
          <div className="text-center py-8">
            <CameraOff className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold mb-2">Camera Unavailable</h4>
            <p className="text-gray-300 mb-4">
              {cameraError || "Camera access is required to scan QR codes."}
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Please ensure:</p>
              <ul className="text-sm text-gray-400 text-left list-disc list-inside">
                <li>Camera permissions are granted</li>
                <li>Your device has a camera</li>
                <li>You're using a supported browser</li>
              </ul>
            </div>
            <Button onClick={startCamera} className="mt-4">
              Retry Camera
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-lg overflow-hidden bg-black aspect-video mb-4 relative">
              <video 
                ref={videoRef} 
                className="h-full w-full object-cover" 
                playsInline
                muted
              />
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-gray-400">Starting camera...</div>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-emerald-400 rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-300 text-center mb-4">
              Point your camera at the pickup QR code to verify collection
            </p>
            
            {isProcessing && (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="text-sm text-gray-300">Processing...</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}