import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
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
          borderRadius: '42px',
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
            width: 96,
            height: 96,
            borderRadius: 999,
            border: '12px solid #ffffff',
            boxSizing: 'border-box',
            top: 45,
            left: 45,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 62,
            height: 12,
            background: '#ffffff',
            borderRadius: 999,
            transform: 'rotate(45deg)',
            top: 110,
            left: 110,
          }}
        />
      </div>
    ),
    {
      width: 192,
      height: 192,
    },
  );
}
