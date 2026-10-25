import { useEffect, useRef, useState } from 'react'
import { removeBookFile, storeBookFile, storedBookFile, type StoredBookFile } from '../rules/book-store.ts'
import { bookCounts, readBookFile, type BookFileName } from '../rules/books.ts'
import { reloadRules } from '../rules/load.ts'

// Settings, Book file (the spec §4.2): the user's own PHB and DMG records,
// restated, which the app never ships. The user loads the file the
// workspace builds, d-amp-d-books-<date>.json, on each device. This says
// which file is loaded, from when, and what it holds; loads another, which
// replaces it whole; or removes it. A character using a book record keeps it
// on a device without the file, marked unresolved (§4.1), rather than
// losing it.

const NAMES: Record<BookFileName, [string, string]> = {
  classes: ['subclass', 'subclasses'],
  species: ['species', 'species'],
  backgrounds: ['background', 'backgrounds'],
  feats: ['feat', 'feats'],
  spells: ['spell', 'spells'],
  'magic-items': ['magic item', 'magic items'],
}

const DATE = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export function BookFileSection() {
  const input = useRef<HTMLInputElement>(null)
  const [stored, setStored] = useState<StoredBookFile | null | undefined>(undefined)
  const [said, setSaid] = useState('')
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    void storedBookFile().then(setStored)
  }, [])

  async function load(file: File) {
    const read = readBookFile(await file.text())
    if (!read.ok) return setSaid(`Not loaded: ${read.error}`)
    const next: StoredBookFile = { file: read.file, loadedAt: new Date().toISOString(), fileName: file.name }
    try {
      await storeBookFile(next)
    } catch (err) {
      return setSaid(`This browser would not keep the book file: ${String(err)}`)
    }
    setStored(next)
    reloadRules()
    setSaid(stored ? 'Loaded, in place of the earlier book file.' : 'Loaded. Its records are in every list now.')
  }

  async function remove() {
    setAsking(false)
    try {
      await removeBookFile()
    } catch (err) {
      return setSaid(`It could not be removed: ${String(err)}`)
    }
    setStored(null)
    reloadRules()
    setSaid('Removed. Characters keep any book records they use, marked as missing until a book file is loaded again.')
  }

  if (stored === undefined) return null
  return (
    <section aria-labelledby="book-file-heading">
      <h2 id="book-file-heading">Book file</h2>
      <p className="meta">
        Your own Player’s Handbook and Dungeon Master’s Guide records, restated: the subclasses, species, backgrounds, feats, spells and magic items the free SRD
        doesn’t have. The app never carries them; you load the file on each device.
      </p>
      {stored ? (
        <>
          <p className="book-file-loaded">
            <strong>{stored.fileName}</strong>, built {stored.file.builtOn}, loaded {DATE.format(new Date(stored.loadedAt))}.
          </p>
          <p className="meta">
            {bookCounts(stored.file)
              .map((c) => `${c.count} ${NAMES[c.name][c.count === 1 ? 0 : 1]}`)
              .join(', ')}
            . Version {stored.file.booksVersion}.
          </p>
        </>
      ) : (
        <p>No book file on this device. The SRD’s records work without one.</p>
      )}
      <div className="actions">
        <button type="button" className="secondary" onClick={() => input.current?.click()}>
          {stored ? 'Load a newer book file' : 'Load the book file'}
        </button>
        {stored && !asking && (
          <button type="button" className="secondary" onClick={() => setAsking(true)}>
            Remove it
          </button>
        )}
      </div>
      {asking && (
        <>
          <p>Remove the book file from this device? Characters keep the book records they use, shown as missing until it’s loaded again.</p>
          <div className="actions">
            <button type="button" className="secondary" onClick={() => setAsking(false)}>
              Keep it
            </button>
            <button type="button" className="danger" onClick={() => void remove()}>
              Remove
            </button>
          </div>
        </>
      )}
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void load(file)
        }}
      />
      <p role="status">{said}</p>
    </section>
  )
}
