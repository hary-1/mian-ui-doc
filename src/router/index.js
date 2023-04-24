import Vue from "vue"
import VueRouter from "vue-router"

Vue.use(VueRouter)

let routes = [
  {
    path: "/docs",
    name: "docs",
    component: (resolve) =>
      require([`../../docs/components/button/index.md`], resolve)
  }
]
const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
})

export default router
