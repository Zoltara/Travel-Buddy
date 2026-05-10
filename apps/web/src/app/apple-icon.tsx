import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// Apple icon component (used for home screen on iOS)
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0b1220',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderRadius: '36px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 55%, #67e8f9 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 92,
            height: 92,
            borderRadius: 999,
            border: '12px solid #ffffff',
            boxSizing: 'border-box',
            top: 42,
            left: 42,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 60,
            height: 12,
            background: '#ffffff',
            borderRadius: 999,
            transform: 'rotate(45deg)',
            top: 105,
            left: 104,
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
