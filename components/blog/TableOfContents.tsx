import { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  // Extract H2 headings from HTML content and add IDs
  useEffect(() => {
    if (!content) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    const h2Elements = tempDiv.querySelectorAll('h2');
    const extractedHeadings: Heading[] = [];

    h2Elements.forEach((h2, index) => {
      const text = h2.textContent || '';
      if (text.trim()) {
        const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
        extractedHeadings.push({ id, text: text.trim() });
      }
    });

    setHeadings(extractedHeadings);

    // Add IDs to actual rendered headings
    const addIdsToHeadings = () => {
      const contentElement = document.querySelector('.blog-content');
      if (!contentElement) {
        setTimeout(addIdsToHeadings, 100);
        return;
      }
      const renderedH2Elements = contentElement.querySelectorAll('h2');
      renderedH2Elements.forEach((h2, index) => {
        if (index < extractedHeadings.length) {
          h2.id = extractedHeadings[index].id;
        }
      });
    };

    setTimeout(addIdsToHeadings, 100);
    setTimeout(addIdsToHeadings, 300);
    setTimeout(addIdsToHeadings, 500);
  }, [content]);

  // Track active heading on scroll
  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      for (let i = headings.length - 1; i >= 0; i--) {
        const element = document.getElementById(headings[i].id);
        if (element && scrollPosition >= element.offsetTop) {
          setActiveId(headings[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (!element) {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.pageYOffset - 100;
          window.scrollTo({ top, behavior: 'smooth' });
          setActiveId(id);
        }
      }, 100);
      return;
    }
    const top = element.getBoundingClientRect().top + window.pageYOffset - 100;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveId(id);
  };

  if (headings.length === 0) return null;

  return (
    <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
      <div className="px-6 py-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h2>
        <nav className="space-y-2">
          {headings.map((heading) => (
            <button
              key={heading.id}
              onClick={() => scrollToHeading(heading.id)}
              className={`block w-full text-left text-sm transition-colors py-1 ${
                activeId === heading.id
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
