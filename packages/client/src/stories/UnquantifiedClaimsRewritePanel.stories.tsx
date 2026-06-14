import { useEffect } from 'react'

import { installFetchMock, uninstallFetchMock } from './_mockFetch'

import type { Meta, StoryObj } from '@storybook/react-vite'

import UnquantifiedClaimsRewritePanel from '@/components/UnquantifiedClaimsRewritePanel'

const meta: Meta<typeof UnquantifiedClaimsRewritePanel> = {
  title: 'Resume Analysis/UnquantifiedClaimsRewritePanel',
  component: UnquantifiedClaimsRewritePanel,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => {
      useEffect(() => {
        installFetchMock({
          '/api/inline-assist': { improved: '시스템 응답 지연을 38% 감소(평균 240ms → 149ms).' },
        })
        return () => uninstallFetchMock()
      }, [])
      return <Story />
    },
  ],
  argTypes: {
    resumeId: { control: 'text' },
    text: { control: 'text' },
    minLength: { control: { type: 'number', min: 0, max: 1000, step: 50 } },
  },
}
export default meta
type Story = StoryObj<typeof UnquantifiedClaimsRewritePanel>

const unquantifiedText = `
업무 효율을 크게 개선하였고, 사용자 만족도를 높이기 위해 다양한 노력을
기울였습니다. 팀의 협업 문화를 개선하고 코드 품질을 향상시켰습니다.
신규 기능을 빠르게 출시하여 사용자 경험을 강화하였고, 시스템 안정성을
크게 확보하였습니다. 사용자 인터페이스를 개선하여 사용 편의성을
높였고, 문서를 정리하여 신규 입사자의 적응을 도왔습니다.
프로세스를 자동화하여 반복 작업을 줄였습니다.
`.trim()

export const WithClaims: Story = {
  args: {
    resumeId: 'demo-resume-id',
    text: unquantifiedText,
    minLength: 200,
  },
}

export const Empty: Story = {
  args: {
    resumeId: 'demo-resume-id',
    text: '짧음',
    minLength: 200,
  },
}
