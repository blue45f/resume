import type { Resume } from '@/types/resume'

export interface RoadmapTask {
  label: string
  tip: string
  gain: number
  done: boolean
  sectionId: string
}

export function buildRoadmap(resume: Partial<Resume>): RoadmapTask[] {
  if (!resume.personalInfo) return []
  const r = resume as Resume
  const tasks: RoadmapTask[] = []
  const pi = r.personalInfo

  if (!pi.summary || pi.summary.replace(/<[^>]*>/g, '').length < 30)
    tasks.push({
      label: '자기소개 작성',
      tip: '30자 이상 자기소개를 작성하면 +8점',
      gain: 8,
      done: false,
      sectionId: 'summary',
    })
  else
    tasks.push({
      label: '자기소개 완성',
      tip: '자기소개가 잘 작성되어 있습니다',
      gain: 8,
      done: true,
      sectionId: 'summary',
    })

  if (!pi.github && !pi.website)
    tasks.push({
      label: 'GitHub / 포트폴리오 링크 추가',
      tip: 'URL 추가 시 +3점, ATS 매칭률 향상',
      gain: 3,
      done: false,
      sectionId: 'links',
    })
  else
    tasks.push({
      label: 'GitHub / 포트폴리오 링크',
      tip: '링크가 등록되어 있습니다',
      gain: 3,
      done: true,
      sectionId: 'links',
    })

  const hasDescriptions = r.experiences.some(
    (e) => e.description && e.description.replace(/<[^>]*>/g, '').length > 30
  )
  if (r.experiences.length === 0)
    tasks.push({
      label: '경력 사항 추가',
      tip: '경력 1개 추가 시 +10점',
      gain: 10,
      done: false,
      sectionId: 'experience',
    })
  else if (!hasDescriptions)
    tasks.push({
      label: '경력 업무 내용 상세화',
      tip: '업무 설명 30자+ 입력 시 +5점',
      gain: 5,
      done: false,
      sectionId: 'experience',
    })
  else if (!r.experiences.some((e) => e.techStack))
    tasks.push({
      label: '경력에 기술 스택 명시',
      tip: '사용 기술 추가 시 +2점, ATS 키워드 강화',
      gain: 2,
      done: false,
      sectionId: 'experience',
    })
  else
    tasks.push({
      label: '경력 섹션 완성',
      tip: '경력이 충실하게 작성되어 있습니다',
      gain: 25,
      done: true,
      sectionId: 'experience',
    })

  if (r.educations.length === 0)
    tasks.push({
      label: '학력 추가',
      tip: '학력 입력 시 +7점',
      gain: 7,
      done: false,
      sectionId: 'education',
    })
  else
    tasks.push({
      label: '학력 완성',
      tip: '학력이 등록되어 있습니다',
      gain: 10,
      done: true,
      sectionId: 'education',
    })

  if (r.skills.length === 0)
    tasks.push({
      label: '기술 스택 추가',
      tip: '기술 1개 카테고리 추가 시 +6점',
      gain: 6,
      done: false,
      sectionId: 'skills',
    })
  else if (r.skills.length < 2)
    tasks.push({
      label: '기술 카테고리 추가',
      tip: '2개 이상 카테고리 입력 시 +4점 추가',
      gain: 4,
      done: false,
      sectionId: 'skills',
    })
  else
    tasks.push({
      label: '기술 스택 완성',
      tip: '다양한 기술이 등록되어 있습니다',
      gain: 15,
      done: true,
      sectionId: 'skills',
    })

  if (r.projects.length === 0)
    tasks.push({
      label: '프로젝트 추가',
      tip: '프로젝트 1개 추가 시 +5점',
      gain: 5,
      done: false,
      sectionId: 'projects',
    })
  else
    tasks.push({
      label: '프로젝트 완성',
      tip: '프로젝트가 등록되어 있습니다',
      gain: 10,
      done: true,
      sectionId: 'projects',
    })

  const hasExtras = r.certifications.length > 0 || r.languages.length > 0 || r.awards.length > 0
  if (!hasExtras)
    tasks.push({
      label: '자격증 또는 어학 추가',
      tip: '자격증/어학/수상 추가 시 +3~5점',
      gain: 5,
      done: false,
      sectionId: 'extras',
    })
  else
    tasks.push({
      label: '자격증 / 어학',
      tip: '추가 스펙이 등록되어 있습니다',
      gain: 10,
      done: true,
      sectionId: 'extras',
    })

  // Sort: incomplete tasks first, by gain descending
  return tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return b.gain - a.gain
  })
}
