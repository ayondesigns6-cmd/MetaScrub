export interface DetectedMetadata {
  hasExif: boolean;
  hasXmp: boolean;
  hasIptc: boolean;
  hasC2pa: boolean;
  hasGps: boolean;
  details: string[];
}

export function detectMetadata(buffer: ArrayBuffer): DetectedMetadata {
  const bytes = new Uint8Array(buffer);
  // Convert first 1MB or full buffer to latin1 string for fast pattern searching
  const sampleSize = Math.min(bytes.length, 2 * 1024 * 1024);
  let binaryString = '';
  for (let i = 0; i < sampleSize; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }

  const details: string[] = [];

  // EXIF check
  const hasExif = 
    binaryString.includes('Exif\0\0') || 
    binaryString.includes('http://ns.adobe.com/exif/') ||
    binaryString.includes('Orientation') ||
    binaryString.includes('Make') && binaryString.includes('Model');
  if (hasExif) {
    details.push('EXIF (Camera & Device Data)');
  }

  // XMP check (used heavily by AI tools like Midjourney, DALL-E, Photoshop)
  const hasXmp = 
    binaryString.includes('http://ns.adobe.com/xap/1.0/') || 
    binaryString.includes('<x:xmpmeta') ||
    binaryString.includes('xmp:CreatorTool');
  if (hasXmp) {
    details.push('XMP (Software & Generator Tags)');
  }

  // IPTC check
  const hasIptc = 
    binaryString.includes('Photoshop 3.0') || 
    binaryString.includes('IPTC') ||
    binaryString.includes('8BIM');
  if (hasIptc) {
    details.push('IPTC (Editorial & Rights Metadata)');
  }

  // C2PA / Content Authenticity check (used by platforms to flag AI content)
  const hasC2pa = 
    binaryString.includes('c2pa') || 
    binaryString.includes('C2PA') ||
    binaryString.includes('jumb') ||
    binaryString.includes('urn:c2pa') ||
    binaryString.includes('c2pa.manifest');
  if (hasC2pa) {
    details.push('C2PA (Cryptographic AI Signature)');
  }

  // GPS check
  const hasGps = 
    binaryString.includes('GPSVersionID') || 
    binaryString.includes('GPS Latitude') ||
    binaryString.includes('GPS Longitude');
  if (hasGps) {
    details.push('GPS (Geolocation Coordinates)');
  }

  return {
    hasExif,
    hasXmp,
    hasIptc,
    hasC2pa,
    hasGps,
    details,
  };
}
