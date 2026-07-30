---
title: "H5和Android ios交互"
published: 2020-06-30
image: /media/uploads/covers/vue.png
description: "介绍 H5 与 Android / iOS 原生交互的判断与调用方式，适合 WebView 混合开发踩坑与联调。"
tags: ["html5", "vue.js", "javascript"]
category: "Vue"
draft: false
lang: "zh_CN"
---
> 本文同步自 [CSDN · 清阿哥](https://blog.csdn.net/weixin_44980732/article/details/107041442)，原文发布于 2020-06-30。

### 1. 判断手机是安卓或者ios方法

#### 1.1 添加判断机型方法（适用于Android和ios调用方法不一样）

```
// checkDeciveTyoe.js
function checkDevice() {
  // js判断是否是苹果设备
  function checkIsAppleDevice() {
      var u = navigator.userAgent,
          app = navigator.appVersion;
      var ios = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
      var iPad = u.indexOf("iPad") > -1;
      var iPhone = u.indexOf("iPhone") > -1 || u.indexOf("Mac") > -1;
      if (ios || iPad || iPhone) {
          return true;
      } else {
          return false;
      }
  }
  //js判断是否为Android设备
  function checkIsAndroidDevice() {
      var u = navigator.userAgent;
      if (u.indexOf("Android") > -1 || u.indexOf("Adr") > -1) {
          return true;
      } else {
          return false;
      }
  }

  if (checkIsAppleDevice()) {
      return "ios";
  } else {
      return "Android";
  }
}
export default checkDevice;
```

#### 1.2 页面中使用（vue）

```
// 引入检测机型方法
import checkDevice from "@/utils/checkDeviceType";
export default{
	data: { 
		phone: '',
		userInfo : {},
	};
	created(){
		this.phone = checkDevice();
		window.getAppUser = this.getAppUser // 接收ios返回的数据
	}，
	methods: {
	   handleQuit () {
  	   	 if (this.phone == "Android") {
      		 // 调用安卓的方法
      		 window.android.goToAppHome();
     	 } else {
      		 // 调用ios方法
      	  window.webkit &&
          window.webkit.messageHandlers &&
          window.webkit.messageHandlers.closeWebView &&
          window.webkit.messageHandlers.closeWebView.postMessage &&
          window.webkit.messageHandlers.closeWebView.postMessage(null);
          }
      	},
      	getAppUser (str) { // ios 接受用户基本信息
      		this.userInfo = JSON.parse(str) // 原生返回的是JSON格式 需要转成对象
    	},
	}
}
```
