<template>
  <div class="container">
    <div>
      <div class="viewer-frame">
        <iframe class="viewer" src="/viewer" scrolling="no" frameborder="0" />
      </div>
      <h1 class="title">
        8K-EAGLE EYE
      </h1>
    </div>
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.container > div {
  width: 960px;
  max-width: 80%;
  margin: 20px auto 0;
}

.viewer-frame {
  position: relative;
  padding-top: 75%;
}

.viewer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 5px;
}

.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 80px;
  color: #35495e;
  letter-spacing: 1px;
  margin-top: 15px;
}
</style>
