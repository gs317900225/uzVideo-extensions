// TODO: 替换为自己的�?
// 服务器接收来�?app 的请求的�?
const saltApp2End = "123321";
// 服务器发送数据到 app 的盐
const saltEnd2App = "123321";

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  let params;

  try {
    params = await request.json();
  } catch (error) {
    return new Response();
  }

  if (!params || Object.keys(params).length === 0) {
    return new Response();
  }

  if (!(await _verifySignFromApp(params))) {
    return new Response();
  }

  if (!_verifyTimestamp(params.date)) {
    return new Response();
  }

  let responseData = {};
  let sid = params.sid;
  //TODO: 判断 sid 是否是允许的用户
  // 如果使用 cloudflare worker，可以使�?KV 存储 key: sid  value：与用户定义的其它标�?例如邮箱
  if (sid) {
    responseData.pass = true;
  } else {
    responseData.pass = false;
  }

  const signedResponse = await _signResponse2App(
    responseData,
    params.sessionId
  );

  return new Response(JSON.stringify(signedResponse), {
    headers: { "Content-Type": "application/json" },
  });
}

async function _verifySignFromApp(params) {
  const { sign, ...otherParams } = params;
  if (
    !sign ||
    !otherParams.random ||
    !otherParams.date ||
    !otherParams.sessionId ||
    !otherParams.sid
  )
    return false;

  const sortedParams = Object.entries(otherParams)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const salt =
    saltApp2End + otherParams.random.slice(-4) + otherParams.date.slice(-4);
  const signStr = salt + sortedParams;
  const calculatedSign = await _keyToSha256(signStr);

  return calculatedSign === sign;
}

async function _signResponse2App(data, sessionId) {
  const signMap = { ...data };
  // 64位随机数
  const random = crypto.randomUUID().slice(-64);
  const date = Date.now().toString();

  signMap.random = random;
  signMap.date = date;
  signMap.sessionId = sessionId;

  const sortedParams = Object.entries(signMap)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const salt = saltEnd2App + random.slice(-4) + date.slice(-4);
  const signStr = salt + sortedParams;
  signMap.sign = await _keyToSha256(signStr);

  return signMap;
}

async function _keyToSha256(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 验证时间�?
function _verifyTimestamp(timestamp) {
  // 时间为了保证任意时区都一�?所以使用格林威治时�?
  const currentTimeString = new Date().toISOString();
  const currentTime = new Date(currentTimeString).getTime();
  const requestTime = parseInt(timestamp);
  const timeDifference = Math.abs(currentTime - requestTime);
  // 检查时间差是否小于2分钟�?20000毫秒�?
  return timeDifference < 120000;
}


