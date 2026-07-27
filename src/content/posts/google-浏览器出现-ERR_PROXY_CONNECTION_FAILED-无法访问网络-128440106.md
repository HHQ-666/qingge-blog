---
title: "google 浏览器出现 ERR_PROXY_CONNECTION_FAILED 无法访问网络"
published: 2022-12-26
description: "记录 Chrome 出现 ERR_PROXY_CONNECTION_FAILED 无法上网的排查过程，给出代理相关的解决办法。"
tags: ["网络"]
category: "前端"
draft: false
lang: "zh_CN"
---
> 本文同步自 [CSDN · 清阿哥](https://blog.csdn.net/weixin_44980732/article/details/128440106)，原文发布于 2022-12-26。

## 1. 问题

> 早上来公司突然发现谷歌浏览器访问所有的东西都出现 ERR\_PROXY\_CONNECTION\_FAILED 网络不可用的提示 这一串的单词的意思是 代理连接失败 真的是一脸懵逼 经过一番百度后发现是网络代理作的妖…

![请添加图片描述](https://green-mouse-f903.heqing299-328.workers.dev/posts/google-浏览器出现-ERR_PROXY_CONNECTION_FAILED-无法访问网络-128440106/b2f4b8d2aca2ff50.jpg)

## 2. 解决方法

其实很简单将 wifi 和网络里面所有的代理全部取消即可  
![请添加图片描述](https://green-mouse-f903.heqing299-328.workers.dev/posts/google-浏览器出现-ERR_PROXY_CONNECTION_FAILED-无法访问网络-128440106/08c7544f80cabdf0.jpg)  
全部取消勾选 还不明白为什么代理被自动勾选了… 有明白的大佬 可以解释下 （wifi 和网络设置同理）  
![请添加图片描述](https://green-mouse-f903.heqing299-328.workers.dev/posts/google-浏览器出现-ERR_PROXY_CONNECTION_FAILED-无法访问网络-128440106/83e73cb2c8f5dfca.jpg)  
**可以正常访问了**  
![请添加图片描述](https://green-mouse-f903.heqing299-328.workers.dev/posts/google-浏览器出现-ERR_PROXY_CONNECTION_FAILED-无法访问网络-128440106/857c4d9a2efd5b71.jpg)  
如有问题请留言交流，有更好的方法希望不吝赐教，如有错误还请指出多多包涵，如果对你有所帮助希望可以点个赞 Thanks♪(･ω･)ﾉ
