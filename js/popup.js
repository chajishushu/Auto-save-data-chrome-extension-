function init_popul(options){
		let {db_type, get_data_type, PouchDBIp, PouchDBPort, auto_next_page_save, auto_next_page_interval, disable_load_img} = options;
		if (db_type === 'local'){
			$(`input[name="save_db"]`).eq(0).prop("checked","checked");
		}else if (db_type === 'couchdb'){
			$(`input[name="save_db"]`).eq(1).prop("checked","checked");
		}

		if (get_data_type === 'xpath'){
			$(`input[name="save_type"]`).eq(0).prop("checked","checked");
			radioHandle(1);
		}else if(get_data_type === 'page_source'){
			$(`input[name="save_type"]`).eq(1).prop("checked","checked");
			radioHandle(2);
		}else if(get_data_type === 'cookies'){
			$(`input[name="save_type"]`).eq(2).prop("checked","checked");
			radioHandle(3);
		}
	}

function change_sync_option(opthon_obj){
	chrome.storage.sync.set(opthon_obj,()=>{
			console.log("修改配置选项")
		})
}

function change_save_db(options,signal){
	var pouchdb_options;
	switch(signal) {
		case "存储数据到local":
			pouchdb_options = {db_type:'local',PouchDBIp:null,PouchDBPort:null};
			options.db_type ='local';
			options.PouchDBIp = null;
			options.PouchDBPort = null;
			break;
		case "存储数据到couchdb":
			pouchdb_options = {db_type:'couchdb',PouchDBIp:'localhost',PouchDBPort:5984};
			options.db_type ='couchdb';
			options.PouchDBIp = 'localhost';
			options.PouchDBPort = 5984;
			break;
		}
	change_sync_option(pouchdb_options)
}

function radioHandle(num){
		if(num == 1){
			document.getElementById('xpath_info').style.display = 'flex'
			document.getElementById('next_page_info').style.display = 'flex'
		}else if(num == 2){
			document.getElementById('xpath_info').style.display = 'none'
			document.getElementById('next_page_info').style.display = 'flex'
		}else if(num ==3){
			document.getElementById('xpath_info').style.display = 'none'
			document.getElementById('next_page_info').style.display = 'none'
		}
	}

function change_save_type(options,signal){
	var pouchdb_options;
	switch(signal) {
		case "存储xpath":
			pouchdb_options = {get_data_type:'xpath'};
			options.get_data_type = 'xpath';
			radioHandle(1)
			break;
		case "存储整页":
			pouchdb_options = {get_data_type:'page_source'};
			options.get_data_type = 'page_source';
			radioHandle(2)
			break;
		case "存储cookies":
			pouchdb_options = {get_data_type:'cookies'};
			options.get_data_type = 'cookies';
			radioHandle(3)
			break;
	}
	change_sync_option(pouchdb_options)
}


function render_result(result){
	$('#result_info textarea').eq(0).val(result.result_str);
	$('#node-count').text(result.node_count)
}


function checkError()
{
    if (chrome.runtime.lastError == null) ;
    else if (chrome.runtime.lastError.message == "Could not establish connection. Receiving end does not exist.") ;  /* Chrome & Firefox - ignore */
    else if (chrome.runtime.lastError.message == "The message port closed before a response was received.") ;  /* Chrome - ignore */
    else if (chrome.runtime.lastError.message == "Message manager disconnected") ;  /* Firefox - ignore */
    else console.log("auto save page - " + chrome.runtime.lastError.message);
}


//给所有xpath input框绑定事件
function xpath_bind_Event(){
	for (var i = 0 ; i < $('#query_info').find('tr').size();i++){
		$('#query_info').find('tr').eq(i).find('td:eq(1)').on('keyup mouseup',function(e){
			var title = $(e.target).parents('tr').find('td:eq(0) input').val();
  			sendMessageToContentScript({
			    type: 'evaluate',
			    tr_index:$(e.target).parents('tr').index(),
			    query: e.target.value,
			    title: title
		  		});
			});
		$('#query_info').find('tr').eq(i).find('td:eq(1) input').on('blur',function(){
			sendMessageToContentScript({type:'clearHighlights'});
			});
	}
}



