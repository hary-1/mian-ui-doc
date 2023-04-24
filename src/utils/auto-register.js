// auto-register.js
// 自动注册全局组件
import Vue from "vue"
import upperFirst from "lodash/upperFirst"
import camelCase from "lodash/camelCase"

// 将components目录下所有子组件注册为全局组件
const requireComponent = require.context("@/components", false, /\w+\.(vue)$/)

requireComponent.keys().forEach((fileName) => {
  // 获取组件配置
  const componentConfig = requireComponent(fileName)

  // 获取组件的 PascalCase 命名
  const componentName = upperFirst(
    camelCase(
      // 获取和目录深度无关的文件名
      fileName
        .split("/")
        .pop()
        .replace(/\.\w+$/, "")
    )
  )

  // 全局注册组件
  Vue.component(
    componentName,
    // 如果这个组件选项是通过 `export default` 导出的，
    // 那么就会优先使用 `.default`，
    // 否则回退到使用模块的根。
    componentConfig.default || componentConfig
  )
})
