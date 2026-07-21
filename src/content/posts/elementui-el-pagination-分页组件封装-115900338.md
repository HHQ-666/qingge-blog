---
title: "elementui el-pagination 分页组件封装"
published: 2021-04-20
description: "封装 ElementUI el-pagination 分页组件，统一表格场景的前后端分页用法，减少重复配置。"
tags: ["javascript", "js", "vue.js", "css", "html"]
category: "Vue"
draft: false
lang: "zh_CN"
---
> 本文同步自 [CSDN · 清阿哥](https://blog.csdn.net/weixin_44980732/article/details/115900338)，原文发布于 2021-04-20。

分页组件是比较常用的，有表格的地方基本上都存在分页，使用 elementui 里面的分页进行封装方便使用。

### 一. 后端分页

```
<template>
  <div class="pagination">
    <el-pagination @size-change="sizeChange"
      @current-change="currentChange"
      :current-page="currentPage"
      :page-sizes="propPageSizes"
      :page-size="pageSize"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      v-if="total > 0">
    </el-pagination>
  </div>
</template>

<script>
export default {
  props: {
    callback: { // 获取列表数据方法
      type: Function,
      default() {
        return function() {};
      }
    },
    propCurrentPage: { // 当前页
      type: [Number],
      default: 1
    },
    propPageSizes: { // 配置每页显示多少条
      type: Array,
      default: function() {
        return [10, 20, 30];
      }
    },
    propPageSize: { // 默认每页显示条数
      type: [Number],
      default: 10
    },
    total: { // 数据总条数
      type: [Number],
      default: 0
    }
  },
  data() {
    return {
      currentPage: this.propCurrentPage, // 页面的当前页
      pageSize: this.propPageSize // 页面分页器大小
    };
  },
  methods: {
    // 改变当前页
    currentChange(val) {
      this.currentPage = val;
      this['callback']();
    },
    // 改变每页显示多少条
    sizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this['callback']();
    }
  }
};
</script>

<style lang="less" scoped>
// 样式根据自己的实际情况修改，也可以用下边的
.pagination {
  margin-top: 20px;
  text-align: right;

  /deep/ .el-pagination.is-background .el-pager li,
  /deep/ .el-pagination.is-background .btn-prev,
  /deep/ .el-pagination.is-background .btn-next {
    color: #666;
    background-color: #fff;
    border: 1px solid #e4e9ec;
    border-radius: 4px;
  }

  /deep/ .el-pagination.is-background .el-pager li:not(.disabled).active {
    color: #11889c;
    background-color: #fff;
    border: 1px solid #11889c;
  }

  /deep/ .el-pagination.is-background .btn-prev:disabled,
  /deep/ .el-pagination.is-background .btn-next:disabled {
    color: #c0c4cc;
  }
}
</style>
```

```
<Pagination 
  ref="pagination"
  :callback="getMsgList"
  :total="total">
</Pagination>
```

**效果图**  
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/7b4276093194f42a89cc918bc08f44d3.png)

---

#### 二. 前端实现分页

待更新。。。

---

这个分页其实也没什么难度，是后端实现的分页，后面再总结下前端实现分页的方法。有问题，欢迎大家随时留言交流！