//给add_button 添加增加tr,绑定各种事件等
function add_button_func() {
		// console.log(tab1)
		var tr = document.createElement('tr')
		var td1 = document.createElement('td')
		var td2 = document.createElement('td')
		var td3 = document.createElement('td')
		var label1 = document.createElement('label')
		var label2 = document.createElement('label')
		var label3 = document.createElement('label')
		var but1   = document.createElement('button')
		var span1 = document.createElement('span')
		var span2 = document.createElement('span')
		var input1 = document.createElement('input')
		var input2 = document.createElement('input')



		span1.innerHTML = 'key:'
		span2.innerHTML = 'xpath:'
		input1.className = 'data_name'
		input1.placeholder = '请输入信息名称'
		input2.className = 'xpath'
		input2.placeholder = '请输入xpath路径'
		but1.innerText='删除'
		but1.className="delete_class"
		label1.appendChild(span1)
		label1.appendChild(input1)
		label2.appendChild(span2)
		label2.appendChild(input2)
		label3.appendChild(but1)
		td1.appendChild(label1)
		td2.appendChild(label2)
		td3.appendChild(label3)
		tr.appendChild(td1)
		tr.appendChild(td2)
		tr.appendChild(td3)
		tab1.appendChild(tr)
		textarea1.style.height = ( textarea1.offsetHeight + 20 ) + 'px';
		$('#xpath-count').text($('#query_info').find('tr').size());
		xpath_bind_Event();
		del_bind_func();
	}


// 给所有的delete_btn 绑定删除tr元素事件
function del_bind_func(){
	var delete_btn = document.getElementsByClassName("delete_class");
	for (var i=0;i<delete_btn.length;i++){
		delete_btn[i].onclick=function(){
			this.parentNode.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode.parentNode)
			textarea1.style.height = ( textarea1.offsetHeight + 0 - 30 ) + 'px';
			$('#xpath-count').text($('#query_info').find('tr').size());

		}
	};
}

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
		chrome.tabs.sendMessage(parseInt(current_tab_id), message, checkError);
	});
}

function change_title(){
	chrome.tabs.query({active: true, currentWindow: true},function(tabs){
		var SearchParams = new window.URL(tabs[0].url).search;
		var {current_tab_id,current_tab_url} = getSearchParams(SearchParams);
		var host = new window.URL(window.decodeURIComponent(current_tab_url)).hostname;
		$('title').text(host);
	});
}

$(function() {
	const bgp = chrome.extension.getBackgroundPage();
	init_popul(bgp.current_options);
	change_title();

	$(`#_save_db input[name="save_db"]`).click(function(){
		change_save_db(bgp.current_options,$(this).val())
	});
	$(`#_save_type input[name="save_type"]`).click(function(){
		change_save_type(bgp.current_options,$(this).val())
	});

	$(`#the_save_button`).on('click',function(){
		switch(bgp.current_options.get_data_type) {
			case "xpath":
				sendMessageToContentScript({type:'save_xpath_result'})
				break
			case "page_source":
				sendMessageToContentScript({type:'save_page_source'})
				break;
			case "cookies":
				sendMessageToContentScript({type:'cookies'})
				break;
		}
		
	});

	$('#next_page_xpath').on('keyup mouseup',function(e){
		sendMessageToContentScript({
			    type: 'high_light_next_node',
			    query: e.target.value
		  		});
	})

	var save_next_page_interval = null;
	$('#next_page_button').on('click',function(){
		if (save_next_page_interval){clearInterval(save_next_page_interval)};
		save_next_page_interval = setInterval(save_next_page, 2500);
	});

	function save_next_page(){
		sendMessageToContentScript({type:'tip',tip_text:'开启自动翻页爬取数据!!!'})
		sendMessageToContentScript({type:'save_next_page','xpath_text_obj':bgp.xpath_text_obj,'next_page_xpath':$('#next_page_xpath').val()})
	}

	$('#stop_next_button').on('click',function(){
		clearInterval(save_next_page_interval);
		sendMessageToContentScript({type:'tip',tip_text:'关闭自动翻页爬取!!!'})
	});

	document.getElementById('add_button').addEventListener('click',add_button_func);
	//先增加一行tr 并给所有input xpath绑定事件
	add_button_func();


	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	switch(request.action){
		case 'evaluate':
			console.log("request.result",request.result);
			bgp.xpath_results_obj = request.result;
			var title = bgp.xpath_results_obj.title ;
			var tr_index = bgp.xpath_results_obj.tr_index;
			var xpath_text = bgp.xpath_results_obj.xpath_text;
			console.log('tr_index',tr_index);
			if(title.trim()){ 
				bgp.xpath_couchdb_obj.title_obj[tr_index] = title;	
				bgp.xpath_couchdb_obj[tr_index] = bgp.xpath_results_obj.str_list;
				bgp.xpath_text_obj[tr_index] = xpath_text;
				bgp.xpath_text_obj.title_obj[tr_index] = title;
			};
			render_result(request.result)
			sendResponse('Results显示xpath成功!');
			break;
		}
	})

});
