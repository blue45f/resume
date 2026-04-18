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
  'rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]',
  'bg-[var(--color-surface)] text-[var(--color-text)]',
  'shadow-[var(--shadow-lg)]',
  'p-4',
  'outline-none',
  'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.96]',
  'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
  'data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1',
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.96]',
  'motion-reduce:animate-none',
  'max-h-[calc(100dvh-3rem)] overflow-y-auto',
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
