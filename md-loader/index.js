const hljs = require("highlight.js")
const cheerio = require("cheerio")
const {
  stripScript,
  stripTemplate,
  genInlineComponentText
} = require("./util")
const md = require("./config")

module.exports = function(source) {
  md.set({
    linkify: true, // 将类似 URL 的文本自动转换为链接。
    html: true, // Enable HTML tags in source
    // 代码高亮
    highlight: function(str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return (
            '<pre class="hljs"><code>' +
            hljs.highlight(lang, str, true).value +
            "</code></pre>"
          )
        } catch (err) {
          console.log(err)
        }
      }

      return (
        '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + "</code></pre>"
      )
    }
  })

  console.log(source, "source")

  const content = md.render(source)

  const startTag = "<!--element-demo:"
  const startTagLen = startTag.length
  const endTag = ":element-demo-->"
  const endTagLen = endTag.length

  let componenetsString = ""
  let id = 0 // demo 的 id
  const output = [] // 输出的内容
  let start = 0 // 字符串开始位置

  let commentStart = content.indexOf(startTag)
  let commentEnd = content.indexOf(endTag, commentStart + startTagLen)
  while (commentStart !== -1 && commentEnd !== -1) {
    output.push(content.slice(start, commentStart))

    const commentContent = content.slice(
      commentStart + startTagLen,
      commentEnd
    )
    const html = stripTemplate(commentContent)
    const script = stripScript(commentContent)
    const demoComponentContent = genInlineComponentText(html, script)
    const demoComponentName = `element-demo${id}`
    output.push(`<template slot="source"><${demoComponentName} /></template>`)
    componenetsString += `${JSON.stringify(
      demoComponentName
    )}: ${demoComponentContent},`

    // 重新计算下一次的位置
    id++
    start = commentEnd + endTagLen
    commentStart = content.indexOf(startTag, start)
    commentEnd = content.indexOf(endTag, commentStart + startTagLen)
  }

  // 仅允许在 demo 不存在时，才可以在 Markdown 中写 script 标签
  // todo: 优化这段逻辑
  let pageScript = ""
  if (componenetsString) {
    pageScript = `<script>
      export default {
        name: 'component-doc',
        components: {
          ${componenetsString}
        }
      }
    </script>`
  } else if (content.indexOf("<script>") === 0) {
    // 硬编码，有待改善
    start = content.indexOf("</script>") + "</script>".length
    pageScript = content.slice(0, start)
  }

  output.push(content.slice(start))

  // 给每个元素增加 markdown class, 定制 markdown 样式时选择更加准确
  const htmlContent = output.join("")
  const $ = cheerio.load(htmlContent)
  const markdownHtml = $("*").addClass("markdown").html()

  return `
    <template>
      <section class="markdown-container theme-default-content">
      ${markdownHtml}
      </section>
    </template>
    ${pageScript}
  `
}
