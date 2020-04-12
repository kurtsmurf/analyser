const audioContext = new AudioContext()
const bufSrc = audioContext.createBufferSource()
const analyser = audioContext.createAnalyser()
analyser.fftSize = 64

const canvas = document.getElementById('analyser')
const renderCtx = canvas.getContext('2d')
const scale = 16
const numRows = 16
const depth = 32
canvas.width = analyser.frequencyBinCount * 3 * scale
canvas.height = (numRows + depth) * scale
renderCtx.scale(scale,scale)


fetch('mk_drmz.wav')
.then(response => response.arrayBuffer())
.then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
.then(audioBuffer => {
  bufSrc.buffer = audioBuffer
  bufSrc.loop = true
  bufSrc.connect(analyser)//.connect(audioContext.destination)
  bufSrc.start()
})

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
  rowValues.forEach((v,i) => {
    const hue = v * 8
    renderCtx.fillStyle = `hsl(${hue},100%,50%)`
  
    x = i + rowIndex
    y = h - v - 1 - rowIndex

    renderCtx.fillRect(x,y,1,1)
  })
}

const render = () => {
  renderCtx.clearRect(0,0,999999,9999999)
  rows.forEach(drawRow)
}

// act
animate = () => {
  updateRows()
  render()

  frame = requestAnimationFrame(animate)
}
animate()