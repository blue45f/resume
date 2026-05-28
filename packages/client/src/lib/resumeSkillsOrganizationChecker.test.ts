import { describe, expect, it } from 'vitest';
import { checkResumeSkillsOrganization } from './resumeSkillsOrganizationChecker';

describe('checkResumeSkillsOrganization', () => {
  it('returns minimal for empty text', () => {
    const r = checkResumeSkillsOrganization('');
    expect(r.grade).toBe('minimal');
    expect(r.skillCount).toBe(0);
  });

  it('detects skills across categories', () => {
    const r = checkResumeSkillsOrganization(
      'Java, Python, React, PostgreSQL, Docker, AWS 활용 경험.',
    );
    expect(r.skillCount).toBeGreaterThan(3);
    expect(r.categoryCount).toBeGreaterThan(2);
  });

  it('detects organized headers', () => {
    const r = checkResumeSkillsOrganization(
      '언어: Java, Python\n프레임워크: Spring, React\nDB: PostgreSQL, Redis',
    );
    expect(r.grade).toBe('organized');
  });

  it('grades jumbled when many skills without categories', () => {
    const r = checkResumeSkillsOrganization(
      'Java Python TypeScript React Vue Angular Spring Django FastAPI PostgreSQL MySQL Redis Docker AWS Kubernetes',
    );
    expect(r.grade).toBe('jumbled');
  });

  it('flags no_categories issue for unorganized skills', () => {
    const r = checkResumeSkillsOrganization('Java Python React PostgreSQL Docker AWS Kubernetes');
    expect(r.issues).toContain('no_categories');
  });

  it('flags too_broad for more than 50 skills', () => {
    // Construct a text with many skills
    const skills =
      'Java Python TypeScript JavaScript Go Rust Kotlin Swift Ruby PHP ' +
      'React Vue Angular Next.js Nuxt Svelte Remix Astro ' +
      'Spring NestJS Express FastAPI Django Flask Rails Gin ' +
      'MySQL PostgreSQL MongoDB Redis Elasticsearch Oracle SQLite Cassandra DynamoDB ' +
      'AWS GCP Azure Docker Kubernetes Terraform Jenkins CircleCI ' +
      'TensorFlow PyTorch Pandas NumPy Spark Kafka Airflow ' +
      'Jest JUnit pytest Cypress Playwright Selenium Vitest';
    const r = checkResumeSkillsOrganization(skills);
    expect(r.issues).toContain('too_broad');
  });

  it('provides suggestions for jumbled skills', () => {
    const r = checkResumeSkillsOrganization('Java React PostgreSQL Docker AWS 기술 보유');
    expect(r.suggestions.length).toBeGreaterThan(0);
  });

  it('summary is non-empty string', () => {
    const r = checkResumeSkillsOrganization('일반적인 이력서 내용입니다.');
    expect(r.summary.length).toBeGreaterThan(10);
  });
});
