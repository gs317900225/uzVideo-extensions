// ignore
//@name:clicli
//@version:1
//@webSite:https://www.clicli.pro
//@remark:
// ignore

// 适用�?把鼠标放在视频封面上 可以右键 复制正确链接的网�?
// 不能保证一定能用，不能用的欢迎反馈

/// 是否模拟 PC �?1�?手机�?0
const isUsePC = 1
/// 默认应该�?0，当视频不能播放的时候，可以把这个设置为 1�?否则不要改动
const isAddReferer = 1

// 网站主页
const webSite = 'https://www.clicli.pro'
// 网站搜索
// https://www.clicli.pro/search/page/2/wd/�?html
// 把网站主页变�?@{webSite} 把搜索词变成 @{searchWord}  把页码变�?@{page}
const searchUrl = '@{webSite}/search/page/@{page}/wd/@{searchWord}.html'
// 当前网站任意视频详情�?
// https://www.clicli.pro/bangumi/3384.html
const videoDetailPage = '@{webSite}/bangumi/3384.html'
// 当前网站任意视频播放�?
// https://www.clicli.pro/video/3384/1-1.html
const videoPlayPage = '@{webSite}/video/3384/1-1.html'

// 保持不变
const filterListUrl = ''

const firstClass = [
    {
        name: '番剧',
        // https://www.clicli.pro/show/id/1/page/2.html
        // 把网站主页变�?@{webSite}  把页码变�?@{page}
        id: '@{webSite}/show/id/1/page/@{page}.html',
    },
    {
        name: '剧场�?,
        // https://www.clicli.pro/show/id/2/page/2.html
        // 把网站主页变�?@{webSite}  把页码变�?@{page}
        id: '@{webSite}/show/id/2/page/@{page}.html',
    },
]

// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需�?
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需�?
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需�?

//#BaseCode1#


