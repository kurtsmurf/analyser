const audioContext = new AudioContext()
const bufSrc = audioContext.createBufferSource()
const analyser = audioContext.createAnalyser()
analyser.fftSize = 64

const canvas = document.getElementById('analyser')
const renderCtx = canvas.getContext('2d')
const scale = 12
const numRows = 32
const depth = 32
canvas.width = (analyser.frequencyBinCount + numRows) * scale
canvas.height = (numRows + depth) * scale
renderCtx.lineCap = 'round'
renderCtx.lineJoin = 'round'
renderCtx.scale(scale,scale)

// state
const rows = [...Array(numRows)].map(_ => new Uint8Array(analyser.frequencyBinCount))

// input
const getFreqData = () => {
  const freqData = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(freqData)

  return freqData
}

const updateRows = () => {
  rows.unshift(scaleBins(getFreqData()))
  rows.pop()
}

// pure
const scaleBins = (bins) => {
  return bins.map(binVal => binVal * (depth/256))
}

// output
let frame

const drawRow = (rowValues, rowIndex) => {
  const h = canvas.height / scale
  const hue = rowIndex * 18
  const lightness = rowIndex / numRows * 50 + 50
  renderCtx.strokeStyle = `hsl(${hue},100%,${lightness}%)`

  renderCtx.moveTo(rowIndex, h - rowValues[0])
  renderCtx.beginPath()
  for (let i = 1; i<rowValues.length;i++) {
    const v = rowValues[i]
    const x = i + rowIndex
    const y = h - v - 1 - rowIndex

    renderCtx.lineTo(x,y)
  }
  renderCtx.stroke()
}

const render = () => {
  renderCtx.clearRect(0,0,999999,9999999)
  rows.forEach(drawRow)

  for (let i = rows.length; i>0;i--) {
    drawRow(rows[i - 1], i - 1)
  }
}

// act
fetch('mk_drmz.wav')
.then(response => response.arrayBuffer())
.then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
.then(audioBuffer => {
  bufSrc.buffer = audioBuffer
  bufSrc.loop = true
  bufSrc.connect(analyser)//.connect(audioContext.destination)
  bufSrc.start()
  animate()
})

animate = () => {
  updateRows()
  render()

  frame = requestAnimationFrame(animate)
}

// use web audio to schedule ticks
// make color gradients from row values
// sway left/right
// fade out from front to back