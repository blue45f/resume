/**
 * Tooltip - Reusable tooltip component built on @radix-ui/react-tooltip.
 *
 * Usage:
 *   import Tooltip from '@/shared/ui/Tooltip';
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

export default function Tooltip({ content, children, side = 'top', delay = 300 }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={delay}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={6}
            className="z-[110] rounded-[var(--radius-sm)] bg-neutral-900 dark:bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg shadow-black/20 max-w-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none"
          >
            {content}
            <RadixTooltip.Arrow
              className="fill-neutral-900 dark:fill-neutral-800"
              width={10}
              height={5}
            />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
