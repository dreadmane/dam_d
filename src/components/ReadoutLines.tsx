// The lines of the System's readout (A15, readout.ts): plain text in the body
// face with tabular figures, one sentence a line. The name line above them is
// the caller's heading, classed readout-name: a window's title, the Finish
// screen's heading, a pet's.
export function ReadoutLines({ lines }: { lines: string[] }) {
  return (
    <div className="readout-lines">
      {lines.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  )
}
