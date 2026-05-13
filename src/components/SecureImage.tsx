// HIGH-6: Secure image component that uses signed URLs
import { useState, useEffect } from 'react';
import { getSignedImageUrl } from '@/lib/storage';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storageUrl: string;
}

export function SecureImage({ storageUrl, alt, ...props }: SecureImageProps) {
  const [signedUrl, setSignedUrl] = useState<string>('');

  useEffect(() => {
    if (!storageUrl) return;
    let cancelled = false;
    getSignedImageUrl(storageUrl).then((url) => {
      if (!cancelled) setSignedUrl(url);
    });
    return () => { cancelled = true; };
  }, [storageUrl]);

  if (!signedUrl) {
    return <div className="bg-muted animate-pulse rounded" style={{ ...props.style, minHeight: '100px' }} />;
  }

  return <img src={signedUrl} alt={alt} {...props} />;
}
