const ac = new AudioContext()
const b = ac.createBufferSource()
const a = ac.createAnalyser()

b.connect(a).connect(ac.destination)

const c = document.getElementById('analyser')
const r = c.getContext('2d')

const binsPerRow = 32
const rowCount = 8
const scale = 10

c.width = binsPerRow * scale
c.height = 32 * scale

r.scale(scale,scale)

let bins = new Uint8Array(binsPerRow * rowCount)

const getBins = () => {
  const binWidth = a.frequencyBinCount / binsPerRow
  const data = new Uint8Array(a.frequencyBinCount)

  a.getByteFrequencyData(data)

  bins.forEach((_, i) => {
    bins[i] = Math.floor(data[binWidth * i] / 8)
  })

  return bins
}

let frame

const draw = () => {
  const w = c.width / scale
  const h = c.height / scale

  r.fillStyle = 'rgba(255,255,255,.2)'
  r.fillRect(0,0,w,h)

  getBins().forEach((v, i) => {
    r.fillStyle = `hsl(${v * 18 + 15},100%, 50%)`

    const x = i
    const y = h - v

    r.fillRect(x,y,1,1)
  })

  frame = requestAnimationFrame(draw)
}


fetch('mk_drmz.wav')
.then(response => response.arrayBuffer())
.then(arrayBuffer => ac.decodeAudioData(arrayBuffer))
.then(audioBuffer => {
  b.buffer = audioBuffer
  b.loop = true
  b.start()
  draw()
})