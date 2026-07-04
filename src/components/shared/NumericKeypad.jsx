const keyClass = 'h-11 rounded-lg border border-gray-200 bg-gray-50 text-xl font-medium text-gray-700 active:bg-gray-100'

function NumericKeypad({ value, onChange, onConfirm }) {
  const appendDigit = (digit) => {
    onChange(value === '0' ? digit : value + digit)
  }

  const appendDoubleZero = () => {
    if (value === '' || value === '0') return
    onChange(value + '00')
  }

  const backspace = () => {
    onChange(value.slice(0, -1))
  }

  const clear = () => {
    onChange('')
  }

  return (
    <div
      className="grid gap-1.5 p-1.5"
      style={{
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateAreas: `
          "n7 n8 n9 bs"
          "n4 n5 n6 cl"
          "n1 n2 n3 ok"
          "n00 n0 n0 ok"
        `,
      }}
    >
      {['7', '8', '9'].map((d) => (
        <button key={d} type="button" className={keyClass} style={{ gridArea: `n${d}` }} onClick={() => appendDigit(d)}>
          {d}
        </button>
      ))}
      <button type="button" className={keyClass} style={{ gridArea: 'bs' }} onClick={backspace}>⌫</button>

      {['4', '5', '6'].map((d) => (
        <button key={d} type="button" className={keyClass} style={{ gridArea: `n${d}` }} onClick={() => appendDigit(d)}>
          {d}
        </button>
      ))}
      <button type="button" className={keyClass} style={{ gridArea: 'cl' }} onClick={clear}>C</button>

      {['1', '2', '3'].map((d) => (
        <button key={d} type="button" className={keyClass} style={{ gridArea: `n${d}` }} onClick={() => appendDigit(d)}>
          {d}
        </button>
      ))}
      <button
        type="button"
        style={{ gridArea: 'ok' }}
        onClick={onConfirm}
        className="h-11 rounded-lg bg-orange-500 text-lg font-bold text-white active:bg-orange-600"
      >
        確定
      </button>

      <button type="button" className={keyClass} style={{ gridArea: 'n00' }} onClick={appendDoubleZero}>00</button>
      <button type="button" className={keyClass} style={{ gridArea: 'n0' }} onClick={() => appendDigit('0')}>0</button>
    </div>
  )
}

export default NumericKeypad
