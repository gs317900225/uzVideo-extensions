// ignore
//@name:云盘资源�?
//@version:1
//@webSite:https://res.yunpan.win
//@remark:
//@type:100
//@instance:resYunPan20241120
import {} from '../../core/uzVideo.js'
import {} from '../../core/uzHome.js'
import {} from '../../core/uz3lib.js'
import {} from '../../core/uzUtils.js'
// ignore

// 类名要特�?
class ResYunPan extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://res.yunpan.win'
    }
    /**
     * 异步获取分类列表的方法�?
     * @param {UZArgs} args
     * @returns {Promise<RepVideoClassList>}
     */
    async getClassList(args) {
        var backData = new RepVideoClassList()
        backData.data = [
            {
                type_id: '1',
                type_name: '全部',
                hasSubclass: false,
            },
        ]
        return JSON.stringify(backData)
    }

    /**
     * 获取分类视频列表
     * @param {UZArgs} args
     * @returns {Promise<RepVideoList>}
     */
    async getVideoList(args) {
        var backData = new RepVideoList()
        var endWebSite = UZUtils.removeTrailingSlash(this.webSite)
        let url =
            endWebSite +
            `/?PageIndex=${args.page}&PageSize=12&Keyword=&Type=&Tag=&YunPanSourceType=`
        try {
            const pro = await req(url)
            backData.error = pro.error
            let videos = []
            if (pro.data) {
                const $ = cheerio.load(pro.data)
                let vodItems = $('div.col')
                vodItems.each((_, e) => {
                    let videoDet = new VideoDetail()
                    videoDet.vod_pic =
                        endWebSite + $(e).find('img').first().attr('src')
                    videoDet.vod_id = $(e)
                        .find('div.float-end a.card-link')
                        .last()
                        .attr('href')
                    videoDet.vod_name = $(e)
                        .find('h5.card-title')
                        .contents() // 获取所有子节点
                        .not('span') // 排除 span 元素
                        .text() // 提取文本内容
                        .trim()
                    videos.push(videoDet)
                })
            }
            backData.data = videos
        } catch (error) {}
        return JSON.stringify(backData)
    }

    /**
     * 获取视频详情
     * @param {UZArgs} args
     * @returns {Promise<RepVideoDetail>}
     */
    async getVideoDetail(args) {
        var backData = new RepVideoDetail()
        try {
            var endWebSite = UZUtils.removeTrailingSlash(this.webSite)
            let webUrl = endWebSite + args.url
            let pro = await req(webUrl)
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                let vodDetail = new VideoDetail()
                vodDetail.vod_content = $('p.card-text').first().text().trim()
                const panUrls = []
                const onclickAttr = $('a.card-link.float-end').attr('onclick') // 获取 onclick 属性内�?
                // 使用正则解析�?window.open 的链�?
                const match = onclickAttr.match(/window\.open\('([^']+)'\)/) // 正则匹配单引号内的链�?
                const link = match ? match[1] : null // 提取链接
                panUrls.push(link)
                vodDetail.panUrls = panUrls
                backData.data = vodDetail
            }
        } catch (error) {
            backData.error = '获取视频详情失败' + error
        }

        return JSON.stringify(backData)
    }

    /**
     * 获取视频的播放地址
     * @param {UZArgs} args
     * @returns {Promise<RepVideoPlayUrl>}
     */
    async getVideoPlayUrl(args) {
        var backData = new RepVideoPlayUrl()
        return JSON.stringify(backData)
    }

    /**
     * 搜索视频
     * @param {UZArgs} args
     * @returns {Promise<RepVideoList>}
     */
    async searchVideo(args) {
        var backData = new RepVideoList()
        var endWebSite = UZUtils.removeTrailingSlash(this.webSite)
        let url =
            endWebSite +
            `/?PageIndex=${args.page}&PageSize=12&Keyword=${args.searchWord}&Type=&Tag=&YunPanSourceType=`
        try {
            const pro = await req(url)
            backData.error = pro.error
            let videos = []
            if (pro.data) {
                const $ = cheerio.load(pro.data)
                let vodItems = $('div.col')
                vodItems.each((_, e) => {
                    let videoDet = new VideoDetail()
                    videoDet.vod_pic =
                        endWebSite + $(e).find('img').first().attr('src')
                    videoDet.vod_id = $(e)
                        .find('div.float-end a.card-link')
                        .last()
                        .attr('href')
                    videoDet.vod_name = $(e)
                        .find('h5.card-title')
                        .contents() // 获取所有子节点
                        .not('span') // 排除 span 元素
                        .text() // 提取文本内容
                        .trim()
                    videos.push(videoDet)
                })
            }
            backData.data = videos
        } catch (error) {}
        return JSON.stringify(backData)
    }
}

// json �?instance 的值，这个名称一定要特殊
var resYunPan20241120 = new ResYunPan()


