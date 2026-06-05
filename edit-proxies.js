const prefix = $arguments.prefix || $arguments.name
const interfaceName = $arguments.interfaceName || $arguments.interface

if (prefix) {
  const tag = `[${prefix}]`
  if (!$server.name.startsWith(tag)) {
    $server.name = tag + $server.name // 节点前面添加前缀
  }
}

if (interfaceName) {
  $server['interface-name'] = interfaceName // 指定节点的出口网卡
}
