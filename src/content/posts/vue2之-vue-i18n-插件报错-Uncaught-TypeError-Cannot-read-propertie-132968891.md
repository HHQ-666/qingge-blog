---
title: "vue2之 vue-i18n 插件报错-Uncaught TypeError: Cannot read properties of undefined (reading ‘0‘)"
published: 2023-09-18
description: "排查 Vue2 使用 vue-i18n 时 Cannot read properties of undefined 报错，给出版本与初始化相关修复。"
tags: ["vue.js", "前端", "javascript"]
category: "Vue"
draft: false
lang: "zh_CN"
---
> 本文同步自 [CSDN · 清阿哥](https://blog.csdn.net/weixin_44980732/article/details/132968891)，原文发布于 2023-09-18。

### 1. 前言

> 在对 showdoc 开源项目进行二次开发的时候遇到了这个报错，在本地没有问题，发布到开发环境之后就报这个错误，一开始一头雾水无从下手，经过一番筛查（百度）之后发现是和项目里面的插件 vue-i8n 有关系，然后又经过很长时间的排查才发现是 vue-i18n 的版本问题… 排查的过程中简直太艰难了…

### 2. 问题

![报错](https://green-mouse-f903.heqing299-328.workers.dev/posts/vue2之-vue-i18n-插件报错-Uncaught-TypeError-Cannot-read-propertie-132968891/f24c82a75a5d02c8.jpg)

### 3. 解决过程

在报错指向的第一个报错文件中找到了 `_watchers[0].constructor` undefined 造成的问题 说明这个插件在初始化的时候没有`_watcher` 这个方法，导致报错之后导致页面阻塞加载白屏的状态。  
 无意中看到了一篇文章产生了启发，感觉会不会是版本的问题

- 升级插件版本（原来是 5.0.3 node v14.19.0）
  - `npm i vue-i18n@8.28.2 -S` 也可以试试其他高一点的版本

### 4. 代码

```
// lang.js
import Vue from 'vue' // 引入Vue
```
