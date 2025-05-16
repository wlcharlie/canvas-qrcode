let dpi
let video
let canvas
let timer
let detectCount = 0
let detectSuccessCount = 0

const barcodeDetector = new BarcodeDetector({
  formats: ["qr_code"],
})

async function getDpi() {
  const dpiSpan = document.getElementById("dpi")
  dpiSpan.textContent = window.devicePixelRatio
  dpi = window.devicePixelRatio
}

async function fixDpi() {
  //create a style object that returns width and height
  let style = {
    width() {
      // return +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2)
      return 300
    },
    height() {
      // return  +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2)
      //  (video.videoHeight / video.videoWidth) * width;
      return (video.videoHeight / video.videoWidth) * 300
    },
  }

  const canvasWHSpan = document.getElementById("canvas-w-h")
  canvasWHSpan.textContent = `${style.width()}x${style.height()}`

  let _dpi = 1
  if (document.getElementById("checkbox-dip-fix").checked) {
    _dpi = dpi
  }

  //set the correct attributes for a crystal clear image!
  canvas.setAttribute("width", style.width() * _dpi)
  canvas.setAttribute("height", style.height() * _dpi)
}

// request camera permission
async function requestCameraPermission() {
  // environment (後置鏡頭)
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "environment",
      // width: 300,
      // height: 300,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  })
  return stream
}

async function captureImage() {
  fixDpi()
  const ctx = canvas.getContext("2d")
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  // 增強畫面
  enhanceImage()

  // 偵測 QRCODE
  detectQRCODE()

  // A. 持續更新畫面
  // requestAnimationFrame(captureImage)
  // B. 每1s 更新
  timer = setTimeout(() => {
    captureImage()
  }, 1000)
}

function contrastEnhancement() {
  const ctx = canvas.getContext("2d")
  // 獲取像素資料
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // 調整對比度和亮度
  const contrast = 1.4 // 對比度增強係數
  const brightness = 10 // 亮度增加值

  for (let i = 0; i < data.length; i += 4) {
    // 套用對比度
    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128 + brightness))
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128 + brightness))
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128 + brightness))
  }

  // 將處理後的像素資料放回 canvas
  ctx.putImageData(imageData, 0, 0)
}

function convertToGrayscale() {
  const ctx = canvas.getContext("2d")
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    // 轉換為灰階
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
    data[i] = avg // R
    data[i + 1] = avg // G
    data[i + 2] = avg // B
  }

  ctx.putImageData(imageData, 0, 0)
}

function binarizeImage(threshold = 118) {
  const ctx = canvas.getContext("2d")
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    // 計算灰度值
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
    // 二值化處理
    const val = avg < threshold ? 0 : 255
    data[i] = val // R
    data[i + 1] = val // G
    data[i + 2] = val // B
  }

  ctx.putImageData(imageData, 0, 0)
}

async function enhanceImage() {
  if (document.getElementById("checkbox-grayscale").checked) {
    convertToGrayscale()
  }
  if (document.getElementById("checkbox-contrast-enhancement").checked) {
    contrastEnhancement()
  }
  if (document.getElementById("checkbox-binarization").checked) {
    binarizeImage()
  }
}

async function detectQRCODE() {
  detectCount++

  const result = await barcodeDetector.detect(canvas)
  if (result.length > 0) {
    detectSuccessCount++
    const resultSpan = document.getElementById("result")
    resultSpan.textContent = result[0].rawValue
    const detectSuccessCountSpan = document.getElementById("detect-success-count")
    detectSuccessCountSpan.textContent = detectSuccessCount
  }

  const detectCountSpan = document.getElementById("detect-count")
  detectCountSpan.textContent = detectCount
}

async function main() {
  // init
  canvas = document.getElementById("canvas")
  video = document.getElementById("video")

  // prepare
  await getDpi()

  // start
  const stream = await requestCameraPermission()
  video.srcObject = stream
  video.play()

  // 監聽 video 可以播放
  video.addEventListener("canplay", () => {
    // 開始持續捕捉影像
    captureImage()
  })
}

try {
  main()
} catch (error) {
  window.alert(error)
}
