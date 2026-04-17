/**
 * Popover - Impeccable-styled Radix Popover wrapper primitives.
 *
 * Usage:
 *   <Popover.Root>
 *     <Popover.Trigger asChild><button>...</button></Popover.Trigger>
 *     <Popover.Content>
 *       ... content ...
 *     </Popover.Content>
 *   </Popover.Root>
 */
import * as Radix from '@radix-ui/react-popover';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';

const contentClass = [
  'z-[100] w-72',
  'rounded-[12px] border border-neutral-200 dark:border-neutral-800',
  'bg-white dark:bg-neutral-900',
  'shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]',
  'p-4',
  'outline-none',
  'animate-in fade-in-0 zoom-in-95',
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
  'max-h-[90vh] overflow-y-auto',
].join(' ');

const Content = forwardRef<
  ElementRef<typeof Radix.Content>,
  ComponentPropsWithoutRef<typeof Radix.Content>
>(({ className = '', sideOffset = 6, align = 'center', ...props }, ref) => (
  <Radix.Portal>
    <Radix.Content
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      className={`${contentClass} ${className}`}
      {...props}
    />
  </Radix.Portal>
));
Content.displayName = 'PopoverContent';

const Popover = {
  Root: Radix.Root,
  Trigger: Radix.Trigger,
  Portal: Radix.Portal,
  Anchor: Radix.Anchor,
  Arrow: Radix.Arrow,
  Close: Radix.Close,
  Content,
};

export default Popover;
