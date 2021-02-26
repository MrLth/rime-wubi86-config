# Rime 输入法配置指南

### 参考文章和链接

Rime下载：https://rime.im/download/

wubi 词库及配置：https://github.com/KyleBing/rime-wubi86-jidian

搜狗词库：https://pinyin.sogou.com/dict/cate/index/96

词库转换工具：http://tools.bugscaner.com/sceltotxt/

window10 输入法主题： https://github.com/danvim/rime-theme-windows10



### 用户扩展词库生成思路

1. 去搜狗词库下载需要的词库
2. 通过在线工具将词库转为可编辑查看的文本格式
3. 通过 javaScript 脚本过滤和生成对应词库

1. 1. cd script 移动到 script 目录下
   2. 将通过在线工具转换的文本格式文件重命名为 1.txt 保存在此目录下
   3. node translate.js 生成词库
   4. 将生成的 output.txt 内的内容复制到 wubi86_jidian_user.dict.yaml 文件内
   5. 重新部署 Rime