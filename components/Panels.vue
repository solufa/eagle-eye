<template>
  <div class="panel-container">
    <template v-if="ratio > 1">
      <template v-for="yIndex in blockLength">
        <template v-for="xIndex in blockLength">
          <div
            :key="`${ratio}-${yIndex}-${xIndex}`"
            :style="blockStyle"
            class="panel-block"
          >
            <video
              v-if="videoVisible(xIndex, yIndex)"
              ref="videos"
              :src="videoSrc(xIndex, yIndex)"
              class="panel-video"
              muted
              loop
              autoplay
              webkit-playsinline
              playsinline
              @play="onPlay"
            />
            <!-- <div v-if="videoVisible(xIndex, yIndex)" class="test" /> -->
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    playing: {
      type: Boolean,
      required: true
    },
    currentTime: {
      type: Number,
      required: true
    },
    scale: {
      type: Number,
      required: true
    },
    ratio: {
      type: Number,
      required: true
    },
    playbackRate: {
      type: Number,
      required: true
    },
    baseWidth: {
      type: Number,
      required: true
    },
    baseHeight: {
      type: Number,
      required: true
    },
    translate: {
      type: Object,
      required: true
    },
    widthList: {
      type: Array,
      required: true
    }
  },
  computed: {
    blockLength() {
      return this.ratio * 2
    },
    blockStyle() {
      return {
        width: `${100 / this.blockLength}%`,
        height: `${100 / this.blockLength}%`
      }
    },
    videoVisible() {
      return (xIndex, yIndex) =>
        this.translate.x + this.baseWidth > (xIndex - 1) * this.baseWidth * this.scale / this.blockLength &&
        this.translate.x < xIndex * this.baseWidth * this.scale / this.blockLength &&
        this.translate.y + this.baseHeight > (yIndex - 1) * this.baseHeight * this.scale / this.blockLength &&
        this.translate.y < yIndex * this.baseHeight * this.scale / this.blockLength
    },
    videoSrc() {
      return (xIndex, yIndex) => `/videos/${this.ratio}k/${yIndex}-${xIndex}.mp4`
    }
  },
  watch: {
    playing(bool) {
      if (!this.$refs.videos) return
      this.$refs.videos.forEach(video => bool ? video.play() : video.pause())
    }
  },
  mounted() {
    setInterval(() => {
      if (!this.$refs.videos) return
      this.$refs.videos.forEach((video) => {
        if (Math.abs(video.currentTime - this.currentTime) > 1) {
          video.currentTime = this.currentTime
        }
      })
    }, 500)
  },
  methods: {
    onPlay(e) {
      e.target.playbackRate = this.playbackRate
      e.target.currentTime = this.currentTime
      if (!this.playing) e.target.pause()
    }
  }
}
</script>

<style scoped>
.panel-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.panel-block {
  display: inline-block;
  vertical-align: bottom;
}

.panel-video {
  vertical-align: bottom;
  width: 100%;
}

.test {
  height: 100%;
  background: #f00;
  box-sizing: border-box;
  border: 1px solid #fff;
}
</style>
