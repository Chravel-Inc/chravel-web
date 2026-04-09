import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, SPRING } from '../theme';
import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600'],
  subsets: ['latin'],
});

type BrowserFrameProps = {
  children: React.ReactNode;
  width?: number;
  height?: number;
  delay?: number;
  url?: string;
};

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  children,
  width = 1100,
  height = 680,
  delay = 0,
  url = 'chravel.app',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, delay, config: SPRING.gentle });
  const entranceY = interpolate(entrance, [0, 1], [60, 0]);
  const entranceOpacity = interpolate(entrance, [0, 1], [0, 1]);

  const floatY = interpolate(frame % 180, [0, 45, 90, 135, 180], [0, -3, 0, 3, 0]);

  const TOOLBAR_H = 44;
  const BORDER_R = 16;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translateY(${entranceY + floatY}px)`,
        opacity: entranceOpacity,
        width,
        height: height + TOOLBAR_H,
      }}
    >
      {/* Shadow */}
      <div
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: BORDER_R + 4,
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 10px 30px rgba(0,0,0,0.5)',
        }}
      />

      {/* Browser chrome toolbar */}
      <div
        style={{
          width,
          height: TOOLBAR_H,
          background: '#1e1e1e',
          borderTopLeftRadius: BORDER_R,
          borderTopRightRadius: BORDER_R,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 7 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((color) => (
            <div
              key={color}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: color,
              }}
            />
          ))}
        </div>

        {/* Address bar */}
        <div
          style={{
            flex: 1,
            height: 28,
            background: '#2d2d2d',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zm3 8H9V7c0-1.654 1.346-3 3-3s3 1.346 3 3v3z"
              fill="#999"
            />
          </svg>
          <span
            style={{
              fontFamily,
              fontSize: 13,
              color: '#aaa',
              fontWeight: 400,
            }}
          >
            {url}
          </span>
        </div>
      </div>

      {/* Content area */}
      <div
        style={{
          width,
          height,
          background: COLORS.background,
          borderBottomLeftRadius: BORDER_R,
          borderBottomRightRadius: BORDER_R,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  );
};
