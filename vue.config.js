const path = require("path")
const resolve = (dir) => path.join(__dirname, dir)

module.exports = {
  transpileDependencies: [
    "core-js",
    "element-ui"
  ],
  configureWebpack: {
    resolve: {
      alias: {
        "@": resolve("src"),
        config: resolve("config"),
        "@demo": resolve("demo")
      }
    }
  },
  chainWebpack: (config) => {
    config.module
      .rule("markdown")
      .test(/\.md$/)
      .use("vue-loader")
      .loader("vue-loader")
      .end()
      .use("md-loader")
      .loader(path.resolve(__dirname, "md-loader/index.js"))
      .end()
  }
}
