import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Icon component
export default function Icon() {
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
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 50%, #67e8f9 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 18,
            height: 18,
            borderRadius: 999,
            border: '3px solid #ffffff',
            boxSizing: 'border-box',
            top: 7,
            left: 7,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 12,
            height: 3,
            background: '#ffffff',
            borderRadius: 999,
            transform: 'rotate(45deg)',
            top: 20,
            left: 20,
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
