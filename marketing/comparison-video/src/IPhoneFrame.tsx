import React from 'react';
import { BEZEL, PHONE_H, PHONE_W, SCREEN_H, SCREEN_W } from './theme';

type Props = {
  children: React.ReactNode;
  // Light screens (iOS apps) get a dark home indicator; dark screens get white
  lightScreen?: boolean;
};

/**
 * Realistic iPhone chassis: titanium edge, dynamic island, side buttons.
 * Children fill the 356x776 screen area and are clipped to its radius.
 */
export const IPhoneFrame: React.FC<Props> = ({ children, lightScreen }) => {
  // Side buttons: action, volume up/down (left) and power (right)
  const sideButtons: Array<{ side: 'left' | 'right'; top: number; height: number }> = [
    { side: 'left', top: 170, height: 34 },
    { side: 'left', top: 226, height: 62 },
    { side: 'left', top: 302, height: 62 },
    { side: 'right', top: 250, height: 92 },
  ];

  return (
    <div style={{ position: 'relative', width: PHONE_W, height: PHONE_H }}>
      {sideButtons.map(btn => (
        <div
          key={`${btn.side}-${btn.top}`}
          style={{
            position: 'absolute',
            [btn.side]: -3,
            top: btn.top,
            width: 4,
            height: btn.height,
            borderRadius: 3,
            background:
              btn.side === 'left'
                ? 'linear-gradient(90deg, #3a3a3e, #1b1b1e)'
                : 'linear-gradient(90deg, #1b1b1e, #3a3a3e)',
          }}
        />
      ))}

      {/* Chassis */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 60,
          background: 'linear-gradient(145deg, #4a4a4f 0%, #232327 40%, #17171a 60%, #3d3d42 100%)',
          boxShadow:
            '0 40px 80px rgba(0,0,0,0.55), 0 12px 30px rgba(0,0,0,0.4), inset 0 0 2px rgba(255,255,255,0.25)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 4,
          borderRadius: 56,
          background: '#000',
        }}
      />

      {/* Screen */}
      <div
        style={{
          position: 'absolute',
          left: BEZEL,
          top: BEZEL,
          width: SCREEN_W,
          height: SCREEN_H,
          borderRadius: 48,
          overflow: 'hidden',
          background: '#000',
        }}
      >
        {children}

        {/* Dynamic island */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 104,
            height: 30,
            borderRadius: 20,
            background: '#000',
            zIndex: 50,
          }}
        />

        {/* Home indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 5,
            borderRadius: 3,
            background: lightScreen ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.45)',
            zIndex: 50,
          }}
        />

        {/* Glass reflection */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 48,
            background:
              'linear-gradient(115deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 28%, rgba(255,255,255,0) 45%)',
            pointerEvents: 'none',
            zIndex: 60,
          }}
        />
      </div>
    </div>
  );
};

type StatusBarProps = { dark?: boolean };

/** iOS status bar: time on the left, signal/wifi/battery on the right. */
export const StatusBar: React.FC<StatusBarProps> = ({ dark }) => {
  const color = dark ? '#0a0a0a' : '#f5f5f4';
  return (
    <div
      style={{
        height: 46,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: '0 30px 4px 34px',
        flexShrink: 0,
      }}
    >
      <div style={{ color, fontSize: 14, fontWeight: 700, letterSpacing: 0.2 }}>9:41</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {/* Signal bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5 }}>
          {[4, 6, 8, 10].map(h => (
            <div key={h} style={{ width: 3, height: h, borderRadius: 1, background: color }} />
          ))}
        </div>
        {/* Wifi */}
        <svg width="16" height="12" viewBox="0 0 16 12">
          <path
            d="M8 10.5 L10.5 7.6 A4 4 0 0 0 5.5 7.6 Z M12.5 5.4 A7 7 0 0 0 3.5 5.4 L2 3.6 A9.5 9.5 0 0 1 14 3.6 Z"
            fill={color}
          />
        </svg>
        {/* Battery */}
        <div
          style={{
            width: 24,
            height: 12,
            borderRadius: 3.5,
            border: `1.5px solid ${color}`,
            opacity: 0.9,
            padding: 1.5,
          }}
        >
          <div style={{ width: '72%', height: '100%', borderRadius: 1.5, background: color }} />
        </div>
      </div>
    </div>
  );
};
