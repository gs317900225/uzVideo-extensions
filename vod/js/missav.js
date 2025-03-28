// ignore
//@name:missav
//@version:2
//@webSite:https://missav.ai
//@remark:
//@type:100
//@instance:missav20240627
//@isAV:1

import { } from '../../core/uzVideo.js'
import { } from '../../core/uzHome.js'
import { } from '../../core/uz3lib.js'
import { } from '../../core/uzUtils.js'
// ignore

class missavClass extends WebApiBase {
    /**
     *
     */
    constructor() {
        super();
        this.url = 'https://missav.ai'
        this.headers = {
            'User-Agent': 'PostmanRuntime/7.39.0',
        }
    }

    /**
     * 异步获取分类列表的方法�?
     * @param {UZArgs} args
     * @returns {Promise<RepVideoClassList>}
     */
    async getClassList(args) {
        let webUrl = args.url
        // 如果通过首页获取分类的话，可以将对象内部的首页更�?
        this.webSite = this.removeTrailingSlash(webUrl)
        let backData = new RepVideoClassList()
        try {
            const pro = await req(webUrl + '/dm24', { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let document = parse(proData)
                let allClass = document.querySelectorAll('.relative nav .py-1 a')
                let list = []
                for (let index = 0; index < allClass.length; index++) {
                    const element = allClass[index]
                    let isIgnore = this.isIgnoreClassName(element.text)
                    if (isIgnore) {
                        continue
                    }
                    let type_name = element.text
                    let url = element.getAttribute('href') ?? ''

                    if (url.length > 0 && type_name.length > 0) {
                        let videoClass = new VideoClass()
                        videoClass.type_id = url
                        videoClass.type_name = type_name.trim()
                        list.push(videoClass)
                    }
                }

                backData.data = list.filter((e) => !e.type_id.includes('bit.ly'))
            }
        } catch (error) {
            backData.error = '获取分类失败�? + error.message
        }

        return JSON.stringify(backData)
    }

    /**
     * 获取分类视频列表
     * @param {UZArgs} args
     * @returns {Promise<RepVideoList>}
     */
    async getVideoList(args) {
        let listUrl = this.removeTrailingSlash(args.url) + '?page=' + args.page
        let backData = new RepVideoList()
        try {
            let pro = await req(listUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let document = parse(proData)
                let allVideo = document.querySelector('div.pb-12').querySelectorAll('div.thumbnail')
                let videos = []
                for (let index = 0; index < allVideo.length; index++) {
                    const element = allVideo[index]
                    let vodUrl = element.querySelector('.my-2 .text-secondary')?.attributes['href'] ?? ''
                    let vodPic = element.querySelector('img')?.attributes['data-src'] ?? ''
                    let vodName = element.querySelector('.my-2 .text-secondary')?.text ?? ''
                    let vodDiJiJi = element.querySelector('span')?.text ?? ''

                    let videoDet = {}
                    videoDet.vod_id = vodUrl
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                }
                backData.data = videos
            }
        } catch (error) {
            backData.error = '获取列表失败�? + error.message
        }
        return JSON.stringify(backData)
    }

    /**
     * 获取视频详情
     * @param {UZArgs} args
     * @returns {Promise<RepVideoDetail>}
     */
    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        try {
            let webUrl = args.url
            let pro = await req(webUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let document = parse(proData)
                let vod_content = document.querySelector('div.mb-4 div.text-secondary')?.text ?? ''
                let vod_pic = document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? ''
                let vod_name = document.querySelector('.mt-4 h1')?.text ?? ''
                let vod_year = ''
                let vod_director = ''
                let vod_actor = ''
                let vod_area = ''
                let vod_lang = ''
                let vod_douban_score = ''
                let type_name = ''

                let detModel = new VideoDetail()
                detModel.vod_year = vod_year
                detModel.type_name = type_name
                detModel.vod_director = vod_director
                detModel.vod_actor = vod_actor
                detModel.vod_area = vod_area
                detModel.vod_lang = vod_lang
                detModel.vod_douban_score = vod_douban_score
                detModel.vod_content = vod_content.trim()
                detModel.vod_pic = vod_pic
                detModel.vod_name = vod_name
                detModel.vod_play_url = `$${webUrl}#`
                detModel.vod_id = webUrl

                backData.data = detModel
            }
        } catch (error) {
            backData.error = '获取视频详情失败' + error.message
        }

        return JSON.stringify(backData)
    }

    /**
     * 获取视频的播放地址
     * @param {UZArgs} args
     * @returns {Promise<RepVideoPlayUrl>}
     */
    async getVideoPlayUrl(args) {
        let backData = new RepVideoPlayUrl()
        let url = args.url
        let m3u8Prefix = 'https://surrit.com/'
        let m3u8Suffix = '/playlist.m3u8'
        try {
            let html = await req(url, { headers: this.headers })
            backData.error = html.error

            let uuid = html.data.match(/nineyu\.com\\\/(.+)\\\/seek\\\/_0\.jpg/)[1]
            let m3u8 = m3u8Prefix + uuid + m3u8Suffix

            backData.data = m3u8
        } catch (error) {
            backData.error = error.message
        }
        return JSON.stringify(backData)
    }

    /**
     * 搜索视频
     * @param {UZArgs} args
     * @returns {Promise<RepVideoList>}
     */
    async searchVideo(args) {
        let backData = new RepVideoList()
        let url = this.removeTrailingSlash(this.webSite) + `/search/${args.searchWord}?page=${args.page}`

        try {
            let pro = await req(url, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let document = parse(proData)
                let allVideo = document.querySelector('div.pb-12').querySelectorAll('div.thumbnail')
                let videos = []
                for (let index = 0; index < allVideo.length; index++) {
                    const element = allVideo[index]
                    let vodUrl = element.querySelector('.my-2 .text-secondary')?.attributes['href'] ?? ''
                    let vodPic = element.querySelector('img')?.attributes['data-src'] ?? ''
                    let vodName = element.querySelector('.my-2 .text-secondary')?.text ?? ''
                    let vodDiJiJi = element.querySelector('span')?.text ?? ''

                    let videoDet = {}
                    videoDet.vod_id = vodUrl
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                }
                backData.data = videos
            }
        } catch (e) {
            backData.error = e.message
        }

        return JSON.stringify(backData)
    }

    ignoreClassName = ['色色主播', '我的', '女優', '發行', '類型', '影評', 'VIP', '觀看記�?, '繁體中文']

    combineUrl(url) {
        if (url === undefined) {
            return ''
        }
        if (url.indexOf(this.webSite) !== -1) {
            return url
        }
        if (url.startsWith('/')) {
            return this.webSite + url
        }
        return this.webSite + '/' + url
    }

    isIgnoreClassName(className) {
        for (let index = 0; index < this.ignoreClassName.length; index++) {
            const element = this.ignoreClassName[index]
            if (className.indexOf(element) !== -1) {
                return true
            }
        }
        return false
    }

    removeTrailingSlash(str) {
        if (str.endsWith('/')) {
            return str.slice(0, -1)
        }
        return str
    }
}
var missav20240627 = new missavClass()


