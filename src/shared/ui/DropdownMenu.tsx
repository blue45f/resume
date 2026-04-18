/**
 * DropdownMenu - Impeccable-styled Radix DropdownMenu wrapper primitives.
 *
 * Exports:
 *   - DropdownMenu.Root, Trigger, Portal, Content, Item, Separator, Label,
 *     Sub, SubContent, SubTrigger, CheckboxItem, RadioItem, ItemIndicator
 *
 * Usage:
 *   <DropdownMenu.Root>
 *     <DropdownMenu.Trigger asChild><button>...</button></DropdownMenu.Trigger>
 *     <DropdownMenu.Content>
 *       <DropdownMenu.Item onSelect={...}>액션</DropdownMenu.Item>
 *       <DropdownMenu.Separator />
 *       <DropdownMenu.Item onSelect={...}>다른 액션</DropdownMenu.Item>
 *     </DropdownMenu.Content>
 *   </DropdownMenu.Root>
 */
import * as Radix from '@radix-ui/react-dropdown-menu';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';

const contentClass = [
  'z-[100] min-w-[11rem] overflow-hidden',
  'rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]',
  'bg-[var(--color-surface)]',
  'shadow-[var(--shadow-lg)]',
  'p-1',
  // Radix side-aware open animation (slide from trigger side)
  'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.96]',
  'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
  'data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1',
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.96]',
  'motion-reduce:animate-none',
].join(' ');

const itemClass = [
  'relative flex items-center gap-2.5',
  'h-9 px-2.5 rounded-[var(--radius-sm)]',
  'text-sm text-[var(--color-text)]',
  'cursor-pointer select-none outline-none',
  'data-[highlighted]:bg-[var(--color-surface-sunken)]',
  'data-[highlighted]:text-[var(--color-text)]',
  'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
  'transition-colors duration-100',
].join(' ');

const Content = forwardRef<
  ElementRef<typeof Radix.Content>,
  ComponentPropsWithoutRef<typeof Radix.Content>
>(({ className = '', sideOffset = 6, ...props }, ref) => (
  <Radix.Portal>
    <Radix.Content
      ref={ref}
      sideOffset={sideOffset}
      className={`${contentClass} ${className}`}
      {...props}
    />
  </Radix.Portal>
));
Content.displayName = 'DropdownMenuContent';

const Item = forwardRef<ElementRef<typeof Radix.Item>, ComponentPropsWithoutRef<typeof Radix.Item>>(
  ({ className = '', ...props }, ref) => (
    <Radix.Item ref={ref} className={`${itemClass} ${className}`} {...props} />
  ),
);
Item.displayName = 'DropdownMenuItem';

const CheckboxItem = forwardRef<
  ElementRef<typeof Radix.CheckboxItem>,
  ComponentPropsWithoutRef<typeof Radix.CheckboxItem>
>(({ className = '', ...props }, ref) => (
  <Radix.CheckboxItem ref={ref} className={`${itemClass} pr-7 ${className}`} {...props} />
));
CheckboxItem.displayName = 'DropdownMenuCheckboxItem';

const RadioItem = forwardRef<
  ElementRef<typeof Radix.RadioItem>,
  ComponentPropsWithoutRef<typeof Radix.RadioItem>
>(({ className = '', ...props }, ref) => (
  <Radix.RadioItem ref={ref} className={`${itemClass} pr-7 ${className}`} {...props} />
));
RadioItem.displayName = 'DropdownMenuRadioItem';

const Separator = forwardRef<
  ElementRef<typeof Radix.Separator>,
  ComponentPropsWithoutRef<typeof Radix.Separator>
>(({ className = '', ...props }, ref) => (
  <Radix.Separator
    ref={ref}
    className={`my-1 h-px bg-[var(--color-border-subtle)] ${className}`}
    {...props}
  />
));
Separator.displayName = 'DropdownMenuSeparator';

const Label = forwardRef<
  ElementRef<typeof Radix.Label>,
  ComponentPropsWithoutRef<typeof Radix.Label>
>(({ className = '', ...props }, ref) => (
  <Radix.Label
    ref={ref}
    className={`px-2.5 pt-2 pb-1 text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider ${className}`}
    {...props}
  />
));
Label.displayName = 'DropdownMenuLabel';

const SubContent = forwardRef<
  ElementRef<typeof Radix.SubContent>,
  ComponentPropsWithoutRef<typeof Radix.SubContent>
>(({ className = '', ...props }, ref) => (
  <Radix.SubContent ref={ref} className={`${contentClass} ${className}`} {...props} />
));
SubContent.displayName = 'DropdownMenuSubContent';

const SubTrigger = forwardRef<
  ElementRef<typeof Radix.SubTrigger>,
  ComponentPropsWithoutRef<typeof Radix.SubTrigger>
>(({ className = '', ...props }, ref) => (
  <Radix.SubTrigger ref={ref} className={`${itemClass} ${className}`} {...props} />
));
SubTrigger.displayName = 'DropdownMenuSubTrigger';

const DropdownMenu = {
  Root: Radix.Root,
  Trigger: Radix.Trigger,
  Portal: Radix.Portal,
  Group: Radix.Group,
  RadioGroup: Radix.RadioGroup,
  Sub: Radix.Sub,
  ItemIndicator: Radix.ItemIndicator,
  Content,
  Item,
  CheckboxItem,
  RadioItem,
  Separator,
  Label,
  SubContent,
  SubTrigger,
};

export default DropdownMenu;
