// Writing small PDFs for pdf-fields.test.ts: a catalog, a page tree and
// widgets, laid out the way D&D Beyond's export is (no /AcroForm, the fields
// found only from the pages), with options for the shapes a re-saved copy
// can take. Tests only.

export interface TestWidget {
  // The widget's /T and /V as PDF source, written as they appear in a file:
  // '(Name)', '<FEFF2022>', '/Off'. Either may be left out.
  T?: string
  V?: string
  // A /Parent field holding what the widget leaves out.
  parent?: { T?: string; V?: string }
}

export interface TestPage {
  widgets: TestWidget[]
  // /Annots as a reference to an array object rather than the array itself.
  annotsIndirect?: boolean
  // A content stream of binary bytes that hide PDF syntax: an `endobj`, a
  // `)`, an `endstream`, and a fake object redefining the first widget.
  // Only a reader that skips the stream by its /Length gets past it.
  binaryContent?: boolean
}

export interface TestNode {
  kids: Array<TestNode | TestPage>
}

export interface TestPdfOptions {
  // The root /Pages node's kids.
  pages: Array<TestNode | TestPage>
  // Every dictionary packed into one compressed /ObjStm, with a
  // cross-reference stream naming the root in place of the trailer.
  objectStream?: boolean
  // An incremental update appended to the file, redefining a widget
  // (counted from 0 in document order) with a new /V.
  update?: { widget: number; V: string }
  encrypt?: boolean
}

export async function buildPdf(options: TestPdfOptions): Promise<Uint8Array> {
  // Object n's dictionary source is dicts[n - 1]; streams are written apart.
  const dicts: string[] = []
  const streams: Array<{ num: number; data: Uint8Array }> = []
  const widgets: Array<{ num: number; source: (V?: string) => string }> = []
  const add = (source = '') => dicts.push(source)
  const ref = (num: number) => `${num} 0 R`

  const node = (kids: Array<TestNode | TestPage>, parent: number | null): number => {
    const num = add()
    const kidNums = kids.map((kid) => ('kids' in kid ? node(kid.kids, num) : page(kid, num)))
    dicts[num - 1] = `<< /Type /Pages${parent ? ` /Parent ${ref(parent)}` : ''} /Kids [${kidNums.map(ref).join(' ')}] /Count ${kidNums.length} >>`
    return num
  }

  const page = (spec: TestPage, parent: number): number => {
    const num = add()
    const annots = spec.widgets.map((w) => widget(w, num))
    let entries = `/Type /Page /Parent ${ref(parent)} /MediaBox [0 0 612 792]`
    if (spec.annotsIndirect) entries += ` /Annots ${ref(add(`[${annots.map(ref).join(' ')}]`))}`
    else entries += ` /Annots [${annots.map(ref).join(' ')}]`
    if (spec.binaryContent) {
      const content = add()
      streams.push({ num: content, data: new Uint8Array() })
      entries += ` /Contents ${ref(content)}`
    }
    dicts[num - 1] = `<< ${entries} >>`
    return num
  }

  const widget = (w: TestWidget, pageNum: number): number => {
    const num = add()
    let parentEntry = ''
    if (w.parent) {
      const p = w.parent
      parentEntry = ` /Parent ${ref(add(`<< /FT /Tx${p.T ? ` /T ${p.T}` : ''}${p.V ? ` /V ${p.V}` : ''} /Kids [${ref(num)}] >>`))}`
    }
    const source = (V = w.V) =>
      `<< /Type /Annot /Subtype /Widget /FT /Tx /Rect [0 0 100 20] /P ${ref(pageNum)}${w.T ? ` /T ${w.T}` : ''}${V ? ` /V ${V}` : ''}${parentEntry} >>`
    dicts[num - 1] = source()
    widgets.push({ num, source })
    return num
  }

  const catalog = add()
  dicts[catalog - 1] = `<< /Type /Catalog /Pages ${ref(node(options.pages, null))} >>`

  // The trap inside a binary content stream redefines the first widget,
  // later in the file than the real one, so a reader fooled by it would
  // report the trap's value.
  const first = widgets[0]
  const trap = first ? `${first.num} 0 obj\n<< /Subtype /Widget /T (Trapped) /V (trapped) >>\nendobj\n` : ''
  for (const s of streams) {
    const binary = Uint8Array.from({ length: 64 }, (_, i) => (i * 37 + 200) & 0xff)
    // Never inflated by the reader, so the bytes need not be real deflate data.
    s.data = concat([binary, latin1(`) endobj\nendstream\nendobj\n${trap}(`), binary])
  }

  const out = new Writer()
  out.text('%PDF-1.7\n%\xe2\xe3\xcf\xd3\n')
  let size = dicts.length + 1
  // The dictionaries, numbered from 1, less the slots kept for streams.
  const plain = dicts.map((source, i) => ({ num: i + 1, source })).filter((d) => !streams.some((s) => s.num === d.num))
  if (options.objectStream) {
    // Each object's offset within the stream, after the header of number pairs.
    let body = ''
    const pairs: string[] = []
    for (const d of plain) {
      pairs.push(`${d.num} ${body.length}`)
      body += `${d.source}\n`
    }
    const header = `${pairs.join(' ')}\n`
    const packed = await deflate(latin1(header + body))
    const objStm = size++
    out.object(objStm, `<< /Type /ObjStm /N ${plain.length} /First ${header.length} /Filter /FlateDecode /Length ${packed.length} >>`, packed)
  } else for (const d of plain) out.object(d.num, d.source)
  for (const s of streams) out.object(s.num, `<< /Length ${s.data.length} /Filter /FlateDecode >>`, s.data)

  const trailer = `/Size ${size + (options.objectStream ? 1 : 0)} /Root ${ref(catalog)}${options.encrypt ? ' /Encrypt << /Filter /Standard /V 1 /R 2 >>' : ''}`
  if (options.objectStream) {
    // The reader finds objects by scanning, so this cross-reference stream
    // need only carry the trailer's entries: its data is left empty.
    out.object(size, `<< /Type /XRef ${trailer} /W [1 2 1] /Length 0 >>`, new Uint8Array())
    out.text(`startxref\n${out.offsets.get(size)}\n%%EOF\n`)
  } else out.xrefAndTrailer(trailer)

  if (options.update) {
    const w = widgets[options.update.widget]
    out.object(w.num, w.source(options.update.V))
    out.xrefAndTrailer(`/Size ${size} /Root ${ref(catalog)} /Prev ${out.lastXref}`, [w.num])
  }
  return out.bytes()
}

