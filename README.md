# swan

> My beautiful Nuxt.js project

## Build Setup

``` bash
# install dependencies
$ npm run install

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm run start

# generate static project
$ npm run generate
```

For detailed explanation on how things work, checkout [Nuxt.js docs](https://nuxtjs.org).

ffmpeg -i 8k-rio.mkv -q:v 5 -threads 0 -vf crop=480:270:480:270,scale=w=480:h=270 00.mp4