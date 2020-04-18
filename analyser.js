const audioContext = new AudioContext()
const bufSrc = audioContext.createBufferSource()
const analyser = audioContext.createAnalyser()
analyser.fftSize = 64

const canvas = document.getElementById('analyser')
const renderCtx = canvas.getContext('2d')
const scale = 16
const numRows = 32
const depth = 32
canvas.width = (analyser.frequencyBinCount + numRows - 1) * scale
canvas.height = (numRows - 1 + depth) * scale
renderCtx.lineCap = 'round'
renderCtx.lineJoin = 'round'
renderCtx.scale(scale, scale)

const lineWidth = 2

// ======= STATE =======
const freqDataRows = [...Array(numRows)].map(_ => new Uint8Array(analyser.frequencyBinCount))

// ======= INPUT =======
const getFreqData = () => {
  const freqData = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(freqData)

  return freqData
}

const updateRows = () => {
  freqDataRows.unshift(scaleBins(getFreqData()))
  freqDataRows.pop()
}

// ======= PURE =======
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

const pathFromFreqData = (freqData) => {
  const path = new Path2D()
  path.moveTo(0, depth - freqData[0])

  for (let i = 1; i<freqData.length;i++) {
    const x = i
    const y = depth - freqData[i]
    path.lineTo(x,y)
  }

  return path
}

// ======= OUTPUT =======
let frame = 0

const drawFreqData = (freqData, saturation) => {
  const path = pathFromFreqData(freqData)
  const baseHue = (frame % 1800) / 5

  renderCtx.strokeStyle = verticalGradient(depth, 0, baseHue, saturation, 85)
  renderCtx.lineWidth = lineWidth
  renderCtx.stroke(path)

  renderCtx.strokeStyle = verticalGradient(depth, 0, baseHue, saturation, 50)
  renderCtx.lineWidth = lineWidth * .75
  renderCtx.stroke(path)
}

const drawFrame = () => {
  const defaultTransform = renderCtx.getTransform()
  renderCtx.clearRect(0,0,canvas.width,canvas.height)
  renderCtx.translate(numRows, -1)

  for (let i = numRows - 1; i > 0; i--) {
    const saturation = 125 - (i / numRows) * 100
    renderCtx.translate(-1, 1)

    drawFreqData(freqDataRows[i], saturation)
  }

  renderCtx.setTransform(defaultTransform)
}

const animate = () => {
  updateRows()
  drawFrame()

  frame = requestAnimationFrame(animate)
}

// ======= ACT =======
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
// sway left/right
