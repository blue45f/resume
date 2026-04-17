/**
 * TooltipProvider - Global provider for tooltip delay/skip behavior.
 * Wrap your app root with this to share tooltip state across components.
 *
 * Usage (e.g. in App.tsx):
 *   <TooltipProvider>
 *     <Routes>...</Routes>
 *   </TooltipProvider>
 */
import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
}

export default function TooltipProvider({
  children,
  delayDuration = 300,
  skipDelayDuration = 300,
}: Props) {
  return (
    <RadixTooltip.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
    >
      {children}
    </RadixTooltip.Provider>
  );
}
