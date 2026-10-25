// Reading form fields out of a PDF: names and values in page order, from the
// pages' widgets alone (D&D Beyond's export has no /AcroForm), through the
// shapes a re-saved copy can take. The PDFs are written by test-pdf.ts.

import { describe, expect, it } from 'vitest'
import { readPdfFields, type PdfField } from './pdf-fields.ts'
import { buildPdf, latin1, type TestPage, type TestPdfOptions } from './test-pdf.ts'

// A page of widgets, each given as its /T and /V source.
const page = (...widgets: Array<[string, string?]>): TestPage => ({ widgets: widgets.map(([T, V]) => ({ T, V })) })

async function fieldsOf(options: TestPdfOptions): Promise<PdfField[]> {
  const result = await readPdfFields(await buildPdf(options))
  if (!result.ok) throw new Error(`not read: ${result.reason}`)
  return result.fields
}

const valuesOf = async (...widgets: string[]) =>
  (await fieldsOf({ pages: [page(...widgets.map((V, i): [string, string] => [`(F${i})`, V]))] })).map((f) => f.value)

const asText = (bytes: Uint8Array) => String.fromCharCode(...bytes)

describe('readPdfFields', () => {
  it('reads each widget name and value from the pages, with no /AcroForm', async () => {
    const options = { pages: [page(['(CharacterName)', '(Brindle)'], ['(STR)', '(15)'], ['(Notes)'])] }
    expect(asText(await buildPdf(options))).not.toContain('AcroForm')
    expect(await fieldsOf(options)).toEqual([
      { page: 1, name: 'CharacterName', value: 'Brindle' },
      { page: 1, name: 'STR', value: '15' },
      { page: 1, name: 'Notes', value: '' },
    ])
  })

  it('numbers the pages in page-tree order, through nested /Kids', async () => {
    const fields = await fieldsOf({ pages: [{ kids: [page(['(A)']), { kids: [page(['(B)']), page(['(C)'])] }] }, page(['(D)'])] })
    expect(fields.map((f) => `${f.page} ${f.name}`)).toEqual(['1 A', '2 B', '3 C', '4 D'])
  })

  it('keeps a name that repeats on another page, both in order', async () => {
    const fields = await fieldsOf({ pages: [page(['(Spells)', '(first)'], ['(Level)', '(3)']), page(['(Spells)', '(second)'])] })
    expect(fields).toEqual([
      { page: 1, name: 'Spells', value: 'first' },
      { page: 1, name: 'Level', value: '3' },
      { page: 2, name: 'Spells', value: 'second' },
    ])
  })

  it('reads the escapes of a literal string', async () => {
    expect(
      await valuesOf(
        '(two\\nlines)',
        '(\\101\\60\\0618)', // octal of three, two and three digits; the 8 is text
        '(a (nested) pair \\( \\) \\\\)',
        '(con\\\ntinued)', // a backslash before a line break joins the lines
        '(one\r\ntwo\rthree)', // a bare CRLF or CR reads as LF
        '(tab\\there)',
      ),
    ).toEqual(['two\nlines', 'A018', 'a (nested) pair ( ) \\', 'continued', 'one\ntwo\nthree', 'tab\there'])
  })

  it('reads PDFDocEncoding, where it differs from Latin-1 and where it does not', async () => {
    expect(await valuesOf('(\x80 \x84 \x92)', '(\x8dquoted\x8e \x8f\x90)', '(\x18 \xa0 caf\xe9)')).toEqual([
      '• — ™',
      '“quoted” ‘’',
      '˘ € café',
    ])
  })

  it('reads UTF-16BE hex strings, and UTF-8 ones with a byte-order mark', async () => {
    expect(await valuesOf('<FEFF 2022 0041>', '<FEFFD83DDE00>', '<EFBBBFE2809C>', '<48 69 2>')).toEqual(['•A', '\u{1f600}', '“', 'Hi '])
    expect((await fieldsOf({ pages: [page(['<FEFF004E0061006D0065>', '(x)'])] }))[0].name).toBe('Name')
  })

  it('reads a checkbox value as its name without the slash', async () => {
    expect(await valuesOf('/Off', '/Yes', '/On#20it')).toEqual(['Off', 'Yes', 'On it'])
  })

  it('follows an /Annots given as a reference to an array', async () => {
    const fields = await fieldsOf({ pages: [{ ...page(['(Indirect)', '(found)']), annotsIndirect: true }] })
    expect(fields).toEqual([{ page: 1, name: 'Indirect', value: 'found' }])
  })

  it('takes the name and value from a /Parent field when the widget lacks them', async () => {
    const fields = await fieldsOf({
      pages: [
        {
          widgets: [
            { parent: { T: '(Parented)', V: '(from the parent)' } },
            { T: '(Own name)', parent: { T: '(Outer)', V: '(inherited)' } },
            { T: '(Mine)', V: '(mine)', parent: { T: '(Theirs)', V: '(theirs)' } },
          ],
        },
      ],
    })
    expect(fields.map((f) => [f.name, f.value])).toEqual([
      ['Parented', 'from the parent'],
      ['Own name', 'inherited'],
      ['Mine', 'mine'],
    ])
  })

  it('skips a binary content stream by its /Length, whatever syntax its bytes hold', async () => {
    const options = { pages: [{ ...page(['(Real)', '(real)']), binaryContent: true }, page(['(After)', '(after)'])] }
    // The stream does hide a fake redefinition of the widget.
    expect(asText(await buildPdf(options))).toContain('(Trapped)')
    expect(await fieldsOf(options)).toEqual([
      { page: 1, name: 'Real', value: 'real' },
      { page: 2, name: 'After', value: 'after' },
    ])
  })

  it('unpacks the objects of a compressed object stream', async () => {
    const pages = [{ kids: [page(['(A)', '(1)'])] }, { widgets: [{ parent: { T: '(B)', V: '<FEFF2022>' } }] }]
    expect(asText(await buildPdf({ pages, objectStream: true }))).not.toContain('Widget')
    expect(await fieldsOf({ pages, objectStream: true })).toEqual(await fieldsOf({ pages }))
    expect((await fieldsOf({ pages, objectStream: true })).map((f) => f.value)).toEqual(['1', '•'])
  })

  it('takes the later definition of an object redefined by an incremental update', async () => {
    const options = { pages: [page(['(HP)', '(12)'], ['(AC)', '(15)'])], update: { widget: 1, V: '(16)' } }
    expect(asText(await buildPdf(options)).match(/%%EOF/g)).toHaveLength(2)
    expect((await fieldsOf(options)).map((f) => f.value)).toEqual(['12', '16'])
  })

  it('reads a PDF after up to 1024 bytes of something else', async () => {
    const pdf = await buildPdf({ pages: [page(['(A)', '(1)'])] })
    const after = (n: number) => new Uint8Array([...latin1(' '.repeat(n)), ...pdf])
    expect((await readPdfFields(after(1024))).ok).toBe(true)
    expect(await readPdfFields(after(1025))).toEqual({ ok: false, reason: 'not-pdf' })
  })

  it('is not-pdf for a file that is not a PDF', async () => {
    const json = new TextEncoder().encode(JSON.stringify({ name: 'Brindle', classes: [] }))
    expect(await readPdfFields(json)).toEqual({ ok: false, reason: 'not-pdf' })
    expect(await readPdfFields(new Uint8Array())).toEqual({ ok: false, reason: 'not-pdf' })
  })

  it('is no-fields for a PDF whose pages hold no named widget', async () => {
    expect(await readPdfFields(await buildPdf({ pages: [{ widgets: [] }, { widgets: [] }] }))).toEqual({ ok: false, reason: 'no-fields' })
    expect(await readPdfFields(await buildPdf({ pages: [{ widgets: [{ V: '(nameless)' }] }] }))).toEqual({ ok: false, reason: 'no-fields' })
  })

  it('is unreadable for a truncated file, garbage after the header, or an encrypted file', async () => {
    const pdf = await buildPdf({ pages: [page(['(A)', '(1)'], ['(B)', '(2)'])] })
    const unreadable = { ok: false, reason: 'unreadable' }
    expect(await readPdfFields(pdf.subarray(0, pdf.length >> 1))).toEqual(unreadable)
    expect(await readPdfFields(latin1('%PDF-1.7\n\x00\xff<<[(garbage 1 0 obj << /Root'))).toEqual(unreadable)
    expect(await readPdfFields(await buildPdf({ pages: [page(['(A)', '(1)'])], encrypt: true }))).toEqual(unreadable)
  })
})
