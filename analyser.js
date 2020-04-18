const audioContext = new AudioContext()
const bufSrc = audioContext.createBufferSource()
const analyser = audioContext.createAnalyser()
analyser.fftSize = 64

const canvas = document.getElementById('analyser')
const renderCtx = canvas.getContext('2d')
const scale = 16
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

const verticalGradient = (bottom, top, baseHue, saturation, lightness) => {
  const gradient = renderCtx.createLinearGradient(0,bottom,0,top)
  gradient.addColorStop(0.0, `hsl(${baseHue},${saturation}%,${lightness}%)`)
  gradient.addColorStop(0.5, `hsl(${baseHue + 90},${saturation}%,${lightness}%)`)
  gradient.addColorStop(1.0, `hsl(${baseHue + 180},${saturation}%,${lightness}%)`)

  return gradient
}

// output
let frame = 0



const drawRow = (rowValues, rowIndex) => {
  const h = canvas.height / scale

  // create path object from frequency data
  const path = new Path2D()
  path.moveTo(rowIndex + 1, h - rowValues[0] - 1 - rowIndex)

  for (let i = 1; i<rowValues.length;i++) {
    const v = rowValues[i]
    const x = i + 1 + rowIndex
    const y = h - v - 1 - rowIndex

    path.lineTo(x,y)
  }

  // calculate hue and saturation
  const baseHue = (frame % 1800) / 5
  const saturation = 125 - (rowIndex / numRows) * 100

  // calculate upper/lower bounds of row box
  const bottom = h - rowIndex
  const top = bottom - depth

  // draw wider line
  renderCtx.strokeStyle = verticalGradient(bottom, top, baseHue, saturation, 85)
  renderCtx.lineWidth = 2
  renderCtx.stroke(path)

  // draw narrower line
  renderCtx.strokeStyle = verticalGradient(bottom, top, baseHue, saturation, 50)
  renderCtx.lineWidth = 1.5
  renderCtx.stroke(path)
}

const drawFrame = () => {
  renderCtx.clearRect(0,0,canvas.width,canvas.height)

  for (let i = rows.length; i>0;i--) {
    drawRow(rows[i - 1], i - 1)
  }
}

const animate = () => {
  updateRows()
  drawFrame()

  frame = requestAnimationFrame(animate)
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


// use web audio to schedule ticks
// make color gradients from row values
// sway left/right
