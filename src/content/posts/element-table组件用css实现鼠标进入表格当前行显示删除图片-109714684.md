---
title: "element table组件用css实现鼠标进入表格当前行显示删除图片"
published: 2020-11-16
image: /media/uploads/covers/vue.png
description: "用 CSS 实现 Element Table 鼠标悬停当前行显示删除图标，兼顾交互反馈与布局不跳动。"
tags: ["css", "elementui"]
category: "Vue"
draft: false
lang: "zh_CN"
---
> 本文同步自 [CSDN · 清阿哥](https://blog.csdn.net/weixin_44980732/article/details/109714684)，原文发布于 2020-11-16。

现在有一个需求鼠标进入表格的当前行，显示操作列的删除图标，鼠标移出隐藏，发现一种超级简单的实现方法，只用ss就能实现。  
直接上代码  
在需要隐藏显示的元素上加上 delImg 就可以了 就这么简单粗暴

```
.delImg {
  cursor: pointer;
  opacity: 0;
}

.el-table__body tr:hover {
  .delImg {
    opacity: 1;
  }
}
```

ps：说下为什么要用 opacity 属性进行显示隐藏，如果用display 属性进行操作的话，因为它不占据原来的位置，显示隐藏的操作列的宽度会变，体验不好，所以就用了透明属性元素占据原来的位置。
