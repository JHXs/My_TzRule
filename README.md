# My_TzRule

自用代理规则、Sub-Store 模板和客户端配置文件。

## 目录结构

```txt
.
├── My_ACL4SSR.ini                 # subconverter / ACL4SSR 自定义配置
├── My_Direct.txt                  # 自用直连规则，Clash classical 文本格式
├── My_Proxy.txt                   # 自用代理规则，Clash classical 文本格式
├── My_Reject.txt                  # 自用拦截规则，Clash classical 文本格式
├── clash/
│   ├── clash-config.yaml
│   ├── clash-template.yaml
│   ├── clash.meta_for_magisk_config.yaml
│   ├── substore-mihomo-override.yaml
│   └── template
└── sing-box/
    ├── config.json
    ├── substore-singbox-template.json
    ├── substore-singbox-merge.js
    └── rules/
        ├── My_Direct.json
        ├── My_Proxy.json
        └── My_Reject.json
```

## Sub-Store 生成 Mihomo 配置

Mihomo / Clash.Meta 使用覆写文件：

```txt
https://raw.githubusercontent.com/JHXs/My_TzRule/master/clash/substore-mihomo-override.yaml
```

在 Sub-Store 对应订阅或组合订阅的覆写配置里使用即可。

> 注意：建议先在每个单条订阅里给节点加来源前缀，例如 `[peiqian]`、`[ikuuu]`、`[自建]`，这样分组过滤才会生效。

## Sub-Store 生成 sing-box 配置

sing-box 使用「文件管理 + JSON 模板 + 脚本合并节点」的方式。

相关文件：

- `sing-box/substore-singbox-template.json`：完整 sing-box 配置模板，分组/规则逻辑对齐 Mihomo 覆写
- `sing-box/substore-singbox-merge.js`：Sub-Store 文件脚本，把单条订阅或组合订阅生成的 sing-box 节点插入模板
- `sing-box/rules/*.json`：由 `My_Reject.txt` / `My_Direct.txt` / `My_Proxy.txt` 转成的 sing-box source rule-set

### 使用方式

1. 在 Sub-Store 的「文件管理」中新建文件。
2. 文件内容填 `sing-box/substore-singbox-template.json`，或远程 URL 填：

   ```txt
   https://raw.githubusercontent.com/JHXs/My_TzRule/master/sing-box/substore-singbox-template.json
   ```

3. 给这个文件添加「脚本操作」，脚本 URL 填：

   ```txt
   https://raw.githubusercontent.com/JHXs/My_TzRule/master/sing-box/substore-singbox-merge.js#type=1&name=你的组合订阅名
   ```

4. 访问这个文件的 Sub-Store 下载链接，即可得到完整 sing-box JSON 配置。

### 脚本参数

- `type=1` / `collection` / `col`：组合订阅
- `type=2` / `subscription` / `sub`：单条订阅
- `name=`：Sub-Store 里订阅或组合订阅的名称

示例：

```txt
# 组合订阅
https://raw.githubusercontent.com/JHXs/My_TzRule/master/sing-box/substore-singbox-merge.js#type=1&name=All

# 单条订阅
https://raw.githubusercontent.com/JHXs/My_TzRule/master/sing-box/substore-singbox-merge.js#type=2&name=peiqian
```

> 注意：sing-box 分组同样依赖节点名前缀，例如 `[peiqian]`、`[ikuuu]`、`[自建]`。

## 自定义规则说明

根目录的 `My_Direct.txt`、`My_Proxy.txt`、`My_Reject.txt` 使用 Clash classical 文本规则格式，例如：

```txt
DOMAIN-SUFFIX,example.com
DOMAIN-KEYWORD,example
DOMAIN,full.example.com
IP-CIDR,192.168.1.0/24
SRC-IP-CIDR,192.168.1.100/32
PROCESS-NAME,qbittorrent-nox
DST-PORT,80
SRC-PORT,7777
```

sing-box 对应的 source rule-set 放在：

```txt
sing-box/rules/
```

如果修改了根目录的 `My_*.txt`，记得同步更新 `sing-box/rules/*.json`。
