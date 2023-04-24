import Vue from "vue"

export const isServer = Vue.prototype.$isServer

/**
 * judge if the browser is support sticky
 */
export const isSupportSticky = function() {
  let div = document.createElement("div")
  const style = "display: none; position: -webkit-sticky; position: sticky"
  div.style.cssText = style
  const body = document.body
  body.appendChild(div)
  const isSupport = /sticky/i.test(window.getComputedStyle(div).position)
  body.removeChild(div)
  div = null

  return isSupport
}

/**
 * get the overscroll parentNode
 * @param {*} element current node
 * @param {*} rootElement root node
 */
export const getScrollTargetEvent = function(element, rootElement = window) {
  let currentNode = element

  while (
    currentNode &&
    currentNode.tagName !== "HTML" &&
    currentNode.tagName !== "BODY" &&
    currentNode !== rootElement &&
    currentNode.nodeType === 1
  ) {
    const overflowY =
      document.defaultView.getComputedStyle(currentNode).overflowY
    if (overflowY === "auto" || overflowY === "scroll") {
      return currentNode
    }

    currentNode = currentNode.parentNode
  }

  return rootElement
}

export const padZero = (number, length = 2) => {
  number = number + ""

  while (number.length < length) {
    number = "0" + number
  }

  return number
}

export const range = (value, min, max) => {
  return Math.min(Math.max(value, min), max)
}

/** @description 比较数值是否相等 */
export const isEqual = (value1, value2) => {
  if (value1 === value2) return true
  if (!(value1 instanceof Array)) return false
  if (!(value2 instanceof Array)) return false
  if (value1.length !== value2.length) return false
  for (let i = 0; i !== value1.length; ++i) {
    if (value1[i] !== value2[i]) return false
  }
  return true
}

export const bus = new Vue()

/**
 * @description 获取目标原始类型
 * @param target 任意类型
 * @returns {string} type 数据类型
 */
export function getType(target) {
  // 得到原生类型
  const typeStr = Object.prototype.toString.call(target)
  // 拿到类型值
  const type = typeStr.match(/\[object (\w+)\]/)[1]
  // 类型值转小写并返回
  return type.toLowerCase()
}

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const ua = navigator.userAgent.toLowerCase()

export const isWindows = ua.indexOf("win32") > -1 ||
  ua.indexOf("wow32") > -1 ||
  ua.indexOf("win64") > -1 ||
  ua.indexOf("wow64") > -1

export const hashRE = /#.*$/
export const extRE = /\.(md|html)$/
export const endingSlashRE = /\/$/
export const outboundRE = /^[a-z]+:/i

export function normalize(path) {
  return decodeURI(path).replace(hashRE, "").replace(extRE, "")
}

export function getHash(path) {
  const match = path.match(hashRE)
  if (match) {
    return match[0]
  }
}

export function isExternal(path) {
  return outboundRE.test(path)
}

export function isMailto(path) {
  return /^mailto:/.test(path)
}

export function isTel(path) {
  return /^tel:/.test(path)
}

export function ensureExt(path) {
  if (isExternal(path)) {
    return path
  }
  const hashMatch = path.match(hashRE)
  const hash = hashMatch ? hashMatch[0] : ""
  console.log(hash);
  const normalized = normalize(path)

  if (endingSlashRE.test(normalized)) {
    return path
  }
  // return normalized + ".html" + hash
  return normalized
}

export function isActive(route, path) {
  const routeHash = decodeURIComponent(route.hash)
  const linkHash = getHash(path)
  if (linkHash && routeHash !== linkHash) {
    return false
  }
  const routePath = normalize(route.path)
  const pagePath = normalize(path)
  return routePath === pagePath
}

export function resolvePage(pages, rawPath, base) {
  if (isExternal(rawPath)) {
    return {
      type: "external",
      path: rawPath
    }
  }
  if (base) {
    rawPath = resolvePath(rawPath, base)
  }
  const path = normalize(rawPath)
  for (let i = 0; i < pages.length; i++) {
    if (normalize(pages[i].regularPath) === path) {
      return Object.assign({}, pages[i], {
        type: "page",
        path: ensureExt(pages[i].path)
      })
    }
  }
  console.error(
    `[vuepress] No matching page found for sidebar item "${rawPath}"`
  )
  return {}
}

function resolvePath(relative, base, append) {
  const firstChar = relative.charAt(0)
  if (firstChar === "/") {
    return relative
  }

  if (firstChar === "?" || firstChar === "#") {
    return base + relative
  }

  const stack = base.split("/")

  // remove trailing segment if:
  // - not appending
  // - appending to trailing slash (last segment is empty)
  if (!append || !stack[stack.length - 1]) {
    stack.pop()
  }

  // resolve relative path
  const segments = relative.replace(/^\//, "").split("/")
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (segment === "..") {
      stack.pop()
    } else if (segment !== ".") {
      stack.push(segment)
    }
  }

  // ensure leading slash
  if (stack[0] !== "") {
    stack.unshift("")
  }

  return stack.join("/")
}

