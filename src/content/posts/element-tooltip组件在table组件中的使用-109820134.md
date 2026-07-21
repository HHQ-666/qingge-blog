---
title: "element tooltip组件在table组件中的使用"
published: 2020-11-19
description: "总结 Element Tooltip 在 Table 中的用法，处理溢出文本提示与单元格内悬浮交互的常见问题。"
tags: ["vue"]
category: "Vue"
draft: false
lang: "zh_CN"
---
> 本文同步自 [CSDN · 清阿哥](https://blog.csdn.net/weixin_44980732/article/details/109820134)，原文发布于 2020-11-19。

需求：在表格中超出两行后显示省略号，鼠标进入在tooltip框中显示文本信息，随后将tooltip封装成立组件使用。

```
OverFlowText.vue

<!-- 组件功能：文本溢出时，显示tooltip -->
<template>
  <el-tooltip manual
              v-model="isShow"
              :disabled="!isShow"
              :width="tableWidth"
              placement="top">
    <div class="tooltip-content"
         slot="content">{{ content }}</div>
    <div :class="`text-wrap ${rows>1?'text-wrap-column':'text-wrap-row'}`"
         @mouseenter="handleMouseenter($event,)"
         @mouseleave="handleMouseleave"
         :style="rows>1?`-webkit-line-clamp:${rows}`:''">
      <slot />
    </div>
  </el-tooltip>
</template>

<script>
export default {
  props: {
    content: {
      // tooltip展示内容
      type: String
    },
    rows: {
      // 超过n行省略
      type: Number,
      default: 1
    },
    tableWidth: {
      // 需要展示tooltip框元素的宽度
      type: Number
    }
  },
  data() {
    return {
      isShow: false
    };
  },
  methods: {
    handleMouseenter({ target: { offsetWidth } }) {
      // 获取当前文本宽度
      let TemporaryTag = document.createElement('span');
      TemporaryTag.innerText = this.content;
      TemporaryTag.className = 'getTextWidth';
      document.querySelector('body').appendChild(TemporaryTag);
      let currentWidth = document.querySelector('.getTextWidth').offsetWidth;
      document.querySelector('.getTextWidth').remove();
      /* cellWidth为表格容器的宽度 */
      const cellWidth = offsetWidth;
      /* 当文本宽度小于||等于容器宽度两倍时，代表文本显示未超过两行 */
      currentWidth <= (2 * cellWidth) ? this.isShow = false : this.isShow = true;
    },
    handleMouseleave() {
      this.isShow = false;
    }
  }
};
</script>

<style scoped>
.text-wrap {
  width: 100%;
  overflow: hidden;
  word-break: break-word;
  box-sizing: border-box;
}

.text-wrap-row {
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-wrap-column {
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.tooltip-content {
  max-width: 500px;
  word-break: break-word;
  white-space: pre-wrap;
}
</style>
```

页面中的使用

```
/**
* width 表格宽度 
* content 需要显示在tooltip 框中的内容
* row 需要几行显示省略号 隐藏文本内容
**/
<el-table-column prop="subject"
                           label="学科"
                           align="center"
                           width="180">
            <template slot-scope="scoped">
              <over-flow-text :rows="2"
                            :width="180"
                           	:content="Object.keys(scoped.row.subjects).join('，')"> 
                <div>
                  {{ Object.keys(scoped.row.subjects).join('，') }}
                </div>
              </over-flow-text>
            </template>
          </el-table-column>
```

效果图如下：  
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/cbd231cc4407f42094a2e6387cda8fac.png#pic_center)  
展示需要展示 tooltip 的需求都可以使用，上面的组件。  
如果有什么问题，可以留言一起交流。
