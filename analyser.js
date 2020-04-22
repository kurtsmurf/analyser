const audioContext = new AudioContext()
const bufSrc = audioContext.createBufferSource()
const analyser = audioContext.createAnalyser()

analyser.fftSize = 64

const canvas = document.getElementById('analyser')
const renderCtx = canvas.getContext('2d')
const scale = 8
const numRows = 32
const boxHeight = 32
const lineWidth = 2

canvas.width = (analyser.frequencyBinCount + numRows) * scale
canvas.height = (numRows + boxHeight) * scale
renderCtx.lineCap = 'round'
renderCtx.lineJoin = 'round'
renderCtx.scale(scale, scale)

const freqDataRows = [...Array(numRows)].map(_ => new Uint8Array(analyser.frequencyBinCount))

// ======= INPUT =======
const getFreqData = () => {
  const freqData = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(freqData)

  return freqData
}

const updateRows = () => {  
  freqDataRows.push(scaleBins(getFreqData()))
  freqDataRows.shift()
}

// ======= PURE =======
const scaleBins = (bins) => {
  return bins.map(binVal => binVal * (boxHeight / 255))
}

const verticalGradient = (baseHue, saturation, lightness) => {
  const gradient = renderCtx.createLinearGradient(0, boxHeight, 0, 0)
  gradient.addColorStop(0.0, `hsl(${baseHue      }, ${saturation}%, ${lightness}%)`)
  gradient.addColorStop(0.5, `hsl(${baseHue + 90 }, ${saturation}%, ${lightness}%)`)
  gradient.addColorStop(1.0, `hsl(${baseHue + 180}, ${saturation}%, ${lightness}%)`)

  return gradient
}

const pathFromFreqData = (freqData) => {
  const path = new Path2D()
  path.moveTo(0, boxHeight - freqData[0])

  for (let i = 1; i < freqData.length; i++) {
    path.lineTo(i, boxHeight - freqData[i])
  }

  return path
}

// ======= OUTPUT =======
let frame = 0

const drawFreqData = (freqData, saturation) => {
  const path = pathFromFreqData(freqData)
  const baseHue = (frame % 1800) / 5

  renderCtx.strokeStyle = verticalGradient(baseHue, saturation, 85)
  renderCtx.lineWidth = lineWidth
  renderCtx.stroke(path)

  renderCtx.strokeStyle = verticalGradient(baseHue, saturation, 50)
  renderCtx.lineWidth = lineWidth * 0.75
  renderCtx.stroke(path)
}

const drawFrame = () => {
  const initialTransform = renderCtx.getTransform()
  renderCtx.clearRect(0, 0, canvas.width, canvas.height)
  renderCtx.translate(numRows, 0)

  for (let i = 0; i < numRows; i++) {
    const saturation = (i / numRows) * 100 + 25
    drawFreqData(freqDataRows[i], saturation)
    renderCtx.translate(-1, 1)
  }

  renderCtx.setTransform(initialTransform)
}

const animate = () => {
  updateRows()
  drawFrame()

  frame = requestAnimationFrame(animate)
}

// ======= ACT =======
navigator.mediaDevices
  .getUserMedia({ audio: true, video: false })
  .then(stream => {
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)
    audioContext.resume()
  })

animate()

// use web audio to schedule ticks