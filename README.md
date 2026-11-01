# MetaScrub

> **Local, browser-only utility to strip EXIF, IPTC, XMP metadata, and C2PA digital signatures from user images to prevent automated AI-labeling on platforms like Facebook and Instagram.**

MetaScrub executes 100% client-side inside your browser sandbox using the HTML5 Canvas API and Web APIs. Zero bytes, images, or telemetry leave your machine.

---

## Features

- **Purges C2PA Manifests**: Strips cryptographically signed provenance assertions (Content Authenticity Initiative) used by social media platforms to automatically detect and flag AI-generated imagery.
- **Removes EXIF, IPTC & XMP Data**: Removes camera models, serial numbers, timestamps, GPS geolocation tags, and editing/generator software history.
- **100% Client-Side Privacy**: Runs completely offline in the browser. You can load the application, disconnect from the internet, and sanitize files without interruption.
- **Zero Resolution Loss**: Retains 100% of the image's original pixel dimensions with high-fidelity re-encoding (95%+ quality JPEG/WEBP or lossless PNG).
- **Format Support**:
  - PNG (`.png`)
  - JPEG (`.jpg`, `.jpeg`)
  - WEBP (`.webp`)
  - Apple HEIC/HEIF (`.heic`, `.heif`) with client-side transcoding
- **Instant Workflow**:
  - Drag-and-drop single or multiple files
  - Automatic download appended with `_cleaned`
  - Copy cleaned image directly to clipboard
  - Dimension and compression size comparison inspect cards

---

## How It Works

1. **Decoding**: The browser decodes the uploaded image into raw bitmap pixels.
2. **Buffer Re-rasterization**: The pixel data is drawn onto an isolated, internal HTML5 `<canvas>` context. This process automatically discards all container metadata blocks (such as `APP1` EXIF segments, `APP13` IPTC records, `APP11` C2PA boxes, and PNG text chunks).
3. **Re-encoding**: The canvas outputs a freshly synthesized image blob using `canvas.toBlob()` containing only the clean pixel stream with standard compression headers.

---

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **File Export**: `file-saver`
- **HEIC Transcoding**: `heic2any` (dynamically loaded on-demand)

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd MetaScrub

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

---

## Credits

- **Developer**: [Ishmam Ayon](https://ishmamayon.vercel.app)
- **Agency**: [Axiolab](https://www.facebook.com/axiolab.official)

---

## License

MIT License. Free for personal and commercial use.
