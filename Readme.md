第一步(下载并安装CouchDB):

https://couchdb.apache.org/#download

测试：

于CMD下，执行 curl localhost:5984

打开 http://localhost:5984/_utils/fauxton/ 或 http://localhost:5984/_utils/ 以进入 CouchDB界面

第二步(Set _utilsp CORS 用于跨域):

安装：于CMD下，执行 npm install -g add-cors-to-couchdb
运行：于CMD下，执行 add-cors-to-couchdb


首先需要按照以上步奏安装好couchdb环境并开启跨域  插件目前只写了最基础功能 最近思维有点混乱且精力有限(自己是个菜鸡) 如果有感兴趣的大佬可以在我的基础上更新迭代 造福大家哈哈

快捷键 : ctrl+shift+z 存储cookies  ctrl+shift+a 存储整页  

右键菜单几个功能可以自行测试 

目前支持两种存储方式  数据存储到本地 和存储到couchdb   现阶段只支持couchdb查看 local 是为了将来生成excel表格功能预留的   但是目前处于原始开发阶段  暂时没有太大用.

选择couchdb原因 是这个数据库支持py等多种语言访问读取  可以自己写脚本 转入其他插件 而且插件本身支持http读取  因为插件是纯前端环境,因此在写插件时候不需要再单独写个api,降低使用插件难度.
