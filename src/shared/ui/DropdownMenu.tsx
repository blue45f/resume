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
  'z-[100] min-w-[10rem] overflow-hidden',
  'rounded-[12px] border border-neutral-200 dark:border-neutral-800',
  'bg-white dark:bg-neutral-900',
  'shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]',
  'p-1',
  'animate-in fade-in-0 zoom-in-95',
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
].join(' ');

const itemClass = [
  'relative flex items-center gap-2',
  'px-2.5 py-2 rounded-[8px]',
  'text-sm text-neutral-700 dark:text-neutral-200',
  'cursor-pointer select-none outline-none',
  'data-[highlighted]:bg-neutral-100 dark:data-[highlighted]:bg-neutral-800',
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
    className={`my-1 h-px bg-neutral-100 dark:bg-neutral-800 ${className}`}
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
    className={`px-2.5 py-1 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider ${className}`}
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
