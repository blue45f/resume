import data from '../sample-data.json'

export interface Experience {
  company: string
  position: string
  period: string
  description: string
}
export interface Resume {
  id: string
  title: string
  role: string
  name: string
  summary: string
  viewCount: number
  skills: string[]
  experiences: Experience[]
}
const items: Resume[] = (data as { items?: Resume[] }).items || []
export function getResumes(): Resume[] {
  return items
}
export function getResume(id: string): Resume | undefined {
  return items.find((r) => r.id === id)
}
