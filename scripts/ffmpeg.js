const fs = require('fs')
const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const input = { dir: 'static/videos', file: 'org8k.mkv' }
const output = { dir: 'static/videos' }
const displayCodes = ['8k', '4k', '2k', 'hd']
const displays = [
  { code: '8k', width: 7680, height: 4320 },
  { code: '4k', width: 3840, height: 2160 },
  { code: '2k', width: 1920, height: 1080 }
  // { code: 'HD', width: 1280, height: 720 }
]
const trim = { seekSeconds: 31, durationSeconds: 35 }
const panel = { width: 480, height: 270 }
const shift = { x: 480, y: 270 }
const tmpMp4File = path.join(process.cwd(), input.dir, 'tmp.mp4')
const movies = []

displayCodes.forEach((code) => {
  try {
    fs.mkdirSync(path.join(process.cwd(), output.dir, code), { recursive: true })
  } catch (error) {
    console.error(error.toString())
    process.exit(1)
  }
})

displays.forEach(({ code, width, height }) => {
  let y = 0
  let row = 1

  while (y + panel.height <= height) {
    let x = 0
    let column = 1

    while (x + panel.width <= width) {
      const outputFilePath = path.join(process.cwd(), output.dir, code, `${row}-${column}.mp4`)
      movies.push({
        width,
        panelWidth: panel.width,
        panelHeight: panel.height,
        x,
        y,
        outputFilePath
      })
      x += shift.x
      column++
    }
    y += shift.y
    row++
  }
})

async function convertVideos() {
  if (!fs.existsSync(tmpMp4File)) {
    const inputFilePath = path.join(process.cwd(), input.dir, input.file)
    const { seekSeconds, durationSeconds } = trim

    try {
      await exec(
        `ffmpeg -ss ${seekSeconds} -i ${inputFilePath} -t ${durationSeconds} -vcodec copy -an ${tmpMp4File}`
      )
      console.log(`Converted: ${tmpMp4File}`)
    } catch (error) {
      console.error(error.toString())
      process.exit(1)
    }
  } else {
    console.log('Convert skip')
  }
}

console.log('Start:', new Date())

convertVideos()
  .then(async () => {
    const len = 1
    for (let i = 0; i < movies.length; i += len) {
      await Promise.all(
        movies.slice(i, i + len).map(async (movie) => {
          const { width, panelWidth, panelHeight, x, y, outputFilePath } = movie
          await exec(
            `ffmpeg -i ${tmpMp4File} -vf "scale=${width}:-1,crop=${panelWidth}:${panelHeight}:${x}:${y}" ${outputFilePath}`
          )
          console.log('Cropped:', new Date(), outputFilePath)
        })
      )
    }

    await exec(
      `ffmpeg -i ${tmpMp4File} -vf "scale=1280:-1,crop=${panel.width}:${
        panel.height
      }:0:0" ${path.join(process.cwd(), output.dir, 'hd/1-1.mp4')}`
    )
    console.log('Done:', new Date())
  })
  .catch((error) => {
    console.error(error.toString())
    process.exit(1)
  })