/**
 * @param { Page } page
 * @param { string } regularPath
 * @param { SiteData } site
 * @param { string } localePath
 * @returns { SidebarGroup }
 */
export function resolveSidebarItems(page, regularPath, site, localePath) {
  const { pages, themeConfig } = site

  const localeConfig =
    localePath && themeConfig.locales
      ? themeConfig.locales[localePath] || themeConfig
      : themeConfig

  const pageSidebarConfig =
    page.frontmatter.sidebar || localeConfig.sidebar || themeConfig.sidebar
  if (pageSidebarConfig === "auto") {
    return resolveHeaders(page)
  }

  const sidebarConfig = localeConfig.sidebar || themeConfig.sidebar
  if (!sidebarConfig) {
    return []
  } else {
    const { base, config } = resolveMatchingConfig(regularPath, sidebarConfig)
    if (config === "auto") {
      return resolveHeaders(page)
    }
    return config ? config.map((item) => resolveItem(item, pages, base)) : []
  }
}

/**
 * @param { Page } page
 * @returns { SidebarGroup }
 */
function resolveHeaders(page) {
  const headers = groupHeaders(page.headers || [])
  return [
    {
      type: "group",
      collapsable: false,
      title: page.title,
      path: null,
      children: headers.map((h) => ({
        type: "auto",
        title: h.title,
        basePath: page.path,
        path: page.path + "#" + h.slug,
        children: h.children || []
      }))
    }
  ]
}

export function groupHeaders(headers) {
  // group h3s under h2
  headers = headers.map((h) => Object.assign({}, h))
  let lastH2
  headers.forEach((h) => {
    if (h.level === 2) {
      lastH2 = h
    } else if (lastH2) {
      (lastH2.children || (lastH2.children = [])).push(h)
    }
  })
  return headers.filter((h) => h.level === 2)
}

export function resolveNavLinkItem(linkItem) {
  return Object.assign(linkItem, {
    type: linkItem.items && linkItem.items.length ? "links" : "link"
  })
}

/**
 * @param { Route } route
 * @param { Array<string|string[]> | Array<SidebarGroup> | [link: string]: SidebarConfig } config
 * @returns { base: string, config: SidebarConfig }
 */
export function resolveMatchingConfig(regularPath, config) {
  if (Array.isArray(config)) {
    return {
      base: "/",
      config: config
    }
  }
  for (const base in config) {
    if (ensureEndingSlash(regularPath).indexOf(encodeURI(base)) === 0) {
      return {
        base,
        config: config[base]
      }
    }
  }
  return {}
}

function ensureEndingSlash(path) {
  return /(\.html|\/)$/.test(path) ? path : path + "/"
}

function resolveItem(item, pages, base, groupDepth = 1) {
  if (typeof item === "string") {
    return resolvePage(pages, item, base)
  } else if (Array.isArray(item)) {
    return Object.assign(resolvePage(pages, item[0], base), {
      title: item[1]
    })
  } else {
    const children = item.children || []
    if (children.length === 0 && item.path) {
      return Object.assign(resolvePage(pages, item.path, base), {
        title: item.title
      })
    }
    return {
      type: "group",
      path: item.path,
      title: item.title,
      sidebarDepth: item.sidebarDepth,
      initialOpenGroupIndex: item.initialOpenGroupIndex,
      children: children.map((child) =>
        resolveItem(child, pages, base, groupDepth + 1)
      ),
      collapsable: item.collapsable !== false
    }
  }
}
export function stripScript(content) {
  const result = content.match(/<(script)>([\s\S]+)<\/\1>/)
  return result && result[2] ? result[2].trim() : ""
}

export function stripStyle(content) {
  const result = content.match(/<(style)\s*>([\s\S]+)<\/\1>/)
  return result && result[2] ? result[2].trim() : ""
}

export function stripTemplate(content) {
  content = content.trim()
  if (!content) {
    return content
  }
  return content.replace(/<(script|style)[\s\S]+<\/\1>/g, "").trim()
}

/**
 * 根据路由获取匹配的 SideBar
 */
export const matchSideBar = (routePath, configObject) => {
  const items = routePath.split("/").filter((x) => x)
  const keys = Object.keys(configObject)
  const targetList = keys.map((x) => x.replace(/^\/|\/$/g, ""))
  // console.log("targetList: ", targetList)
  let result = null

  while (items.length) {
    const a = items.splice(-1, 1)
    console.log("a", a)
    const p = items.join("/")
    const index = targetList.indexOf(p)
    if (index > -1) {
      // console.log("----------", p)
      result = configObject[keys[index]]
      break
    }
    // console.log("items", items)
  }
  return result
}

export const makeId = (n) => {
  let result = ""
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789"
  const charactersLength = characters.length
  for (let i = 0; i < n; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}
