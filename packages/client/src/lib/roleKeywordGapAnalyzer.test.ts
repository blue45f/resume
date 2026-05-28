import { describe, expect, it } from 'vitest';
import { detectRoleCategory, analyzeRoleKeywordGap } from './roleKeywordGapAnalyzer';

describe('detectRoleCategory', () => {
  it('returns unknown for empty text', () => {
    expect(detectRoleCategory('')).toBe('unknown');
  });

  it('detects frontend from React/TypeScript signals', () => {
    const text = 'React TypeScript Next.js Tailwind CSS Vite';
    expect(detectRoleCategory(text)).toBe('frontend');
  });

  it('detects backend from Spring/MySQL signals', () => {
    const text = 'Spring Boot NestJS PostgreSQL Redis Docker';
    expect(detectRoleCategory(text)).toBe('backend');
  });

  it('detects iOS from Swift/Xcode signals', () => {
    const text = 'Swift iOS SwiftUI Xcode UIKit Combine';
    expect(detectRoleCategory(text)).toBe('mobile_ios');
  });

  it('detects devops from Docker/Kubernetes signals', () => {
    const text = 'Docker Kubernetes Terraform AWS Helm CI/CD Jenkins';
    expect(detectRoleCategory(text)).toBe('devops');
  });

  it('detects ai_ml from PyTorch/LLM signals', () => {
    const text = 'PyTorch TensorFlow scikit-learn MLflow LLM GPT RAG';
    expect(detectRoleCategory(text)).toBe('ai_ml');
  });

  it('returns unknown for non-tech text', () => {
    const text = '영업 기획 마케팅 소통 협업 성실 열정';
    expect(detectRoleCategory(text)).toBe('unknown');
  });
});

describe('analyzeRoleKeywordGap', () => {
  it('returns score 0 and unknown for empty text', () => {
    const r = analyzeRoleKeywordGap('');
    expect(r.category).toBe('unknown');
    expect(r.score).toBe(0);
  });

  it('returns matched and missing arrays for detected role', () => {
    const text = 'React TypeScript Next.js CSS Vite';
    const r = analyzeRoleKeywordGap(text);
    expect(r.category).toBe('frontend');
    expect(r.matched.length).toBeGreaterThan(0);
    expect(r.missing.length).toBeGreaterThan(0);
  });

  it('score is between 0 and 100', () => {
    const text = 'Docker Kubernetes Terraform AWS Helm CI/CD Jenkins Prometheus';
    const r = analyzeRoleKeywordGap(text);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it('high score when many standard skills present', () => {
    const text = 'Docker Kubernetes Terraform CI/CD AWS Prometheus Grafana Helm GitOps 인프라';
    const r = analyzeRoleKeywordGap(text);
    expect(r.score).toBeGreaterThanOrEqual(60);
  });

  it('provides a non-empty suggestion', () => {
    const r = analyzeRoleKeywordGap('Swift iOS SwiftUI Xcode');
    expect(r.suggestion.length).toBeGreaterThan(0);
  });

  it('categoryLabel is Korean string', () => {
    const r = analyzeRoleKeywordGap('React TypeScript Next.js CSS');
    expect(r.categoryLabel).toBe('프론트엔드');
  });
});
