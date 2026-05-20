import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import AvatarEditor from '@/components/AvatarEditor';
import { installFetchMock, uninstallFetchMock } from './_mockFetch';

const meta: Meta<typeof AvatarEditor> = {
  title: 'Profile/AvatarEditor',
  component: AvatarEditor,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => {
      useEffect(() => {
        installFetchMock({
          '/api/auth/avatar': { avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=demo' },
        });
        return () => uninstallFetchMock();
      }, []);
      return <Story />;
    },
  ],
};
export default meta;
type Story = StoryObj<typeof AvatarEditor>;

function Demo({ initial }: { initial: string }) {
  const [current, setCurrent] = useState(initial);
  return <AvatarEditor current={current} fallbackInitial="김" onChange={setCurrent} />;
}

export const WithAvatar: Story = {
  render: () => <Demo initial="https://api.dicebear.com/9.x/notionists/svg?seed=hojun&size=128" />,
};

export const NoAvatar: Story = {
  render: () => <Demo initial="" />,
};
