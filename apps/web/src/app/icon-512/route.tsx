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
          borderRadius: '112px',
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
            width: 254,
            height: 254,
            borderRadius: 999,
            border: '30px solid #ffffff',
            boxSizing: 'border-box',
            top: 120,
            left: 120,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 165,
            height: 30,
            background: '#ffffff',
            borderRadius: 999,
            transform: 'rotate(45deg)',
            top: 292,
            left: 292,
          }}
        />
      </div>
    ),
    {
      width: 512,
      height: 512,
    },
  );
}
