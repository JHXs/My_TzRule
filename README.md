# My_TzRule
存储自己的特殊配置的Rule Providers 规则集



(clashWiki解释)[https://dreamacro.github.io/clash/zh_CN/premium/rule-providers.html#rule-providers-%E8%A7%84%E5%88%99%E9%9B%86]



``````yaml
rule-providers:
  apple:
    behavior: "domain" # domain, ipcidr or classical (仅限 Clash Premium 内核)
    type: http
    url: "url"

    # format: 'yaml' # or 'text'

    interval: 3600
    path: ./apple.yaml
  microsoft:
    behavior: "domain"
    type: file
    path: /microsoft.yaml

rules:
  - RULE-SET,apple,REJECT
  - RULE-SET,microsoft,policy
``````



## `domain`

yaml:

```
payload:
  - '.blogger.com'
  - '*.*.microsoft.com'
  - 'books.itunes.apple.com'
```

text:

```
# comment
.blogger.com
*.*.microsoft.com
books.itunes.apple.com
```

## `ipcidr`

yaml

```
payload:
  - '192.168.1.0/24'
  - '10.0.0.0.1/32'
```

text:

```
# comment
192.168.1.0/24
10.0.0.0.1/32
```

## `classical` 

yaml:

```
payload:
  - DOMAIN-SUFFIX,google.com
  - DOMAIN-KEYWORD,google
  - DOMAIN,ad.com
  - SRC-IP-CIDR,192.168.1.201/32
  - IP-CIDR,127.0.0.0/8
  - GEOIP,CN
  - DST-PORT,80
  - SRC-PORT,7777
  # MATCH 在这里并不是必须的
```

text:

```
# comment
DOMAIN-SUFFIX,google.com
DOMAIN-KEYWORD,google
DOMAIN,ad.com
SRC-IP-CIDR,192.168.1.201/32
IP-CIDR,127.0.0.0/8
GEOIP,CN
DST-PORT,80
SRC-PORT,7777
```
