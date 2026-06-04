// Sub-Store 文件脚本：把订阅/组合订阅节点合并进 sing-box JSON 模板。
// 用法示例：
//   https://raw.githubusercontent.com/JHXs/My_TzRule/master/sing-box/substore-singbox-merge.js#type=1&name=你的组合订阅名
// 参数：
//   type=1|collection|col  组合订阅
//   type=2|subscription|sub 单条订阅
//   name=Sub-Store 中的订阅或组合订阅名称

function getParams() {
  const params = {};

  function readSearchParams(input) {
    if (!input) return;

    // Sub-Store 传给脚本的 $arguments 通常是对象：{ type: '1', name: 'xxx' }
    if (typeof input === 'object') {
      Object.keys(input).forEach((key) => {
        if (input[key] != null) params[key] = String(input[key]);
      });
      return;
    }

    String(input)
      .replace(/^#/, '')
      .split('&')
      .forEach((part) => {
        if (!part) return;
        const index = part.indexOf('=');
        const key = index >= 0 ? part.slice(0, index) : part;
        const value = index >= 0 ? part.slice(index + 1) : '';
        if (key) params[decodeURIComponent(key)] = decodeURIComponent(value);
      });
  }

  try {
    if (typeof $arguments !== 'undefined') readSearchParams($arguments);
  } catch (_) {}

  try {
    if (typeof http_parameters !== 'undefined' && http_parameters) Object.assign(params, http_parameters);
  } catch (_) {}

  try {
    if (typeof $env !== 'undefined' && $env) Object.assign(params, $env);
  } catch (_) {}

  return params;
}

function parseJSON(text, label) {
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`${label || 'JSON'} 解析失败: ${e.message || e}`);
  }
}

function getTemplate() {
  if (typeof $content === 'string' && $content.trim()) return parseJSON($content, '模板');
  if (typeof $files !== 'undefined' && Array.isArray($files) && $files[0]) return parseJSON($files[0], '模板');
  throw new Error('没有读取到 sing-box 模板内容');
}

function normalizeProducedArtifact(artifact) {
  if (!artifact) return { outbounds: [], endpoints: [] };

  if (typeof artifact === 'string') {
    const json = parseJSON(artifact, '订阅产物');
    if (Array.isArray(json)) return { outbounds: json, endpoints: [] };
    return {
      outbounds: Array.isArray(json.outbounds) ? json.outbounds : Array.isArray(json.proxies) ? json.proxies : [],
      endpoints: Array.isArray(json.endpoints) ? json.endpoints : []
    };
  }

  if (Array.isArray(artifact)) return { outbounds: artifact, endpoints: [] };
  return {
    outbounds: Array.isArray(artifact.outbounds) ? artifact.outbounds : Array.isArray(artifact.proxies) ? artifact.proxies : [],
    endpoints: Array.isArray(artifact.endpoints) ? artifact.endpoints : []
  };
}

function dedupeOutbounds(outbounds) {
  const used = new Set();
  const result = [];

  for (const outbound of outbounds) {
    if (!outbound || !outbound.tag) continue;
    const original = String(outbound.tag);
    let tag = original;
    let i = 2;
    while (used.has(tag)) tag = `${original} ${i++}`;
    outbound.tag = tag;
    used.add(tag);
    result.push(outbound);
  }

  return result;
}

function compile(pattern, flags) {
  if (!pattern) return null;
  return new RegExp(pattern, flags || '');
}

function pick(tags, filter) {
  if (!filter) return tags.slice();
  const flags = filter.flags || '';
  const include = compile(filter.include, flags);
  const exclude = compile(filter.exclude, flags);
  return tags.filter((tag) => {
    if (include && !include.test(tag)) return false;
    if (exclude && exclude.test(tag)) return false;
    return true;
  });
}

function expandTemplateGroups(templateOutbounds, nodeOutbounds) {
  const nodeTags = nodeOutbounds.map((outbound) => outbound.tag).filter(Boolean);
  const groupTags = templateOutbounds.map((outbound) => outbound.tag).filter(Boolean);
  const known = new Set(groupTags.concat(nodeTags));

  return templateOutbounds.map((outbound) => {
    const cloned = JSON.parse(JSON.stringify(outbound));
    const selectedNodes = pick(nodeTags, cloned._filter);

    if (Array.isArray(cloned.outbounds)) {
      const expanded = [];
      for (const tag of cloned.outbounds) {
        if (tag === '{all}') expanded.push(...selectedNodes);
        else expanded.push(tag);
      }

      // 清理不存在的引用，保底给 selector/urltest 留 DIRECT，避免空组导致 sing-box 启动失败。
      cloned.outbounds = Array.from(new Set(expanded)).filter((tag) => known.has(tag) || tag === 'DIRECT' || tag === 'REJECT');
      if (cloned.outbounds.length === 0 && (cloned.type === 'selector' || cloned.type === 'urltest')) cloned.outbounds = ['DIRECT'];
    }

    delete cloned._filter;
    return cloned;
  });
}

async function main() {
  const params = getParams();
  const name = params.name || params.sub || params.collection || params.profile;
  if (!name) throw new Error('缺少参数 name，例如：#type=1&name=你的组合订阅名');

  const typeParam = String(params.type || params.sub_type || '1').toLowerCase();
  const type = /^(2|sub|subscription)$/.test(typeParam) ? 'subscription' : 'collection';

  const config = getTemplate();
  const artifact = await produceArtifact({
    type,
    name,
    platform: 'sing-box'
  });

  const produced = normalizeProducedArtifact(artifact);
  const nodeOutbounds = dedupeOutbounds(
    produced.outbounds.filter((outbound) => outbound && outbound.tag && !['selector', 'urltest', 'direct', 'block', 'dns'].includes(outbound.type))
  );
  const nodeEndpoints = dedupeOutbounds(produced.endpoints.filter((endpoint) => endpoint && endpoint.tag));

  if (!nodeOutbounds.length && !nodeEndpoints.length) throw new Error(`订阅 ${name} 没有生成可用的 sing-box 节点`);

  const templateOutbounds = Array.isArray(config.outbounds) ? config.outbounds : [];
  const expandedTemplateOutbounds = expandTemplateGroups(templateOutbounds, nodeOutbounds.concat(nodeEndpoints));

  config.outbounds = expandedTemplateOutbounds.concat(nodeOutbounds);
  if (nodeEndpoints.length) config.endpoints = (Array.isArray(config.endpoints) ? config.endpoints : []).concat(nodeEndpoints);

  if (typeof $options !== 'undefined') {
    $options._res = $options._res || {};
    $options._res.headers = Object.assign({}, $options._res.headers, {
      'content-type': 'application/json; charset=utf-8'
    });
  }

  $content = JSON.stringify(config, null, 2);
}

await main();
