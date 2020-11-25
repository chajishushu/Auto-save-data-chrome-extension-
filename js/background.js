chrome.browserAction.onClicked.addListener(function(current_tab){
	if ((current_tab.url).indexOf(`chrome://`) !== -1){
		alert('本页不可使用插件');
		return;
	}
	window.open(chrome.extension.getURL("popup.html?current_tab_id=" + encodeURIComponent(current_tab.id) + '&current_tab_url=' + encodeURIComponent(current_tab.url)), "Auto Saver", "toolbar=0,scrollbars=0,location=0,statusbar=0,menubar=0,resizable=1,width=740,height=550")

})

var current_options = {};
var default_options = {
	db_type:'local',
	get_data_type:'page_source',
	PouchDBIp:null,
	PouchDBPort:null,
	auto_next_page_save:false,
	auto_next_page_interval:1,
	disable_load_img:false
}

var xpath_results_obj = null;
var xpath_couchdb_obj = {title_obj:{}};
var xpath_text_obj = {title_obj:{}};



chrome.runtime.onInstalled.addListener(function (details){
	if (details.reason === 'install' || details.reason === 'update' ){

		chrome.storage.sync.set(default_options,()=>{
			console.log("初始化选项成功")
		})
	}
})


// 获取 storage.sync 保存的所有设置
chrome.storage.sync.get(Object.keys(default_options),(items)=>{
			current_options = items;
		});



// 设置右键菜单快捷键操作

chrome.contextMenus.create({
	type: "normal",
	title: "保存网页内容到couchdb",
	onclick: function(){
		sendMessageToContentScript({type:'save_page_source'})
	}
});


chrome.contextMenus.create({
	type: "normal",
	title: "保存cookies到couchdb",
	onclick: function(){
		sendMessageToContentScript({type:'cookies'})
	}
});

chrome.contextMenus.create({
	type: "normal",
	title: "测试跨域",
	onclick: function(){
		var url = `http://${current_options.PouchDBIp}:${current_options.PouchDBPort}/sitemap-data-baidu/_all_docs?include_docs=true`;
		alert(url);
	}
});


chrome.contextMenus.create({
	type: "normal",
	title: "下载html文件",
	onclick: function(){
		sendMessageToContentScript({type:'download_page'})
	}
});


// 监听快捷键操作

chrome.commands.onCommand.addListener(command=>{
	console.log('Command:', command)
	switch(command) 
	{
		case "save_page_source":
			sendMessageToContentScript({type:'save_page_source'})
			break;
		case "save_page_cookies":
			sendMessageToContentScript({type:'cookies'})
			break;
	}
})




chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	var current_db_type = current_options.db_type;
	switch(request.action){
		case 'saveFile':
			console.log(request.page_source);
			saveFile(request);
			sendResponse('下载页面到本地成功!');
			break;
		case 'save_page_source':
			console.log(request.page_source);
			save_page_source(request);
			sendResponse(`保存网页内容到${current_db_type}成功!`);
			break;
		case 'cookies':
			console.log(`获取网站${request.url}的cookies`);
			save_page_cookies(request);
			sendResponse(`保存网页cookies到${current_db_type}成功!`);
			break;
		case 'save_xpath_result':
			console.log(`通过xpath保存网站${request.url}的信息`)
			save_xpath_result(request);
			sendResponse(`通过xpath获取网站信息到${current_db_type}成功!`);
			break;
		case 'evaluate_next':
			console.log("request.result",request.result);
			xpath_results_obj = request.result;
			var title = xpath_results_obj.title ;
			var tr_index = xpath_results_obj.tr_index;
			var xpath_text = xpath_results_obj.xpath_text;
			console.log('tr_index',tr_index);
			if(title.trim()){ 
				xpath_couchdb_obj.title_obj[tr_index] = title;	
				xpath_couchdb_obj[tr_index] = xpath_results_obj.str_list;
			};
			console.log("xpath_couchdb_obj",xpath_couchdb_obj,"xpath_text_obj",xpath_text_obj)
			sendResponse('Results显示xpath成功!');
			break;
		case 'save_next_page':
			console.log("xpath_text_obj",xpath_text_obj);
			save_xpath_result(request)
			sendResponse('打印xpath_text_obj');
			break;
	}
});



