import type { JobApplication } from './api';

export type ApplicationCommunicationTone = 'primary' | 'neutral' | 'caution';

export interface ApplicationCommunicationTemplate {
  id: string;
  label: string;
  description: string;
  subject: string;
  body: string;
  tone: ApplicationCommunicationTone;
}

const INTERVIEW_STATUSES = new Set(['interview', 'interviewing', 'technical', 'onsite', 'final']);

const normalizeStatus = (status: string) => status.trim().toLowerCase();

const cleanText = (value?: string | null, fallback = '') => value?.trim() || fallback;

const formatDate = (value?: string | null, fallback = '최근') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}.${month}.${day}`;
};

const joinEmail = (subject: string, bodyLines: string[]) =>
  [`제목: ${subject}`, '', ...bodyLines].join('\n');

const makeTemplate = (
  template: Omit<ApplicationCommunicationTemplate, 'body'> & { bodyLines: string[] },
): ApplicationCommunicationTemplate => ({
  id: template.id,
  label: template.label,
  description: template.description,
  subject: template.subject,
  body: joinEmail(template.subject, template.bodyLines),
  tone: template.tone,
});

export const buildStageCommunicationTemplates = (
  application: Pick<
    JobApplication,
    'company' | 'position' | 'status' | 'appliedDate' | 'interviewDate' | 'salary' | 'updatedAt'
  >,
  now = new Date(),
): ApplicationCommunicationTemplate[] => {
  const company = cleanText(application.company, '귀사');
  const position = cleanText(application.position, '지원 포지션');
  const status = normalizeStatus(application.status);
  const appliedDate = formatDate(application.appliedDate);
  const interviewDate = formatDate(application.interviewDate, '면접일');
  const updatedAtTime = new Date(application.updatedAt).getTime();
  const staleDays = Number.isFinite(updatedAtTime)
    ? Math.floor((now.getTime() - updatedAtTime) / (24 * 60 * 60 * 1000))
    : 0;

  if (INTERVIEW_STATUSES.has(status)) {
    return [
      makeTemplate({
        id: 'interview-thank-you',
        label: '면접 감사',
        description: '면접 직후 interviewer 또는 recruiter에게 보낼 감사 메일입니다.',
        subject: `${position} 면접 감사드립니다`,
        tone: 'primary',
        bodyLines: [
          '안녕하세요.',
          '',
          `${interviewDate} ${company} ${position} 포지션 면접 기회를 주셔서 감사합니다.`,
          '면접을 통해 팀이 해결하려는 문제와 역할의 기대치를 더 구체적으로 이해할 수 있었습니다.',
          '논의한 내용 중 제가 보완해 전달드릴 자료가 있다면 편하게 말씀 부탁드립니다.',
          '',
          '검토해 주셔서 감사합니다.',
        ],
      }),
      makeTemplate({
        id: 'interview-materials',
        label: '추가 자료',
        description: '면접 후 포트폴리오, 과제, 참고 링크를 정리해 보낼 때 사용합니다.',
        subject: `${position} 면접 관련 추가 자료 전달드립니다`,
        tone: 'neutral',
        bodyLines: [
          '안녕하세요.',
          '',
          `${company} ${position} 면접에서 말씀드린 추가 자료를 정리해 전달드립니다.`,
          '아래 자료가 제 경험과 직무 적합성을 검토하시는 데 도움이 되길 바랍니다.',
          '',
          '- 참고 자료: [링크 또는 파일명]',
          '- 보충 설명: [면접에서 논의한 주제와 연결]',
          '',
          '감사합니다.',
        ],
      }),
    ];
  }

  if (status === 'offer') {
    return [
      makeTemplate({
        id: 'offer-questions',
        label: '오퍼 확인',
        description: '처우, 입사일, 역할 범위를 차분하게 확인하는 메일입니다.',
        subject: `${position} 오퍼 관련 확인드립니다`,
        tone: 'primary',
        bodyLines: [
          '안녕하세요.',
          '',
          `${company} ${position} 포지션 오퍼를 제안해 주셔서 감사합니다.`,
          `현재 안내받은 조건${application.salary ? `(${application.salary})` : ''}을 기준으로 처우와 입사 일정, 역할 범위를 정확히 확인하고 싶습니다.`,
          '검토 가능한 제안서 또는 다음 논의 일정을 안내해 주시면 확인 후 회신드리겠습니다.',
          '',
          '좋은 기회를 주셔서 감사합니다.',
        ],
      }),
      makeTemplate({
        id: 'offer-acceptance',
        label: '오퍼 수락',
        description: '조건 확인 후 오퍼를 수락할 때 사용하는 짧은 회신입니다.',
        subject: `${position} 오퍼 수락드립니다`,
        tone: 'primary',
        bodyLines: [
          '안녕하세요.',
          '',
          `${company} ${position} 포지션 오퍼를 감사히 수락합니다.`,
          '합류 전 필요한 서류와 온보딩 절차를 안내해 주시면 준비하겠습니다.',
          '',
          '앞으로 잘 부탁드립니다.',
        ],
      }),
    ];
  }

  if (status === 'rejected') {
    return [
      makeTemplate({
        id: 'rejection-thank-you',
        label: '관계 유지',
        description: '탈락 후에도 좋은 인상을 남기고 다음 기회를 열어두는 회신입니다.',
        subject: `${position} 전형 결과 회신 감사합니다`,
        tone: 'neutral',
        bodyLines: [
          '안녕하세요.',
          '',
          `${company} ${position} 전형 결과를 안내해 주셔서 감사합니다.`,
          '이번에는 함께하지 못하게 되었지만, 과정에서 보여주신 시간과 검토에 감사드립니다.',
          '향후 더 적합한 기회가 있다면 다시 도전하고 싶습니다.',
          '',
          '감사합니다.',
        ],
      }),
    ];
  }

  const staleNoResponse = ['applied', 'screening'].includes(status) && staleDays >= 21;

  return [
    ...(staleNoResponse
      ? [
          makeTemplate({
            id: 'no-response-final-check',
            label: '마지막 확인',
            description:
              '3주 이상 응답이 없을 때 보드를 정리하기 전 보내는 마지막 확인 메일입니다.',
            subject: `${position} 지원 건 최종 확인 요청드립니다`,
            tone: 'caution' as const,
            bodyLines: [
              '안녕하세요.',
              '',
              `${appliedDate} ${company} ${position} 포지션에 지원한 지원자입니다.`,
              '일정 기간 답변을 기다리고 있어 마지막으로 진행 여부를 확인드리고자 연락드립니다.',
              '전형이 종료되었거나 추가 확인이 어렵다면 해당 지원 건은 정리하도록 하겠습니다.',
              '',
              '검토해 주셔서 감사합니다.',
            ],
          }),
        ]
      : []),
    makeTemplate({
      id: 'application-follow-up',
      label: '지원 후속',
      description: '지원 후 일정 시간이 지났을 때 진행 상태를 정중히 확인합니다.',
      subject: `${position} 지원 건 확인 요청드립니다`,
      tone: 'primary',
      bodyLines: [
        '안녕하세요.',
        '',
        `${appliedDate} ${company} ${position} 포지션에 지원한 지원자입니다.`,
        '채용 검토가 진행 중인지 확인 부탁드리며, 추가로 전달드릴 자료나 보완할 내용이 있다면 안내 부탁드립니다.',
        '',
        '바쁘신 중 확인해 주셔서 감사합니다.',
      ],
    }),
    makeTemplate({
      id: 'withdrawal',
      label: '지원 철회',
      description: '사정상 전형을 정리해야 할 때 예의를 지키는 철회 메일입니다.',
      subject: `${position} 지원 철회 요청드립니다`,
      tone: 'caution',
      bodyLines: [
        '안녕하세요.',
        '',
        `${company} ${position} 포지션 전형에 지원한 지원자입니다.`,
        '개인 사정으로 이번 전형 참여를 철회하고자 연락드립니다.',
        '검토에 시간을 내주셔서 감사드리며, 추후 더 적합한 기회로 다시 인사드릴 수 있기를 바랍니다.',
        '',
        '감사합니다.',
      ],
    }),
  ];
};
