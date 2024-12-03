var ReResMap = [];
var typeMap = {
    "txt"   : "text/plain",
    "html"  : "text/html",
    "css"   : "text/css",
    "js"    : "text/javascript",
    "json"  : "text/json",
    "xml"   : "text/xml",
    "jpg"   : "image/jpeg",
    "gif"   : "image/gif",
    "png"   : "image/png",
    "webp"  : "image/webp"
}

// 存储每个标签页的激活规则
const tabActiveRules = new Map();

function getLocalStorage() {
    ReResMap = window.localStorage.ReResMap ? JSON.parse(window.localStorage.ReResMap) : ReResMap;
}

function getLocalFileUrl(url) {
    var arr = url.split('.');
    var type = arr[arr.length-1];
    var xhr = new XMLHttpRequest();
    xhr.open('get', url, false);
    xhr.send(null);
    var content = xhr.responseText || xhr.responseXML;
    if (!content) {
        return false;
    }
    content = encodeURIComponent(
        type === 'js' ?
        content.replace(/[\u0080-\uffff]/g, function($0) {
            var str = $0.charCodeAt(0).toString(16);
            return "\\u" + '00000'.substr(0, 4 - str.length) + str;
        }) : content
    );
    return ("data:" + (typeMap[type] || typeMap.txt) + ";charset=utf-8," + content);
}

function updateBadgeForTab(tabId) {
    const activeRules = tabActiveRules.get(tabId);
    const count = activeRules ? activeRules.size : 0;
    
    chrome.browserAction.setBadgeText({
        text: count > 0 ? count.toString() : '',
        tabId: tabId
    });
    
    chrome.browserAction.setBadgeBackgroundColor({
        color: '#4CAF50',
        tabId: tabId
    });
}

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        var url = details.url;
        const tabId = details.tabId;
        
        if (!tabActiveRules.has(tabId)) {
            tabActiveRules.set(tabId, new Set());
        }
        
        for (var i = 0, len = ReResMap.length; i < len; i++) {
            var reg = new RegExp(ReResMap[i].req, 'gi');
            if (ReResMap[i].checked && typeof ReResMap[i].res === 'string' && reg.test(url)) {
                // 记录激活的规则
                tabActiveRules.get(tabId).add(ReResMap[i].req);
                updateBadgeForTab(tabId);
                
                if (!/^file:\/\//.test(ReResMap[i].res)) {
                    do {
                        url = url.replace(reg, ReResMap[i].res);
                    } while (reg.test(url))
                } else {
                    do {
                        url = getLocalFileUrl(url.replace(reg, ReResMap[i].res));
                    } while (reg.test(url))
                }
            }
        }
        return url === details.url ? {} : { redirectUrl: url };
    },
    {urls: ["<all_urls>"]},
    ["blocking"]
);

// 清理关闭的标签页数据
chrome.tabs.onRemoved.addListener((tabId) => {
    tabActiveRules.delete(tabId);
});

// 监听消息获取激活规则
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.type === 'getActiveRules') {
            const activeRules = Array.from(tabActiveRules.get(request.tabId) || []);
            sendResponse(activeRules);
        }
        return true;
    }
);

getLocalStorage();
window.addEventListener('storage', getLocalStorage, false);

