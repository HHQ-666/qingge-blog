---
title: "vue pdf 预览下载功能 vue-pdf"
published: 2021-04-05
image: /media/uploads/covers/vue.png
description: "基于 vue-pdf 实现 PDF 预览与下载，记录合同类文件在线查看的接入步骤与注意点。"
tags: ["vue"]
category: "Vue"
draft: false
lang: "zh_CN"
---
> 本文同步自 [CSDN · 清阿哥](https://blog.csdn.net/weixin_44980732/article/details/115443136)，原文发布于 2021-04-05。

开发新项目的时候遇到了合同的预览下载功能，之前没有做过，实现之后记录一下，方便以后查阅。

#### 1. 下载 vue-pdf 插件

```
npm install --save vue-pdf
或者
cnpm install --save vue-pdf
```

#### 2. 所需页面引入 vue-pdf

我的 pdf 预览是在弹窗中展示， 根据自己的项目实际情况来展示

```
<!-- 模板代码 --！>
<div class="pdfPreview">
    <el-dialog
      :close-on-click-modal="false"
      :visible.sync="dialogVisible"
      :fullscreen="true"
      :before-close="handleClose"
      title="合同预览">
      <div class="agreement_picture">
        <div class="tools">
          <el-button @click="prePage" class="mr10"> 上一页</el-button>
          <el-button @click="nextPage" class="mr10"> 下一页</el-button>
          <span class="page">{{pageNum}}/{{pageTotalNum}} </span>
          <el-button @click="handleClose" class="mr10 fl-r btn-cancel"> 取消</el-button>
          <el-button @click="downPDF" class="mr10 dowmBtn"> 下载</el-button>
        </div>
        <pdf ref="pdf" 
          :src="src" 
          :page="pageNum"
          @page-loaded="pageLoaded($event)" 
          @num-pages="pageTotalNum=$event" 
          @error="pdfError($event)" 
          @link-clicked="page = $event">
        </pdf>
      </div>
    </el-dialog>
</div>
```

#### 3. js 代码

```
import pdf from 'vue-pdf';

export default {
  name: 'PdfPreview',
  components: {
    pdf
  },

  props: {
    dialogVisible: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      url: "http://storage.xuetangx.com/public_assets/xuetangx/PDF/PlayerAPI_v1.0.6.pdf", // pdf 地址（网上的pdf例子地址，此地址就是后端返回的真正需要预览的pdf地址）
      src: '', // 预览地址
      pageNum: 1, // 当前页码
      pageTotalNum: 1, // 总页数
    };
  },

  mounted () {
    // 有时PDF文件地址会出现跨域的情况,这里最好处理一下
    var url = this.url
    this.src = pdf.createLoadingTask(url);
  },

  methods: {
    // 上一页函数，
    prePage() {
      var page = this.pageNum
      page = page > 1 ? page - 1 : this.pageTotalNum
      this.pageNum = page
    },
    // 下一页函数
    nextPage() {
      var page = this.pageNum
      page = page < this.pageTotalNum ? page + 1 : 1
      this.pageNum = page
    },
    // 页面加载回调函数，其中e为当前页数
    pageLoaded(e) {
      this.curPageNum = e
    },
    // 抛出错误的回调函数。
    pdfError(error) {
      console.error(error)
    },
    downPDF() { // 下载 pdf
				var url = this.url
				var tempLink = document.createElement("a");
				tempLink.style.display = "none";
				tempLink.href = url;
				tempLink.setAttribute("download", 'XXX.pdf');
				if (typeof tempLink.download === "undefined") {
					tempLink.setAttribute("target", "_blank");
				}
				document.body.appendChild(tempLink);
				tempLink.click();
				document.body.removeChild(tempLink);
        this.handleClose();
			},
    handleClose() {
      this.$emit('update:dialogVisible', false);
    }
  }
};
```

效果预览  
 ![在这里插入图片描述](https://green-mouse-f903.heqing299-328.workers.dev/posts/vue-pdf-预览下载功能-vue-pdf-115443136/f0ff317bfb81b2d2.png)  
 如果对你有所帮助，欢迎大家留言交流！
