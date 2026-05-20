import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import JobUrlInput from '@/components/JobUrlInput';
import { installFetchMock, uninstallFetchMock } from './_mockFetch';

const meta: Meta<typeof JobUrlInput> = {
  title: 'Sharing & Job/JobUrlInput',
  component: JobUrlInput,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => {
      useEffect(() => {
        installFetchMock({
          '/api/jobs/parse-url': {
            source: 'json-ld',
            title: 'Senior Backend Engineer',
            company: '데모컴퍼니',
            location: 'Seoul',
            description: '예시 채용 공고 — Storybook 데모용 응답.',
          },
        });
        return () => uninstallFetchMock();
      }, []);
      return <Story />;
    },
  ],
  argTypes: {
    onParsed: { action: 'parsed' },
    disabled: { control: 'boolean' },
    hint: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof JobUrlInput>;

export const Default: Story = {
  args: { disabled: false },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const CustomHint: Story = {
  args: {
    disabled: false,
    hint: '원티드/잡코리아/사람인 등 한국 채용 사이트 URL 을 붙여넣으면 자동으로 회사·직무·연봉 정보를 추출합니다.',
  },
};
