/**
 * Tooltip - Reusable tooltip component built on @radix-ui/react-tooltip.
 *
 * Usage:
 *   import Tooltip from '@/components/Tooltip';
 *
 *   <Tooltip content="북마크 추가">
 *     <button>...</button>
 *   </Tooltip>
 *
 *   <Tooltip content="상세 설명" side="bottom" delay={500}>
 *     <span>hover me</span>
 *   </Tooltip>
 *
 * Note: For best results, wrap the app root with <TooltipProvider> once.
 * This component also includes a local Provider as a fallback.
 */
import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export default function Tooltip({
  content,
  children,
  side = 'top',
  delay = 300,
}: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={delay}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={6}
            className="z-50 rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg shadow-black/20 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          >
            {content}
            <RadixTooltip.Arrow className="fill-neutral-900" width={10} height={5} />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
