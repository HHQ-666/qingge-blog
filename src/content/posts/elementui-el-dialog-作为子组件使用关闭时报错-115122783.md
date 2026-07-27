---
title: "elementui el-dialog 作为子组件使用关闭时报错"
published: 2021-03-23
description: "排查 el-dialog 作为子组件关闭时报错的原因，给出父子通信与销毁时机相关的修复写法。"
tags: ["vue.js"]
category: "Vue"
draft: false
lang: "zh_CN"
---
> 本文同步自 [CSDN · 清阿哥](https://blog.csdn.net/weixin_44980732/article/details/115122783)，原文发布于 2021-03-23。

#### 1. 弹窗作为子组件

父组件通过点击事件来打开弹窗，然而，在弹窗中点击窗外之外的空白区域或者右上角叉时候一直报错:  
![在这里插入图片描述](https://green-mouse-f903.heqing299-328.workers.dev/posts/elementui-el-dialog-作为子组件使用关闭时报错-115122783/1e749d7112dd36f2.png)  
翻译：**避免直接改变一个道具，因为当父组件重新渲染时，这个值会被覆盖。相反，使用基于道具值的数据或计算属性。正在发生突变的道具:“editVisible”**

#### 2. 原因分析

从翻译来看，子组件中不能直接更改父组件传递过来的数据，然后就按照提示将传递过来的数据在 data 和 computed 都重新复制一遍，仍然报同样的错。

#### 3. 解决方法

最后通过一行代码顺利解决，在弹窗上加上 **:before-close** 方法顺利解决！  
**再次分析原因：**  
通过该方法关闭弹窗的时候，直接通过父组件来改变关闭，该方法是在关闭弹窗前的回调函数，不在子组件改变弹窗的状态就不会报错了！

```
// 父组件
<editDialog :edit-visible.sync="editVisible">
</editDialog>

// 子组件
<el-dialog
      title="我的线索"
      :visible.sync="editVisible"
      :before-close="handleClose"
      top="5vh"
      width="80%">
</el-dialog>

props: {
    editVisible: {
      type: Boolean,
      default: false
    },
};

 handleClose() {
    this.$emit("update:editVisible",!this.editVisible);
 },
```

这么一个简单的问题，解决之路曲曲折折，希望对你有所帮助，有问题可以留言交流！
