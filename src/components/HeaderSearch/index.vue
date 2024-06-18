<template>
  <div :class="{ 'show': show }" class="header-search">
    <svg-icon class-name="search-icon" icon-class="search" @click.stop="click" />
    <el-select ref="headerSearchSelectRef" v-model="search" :remote-method="querySearch" filterable default-first-option
      remote placeholder="Search" class="header-search-select" @change="change">
      <el-option v-for="option in options" :key="option.item.path" :value="option.item"
        :label="option.item.title.join(' > ')" />
    </el-select>
  </div>
</template>

<script setup>
// fuse.js 高效的模糊搜索算法
import Fuse from 'fuse.js'
import { getNormalPath } from '@/utils/ruoyi'
import { isHttp } from '@/utils/validate'
import usePermissionStore from '@/store/modules/permission'

const search = ref('');
const options = ref([]);
const searchPool = ref([]);
const show = ref(false);
const fuse = ref(undefined);
const headerSearchSelectRef = ref(null);
const router = useRouter();
const routes = computed(() => usePermissionStore().routes);

function click() {
  show.value = !show.value
  if (show.value) {
    headerSearchSelectRef.value && headerSearchSelectRef.value.focus()
  }
};
function close() {
  headerSearchSelectRef.value && headerSearchSelectRef.value.blur()
  options.value = []
  show.value = false
}
function change(val) {
  const path = val.path;
  const query = val.query;
  if (isHttp(path)) {
    // http(s):// 路径新窗口打开
    const pindex = path.indexOf("http");
    window.open(path.substr(pindex, path.length), "_blank");
  } else {
    if (query) {
      router.push({ path: path, query: JSON.parse(query) });
    } else {
      router.push(path)
    }
  }

  search.value = ''
  options.value = []
  nextTick(() => {
    show.value = false
  })
}
function initFuse(list) {
  fuse.value = new Fuse(list, {
    shouldSort: true, // 是否对结果进行排序
    threshold: 0.4, // 阈值控制匹配的敏感度
    location: 0, // 匹配的位置，0 表示开头匹配
    distance: 100, // 搜索的最大距离
    minMatchCharLength: 1, // 最小匹配字符长度
    keys: [{
      name: 'title',
      weight: 0.7
    }, {
      name: 'path',
      weight: 0.3
    }] // 多个搜索键
  })
}
// Filter out the routes that can be displayed in the sidebar
// And generate the internationalized title
function generateRoutes(routes, basePath = '', prefixTitle = []) {
  let res = []

  for (const r of routes) {
    // skip hidden router
    if (r.hidden) { continue }
    const p = r.path.length > 0 && r.path[0] === '/' ? r.path : '/' + r.path;
    const data = {
      path: !isHttp(r.path) ? getNormalPath(basePath + p) : r.path,
      title: [...prefixTitle]
    }

    if (r.meta && r.meta.title) {
      data.title = [...data.title, r.meta.title]

      if (r.redirect !== 'noRedirect') {
        // only push the routes with title
        // special case: need to exclude parent router without redirect
        res.push(data)
      }
    }
    if (r.query) {
      data.query = r.query
    }

    // recursive child routes
    if (r.children) {
      const tempRoutes = generateRoutes(r.children, data.path, data.title)
      if (tempRoutes.length >= 1) {
        res = [...res, ...tempRoutes]
      }
    }
  }
  return res
}
function querySearch(query) {
  if (query !== '') {
    options.value = fuse.value.search(query)
  } else {
    options.value = []
  }
}

onMounted(() => {
  searchPool.value = generateRoutes(routes.value);
})

watchEffect(() => {
  searchPool.value = generateRoutes(routes.value)
})

watch(show, (value) => {
  if (value) {
    document.body.addEventListener('click', close)
  } else {
    document.body.removeEventListener('click', close)
  }
})

watch(searchPool, (list) => {
  initFuse(list)
})
</script>

<style lang='scss' scoped>
.header-search {
  font-size: 0 !important;

  .search-icon {
    cursor: pointer;
    font-size: 18px;
    vertical-align: middle;
  }

  .header-search-select {
    font-size: 18px;
    //  transition: [property] [duration] [timing-function] [delay];
    /*
      各个属性及其默认值
      property：指定需要过渡的CSS属性。

      默认值：all （表示所有可动画的属性都将具有过渡效果）
      duration：过渡效果的持续时间。

      默认值：0s （表示没有过渡效果）
      timing-function：定义过渡效果的速度曲线。
      linear: 匀速过渡。
      ease: 缓动效果，开始和结束时较慢，中间较快（默认）。
      ease-in: 缓动效果，开始时较慢。
      ease-out: 缓动效果，结束时较慢。
      ease-in-out: 缓动效果，开始和结束时较慢。
      cubic-bezier(n, n, n, n): 自定义贝塞尔曲线。

      默认值：ease （表示缓动效果，开始和结束时较慢，中间较快）
      delay：延迟多长时间后开始过渡。

      默认值：0s （表示过渡效果立即开始）
    */

    transition: width 0.2s;
    width: 0;
    overflow: hidden;
    background: transparent;
    border-radius: 0;
    display: inline-block;
    vertical-align: middle;

    :deep(.el-input__inner) {
      border-radius: 0;
      border: 0;
      padding-left: 0;
      padding-right: 0;
      box-shadow: none !important;
      border-bottom: 1px solid #d9d9d9;
      vertical-align: middle;
    }
  }

  &.show {
    .header-search-select {
      width: 210px;
      margin-left: 10px;
    }
  }
}
</style>