function checkError()
{
    if (chrome.runtime.lastError == null) ;
    else if (chrome.runtime.lastError.message == "Could not establish connection. Receiving end does not exist.") ;  /* Chrome & Firefox - ignore */
    else if (chrome.runtime.lastError.message == "The message port closed before a response was received.") ;  /* Chrome - ignore */
    else if (chrome.runtime.lastError.message == "Message manager disconnected") ;  /* Firefox - ignore */
    else console.log("auto save page - " + chrome.runtime.lastError.message);
};

var getSearchParams = function(search) {
  var paramPart = search.substr(1).split('&');
  return paramPart.reduce(function(res, item) {
    parts = item.split('=');
    res[parts[0]] = parts[1];
    return res;
  }, {});
}


function sendMessageToContentScript(message)
{
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
	{
		var SearchParams = new window.URL(tabs[0].url).search;
		var {current_tab_id,current_tab_url} = getSearchParams(SearchParams);
		console.log('current_tab_id',current_tab_id)
		chrome.tabs.sendMessage(parseInt(current_tab_id) || tabs[0].id, message, checkError);
	});
}

function download_file(page_source,filename){
	var blob = new Blob(["\ufeff", page_source],{encoding:"UTF-8",type:"text/html;charset=utf-8"});
	var options = {
		url:URL.createObjectURL(blob),
		filename:filename
	};
	chrome.downloads.download(options)
}


function saveFile(request){
	download_file(request.page_source,request.filename);
}

function save_page_source(request){

	var url = (current_options.PouchDBIp&&current_options.PouchDBPort)?`http://${current_options.PouchDBIp}:${current_options.PouchDBPort}/${request.dbname}`:request.dbname;
	var db = new PouchDB(url);

	var doc = {
		_id: request.href,
	  	"name": "page_source",
	  	"content":request.page_source
	};
	db.put(doc);

}

function save_page_cookies(request){
	var url = (current_options.PouchDBIp&&current_options.PouchDBPort)?`http://${current_options.PouchDBIp}:${current_options.PouchDBPort}/cookies`:'cookies';
	var db = new PouchDB(url);

	chrome.cookies.getAll({url:request.url},(cookies_obj)=>{
		console.log(cookies_obj);
		let cookies = cookies_obj.map((item)=>{
			return item.name + "=" + item.value
		}).join("; ");
		var doc = {
			_id: request.url,
			"name": "cookies",
			"content":cookies
		};
		console.log(doc)
		db.put(doc).then((resp)=>{
			console.log(resp)
		}).catch((error)=>{
			if (error.status == 409){
				db.get(doc._id).then((_redoc)=>{
					doc._rev = _redoc._rev;
					console.log(doc)
					db.put(doc)
				})
			}
		})

	})
}

function save_xpath_result(request){
	console.log('xpath_results_obj',xpath_results_obj);
	console.log('xpath_couchdb_obj',xpath_couchdb_obj);
	console.log('request',request);
	console.log('xpath_text_obj',xpath_text_obj);

	if(Object.keys(xpath_couchdb_obj.title_obj).length === 0 || Object.keys(xpath_text_obj).length === 0){
		sendMessageToContentScript({type:'tip',tip_text:'title或者xpath为空,请重新输入!'});
		return;
	};
	var url = (current_options.PouchDBIp&&current_options.PouchDBPort)?`http://${current_options.PouchDBIp}:${current_options.PouchDBPort}/${request.dbname}`:request.dbname;
	console.log(url);
	var db = new PouchDB(url);
	var tag = (request.url.indexOf("?") != -1)?'&':'?';
	var unqiue_singal = window.escape(window.btoa(window.encodeURIComponent(Object.values(xpath_couchdb_obj.title_obj).join())));
	var data_id = request.url + tag + 'unqiue_singal=' + unqiue_singal;

	var doc = xpath_couchdb_obj;
	doc._id = data_id;
	console.log(doc)

	db.put(doc).then((resp)=>{
		console.log('then',resp)
	}).catch((error)=>{
		if (error.status == 409){
			db.get(doc._id).then((_redoc)=>{
				doc._rev = _redoc._rev;
				console.log('catch',doc);
				db.put(doc);
			})
		}
	})

	xpath_couchdb_obj = {title_obj:{}};
}