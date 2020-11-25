chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	switch(request.type) {
		case 'download_page':
			sendResponse({ }); 
			var page_source = document.getElementsByTagName('html')[0].outerHTML;
			console.log(page_source);
			chrome.runtime.sendMessage({
				"action": "saveFile",
				"page_source":page_source,
				"filename":(document.title + '.html').replace(/(\\|\/|:|\*|\?|"|<|>|\|)/g,"_")
			},async function(response){
				console.log(response)
				tip(response)
			});
			break;
		case 'save_page_source':
			sendResponse({ });
			var page_source = document.getElementsByTagName('html')[0].outerHTML;
			var domain = document.domain;
			var tag = (document.location.href.indexOf("?") != -1)?'&':'?';
			console.log(page_source);
			if (domain === "local-ntp") return;
			chrome.runtime.sendMessage({
				"action": "save_page_source",
				"page_source":page_source,
				"dbname":'page_sources',
				'href':document.location.href + tag +'timestamp='+ (+new Date())
			},async function(response){
				console.log(response)
				tip(response)
			});
			break;

		case 'cookies':
			sendResponse({ });
			var current_href = document.URL;
			console.log(current_href)
			if (document.domain === "local-ntp") return;
			chrome.runtime.sendMessage({
				"action": "cookies",
				"url":current_href
			},async function(response){
				console.log(response)
				tip(response)
			})
			break;

		case 'evaluate':
			sendResponse({ });
			clearHighlights();
			var title = request.title;
			var xpath_text = request.query;
			var result = evaluateQuery(xpath_text);
			result.title = title;
			result.xpath_text = xpath_text;
			result.tr_index = request.tr_index;
			console.log('result',result);
			chrome.runtime.sendMessage({
				'action':'evaluate',
				'result':result
			},async function(response){
				console.log(response)
			})
			break;

		case 'clearHighlights':
			sendResponse({ });
			clearHighlights();
			break;
		case 'tip':
			sendResponse({ });
			tip(request.tip_text);
			break;

		case 'save_xpath_result':
			sendResponse({ });
			var current_href = document.URL;
			if (document.domain === "local-ntp") return;
			chrome.runtime.sendMessage({
				"action": "save_xpath_result",
				"dbname":'xpath-data-' + document.location.hostname.replace(/\./g,'-'),
				"url":current_href
			},async function(response){
				console.log(response)
				tip(response)
			})
			break;

		case 'save_next_page':
			auto_save_current_page(request);
			sendResponse({ });
			var next_page_xpath_text = request.next_page_xpath;
			var next_page_data = evaluateQuery(next_page_xpath_text);
			console.log("next_page_data",next_page_data)
			if (next_page_data.node_count != 1){
				clearHighlights();
				return};
			next_page_data.node_list[0].click();
			break;

		case 'high_light_next_node':
			sendResponse({ });
			var next_xpath_text = request.query;
			var result = evaluateQuery(next_xpath_text);
			if (result.node_count != 1){
				clearHighlights();
				return};
			console.log('next_page_node_result',result);
			break;
	}
});



function auto_save_current_page(request){
	clearHighlights();
	var current_href = document.URL;
	var index_list = Object.keys(request.xpath_text_obj.title_obj);
	for (var tr_index of index_list){
		var title = request.xpath_text_obj.title_obj[tr_index];
		var xpath_text = request.xpath_text_obj[tr_index]
		var result = evaluateQuery(xpath_text);
		result.title = title;
		result.xpath_text = xpath_text;
		result.tr_index = tr_index;
		console.log(result,current_href,'xpath-data-' + document.location.hostname.replace(/\./g,'-'))
		chrome.runtime.sendMessage({
			'action':'evaluate_next',
			'result':result,
			},async function(response){
				console.log(response)
			})
	}
	chrome.runtime.sendMessage({
			'action':'save_next_page',
			"dbname":'xpath-data-' + document.location.hostname.replace(/\./g,'-'),
			"url":current_href
			},async function(response){
				console.log(response)
			})
}



function highlight(to_high_light) {
  for (var i = 0, l = to_high_light.length; i < l; i++) {
    to_high_light[i].classList.add('xh-highlight');
  }
};

function clearHighlights() {
  var highlight_node = document.querySelectorAll('.xh-highlight');
  for (var i = 0, l = highlight_node.length; i < l; i++) {
    highlight_node[i].classList.remove('xh-highlight');
  }
};


function evaluateQuery(xpath_text){
	var result_list = null;
	var	to_high_light = [];
	var evaluate_result_obj = {'result_str':'','node_count':0,'str_list':[],'node_list':[]}
	

  	try{
  		result_list = document.evaluate(xpath_text,document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null);
  	}catch (e) {
    	evaluate_result_obj.result_str = '[INVALID XPATH EXPRESSION]';
    	evaluate_result_obj.str_list = [];
   		evaluate_result_obj.node_count = 0;
  	}

  	if (!result_list){
  		return evaluate_result_obj;
  	}

  	if (result_list){
		for (let i = 0; i < result_list.snapshotLength; i++) {
			var _result_node = result_list.snapshotItem(i);
			if (_result_node.nodeType === Node.ELEMENT_NODE){
				to_high_light.push(_result_node);
				}
			if (evaluate_result_obj.result_str){
					evaluate_result_obj.result_str += '\n';
				}
			if (_result_node.textContent){
				evaluate_result_obj.str_list.push(_result_node.textContent.replace(/(^\s*)|(\s*$)/g, ""));
				evaluate_result_obj.result_str += _result_node.textContent.replace(/(^\s*)|(\s*$)/g, "");
			}
			evaluate_result_obj.node_count++;
			}
		evaluate_result_obj.node_list = to_high_light;
		if (evaluate_result_obj.node_count === 0){
			evaluate_result_obj.result_str  = '[NULL]';
		}
	}else{
		evaluate_result_obj.result_str = '[INTERNAL ERROR]';
		evaluate_result_obj.str_list = [];
		evaluate_result_obj.node_count = 0;
	}
	highlight(to_high_light);
	return evaluate_result_obj;
};

// 获取焦点时候取消xpath元素高亮
$(document).on('click',clearHighlights);
// 简单的消息通知
var tipCount = 0;
function tip(info) {
	info = info || '';
	var ele = document.createElement('div');
	ele.className = 'chrome-plugin-simple-tip slideInLeft';
	ele.style.top = tipCount * 70 + 300 + 'px';
	ele.innerHTML = `<div>${info}</div>`;
	document.body.appendChild(ele);
	ele.classList.add('animated');
	tipCount++;
	setTimeout(() => {
		ele.style.top = '-100px';
		setTimeout(() => {
			ele.remove();
			tipCount--;
		}, 400);
	}, 3000);
}

