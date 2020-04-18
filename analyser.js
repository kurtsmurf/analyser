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
canvas.height = (numRows + depth - 1) * scale
renderCtx.lineCap = 'round'
renderCtx.lineJoin = 'round'
renderCtx.scale(scale,scale)

// state
const freqDataRows = [...Array(numRows)].map(_ => new Uint8Array(analyser.frequencyBinCount))

// input
const getFreqData = () => {
  const freqData = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(freqData)

  return freqData
}

const updateRows = () => {
  freqDataRows.unshift(scaleBins(getFreqData()))
  freqDataRows.pop()
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



const drawFreqData = (freqData, lineWidth, saturation) => {
  // create path object from frequency data
  const path = new Path2D()
  path.moveTo(0, depth - freqData[0])

  for (let i = 1; i<freqData.length;i++) {
    const x = i
    const y = depth - freqData[i]

    path.lineTo(x,y)
  }

  // let overall hue drift over time
  const baseHue = (frame % 1800) / 5

  // draw wider line
  renderCtx.strokeStyle = verticalGradient(depth, 0, baseHue, saturation, 85)
  renderCtx.lineWidth = lineWidth
  renderCtx.stroke(path)

  // draw narrower line
  renderCtx.strokeStyle = verticalGradient(depth, 0, baseHue, saturation, 50)
  renderCtx.lineWidth = lineWidth * .75
  renderCtx.stroke(path)

  // temp - draw guide
  renderCtx.strokeStyle = 'white'
  renderCtx.lineWidth = .125
  renderCtx.strokeRect(0,1,freqData.length - 1,depth - 1)
}

const drawFrame = () => {
  // save default transform
  const defaultTransform = renderCtx.getTransform()
  
  renderCtx.clearRect(0,0,canvas.width,canvas.height)

  // move origin to initial position
  renderCtx.translate(numRows, -1)

  // draw data rows back to front
  for (let i = numRows - 1; i > 0; i--) {
    // update origin
    renderCtx.translate(-1, 1)

    const saturation = 125 - (i / numRows) * 100

    drawFreqData(freqDataRows[i], 2, saturation)
  }

  // restore default transform
  renderCtx.setTransform(defaultTransform)
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
