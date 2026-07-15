import React from 'react';
import { interpolate, spring } from 'remotion';
import { Glyph } from '../Glyph';
import { StatusBar } from '../IPhoneFrame';
import {
  BORDER,
  CARD,
  FPS,
  GOLD_GRADIENT,
  GOLD_MID,
  INK_1,
  INK_3,
  LEFT_OVERVIEW_START,
  LEFT_SWIPE_DUR,
  LEFT_TAB_COUNT,
  SCREEN_W,
  leftSwipeStart,
} from '../theme';
import { MiniAvatar, PANELS, TABS } from './tabs';

// Continuous tab position 0..6 driven by springs, one per swipe
const tabPosition = (frame: number): number => {
  let pos = 0;
  for (let i = 0; i < LEFT_TAB_COUNT - 1; i++) {
    pos += spring({
      frame: frame - leftSwipeStart(i),
      fps: FPS,
      config: { damping: 200 },
      durationInFrames: LEFT_SWIPE_DUR,
    });
  }
  return pos;
};

// Frame at which tab i becomes the active tab
const activationFrame = (i: number): number =>
  i === 0 ? 0 : leftSwipeStart(i - 1) + LEFT_SWIPE_DUR;

const Header: React.FC<{ activeIndex: number }> = ({ activeIndex }) => (
  <div
    style={{
      padding: '8px 16px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      borderBottom: `1px solid ${BORDER}`,
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 13,
        background: 'linear-gradient(135deg, #2c3e6b 0%, #7290c9 60%, #c9a662 100%)',
        border: '1px solid rgba(255,255,255,0.15)',
        flexShrink: 0,
      }}
    />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ color: INK_1, fontSize: 15.5, fontWeight: 800, letterSpacing: -0.2 }}>
        Tokyo Spring Trip
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: GOLD_MID }}>
        {TABS[activeIndex]?.label ?? ''}
        <span style={{ color: INK_3, fontWeight: 400 }}> · Apr 12–19 · 8 travelers</span>
      </div>
    </div>
    <div style={{ display: 'flex' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <MiniAvatar i={i} size={24} label="" />
        </div>
      ))}
    </div>
  </div>
);

const TabBar: React.FC<{ pos: number }> = ({ pos }) => (
  <div
    style={{
      display: 'flex',
      padding: '8px 3px 20px',
      borderTop: `1px solid ${BORDER}`,
      background: 'rgba(10,10,12,0.9)',
      flexShrink: 0,
    }}
  >
    {TABS.map((tab, i) => {
      const proximity = Math.max(0, 1 - Math.abs(pos - i));
      const color = proximity > 0.5 ? GOLD_MID : INK_3;
      return (
        <div
          key={tab.key}
          style={{
            width: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -4,
              width: 30,
              height: 42,
              borderRadius: 11,
              background: `rgba(196,151,70,${0.16 * proximity})`,
            }}
          />
          <div style={{ color, position: 'relative' }}>
            <Glyph name={tab.icon} size={19} strokeWidth={proximity > 0.5 ? 2.4 : 2} />
          </div>
          <div
            style={{
              fontSize: 8,
              fontWeight: 700,
              color,
              position: 'relative',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label === 'Files & Notes' ? 'Files' : tab.label}
          </div>
        </div>
      );
    })}
  </div>
);

// Final in-phone state: all tabs together as a connected grid
const OverviewGrid: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const tiles = [
    ...TABS.map(t => ({ icon: t.icon, label: t.label })),
    { icon: 'wallet' as const, label: 'Payments +' },
  ];
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ textAlign: 'center', marginTop: 4 }}>
        <div style={{ color: INK_1, fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>
          One trip. Everything connected.
        </div>
        <div style={{ color: INK_3, fontSize: 11.5, marginTop: 3 }}>
          Every tab shares the same trip, people, and plans
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          flex: 1,
          alignContent: 'start',
        }}
      >
        {tiles.map((tile, i) => {
          const pop = spring({
            frame: Math.max(0, localFrame - 4 - i * 3),
            fps: FPS,
            config: { damping: 18, stiffness: 190 },
            durationInFrames: 20,
          });
          return (
            <div
              key={tile.label}
              style={{
                borderRadius: 16,
                background: CARD,
                border: '1px solid rgba(196,151,70,0.32)',
                padding: '14px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: pop,
                transform: `scale(${0.8 + 0.2 * pop})`,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'rgba(196,151,70,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: GOLD_MID,
                  flexShrink: 0,
                }}
              >
                <Glyph name={tile.icon} size={16} />
              </div>
              <div style={{ color: INK_1, fontSize: 12, fontWeight: 700 }}>{tile.label}</div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          borderRadius: 999,
          background: GOLD_GRADIENT,
          color: '#161006',
          fontSize: 12.5,
          fontWeight: 800,
          textAlign: 'center',
          padding: '11px 0',
          marginBottom: 30,
        }}
      >
        Never leave the trip
      </div>
    </div>
  );
};

