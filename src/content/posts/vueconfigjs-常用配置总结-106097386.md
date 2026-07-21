---
title: "vue.config.js 常用配置总结"
published: 2020-05-13
description: "总结 vue.config.js 常用配置项，覆盖代理、打包、别名等日常开发高频设置。"
tags: ["vue.js"]
category: "Vue"
draft: false
lang: "zh_CN"
---
> 本文同步自 [CSDN · 清阿哥](https://blog.csdn.net/weixin_44980732/article/details/106097386)，原文发布于 2020-05-13。

**第一次写博客，哈哈哈。。。**

#### 1. publicPath

**部署应用包时的基本 URL**

```
publicPath:' ' 或者 publicPath:'./'
```

#### 2. outputDir

**打包生成文件出口**

```
outputDir: 'dist'
```

#### 3. asstsDir

**放置生成的静态资源 (js、css、img、fonts) 的 (相对于 outputDir 的) 目录。**

#### 3. indexPath

**指定输出路径 相当于outputDir，绝对路径**

```
idnexPath: 'index.htnl'
```

#### 4. filenameHashing

*无法使用 Vue CLI 生成的 index HTML，你可以通过将这个选项设为 false 来关闭文件名哈希*

#### 5. pages

```
module.exports = {
  pages: {
    index: {
      // page 的入口
      entry: 'src/index/main.js',
      // 模板来源
      template: 'public/index.html',
      // 在 dist/index.html 的输出
      filename: 'index.html',
      // 当使用 title 选项时，
      // template 中的 title 标签需要是 <title><%= htmlWebpackPlugin.options.title %></title>
      title: 'Index Page',
      // 在这个页面中包含的块，默认情况下会包含
      // 提取出来的通用 chunk 和 vendor chunk。
      chunks: ['chunk-vendors', 'chunk-common', 'index']
    },
    // 当使用只有入口的字符串格式时，
    // 模板会被推导为 `public/subpage.html`
    // 并且如果找不到的话，就回退到 `public/index.html`。
    // 输出文件名会被推导为 `subpage.html`。
    subpage: 'src/subpage/main.js'
  }
}
```

#### 6. lintOnSave

**开发环境下通过 eslint-loader 在每次保存时 lint 代码**

```
lintOnSave: 'warning' / 'true' 
将 lint 错误输出为编译警告。默认情况下，警告仅仅会被输出到命令行，且不会使得编译失败
module.exports = {
  devServer: {
    overlay: { // 同时显示警告和错误
      warnings: true,
      errors: true
    }
    // 生产环境禁用
    module.exports = {
  lintOnSave: process.env.NODE_ENV !== 'production'
	}
	// 或者
	lintOnSave: 'false'
  }
}
```

#### 7. productionSourceMap

*如果你不需要生产环境的 source map，可以将其设置为 false 以加速生产环境构建*

```
// 默认
productionSourceMap: true
```

#### 8. css.extract

*Default: 生产环境下是 true，开发环境下是 false*

#### 9. devServer.proxy

*解决前端跨域*

```
// vue.config.js 文件
module.exports = {
  devServer: {
proxy: {
      '/api': {
        target: 'http://192.168.30.31:30010', //接口请求的地址
        changeOrigin: true, // 表示是否跨域
        // ws: true,//websocket支持
        secure: false,
        pathRewrite: {
          '^/api': '', // 将'/api' 重写为'',这里用'/api'代替target里面的地址,再接口其前面加上 /api
        }, // 例如 请求的路径是 'http://xxxx:30010/chargingpile-app/charging_pile_user/login' 组件中可以写成 '/api/charging_pile_user/login'
      		 },
    	},
	}
};
```

#### 10. 出现的问题

```
// 如果加上这段代码启动项目后的Local和Network地址都会变成Local的地址，删除这行代码即可恢复正常
devServer: {
   host: "localhost",
}
```
