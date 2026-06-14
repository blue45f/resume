import type { JobApplication } from './api'

const CSV_HEADERS = [
  'Company',
  'Position',
  'Status',
  'Priority',
  'Applied Date',
  'Deadline',
  'Interview Date',
  'Location',
  'Salary',
  'URL',
  'Notes',
  'Created At',
  'Updated At',
]

const csvValue = (value?: string | null) => {
  const text = value ?? ''
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

const dateOnly = (value?: string | null) => value?.slice(0, 10) ?? ''

export const buildApplicationCsv = (applications: JobApplication[]) => {
  const rows = applications.map((application) =>
    [
      application.company,
      application.position,
      application.status,
      application.priority,
      dateOnly(application.appliedDate || application.createdAt),
      dateOnly(application.deadline),
      dateOnly(application.interviewDate),
      application.location,
      application.salary,
      application.url,
      application.notes,
      dateOnly(application.createdAt),
      dateOnly(application.updatedAt),
    ]
      .map(csvValue)
      .join(',')
  )

  return [CSV_HEADERS.join(','), ...rows].join('\n')
}

export const getApplicationCsvFileName = (
  exportedCount: number,
  totalCount: number,
  now = new Date()
) => {
  const scope = exportedCount === totalCount ? 'all' : 'filtered'
  const date = now.toISOString().slice(0, 10)
  return `applications-${scope}-${date}.csv`
}
