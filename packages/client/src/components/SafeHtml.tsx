import DOMPurify from 'dompurify';

interface Props {
  html: string;
  className?: string;
}

// 허용 태그 (이력서에 필요한 최소한)
const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span'];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

export default function SafeHtml({ html, className }: Props) {
  if (!html || html === '<p></p>') return null;

  // HTML 태그가 없으면 plain text로 처리 (기존 데이터 호환)
  if (!/<[^>]+>/.test(html)) {
    const lines = html.split('\n').filter(Boolean);
    if (lines.length <= 1) {
      return <p className={className}>{html}</p>;
    }
    return (
      <ul className={`list-disc list-inside space-y-0.5 ${className || ''}`}>
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    );
  }

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });

  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
