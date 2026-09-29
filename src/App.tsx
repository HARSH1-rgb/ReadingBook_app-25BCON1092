import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus, Library, Bookmark, CheckCircle2, Trash2, AlertCircle } from 'lucide-react';

type Status = 'want' | 'reading' | 'finished';

interface Book {
  id: string;
  title: string;
  status: Status;
}

const STATUS_META: Record<Status, { label: string; short: string; icon: typeof Bookmark; chip: string; dot: string }> = {
  want: {
    label: 'Want to Read',
    short: 'Want to Read',
    icon: Bookmark,
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  reading: {
    label: 'Reading',
    short: 'Reading',
    icon: BookOpen,
    chip: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  finished: {
    label: 'Finished',
    short: 'Finished',
    icon: CheckCircle2,
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
};

const FILTERS: { key: 'all' | Status; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'want', label: 'Want to Read' },
  { key: 'reading', label: 'Reading' },
  { key: 'finished', label: 'Finished' },
];

const STORAGE_KEY = 'reading-list-books';

function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b): b is Book =>
        b && typeof b.id === 'string' && typeof b.title === 'string' && ['want', 'reading', 'finished'].includes(b.status)
    );
  } catch {
    return [];
  }
}

export default function App() {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [title, setTitle] = useState('');
  const [newStatus, setNewStatus] = useState<Status>('want');
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  const counts = useMemo(() => {
    return {
      all: books.length,
      want: books.filter((b) => b.status === 'want').length,
      reading: books.filter((b) => b.status === 'reading').length,
      finished: books.filter((b) => b.status === 'finished').length,
    } as Record<'all' | Status, number>;
  }, [books]);

  const visibleBooks = useMemo(() => {
    const list = filter === 'all' ? books : books.filter((b) => b.status === filter);
    return [...list].sort((a, b) => b.id.localeCompare(a.id));
  }, [books, filter]);

  const addBook = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    if (trimmed.length > 60) {
      setError('Book title must be 60 characters or fewer.');
      return;
    }
    const normalized = trimmed.replace(/\s+/g, ' ').toLowerCase();
    const isDuplicate = books.some((b) => b.title.replace(/\s+/g, ' ').toLowerCase() === normalized);
    if (isDuplicate) {
      setError('This book is already in your reading list.');
      return;
    }
    const book: Book = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmed,
      status: newStatus,
    };
    setBooks((prev) => [book, ...prev]);
    setTitle('');
    setError('');
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 600);
  };

  const cycleStatus = (id: string) => {
    const order: Status[] = ['want', 'reading', 'finished'];
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const next = order[(order.indexOf(b.status) + 1) % order.length];
        return { ...b, status: next };
      })
    );
  };

  const removeBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-stone-50/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-800 text-amber-400 shadow-sm">
            <Library className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight tracking-tight text-stone-900">Reading List</h1>
            <p className="text-xs text-stone-500">Track your books, one page at a time.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-24 sm:px-6">
        {/* Add form */}
        <section className="mt-6">
          <form
            onSubmit={addBook}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Book title..."
                aria-label="Book title"
                className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-200"
              />
              <button
                type="submit"
                disabled={!title.trim()}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm transition ${
                  title.trim()
                    ? 'bg-stone-800 hover:bg-stone-900 active:scale-[0.98]'
                    : 'cursor-not-allowed bg-stone-300'
                }`}
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            {error && (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            {/* Status picker for new book */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-stone-500">Status:</span>
              {(Object.keys(STATUS_META) as Status[]).map((s) => {
                const meta = STATUS_META[s];
                const Icon = meta.icon;
                const active = newStatus === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewStatus(s)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                      active
                        ? `${meta.chip} ring-2 ring-offset-0`
                        : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </form>
        </section>

        {/* Filters */}
        <section className="mt-6">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    active
                      ? 'bg-stone-800 text-white shadow-sm'
                      : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-800'
                  }`}
                >
                  {f.label}
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                      active ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Book list / empty state */}
        <section className="mt-5">
          {books.length === 0 ? (
            <EmptyState />
          ) : visibleBooks.length === 0 ? (
            <NoMatches filterLabel={FILTERS.find((f) => f.key === filter)?.label ?? 'this filter'} />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visibleBooks.map((book) => {
                const meta = STATUS_META[book.status];
                const Icon = meta.icon;
                return (
                  <li
                    key={book.id}
                    className={`group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md ${
                      justAdded && book.id === visibleBooks[0]?.id ? 'animate-[fadeIn_0.5s_ease-out]' : ''
                    }`}
                  >
                    <span className={`absolute left-0 top-0 h-full w-1 ${meta.dot}`} />
                    <div className="flex items-start justify-between gap-3 pl-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-stone-900" title={book.title}>
                          {book.title}
                        </h3>
                        <button
                          onClick={() => cycleStatus(book.id)}
                          className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition hover:scale-[1.02] active:scale-95 ${meta.chip}`}
                          title="Click to change status"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {meta.short}
                        </button>
                      </div>
                      <button
                        onClick={() => removeBook(book.id)}
                        aria-label={`Remove ${book.title}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-300 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        <Library className="h-7 w-7" />
      </div>
      <p className="mt-4 text-sm font-medium text-stone-700">
        Your reading list is empty. Add your first book.
      </p>
      <p className="mt-1 text-xs text-stone-400">Use the form above to get started.</p>
    </div>
  );
}

function NoMatches({ filterLabel }: { filterLabel: string }) {
  return (
    <div className="mt-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-400">
        <BookOpen className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm text-stone-600">
        No books in <span className="font-medium text-stone-800">{filterLabel}</span>.
      </p>
    </div>
  );
}