type ChravelScreenProps = {
  frame: number;
  // FinalFrame mode: skip the tab choreography entirely and show the overview
  // grid from a fresh stagger — reusing the comparison scene's frame offsets
  // here would visibly rewind the phone at the scene cut
  overviewOnly?: boolean;
};

export const ChravelScreen: React.FC<ChravelScreenProps> = ({ frame, overviewOnly }) => {
  const pos = overviewOnly ? LEFT_TAB_COUNT - 1 : tabPosition(frame);
  const activeIndex = Math.min(LEFT_TAB_COUNT - 1, Math.round(pos));

  // Overview crossfade
  const overview = overviewOnly
    ? 1
    : spring({
        frame: frame - LEFT_OVERVIEW_START,
        fps: FPS,
        config: { damping: 200 },
        durationInFrames: 24,
      });

  // Swipe touch indicator: bell-curved opacity per swipe, drifting right -> left
  let touchOpacity = 0;
  let touchX = 0;
  for (let i = 0; i < LEFT_TAB_COUNT - 1; i++) {
    const local = frame - leftSwipeStart(i);
    if (local >= -6 && local <= LEFT_SWIPE_DUR + 2) {
      const t = interpolate(local, [-6, 4, LEFT_SWIPE_DUR], [0, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      touchOpacity = t * 0.5;
      touchX = interpolate(local, [-6, LEFT_SWIPE_DUR], [SCREEN_W - 70, 55]);
    }
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, #0b0b0e 0%, #050506 100%)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'inherit',
      }}
    >
      <StatusBar />
      <Header activeIndex={activeIndex} />

      {/* Content strip — skip entirely once the overview fully covers it */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {overview < 0.99 ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 1 - overview,
              transform: `scale(${1 - 0.06 * overview})`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: SCREEN_W * LEFT_TAB_COUNT,
                display: 'flex',
                transform: `translateX(${-pos * SCREEN_W}px)`,
              }}
            >
              {PANELS.map((Panel, i) => (
                <div key={i} style={{ width: SCREEN_W, height: '100%', flexShrink: 0 }}>
                  <Panel activeFor={frame - activationFrame(i)} />
                </div>
              ))}
            </div>

            {/* Touch indicator */}
            <div
              style={{
                position: 'absolute',
                top: '48%',
                left: touchX,
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(254,234,165,0.5)',
                boxShadow: '0 0 18px rgba(232,175,72,0.6)',
                opacity: touchOpacity,
              }}
            />
          </div>
        ) : null}

        {overview > 0.01 ? (
          <div style={{ position: 'absolute', inset: 0, opacity: overview }}>
            <OverviewGrid localFrame={overviewOnly ? frame : frame - LEFT_OVERVIEW_START} />
          </div>
        ) : null}
      </div>

      {overview < 0.98 ? <TabBar pos={pos} /> : null}
    </div>
  );
};
