'use strict';
var reres = angular.module('reres', []);
var groupBy = function (collects, name) {
    var ret = {}, key;
    collects.forEach(function(elem) {
        var key = elem[name];
        ret[key] = ret[key] || [];
        ret[key].push(elem);
    });
    return ret;
}

reres.controller('mapListCtrl', function ($scope) {
    var bg = chrome.extension.getBackgroundPage();

    // 添加获取当前tab的函数
    function getCurrentTab() {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                resolve(tabs[0]);
            });
        });
    }

    // 初始化时获取当前页面的激活规则
    getCurrentTab().then(tab => {
        if (tab && tab.id) {
            chrome.runtime.sendMessage({
                type: 'getActiveRules',
                tabId: tab.id
            }, function(activeRules) {
                $scope.$apply(() => {
                    $scope.maps.forEach(rule => {
                        rule.isActive = activeRules && activeRules.includes(rule.req);
                    });
                });
            });
        }
    });

    //保存规则数据到localStorage
    function saveData() {
        $scope.rules = groupBy($scope.maps, 'group');
        bg.localStorage.ReResMap = angular.toJson($scope.maps);
    }

    //当前编辑的规则
    $scope.curRule = {
        name: '',
        req: '.*test\\.com',
        res: 'http://cssha.com',
        group: '默认分组',
        checked: true
    }

    $scope.maps = bg.ReResMap;
    $scope.rules = groupBy(bg.ReResMap, 'group');

    //编辑框显示状态
    $scope.editDisplay = 'none';

    //按钮框显示状态
//    $scope.btnDisplay = 'block';

    //编辑框保存按钮文本
    $scope.editType = '添加';

    //输入错误时候的警告
    $scope.inputError = '';

    //隐藏编框
    $scope.hideEditBox = function () {
        $scope.editDisplay = 'none';
//        $scope.btnDisplay = 'block';
    }

    //显示编辑框
    $scope.showEditBox = function () {
        $scope.editDisplay = 'block';
//        $scope.btnDisplay = 'none';
    }

    //验证输入合法性
    $scope.virify = function () {
        if (!$scope.curRule.req) {
            $scope.inputError = '正则一栏输入不能为空';
            return false;
        }
        try {
            new RegExp($scope.curRule.req)
        } catch (e) {
            $scope.inputError = 'req正则格式错误';
            return false;
        }
        $scope.inputError = '';
        return true;
    }

    // 生成多种推荐名称
    function generateRuleNames(rule) {
        const names = [];
        
        // 1. 从URL模式生成的名称
        if (rule.req) {
            let cleanPattern = rule.req
                .replace(/\\\./g, '.')
                .replace(/[\^\$\*\+\?\{\}\[\]\(\)\\]/g, '')
                .replace(/^https?:\/\//i, '');
            
            let urlName = cleanPattern.split('/')[0];
            if (rule.res) {
                let target = rule.res.replace(/^https?:\/\//i, '').split('/')[0];
                urlName = `${urlName} → ${target}`;
            }
            names.push(urlName);
        }
        
        // 2. 数字编号形式
        const existingRules = $scope.maps.filter(r => /^规则\d+$/.test(r.name));
        let maxNum = 0;
        existingRules.forEach(r => {
            const num = parseInt(r.name.replace('规则', ''));
            if (num > maxNum) maxNum = num;
        });
        names.push(`规则${maxNum + 1}`);
        
        // 3. 基于目标类型
        if (rule.res) {
            if (rule.res.startsWith('file:///')) {
                names.push('本地文件射');
            } else if (rule.res.startsWith('http')) {
                names.push('远程地址映射');
            }
        }
        
        return names;
    }

    // 修改添加规则函数
    $scope.addRule = function () {
        if ($scope.editDisplay === 'none') {
            $scope.curRule = {
                name: '',
                req: '.*test\\.com',
                res: 'http://cssha.com',
                group: '默认分组',
                checked: true
            };
            // 生成推荐名称
            $scope.suggestedNames = generateRuleNames($scope.curRule);
            $scope.editType = '添加';
            $scope.showEditBox();
        }
    };

    //点击编辑按钮
    $scope.edit = function (rule) {
        $scope.curRule = rule;
        $scope.editType = '编辑';
        $scope.showEditBox();
    }

    //编辑后保存
    $scope.saveRule = function () {
        if ($scope.virify()) {
            if ($scope.editType === '添加') {
                $scope.maps.push($scope.curRule);
            } else {

            }
            saveData();
            $scope.hideEditBox();
        }
    };

    //删除规则
    $scope.removeUrl = function (rule) {
        for (var i = 0, len = $scope.maps.length; i < len; i++) {
            if ($scope.maps[i] === rule) {
                $scope.maps.splice(i, 1);
            }
        }
        saveData();
    }

    // 监听规则变化自动更新推荐名称
    $scope.$watch('curRule.req', function(newVal, oldVal) {
        if (newVal !== oldVal && $scope.editType === '添加') {
            $scope.suggestedNames = generateRuleNames($scope.curRule);
        }
    });

    $scope.$watch('curRule.res', function(newVal, oldVal) {
        if (newVal !== oldVal && $scope.editType === '添加') {
            $scope.suggestedNames = generateRuleNames($scope.curRule);
        }
    });

    // 添加在 controller 内部
    $scope.selectSuggestedName = function(name) {
        $scope.curRule.name = name;
    };

    // 添加克隆规则功能
    $scope.cloneRule = function(rule) {
        // 深拷贝规则对象
        var clonedRule = angular.copy(rule);
        // 修改名称
        clonedRule.name = rule.name + ' (副本)';
        // 添加到规则列表
        $scope.maps.push(clonedRule);
        saveData();
    };

    // 定期更新规则激活状态
    function updateActiveRules() {
        getCurrentTab().then(tab => {
            if (tab && tab.id) {
                chrome.runtime.sendMessage({
                    type: 'getActiveRules',
                    tabId: tab.id
                }, function(activeRules) {
                    $scope.$apply(() => {
                        $scope.maps.forEach(rule => {
                            rule.isActive = activeRules && activeRules.includes(rule.req);
                        });
                    });
                });
            }
        });
    }

    // 初始更新
    updateActiveRules();

    // 每秒更新一次状态
    const updateInterval = setInterval(updateActiveRules, 1000);

    // 当popup关闭时清除定时器
    window.addEventListener('unload', () => {
        clearInterval(updateInterval);
    });
});
