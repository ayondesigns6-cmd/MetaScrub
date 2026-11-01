import React, { useState, useRef, useCallback } from 'react';
import { saveAs } from 'file-saver';
import {
  Upload,
  Download,
  ShieldCheck,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  Lock,
  Layers,
  RefreshCw,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import { processImageFile, type CleanedImageResult } from './utils/imageProcessor';

export function App() {
  const [results, setResults] = useState<CleanedImageResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'auto' | 'image/jpeg' | 'image/png' | 'image/webp'>('auto');
  const [quality, setQuality] = useState<number>(0.95);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) =>
        f.type.startsWith('image/') ||
        f.name.toLowerCase().endsWith('.heic') ||
        f.name.toLowerCase().endsWith('.heif')
      );

      if (files.length === 0) return;

      setIsProcessing(true);
      const newResults: CleanedImageResult[] = [];

      for (const file of files) {
        try {
          const res = await processImageFile(file, {
            outputFormat,
            quality,
          });
          newResults.unshift(res);
        } catch (err) {
          console.error(`Error processing ${file.name}:`, err);
        }
      }

      setResults((prev) => [...newResults, ...prev]);
      setIsProcessing(false);
    },
    [outputFormat, quality]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const copyToClipboard = async (result: CleanedImageResult) => {
    try {
      if (result.mimeType === 'image/png') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': result.cleanedBlob }),
        ]);
      } else {
        // Fallback: draw to offscreen canvas to export png for clipboard
        const img = new Image();
        img.src = result.previewUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          c.toBlob(async (blob) => {
            if (blob) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob }),
              ]);
            }
          }, 'image/png');
        }
      }
      setCopiedId(result.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.warn('Clipboard write failed, downloading instead:', err);
      saveAs(result.cleanedBlob, result.cleanedFileName);
    }
  };

  const removeResult = (id: string) => {
    setResults((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((r) => r.id !== id);
    });
  };

  const clearAllResults = () => {
    results.forEach((r) => URL.revokeObjectURL(r.previewUrl));
    setResults([]);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-slate-200">
      {/* Top Utility Nav */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-7 w-7 rounded bg-slate-900 flex items-center justify-center text-white font-mono text-xs font-bold tracking-tight">
              MΣ
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-slate-900 tracking-tight text-sm uppercase">
                MetaScrub
              </span>
              <span className="text-[11px] font-mono text-slate-400">v1.0</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="inline-flex items-center px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              Client-Side Only
            </div>
            <div className="hidden sm:inline-flex items-center text-slate-500 text-xs">
              <Lock className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Zero Server Uploads
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        {/* Hero Section */}
        <header className="space-y-3">
          <div className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
            <span>Anti-AI Fingerprinting & Privacy Utility</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Strip Image Metadata Locally
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
            Remove EXIF tags, camera details, and digital signatures instantly inside your browser without uploading files anywhere.
          </p>
        </header>

        {/* Converter Section */}
        <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="inline-flex items-center space-x-1.5 text-slate-700 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 rounded transition-colors font-medium cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Format & Quality Options</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-500">
              Output: <span className="text-slate-900 font-semibold">{outputFormat === 'auto' ? 'Match Original' : outputFormat.replace('image/', '').toUpperCase()}</span> • Q: {Math.round(quality * 100)}%
            </div>
          </div>

          {/* Collapsible Format & Quality Settings */}
          {showAdvanced && (
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Format</label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 text-xs focus:outline-hidden focus:border-slate-400"
                >
                  <option value="auto">Auto (Preserve Original Type)</option>
                  <option value="image/jpeg">JPEG (.jpg)</option>
                  <option value="image/png">PNG (.png)</option>
                  <option value="image/webp">WEBP (.webp)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Note: HEIC images automatically export as JPEG for universal compatibility.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-medium text-slate-700">Export Quality</label>
                  <span className="font-mono text-slate-600">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.0"
                  step="0.01"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-slate-800 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Default 95% preserves maximum clarity while creating a clean pixel header.
                </p>
              </div>
            </div>
          )}

          {/* Dropzone */}
          <div className="p-6">
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-md p-8 sm:p-12 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-slate-600 bg-slate-50'
                  : 'border-slate-300 hover:border-slate-400 bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif"
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
              />

              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                  {isProcessing ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-slate-800" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {isProcessing
                      ? 'Re-encoding clean pixels...'
                      : 'Drop images here or click to browse'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Drag and drop single or multiple files to sanitize them immediately.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-2">
                  {['PNG', 'JPG', 'WEBP', 'HEIC'].map((format) => (
                    <span
                      key={format}
                      className="px-2 py-0.5 rounded text-[11px] font-mono border border-slate-200 bg-slate-50 text-slate-600"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results List */}
          {results.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Processed Images ({results.length})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {results.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        results.forEach((r) => saveAs(r.cleanedBlob, r.cleanedFileName));
                      }}
                      className="text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-300 bg-white px-2.5 py-1 rounded cursor-pointer transition-colors"
                    >
                      Download All
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearAllResults}
                    className="text-xs text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {results.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-md p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-14 h-14 rounded border border-slate-200 bg-slate-100 flex-shrink-0 overflow-hidden relative group">
                        <img
                          src={item.previewUrl}
                          alt={item.originalFileName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                            {item.cleanedFileName}
                          </p>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Cleaned
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-mono">
                          <span>
                            {item.dimensions.width} × {item.dimensions.height} px
                          </span>
                          <span>•</span>
                          <span>{formatBytes(item.originalSize)} → {formatBytes(item.cleanedSize)}</span>
                        </div>

                        {/* Stripped markers indicator */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {['EXIF', 'IPTC', 'XMP', 'C2PA'].map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200"
                            >
                              <Check className="w-2.5 h-2.5 mr-0.5 text-emerald-600" />
                              {tag} stripped
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item)}
                        title="Copy clean image to clipboard"
                        className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => saveAs(item.cleanedBlob, item.cleanedFileName)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => removeResult(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Feature Highlights Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white border border-slate-200 p-4 rounded-md space-y-1.5">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              <span>C2PA Signature Purge</span>
            </div>
            <p className="text-slate-500 leading-normal">
              Strips cryptographic provenance manifests (Content Authenticity Initiative) used by Facebook, Instagram, and social networks to auto-flag media.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-md space-y-1.5">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold">
              <Layers className="w-4 h-4 text-slate-700" />
              <span>Full Pixel Re-encoding</span>
            </div>
            <p className="text-slate-500 leading-normal">
              Draws raw pixels into an internal HTML5 canvas, generating brand-new clean headers without touching original EXIF, IPTC, or XMP segments.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-md space-y-1.5">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold">
              <Lock className="w-4 h-4 text-slate-700" />
              <span>100% Client-Side Sandbox</span>
            </div>
            <p className="text-slate-500 leading-normal">
              Zero network requests, telemetry, or server storage. Your private images never leave your local browser runtime.
            </p>
          </div>
        </section>

        {/* Collapsible FAQ & Privacy Accordion */}
        <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              Frequently Asked Questions & Technical Overview
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Everything you need to know about local metadata removal and platform AI labeling.
            </p>
          </div>

          <div className="divide-y divide-slate-200 text-xs">
            <details className="group py-3.5 cursor-pointer">
              <summary className="flex justify-between items-center font-medium text-slate-800 list-none">
                <span>How does local scrubbing work?</span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-2 text-slate-600 leading-relaxed pr-6">
                The app draws your image onto an internal HTML5 canvas, strips original header metadata (EXIF, IPTC, XMP, and C2PA signatures), and re-exports clean pixels as a new image file directly inside your browser.
              </div>
            </details>

            <details className="group py-3.5 cursor-pointer">
              <summary className="flex justify-between items-center font-medium text-slate-800 list-none">
                <span>Are my images uploaded to a server?</span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-2 text-slate-600 leading-relaxed pr-6">
                No. 100% of the processing happens locally on your device. Zero data, images, or telemetry leave your browser. You can even disconnect your internet after loading the page and the tool will continue working normally.
              </div>
            </details>

            <details className="group py-3.5 cursor-pointer">
              <summary className="flex justify-between items-center font-medium text-slate-800 list-none">
                <span>Why do platforms like Facebook label images as AI?</span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-2 text-slate-600 leading-relaxed pr-6">
                Social media networks scan files for embedded digital signatures or EXIF software tags added by generator tools. Removing metadata strips these tags before uploading.
              </div>
            </details>

            <details className="group py-3.5 cursor-pointer">
              <summary className="flex justify-between items-center font-medium text-slate-800 list-none">
                <span>Does scrubbing metadata reduce image quality or resolution?</span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-2 text-slate-600 leading-relaxed pr-6">
                No. The native resolution (pixel width and height) is preserved 1:1. The pixels are re-encoded at 95%+ high fidelity or lossless PNG. Only the uncompressed metadata blocks inside the file headers are discarded.
              </div>
            </details>

            <details className="group py-3.5 cursor-pointer">
              <summary className="flex justify-between items-center font-medium text-slate-800 list-none">
                <span>What formats are supported?</span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-2 text-slate-600 leading-relaxed pr-6">
                MetaScrub accepts PNG, JPG/JPEG, modern WEBP, and Apple HEIC/HEIF files taken directly from iOS devices.
              </div>
            </details>
          </div>
        </section>
      </main>

      {/* Footer & Credits Section */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">MetaScrub</span>
            <span>•</span>
            <span>Client-side EXIF & C2PA Purge</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a
              href="https://ishmamayon.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-slate-700 hover:text-slate-900 font-medium transition-colors"
            >
              <span>Developed by Ishmam Ayon</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <span className="text-slate-300">|</span>

            <a
              href="https://www.facebook.com/axiolab.official"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-slate-700 hover:text-slate-900 font-medium transition-colors"
            >
              <span>Powered by Axiolab</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