// Appends text and objects, remembering where each object starts so the
// cross-reference table is a true one.
class Writer {
  parts: Uint8Array[] = []
  length = 0
  offsets = new Map<number, number>()
  lastXref = 0

  text(source: string): void {
    this.raw(latin1(source))
  }

  object(num: number, dict: string, stream?: Uint8Array): void {
    this.offsets.set(num, this.length)
    this.text(`${num} 0 obj\n${dict}\n`)
    if (stream) {
      this.text('stream\n')
      this.raw(stream)
      this.text('\nendstream\n')
    }
    this.text('endobj\n')
  }

  // A table for the given objects (all of them by default), then the trailer.
  xrefAndTrailer(entries: string, nums = [...this.offsets.keys()].sort((a, b) => a - b)): void {
    this.lastXref = this.length
    const all = nums.length === this.offsets.size
    let table = all ? `xref\n0 ${nums.length + 1}\n0000000000 65535 f \n` : 'xref\n'
    for (const n of nums) table += `${all ? '' : `${n} 1\n`}${String(this.offsets.get(n)).padStart(10, '0')} 00000 n \n`
    this.text(`${table}trailer\n<< ${entries} >>\nstartxref\n${this.lastXref}\n%%EOF\n`)
  }

  raw(bytes: Uint8Array): void {
    this.parts.push(bytes)
    this.length += bytes.length
  }

  bytes(): Uint8Array {
    return concat(this.parts)
  }
}

// One byte a character, so a test can write a raw byte such as '\x80'.
export function latin1(text: string): Uint8Array {
  return Uint8Array.from(text, (c) => c.charCodeAt(0) & 0xff)
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((total, p) => total + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

async function deflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(data)]).stream().pipeThrough(new CompressionStream('deflate'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}
