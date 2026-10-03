/* A number whose digits roll when it changes, like an odometer (NumberFlow, MIT): the crowding
   card hands it to CrowdingIndicator as `numberAs`. NumberFlow draws in a shadow root and labels
   itself as an image; the plain copy beside it keeps the sentence whole for a screen reader and
   for the page's text. The roll takes the design system's --motion-slow (0 with reduced motion),
   not NumberFlow's own 900 ms spring. */
import NumberFlow from '@number-flow/react';

function motionMs(token: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return v.endsWith('ms') ? parseFloat(v) : v.endsWith('s') ? parseFloat(v) * 1000 : 0;
}

/* Hidden but inline: an absolutely placed copy (.ub-visually-hidden) would break the sentence
   into lines for anything reading the page's text. */
const INLINE_HIDDEN = { display: 'inline-block', width: 1, height: 1, margin: -1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' } as const;

export function FlowNumber({ value }: { value: number }) {
  const roll = { duration: motionMs('--motion-slow'), easing: 'ease-out' };
  return (
    <>
      <NumberFlow value={value} aria-hidden="true" transformTiming={roll} spinTiming={roll}
        opacityTiming={{ duration: motionMs('--motion-fast'), easing: 'ease-out' }} />
      <span style={INLINE_HIDDEN}>{value}</span>
    </>
  );
}
