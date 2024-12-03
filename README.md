# ReRes Pro

一个强大的 Chrome 请求转发和重定向工具。

## 主要功能

- 请求重定向：将请求重定向到其他 URL 或本地文件
- 本地文件映射：支持将远程资源映射到本地文件
- 目录映射：支持整个目录的映射
- 规则分组：通过分组更好地管理规则
- 规则状态提示：直观显示当前页面激活的规则
- 批量导入导出：支持规则的批量导入和导出

## 安装使用

1. 从 Chrome 商店安装：[ReRes Pro](https://chrome.google.com/webstore/detail/reres/gieocpkbblidnocefjakldecahgeeica)
2. 在扩展管理页面(chrome://extensions/)中勾选"允许访问文件网址"

## 使用说明

### 规则管理

1. **添加规则**
   - 点击"添加规则"按钮
   - 填写规则名称（可选择推荐名称）
   - 设置 URL 匹配规则（正则表达式）
   - 设置响应地址（支持 http:// 或 file:///）
   - 选择规则分组（可选）

2. **规则状态**
   - 绿色边框：表示规则在当前页面生效
   - 插件图标数字：显示当前页面生效的规则数量
   - 开关按钮：快速启用/禁用规则

3. **规则操作**
   - 编辑：修改现有规则
   - 克隆：快速复制规则
   - 删除：移除不需要的规则

### 批量管理

规则导入导出格式：

```json
[
    {
        "name": "规则名称",
        "req": "^https?:\\/\\/.*test.com",
        "res": "http://target.com",
        "group": "分组名称",
        "checked": true
    }
]
```

字段说明：
- name: 规则名称
- req: URL 匹配正则
- res: 目标地址
- group: 分组名称
- checked: 是否启用

## 注意事项

1. URL 匹配规则使用正则表达式，无需添加开头的 `/` 和结尾的 `/gi`
2. 本地文件映射需要以 `file:///` 开头
3. 远程地址映射需要以 `http://` 或 `https://` 开头

## 技术栈

- AngularJS
- Bootstrap
- Chrome Extension API

## 开源协议

MIT License
