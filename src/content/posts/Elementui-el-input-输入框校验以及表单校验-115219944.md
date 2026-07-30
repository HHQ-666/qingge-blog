---
title: "Elementui el-input 输入框校验以及表单校验"
published: 2021-03-25
image: /media/uploads/covers/vue.png
description: "汇总 ElementUI el-input 与表单校验的常用正则与实践，覆盖数字、整数、手机号等日常输入限制。"
tags: ["vue.js", "前端"]
category: "Vue"
draft: false
lang: "zh_CN"
---
> 本文同步自 [CSDN · 清阿哥](https://blog.csdn.net/weixin_44980732/article/details/115219944)，原文发布于 2021-03-25。

#### 一. 常用的 element-ui el-input 输入框

##### 1. 过滤字母e，在js中属于数字，但是正则匹配 \d 是拦不住字母e 的

```
<el-input type="number" placeholder="请输入" min="1" onKeypress="return (/[\d]/.test(String.fromCharCode(event.keyCode || event.which))) || event.which === 8" v-model.number="count"></el-input>
```

##### 2. 只能输入正整数

```
<el-input type="number" placeholder="请输入" min="1" oninput ="value=value.replace(/[^\d]/g,'')"  v-model.number="count"></el-input>
```

##### 3. 只允许输入数字和小数 / 数字和空格

```
oninput ="value=value.replace(/[^0-9.]/g,'')"
oninput ="value=value.replace(/^[\d\s]+$/g,'')"
```

#### 4. 只允许输入正整数且不能以0开头

```
方法-：
<el-input
  v-model="scope.row.weight"
  oninput="value = Number(value) || 0"
>
方法二：
<el-input
  v-model="scope.row.weight"
  oninput="value=value.replace(/\D|^0/g, '')"
>
方法三：
<el-input
  v-model="scope.row.weight"
  oninput="value=value.replace(/[^\d]|^[0]/g, '')"
>
```

##### 4. 允许输入小数点后几位

```
// 保留一位小数
oninput="if(isNaN(value)) { value = parseFloat(value) } if(value.indexOf('.')>0){value=value.slice(0,value.indexOf('.')+2)}" 
 
// 若需要保留N位小数，则把 2 改为 1 + n即可
```

##### 5. 设置范围，最大值，最小值

```
<el-input min="0" max="100" type="number" @input="numberChange($event, 100)" @change="numberChange($event, 100)" onKeypress="return (/[\d]/.test(String.fromCharCode(event.keyCode || event.which))) || event.which === 8" v-model.number="count"></el-input> 

numberChange (val, max) {
   this.$nextTick(() => {
      this.count = Math.min(parseInt(val), max)
    })
}
```

##### 6. form 表单中校验输入框只能输入数字和两位小数

```
rules: {
        giveHour: [
          { required: true, message: '请输入客户退费金额', trigger: 'blur' },
          { pattern: /(^[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/, message: '请输入正确额格式,可保留两位小数' }
        ]
      }
```

#### 7. 禁止 / 只允许 输入中文

```
onkeyup="this.value=this.value.replace(/[\u4E00-\u9FA5]/g,'')"
onkeyup="value=value.replace(/[^\u4E00-\u9FA5]/g,'')"
```

#### 8. 只允许输入数字和英文

```
<el-input
	 v-model.trim="form.userNumber"
	 placeholder="请输入用户编号"
	 clearable
	 onkeyup="this.value=this.value.replace(/[^\w]/g,'')"
></el-input>
```

#### 9. 禁止输入特殊字符

```
<el-input oninput="this.value=this.value.replace(/[^u4e00-u9fa5w]/g,'')"></el-input>
```

#### 10. 只允许输入英文

```
<el-input oninput = "value=value.replace(/[^\a-\z\A-\Z]/g,'')"></el-input>
```

#### 11. 常见表单校验

> 校验方法可以封装到 util.js 里面

```
// utils.js

// 全局函数
export function validateMobile(str) {
  // 检查手机号码格式
  return /^((13[0-9])|(14[5-9])|(15([0-3]|[5-9]))|(16[6-7])|(17[1-8])|(18[0-9])|(19[1|3])|(19[5|6])|(19[8|9]))\d{8}$/.test(
    str,
  );
}

export function validateEmail(str) {
  // 检查邮箱格式
  return /^([A-Za-z0-9_\-.])+@([A-Za-z0-9_\-.])+\.([A-Za-z]{2,4})$/.test(str);
}

export function validateBankCard(str) {
  // 检查银行卡
  return /^[1-9]\d{9,29}$/.test(str);
}

export function validatePhone(str) {
  // 检查电话格式
  return /^(0\d{2,4}-)?\d{8}$/.test(str);
}

export function validateQQ(str) {
  // 检查QQ格式
  return /^[1-9][0-9]{4,}$/.test(str);
}

// 检查验证码格式
export function validateSmsCode(str) {
  return /^\d4$/.test(str);
}
// 校验 URL
export function validURL(url) {
  const reg =
    /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/
  return reg.test(url)
}

// 校验特殊字符
export function specialCharacter(str) {
  const reg = new RegExp(
    // eslint-disable-next-line quotes
    "[`~!@#$^&*()=|{}':;',\\[\\]<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？ ]"
  )
  return reg.test(str)
}
```

#### 12. 输入非数字组合(登录账号6-16位)

```
// 非纯数字非纯字母 /^(?![0-9]+$)[0-9A-Za-z|a-zA-Z]{6,16}$/
    let userNameReg = /^(?![0-9]+$)[0-9A-Za-z|a-zA-Z]{6,16}$/;
      if (!userNameReg.test(form.userName)) {
        this.$message.warning('请输入6-16位的非纯数字登录账号~');
        return false;
      }
```

#### 13. 设置密码校验(限制输入 8-20位 数字 字母 特殊符号任意两种类型组合)

```
  let passwordReg = /^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?!([^(0-9a-zA-Z)])+$).{8,20}$/;
  if (!passwordReg.test(form.password)) {
      this.$message.warning('请输入正确的密码格式~');
      return false;
    }
```

#### 13. 只允许输入中文，英文，数字 / 空格 / 小数点

```
<el-input oninput = "value=value.replace(/[^\a-\z\A-\Z0-9\u4E00-\u9FA5]/g,'')"></el-input>
<el-input oninput = "value=value.replace(/[^\a-\z\A-\Z0-9\u4E00-\u9FA5\ ]/g,'')"></el-input>
<el-input oninput = "value=value.replace(/[^\a-\z\A-\Z0-9\u4E00-\u9FA5\.]/g,'')"></el-input>
```

#### 14. 空格校验

```
// 去除所有的空格：
<el-input oninput = "value=value.replace(/\s*/g,"")"></el-input>

// 去除两头的空格：
方法一：<el-input oninput = "value=value.replace(/^\s*|\s*$/g,"")"></el-input>
方法二：<el-input v-model.trim=""></el-input>

// 去除左侧的空格：
<el-input oninput = "value=value.replace(/^\s*/g,"")"></el-input>
　　
// 去除右侧的空格：
<el-input oninput = "value=value.replace(/(\s*$)/g,"")"></el-input>
```

> Tips: 最近测试给提了个bug，window 系统电脑，使用 oninput 方法进行输入框正则校验，如果疯狂进行输入的话会出现当前输入框的双向绑定失效，导致输入框无法正常输入值。这时候推荐使用 @input 方法可以避免这个方法，还有一个办法是失焦的时候重新进行一次赋值操作也可以解决。mac系统没有出现这个问题…

**持续更新中，欢迎大家留言交流！**
