import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

loadFont({
  family: 'Playfair Display',
  url: staticFile('fonts/PlayfairDisplay-Regular.ttf'),
  weight: '400',
});

loadFont({
  family: 'Playfair Display',
  url: staticFile('fonts/PlayfairDisplay-Bold.ttf'),
  weight: '700',
});

loadFont({
  family: 'Instrument Serif',
  url: staticFile('fonts/InstrumentSerif-Regular.ttf'),
  weight: '400',
});

export const serifDisplay = 'Playfair Display';
export const serifBody = 'Instrument Serif';
