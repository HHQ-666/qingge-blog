---
title: "vue使用 vue-qr 和 html2canvas 链接生成普通二维码和海报二维码"
published: 2020-11-20
description: "使用 vue-qr 与 html2canvas，把链接生成普通二维码与可下载的海报二维码。"
tags: ["vue"]
category: "Vue"
draft: false
lang: "zh_CN"
---
> 本文同步自 [CSDN · 清阿哥](https://blog.csdn.net/weixin_44980732/article/details/109849492)，原文发布于 2020-11-20。

首先下载插件

```
npm i vue-qr --save
npm i html2canvas --save
```

**链接生成二维码并下载到本地**

```
// 模板中的代码
      <el-dialog :visible.sync="showDownloadDialog"
                 title="测评下载"
                 width="35%">
        <div class="dialog-content">
          <el-radio-group v-model="radio">
            <el-radio :label="1">海报二维码</el-radio>
            <el-radio :label="2">高清二维码</el-radio>
          </el-radio-group>
          <div class="evaluationUrl">
            测评链接：
            <div class="copyUrl">
              <span class="oneLine">{{ QRUrl }}</span>
              <span class="copy"
                    :data-clipboard-text="QRUrl"
                    @click="copy">复制链接</span>
            </div>
            <div id="qrcode">
              <vue-qr :text="QRUrl" // 链接
                      :size="175" // 二维码的宽高
                      :margin="1"></vue-qr>
            </div>
          </div>
        </div>
        <div slot="footer"
             class="dialog-footer">
          <el-button @click="showDownloadDialog = false"
                     class="btn-cancel">取消</el-button>
          <el-button @click="confirmDownload"
                     type="primary">下载</el-button>
        </div>
      </el-dialog>
```

**在使用的组件中引入 注册在组件中**

```
import VueQr from 'vue-qr';
import html2canvas from 'html2canvas';
export default {
  name: 'EvaluationList',
  components: {
    VueQr
  },
 }
```

**下载二维码到本地**

```
confirmDownload() {
      // 确认下载二维码或者海报二维码
      if (this.radio === 2) {
        // 下载高清二维码
        var oQrcode = document.querySelector('#qrcode img');
        var url = oQrcode.src;
        var a = document.createElement('a');
        var event = new MouseEvent('click');
        // 下载图名字
        a.download = '高清二维码';
        // url
        a.href = url;
        // 合成函数，执行下载
        a.dispatchEvent(event);
      } else {
        // 下载海报二维码
        this.saveImg();
      }
    },
```

由于需求是不需要预览 直接下载 所以将二维码进行了隐藏

```
#qrcode {
  display: none;
}
```

**效果图如下**  
 下载弹窗  
 ![在这里插入图片描述](https://green-mouse-f903.heqing299-328.workers.dev/posts/vue使用-vue-qr-和-html2canvas-链接生成普通二维码和海报二维码-109849492/bd3284bc101950c1.png)  
 ![在这里插入图片描述](https://green-mouse-f903.heqing299-328.workers.dev/posts/vue使用-vue-qr-和-html2canvas-链接生成普通二维码和海报二维码-109849492/7114b60945e36440.png)  
 **二维码和背景图片合成海报二维码下载到本地**  
 模板中的代码

```
<div class="bgCode"
           id="mycanvas">
        <vue-qr class="QrcodeBg"
                :text="QRUrl" // 链接
                :margin="1"
                :size="175">
        </vue-qr>
      </div>
```

下载海报到本地

```
saveImg() {
      // 先获取你要转换为img的dom节点
      var node = document.getElementById('mycanvas'); // 传入的id名称
      var width = node.offsetWidth; // dom宽
      var height = node.offsetHeight; // dom高
      var scale = 2; // 放大倍数 这个相当于清晰度 调大一点更清晰一点
      html2canvas(node, {
        width: width,
        heigth: height,
        backgroundColor: '#ffffff', // 背景颜色 为null是透明
        dpi: window.devicePixelRatio * 2, // 按屏幕像素比增加像素
        scale: scale,
        X: 0,
        Y: 0,
        scrollX: -3, // 如果左边多个白边 设置该偏移-3 或者更多
        scrollY: 0,
        useCORS: true, // 是否使用CORS从服务器加载图像 !!!
        allowTaint: true // 是否允许跨域图像污染画布  !!!
      }).then((canvas) => {
        var url = canvas.toDataURL(); // 这里上面不设值cors会报错
        var a = document.createElement('a'); // 创建一个a标签 用来下载
        a.download = '海报二维码'; // 设置下载的图片名称
        var event = new MouseEvent('click'); // 增加一个点击事件
        a.href = url; // 此处的url为base64格式的图片资源
        a.dispatchEvent(event); // 触发a的单击事件 即可完成下载
      });
    },
```

css  
 需求不需要展示海报二维码 所以使用z-index 降低层级 不展示在页面上 将链接转成二维码后定位到背景图片放置二维码的位置

```
.bgCode {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: -10;
  width: 375px;
  height: 667px;
  background: url('~@/assets/images/AIEvaluation/bg.png');
  background-size: contain;

  .QrcodeBg {
    position: absolute;
    top: 348px;
    left: 100px;
  }
}
```

效果图如下  
 ![在这里插入图片描述](https://green-mouse-f903.heqing299-328.workers.dev/posts/vue使用-vue-qr-和-html2canvas-链接生成普通二维码和海报二维码-109849492/b283b488dce70b90.png)  
 ![在这里插入图片描述](https://green-mouse-f903.heqing299-328.workers.dev/posts/vue使用-vue-qr-和-html2canvas-链接生成普通二维码和海报二维码-109849492/555ca9a432ade3f7.png)  
 **vue-qr 常用属性介绍**

text 二维码内容  
 size 二维码宽高大小，因为是正方形，所以设一个参数即可  
 margin 默认边距20px，不喜欢的话自己设为0  
 colorDark 实点的颜色，注意要和colorLight一起设置才有效  
 colorLight 空白的颜色，注意要和colorDark一起设置才有效  
 bgSrc 嵌入背景图地址，没什么卵用，不建议设置  
 logoSrc 二维码中间的图，这个是好东西，设置一下显得专业点  
 logoScale 中间图的尺寸，不要设太大，太大会导致扫码失败的  
 dotScale 那些小点点的大小，这个也没什么好纠结的，不建议设置了

官方vue-qr：[官方文档](https://www.npmjs.com/package/vue-qr)

html2canvas 配置项介绍 [html2canvas 中文文档](https://allenchinese.github.io/html2canvas-docs-zh-cn/docs/html2canvas-configuration.html)

有什么问题留言一起交流下吧。
