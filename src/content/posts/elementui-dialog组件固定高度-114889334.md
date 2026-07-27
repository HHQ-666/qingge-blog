---
title: "elementui dialog组件固定高度"
published: 2021-03-16
description: "解决 ElementUI Dialog 高度不固定的问题，通过样式约束实现内容区可滚动、整体高度稳定的弹窗。"
tags: ["css", "vue.js", "前端"]
category: "Vue"
draft: false
lang: "zh_CN"
---
> 本文同步自 [CSDN · 清阿哥](https://blog.csdn.net/weixin_44980732/article/details/114889334)，原文发布于 2021-03-16。

**弹窗高度过大，想设置个自适应的高度，固定头尾**

```
/deep/.el-dialog {
  margin: 5vh auto !important;
}

/deep/ .el-dialog__body {
  height: 70vh;
  overflow: auto;
}
```

margin，height 可根据实际情况设置大小。  
效果图：  
![在这里插入图片描述](https://green-mouse-f903.heqing299-328.workers.dev/posts/elementui-dialog组件固定高度-114889334/61c1970234b63766.png)  
欢迎大家留言交流！
