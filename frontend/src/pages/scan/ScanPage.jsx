import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  HiSearch,
  HiQrcode,
  HiCamera,
  HiCheckCircle,
  HiExclamationCircle,
  HiPlus,
  HiArrowRight,
  HiRefresh,
  HiClipboardCheck,
} from 'react-icons/hi';
import { get } from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';

// Audio feedback when barcode is successfully scanned
function playScanBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // High pleasant C6 beep
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Ignore audio permission blocks
  }
}

export default function ScanPage() {
  const [manualCode, setManualCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [scannedResult, setScannedResult] = useState(null); // { code, format, asset, loading }
  const [scannerPaused, setScannerPaused] = useState(false);
  const scannerRef = useRef(null);
  const lastScannedTimeRef = useRef(0);
  const navigate = useNavigate();

  // Search backend for asset matching scanned barcode/code
  const lookupBarcode = useCallback(async (barcodeText, formatName = 'Barcode') => {
    if (!barcodeText || !barcodeText.trim()) return;

    const trimmed = barcodeText.trim();
    setScannedResult({
      code: trimmed,
      format: formatName,
      asset: null,
      loading: true,
      notFound: false,
    });

    try {
      // 1. If it's a full URL containing /assets/<id>, extract the id
      let searchParam = trimmed;
      if (trimmed.includes('/assets/')) {
        const parts = trimmed.split('/assets/');
        searchParam = parts[parts.length - 1].replace(/[/?#].*$/, '').trim();
      }

      const res = await get('/assets', { search: searchParam, limit: 1 });
      const assets = res.data?.data || [];

      if (assets.length > 0) {
        setScannedResult({
          code: trimmed,
          format: formatName,
          asset: assets[0],
          loading: false,
          notFound: false,
        });
        toast.success(`Asset matched: ${assets[0].name}`);
      } else {
        setScannedResult({
          code: trimmed,
          format: formatName,
          asset: null,
          loading: false,
          notFound: true,
        });
        toast('Barcode detected (not in database)', { icon: '🔍' });
      }
    } catch (err) {
      setScannedResult({
        code: trimmed,
        format: formatName,
        asset: null,
        loading: false,
        notFound: true,
      });
      toast.error('Search failed for scanned code');
    }
  }, []);

  useEffect(() => {
    // All 1D linear and 2D barcode formats supported
    const formatsToSupport = [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.CODE_93,
      Html5QrcodeSupportedFormats.CODABAR,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.ITF,
      Html5QrcodeSupportedFormats.DATA_MATRIX,
    ];

    const scannerConfig = {
      fps: 15, // Higher fps for responsive 1D line detection
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        // Wide rectangular bounding box optimized for 1D horizontal barcodes & 2D QR codes
        const width = Math.min(viewfinderWidth - 30, 360);
        const height = Math.min(Math.floor(width * 0.55), viewfinderHeight - 40);
        return { width: Math.max(260, width), height: Math.max(140, height) };
      },
      aspectRatio: 1.333334,
      formatsToSupport,
      experimentalFeatures: {
        // Uses native GPU-accelerated BarcodeDetector API in Chromium browsers for instant 1D barcode scanning
        useBarCodeDetectorIfSupported: true,
      },
      rememberLastUsedCamera: true,
      showTorchButtonIfSupported: true,
    };

    const scanner = new Html5QrcodeScanner('qr-reader-container', scannerConfig, /* verbose= */ false);

    scanner.render(
      (decodedText, decodedResult) => {
        const now = Date.now();
        // Debounce scan events within 2.5 seconds
        if (now - lastScannedTimeRef.current < 2500) {
          return;
        }
        lastScannedTimeRef.current = now;

        playScanBeep();
        const formatName = decodedResult?.result?.format?.formatName || 'BARCODE';

        // Pause scanner UI while displaying scanned result card
        setScannerPaused(true);
        lookupBarcode(decodedText, formatName);
      },
      (error) => {
        // Scanning in progress
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [lookupBarcode]);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    lookupBarcode(manualCode.trim(), 'MANUAL_ENTRY');
  };

  const handleResumeScan = () => {
    setScannedResult(null);
    setScannerPaused(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center">
        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-sm">
          <HiQrcode />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Optical Barcode & QR Scanner
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-lg mx-auto">
          Hold any equipment barcode (Code 128, Code 39, EAN-13, UPC) or QR code up to your camera for instant identification
        </p>
      </div>

      {/* Scanned Result Banner Card */}
      {scannedResult && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-primary-500 shadow-xl shadow-primary-500/10 animate-fade-in space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${
                  scannedResult.asset
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                }`}
              >
                {scannedResult.asset ? <HiCheckCircle /> : <HiExclamationCircle />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Scanned {scannedResult.format}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {scannedResult.code}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {scannedResult.loading
                    ? 'Searching database...'
                    : scannedResult.asset
                    ? scannedResult.asset.name
                    : 'Unregistered Barcode'}
                </h3>
              </div>
            </div>

            <button
              onClick={handleResumeScan}
              className="flex items-center px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            >
              <HiRefresh className="mr-1" /> Scan Next
            </button>
          </div>

          {/* Matched Asset Info */}
          {scannedResult.asset && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
                    {scannedResult.asset.assetCode}
                  </span>
                  <StatusBadge status={scannedResult.asset.status} />
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">
                    {scannedResult.asset.department?.name}
                  </span>
                </div>
                <div className="text-slate-500">
                  Location:{' '}
                  {scannedResult.asset.location
                    ? `${scannedResult.asset.location.name} (${scannedResult.asset.location.room || ''})`
                    : 'Unassigned'}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  to={`/assets/${scannedResult.asset.id}`}
                  className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs shadow-md shadow-primary-600/30 transition"
                >
                  <span>View Details</span>
                  <HiArrowRight className="ml-1" />
                </Link>
                {scannedResult.asset.status === 'Available' && (
                  <Link
                    to="/checkout"
                    className="flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 transition"
                  >
                    <HiClipboardCheck className="mr-1 text-sm" /> Check Out
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Unregistered Barcode Action */}
          {scannedResult.notFound && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                This barcode is not yet registered in your institutional catalog. Would you like to add it as a new asset?
              </p>
              <button
                onClick={() =>
                  navigate('/assets/new', { state: { barcode: scannedResult.code } })
                }
                className="flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/30 transition flex-shrink-0"
              >
                <HiPlus className="mr-1" /> Register with this Barcode
              </button>
            </div>
          )}
        </div>
      )}

      {/* Camera Viewfinder */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase text-slate-400">
            <HiCamera className="text-sm text-primary-500" />
            <span>Camera Viewfinder</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
            1D & 2D Barcode Engine Active
          </span>
        </div>

        {/* html5-qrcode target container */}
        <div
          id="qr-reader-container"
          className="w-full rounded-2xl overflow-hidden bg-slate-900 text-slate-200 border border-slate-700"
        />

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>Supported: Code 128, Code 39, EAN-13, UPC-A, QR Code, DataMatrix</span>
          <span>Auto-focus enabled</span>
        </div>
      </div>

      {/* Manual Code Fallback */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Manual Barcode / Asset Code Lookup
        </h3>
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. AST-CSE-00001 or SN-DELL-3660-01..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs shadow-md shadow-primary-600/30 disabled:opacity-50 transition"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Click-to-Test Sample Barcodes */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
          Quick Demo Barcodes (Click to simulate scanning):
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Workstation', code: 'AST-CSE-00001' },
            { label: 'Tektronix Scope', code: 'AST-ECE-00001' },
            { label: 'HPLC Analyzer', code: 'AST-CHM-00001' },
            { label: 'Dell Serial', code: 'SN-DELL-3660-01' },
            { label: 'External Barcode', code: '890123456789' },
          ].map((sample) => (
            <button
              key={sample.code}
              onClick={() => lookupBarcode(sample.code, 'SAMPLE_SIMULATED')}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-500 font-mono text-[11px] text-slate-700 dark:text-slate-200 transition"
            >
              <span className="text-slate-400 font-sans mr-1">{sample.label}:</span>
              <span className="font-bold text-primary-600 dark:text-primary-400">{sample.code}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
