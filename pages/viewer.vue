<template>
  <div class="container">
    <div :style="viewerFrameStyle" class="viewer-frame">
      <div
        :style="mediaContainerStyle"
        class="media-container"
        @mousedown.prevent="onMousedown"
        @mousemove="onMousemove"
        @wheel.prevent="onWheel"
        @touchstart.prevent="onTouchstart"
        @touchmove="onTouchmove"
      >
        <video
          ref="media"
          class="base-media"
          src="/videos/hd/1-1.mp4"
          autoplay
          muted
          loop
          webkit-playsinline
          playsinline
          @play="playing = true"
          @pause="playing = false"
        />

        <panels
          :playing="playing"
          :current-time="currentTime"
          :scale="scale"
          :ratio="ratio"
          :playback-rate="playbackRate"
          :translate="fixedTranslate"
          :width-list="widthList"
          :base-width="baseWidth"
          :base-height="baseHeight"
        />
      </div>
    </div>

    <div class="ratio-label">
      {{ ratioLabel }}
    </div>

    <div class="play-icon" @click="togglePlaying">
      ▶
    </div>
  </div>
</template>

<script>
import Panels from '~/components/Panels.vue'

const calcDistance = ([f, s]) =>
  ((f.pageX - s.pageX) ** 2 + (f.pageY - s.pageY) ** 2) ** 0.5

export default {
  components: {
    Panels
  },

  data() {
    return {
      playing: true,
      panning: false,
      zooming: false,
      currentTime: 0,

      baseDistance: 0, // scale=1で正規化したマルチタッチのpx距離
      baseWidth: 0, // scale=1でのビューワー幅
      baseHeight: 0, // scale=1でのビューワー高さ
      scale: 1,
      translate: { x: 0, y: 0 },
      zoomCenter: { x: 0, y: 0 },
      prevPanPoint: { x: 0, y: 0 },
      diffToGrid: { x: 0, y: 0 },
      fixedTranslate: { x: 0, y: 0 },
      panningStartX: 0,
      panningStartY: 0,
      panningCurrentX: 0,
      panningCurrentY: 0
    }
  },

  computed: {
    widthList: () => [960, 1920, 3840, 7680],
    aspect: () => 16 / 9,
    playbackRate: () => 0.5,
    maxScale: () => 12,
    ratio() {
      const num = Math.floor(this.scale)
      return num >= 8 ? 8 : num >= 4 ? 4 : num >= 2 ? 2 : 1
    },
    ratioLabel() {
      return `${Math.floor(this.ratio)}K`
    },
    viewerFrameStyle() {
      return {
        width: `${this.baseWidth}px`,
        height: `${this.baseHeight}px`
      }
    },
    mediaContainerStyle() {
      return {
        transform: `translate(-${this.translate.x}px, -${this.translate.y}px) scale(${this.scale})`
      }
    }
  },

  mounted() {
    window.addEventListener('resize', this.calcBaseValues, false)
    window.addEventListener('mouseup', this.onMouseup, false)
    window.addEventListener('touchend', this.onTouchend, false)
    document.addEventListener('keyup', this.onKeyup, false)
    this.calcBaseValues()

    this.$refs.media.addEventListener('timeupdate', (e) => {
      this.currentTime = e.target.currentTime
    })

    this.$refs.media.playbackRate = this.playbackRate

    const loop = () => {
      if (!this.panning && (this.diffToGrid.x !== 0 || this.diffToGrid.y !== 0)) {
        const newDiff = { ...this.diffToGrid }
        const step = 20

        newDiff.x += Math.abs(this.diffToGrid.x) <= step ? -newDiff.x : this.diffToGrid.x < 0 ? step : -step
        newDiff.y += Math.abs(this.diffToGrid.y) <= step ? -newDiff.y : this.diffToGrid.y < 0 ? step : -step

        this.transform(
          0,
          this.diffToGrid.x - newDiff.x,
          this.diffToGrid.y - newDiff.y
        )

        this.diffToGrid = newDiff

        if (newDiff.x === 0 && newDiff.y === 0) {
          this.fixedTranslate = { ...this.translate }
        }
      }

      requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)
  },

  methods: {
    calcBaseValues() {
      const windowAspect = window.innerWidth / window.innerHeight
      this.baseWidth = window.innerWidth * (this.aspect > windowAspect ? 1 : this.aspect / windowAspect)
      this.baseHeight = window.innerHeight * (this.aspect > windowAspect ? windowAspect / this.aspect : 1)
    },

    onWheel(e) {
      this.onZoom(e.pageX, e.pageY, e.deltaY < 0 ? 0.4 : -0.4)
    },

    onZoom(pointX, pointY, scaleDelta) {
      this.zoomCenter = {
        x: pointX - (window.innerWidth - this.baseWidth) / 2 + this.translate.x,
        y: pointY - (window.innerHeight - this.baseHeight) / 2 + this.translate.y
      }

      this.transform(scaleDelta, 0, 0)
      this.moveToFix()
    },

    onTouchstart({ touches }) {
      if (touches.length === 1) {
        this.startPan(touches[0])
      } else if (touches.length === 2) {
        this.zooming = true
        this.baseDistance = calcDistance(touches) / this.scale
      }
    },

    onMousedown(e) {
      this.panning = true
      this.startPan(e)
    },

    startPan(e) {
      this.prevPanPoint = { x: e.pageX, y: e.pageY }
    },

    onTouchmove({ touches }) {
      if (touches.length === 1 && !this.zooming) {
        this.movePan(touches[0])
      } else if (touches.length === 2) {
        this.onZoom(
          (touches[0].pageX + touches[1].pageY) / 2,
          (touches[0].pageY + touches[1].pageY) / 2,
          calcDistance(touches) / this.baseDistance - this.scale
        )
      }
    },

    onMousemove(e) {
      if (!this.panning) return
      this.movePan(e)
    },

    movePan(e) {
      const currentPanPoint = { x: e.pageX, y: e.pageY }

      this.transform(
        0,
        currentPanPoint.x - this.prevPanPoint.x,
        currentPanPoint.y - this.prevPanPoint.y
      )

      this.prevPanPoint = currentPanPoint
    },

    onTouchend({ touches }) {
      // ズーム後に指1本でパンに移行してガタつくのを防ぐ
      if (touches.length === 0) this.zooming = false
      this.moveToFix()
    },

    onMouseup() {
      this.panning = false
      this.moveToFix()
    },

    onKeyup(e) {
      let deltaX = 0
      let deltaY = 0
      const blockWidth = this.baseWidth * this.scale / this.ratio / 4 + 1
      const blockHeight = this.baseHeight * this.scale / this.ratio / 4 + 1

      switch (e.keyCode) {
        case 37:
          // left
          deltaX = blockWidth
          break
        case 38:
          // up
          deltaY = blockHeight
          break
        case 39:
          // right
          deltaX = -blockWidth
          break
        case 40:
          // bottom
          deltaY = -blockHeight
          break
        default:
          break
      }

      this.transform(
        0,
        deltaX,
        deltaY
      )
      this.moveToFix()
    },

    moveToFix() {
      const blockWidth = this.baseWidth * this.scale / this.ratio / 2
      const diffX = (this.translate.x + this.baseWidth / 2) % blockWidth
      const blockHeight = this.baseHeight * this.scale / this.ratio / 2
      const diffY = (this.translate.y + this.baseHeight / 2) % blockHeight

      this.diffToGrid = {
        x: diffX < blockWidth / 2 ? diffX : diffX - blockWidth,
        y: diffY < blockHeight / 2 ? diffY : diffY - blockHeight
      }

      // this.transform(
      //   0,
      //   diffX < blockWidth / 2 ? diffX : diffX - blockWidth,
      //   diffY < blockHeight / 2 ? diffY : diffY - blockHeight
      // )
    },

    transform(scaleDelta, translateXDelta, translateYDelta) {
      const prevScale = this.scale
      const pinpoint = {
        x: this.zoomCenter.x - this.translate.x + translateXDelta,
        y: this.zoomCenter.y - this.translate.y + translateYDelta
      }

      this.scale = Math.min(this.maxScale, Math.max(1, this.scale + scaleDelta))

      // 余白防止のmin/max
      this.translate = {
        x: Math.max(
          0,
          Math.min(
            this.baseWidth * (this.scale - 1),
            (this.zoomCenter.x / prevScale) * this.scale - pinpoint.x
          )
        ),
        y: Math.max(
          0,
          Math.min(
            this.baseHeight * (this.scale - 1),
            (this.zoomCenter.y / prevScale) * this.scale - pinpoint.y
          )
        )
      }
    },

    togglePlaying() {
      const video = this.$refs.media
      if (video.paused) video.play()
      else video.pause()
    }
  }
}
</script>

<style scoped>
.container {
  user-select: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #222;
}

.play-icon {
  position: absolute;
  bottom: 15px;
  left: 15px;
  background: #ffffffaa;
  border-radius: 10px;
  cursor: pointer;
  padding: 5px 15px;
  font-size: 20px;
}

.play-icon:hover {
  background: #fff;
}

.viewer-frame {
  position: fixed;
  transform: translate(-50%,-50%);
  top: 50%;
  left: 50%;
  overflow: hidden;
}

.media-container {
  position: relative;
  width: 100%;
  height: 100%;
  transform-origin: left top;
}

.base-media {
  vertical-align: bottom;
  width: 100%;
}

.ratio-label {
  position: absolute;
  top: 15px;
  left: 25px;
  background: #fff;
  border-radius: 3px;
  padding: 5px 20px;
  font-size: 30px;
}
</style>
