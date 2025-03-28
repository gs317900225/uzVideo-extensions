// ignore
//@name:素白�?
//@version:2
//@webSite:https://www.subaibaiys.com
//@remark:
//@type:100
//@instance:sbb20240624
import {} from '../../core/uzVideo.js'
import {} from '../../core/uzHome.js'
import {} from '../../core/uz3lib.js'
import {} from '../../core/uzUtils.js'
// ignore

class sbbClass extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://www.subaibaiys.com'
        this.cookie = ''
        this.UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
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
            await this.sliderBypass(this.webSite)
            const pro = await req(webUrl, {
                headers: {
                    'User-Agent': this.UA,
                    Cookie: this.cookie,
                },
            })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                let list = []
                let allClass = $('ul.navlist a')
                allClass.each((_, e) => {
                    let isIgnore = this.isIgnoreClassName($(e).text())
                    if (isIgnore) {
                        return
                    }
                    let type_name = $(e).text()
                    let url = $(e).attr('href')
                    if (url.length > 0 && type_name.length > 0) {
                        let videoClass = new VideoClass()
                        videoClass.type_id = url
                        videoClass.type_name = type_name
                        list.push(videoClass)
                    }
                })

                backData.data = list
            }
        } catch (error) {
            backData.error = '获取分类失败�? + error.message
        }

        return JSON.stringify(backData)
    }

    async sliderBypass(url) {
        const pro = await req(url, { headers: this.headers })
        let proData = pro.data
        if (proData) {
            const $ = cheerio.load(proData)
            if ($('title').text() === '滑动验证') {
                let slide_js = this.webSite + $('body script').attr('src')
                let slide_js_res = await req(slide_js, {
                    headers: {
                        'User-Agent': this.UA,
                    },
                })
                let vd_url = this.webSite + slide_js_res.data.match(/\/a20be899_96a6_40b2_88ba_32f1f75f1552_yanzheng_huadong\.php\?type=.*?&key=/)[0]
                let [, key, value] = slide_js_res.data.match(/key="(.*?)",value="(.*?)";/)
                vd_url = vd_url + `${key}&value=${md5encode(stringtoHex(value))}`
                let vd_res = await req(vd_url, {
                    headers: {
                        'User-Agent': this.UA,
                        Referer: this.webSite + '/',
                    },
                })
                this.cookie = vd_res.headers['set-cookie']?.[0].split(';')?.[0] ?? vd_res.headers['Set-Cookie']?.[0].split(';')?.[0]
            }
        }
        function stringtoHex(acSTR) {
            var val = ''
            for (var i = 0; i <= acSTR.length - 1; i++) {
                var str = acSTR.charAt(i)
                var code = str.charCodeAt()
                val += parseInt(code) + 1
            }
            return val
        }
        function md5encode(word) {
            return Crypto.MD5(word).toString()
        }
    }

    /**
     * 获取分类视频列表
     * @param {UZArgs} args
     * @returns {Promise<RepVideoList>}
     */
    async getVideoList(args) {
        let listUrl = this.removeTrailingSlash(args.url)
        // let listUrl = this.removeTrailingSlash(args.url) + '/page/' + args.page
        if (args.page > 1) listUrl += '/page/' + args.page
        let backData = new RepVideoList()
        try {
            let pro = await req(listUrl, {
                headers: {
                    'User-Agent': this.UA,
                    Cookie: this.cookie,
                },
            })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                let videos = []
                let allVideo = $('.bt_img.mi_ne_kd.mrb li')
                allVideo.each((_, e) => {
                    let vodUrl = $(e).find('a').attr('href')
                    let vodPic = $(e).find('img.thumb').attr('data-original')
                    let vodName = $(e).find('img.thumb').attr('alt')
                    let vodDiJiJi = $(e).find('.jidi').text() || $(e).find('.hdinfo').text()

                    let videoDet = new VideoDetail()
                    videoDet.vod_id = vodUrl
                    videoDet.vod_pic = vodPic
                    videoDet.vod_name = vodName
                    videoDet.vod_remarks = vodDiJiJi.trim()
                    videos.push(videoDet)
                })
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
            let pro = await req(webUrl, {
                headers: {
                    'User-Agent': this.UA,
                    Cookie: this.cookie,
                },
            })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                const $ = cheerio.load(proData)
                let vod_content = $('.yp_context').text()
                let vod_pic = $('.dyimg img').attr('src')
                let vod_name = $('.moviedteail_tt h1').text()
                let detList = $('ul.moviedteail_list li')
                let vod_year = ''
                let vod_director = ''
                let vod_actor = ''
                let vod_area = ''
                let vod_lang = ''
                let vod_douban_score = ''
                let type_name = ''

                detList.each((_, e) => {
                    const element = $(e)
                    if (element.text().includes('年份')) {
                        vod_year = element.text().replace('年份�?, '')
                    } else if (element.text().includes('导演')) {
                        vod_director = element.text().replace('导演�?, '')
                    } else if (element.text().includes('主演')) {
                        vod_actor = element.text().replace('主演�?, '')
                    } else if (element.text().includes('地区')) {
                        vod_area = element.text().replace('地区�?, '')
                    } else if (element.text().includes('语言')) {
                        vod_lang = element.text().replace('语言�?, '')
                    } else if (element.text().includes('类型')) {
                        type_name = element.text().replace('类型�?, '')
                    } else if (element.text().includes('豆瓣')) {
                        vod_douban_score = element.text().replace('豆瓣�?, '')
                    }
                })

                let juJiDocment = $('.paly_list_btn').find('a')
                let vod_play_url = ''
                juJiDocment.each((_, e) => {
                    const element = $(e)

                    vod_play_url += element.text()
                    vod_play_url += '$'
                    vod_play_url += element.attr('href')
                    vod_play_url += '#'
                })

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
                detModel.vod_play_url = vod_play_url
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
        try {
            let html = await req(url, {
                headers: {
                    'User-Agent': this.UA,
                    Cookie: this.cookie,
                },
            })
            const $ = cheerio.load(html.data)
            const isVipOnly = $('.noplay').text()
            if (isVipOnly) {
                backData.error = isVipOnly
            }
            let iframe = $('iframe').filter((i, iframe) => $(iframe).attr('src').includes('Cloud'))

            if (0 < iframe.length) {
                const iframeHtml = (
                    await req($(iframe[0]).attr('src'), {
                        headers: {
                            Referer: url,
                            'User-Agent':
                                'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
                        },
                    })
                ).data
                let code = iframeHtml
                        .match(/var url = '(.*?)'/)[1]
                        .split('')
                        .reverse()
                        .join(''),
                    temp = ''
                for (let i = 0; i < code.length; i += 2) temp += String.fromCharCode(parseInt(code[i] + code[i + 1], 16))
                const playUrl = temp.substring(0, (temp.length - 7) / 2) + temp.substring((temp.length - 7) / 2 + 7)

                backData.data = playUrl
            } else {
                let playUrl = 'error'

                const script = $('script')
                const js = script.filter((i, script) => $(script).text().includes('window.wp_nonce')).text() ?? ''
                const group = js.match(/(var.*)eval\((\w*\(\w*\))\)/)
                const md5 = Crypto
                const result = eval(group[1] + group[2])
                playUrl = result.match(/url:.*?['"](.*?)['"]/)[1]

                backData.data = playUrl
            }
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
        let url = this.removeTrailingSlash(this.webSite) + `/page/${args.page}?s=${args.searchWord}`
        try {
            let resp = await req(url, {
                headers: {
                    'User-Agent': this.UA,
                    Cookie: this.cookie,
                },
            })
            backData.error = resp.error
            let respData = resp.data

            if (respData) {
                const $ = cheerio.load(respData)
                let allVideo = $('.search_list li')
                let videos = []
                allVideo.each((_, e) => {
                    const href = $(element).find('a').attr('href')
                    const title = $(element).find('img.thumb').attr('alt')
                    const cover = $(element).find('img.thumb').attr('data-original')
                    const subTitle = $(element).find('.jidi span').text()
                    const hdinfo = $(element).find('.hdinfo .qb').text()

                    let videoDet = new VideoDetail()
                    videoDet.vod_id = href
                    videoDet.vod_pic = cover
                    videoDet.vod_name = title
                    videoDet.vod_remarks = subTitle || hdinfo
                    videos.push(videoDet)
                })
                backData.data = videos
            }
        } catch (e) {
            backData.error = e.message
        }

        return JSON.stringify(backData)
    }

    ignoreClassName = ['首页', '公告留言']

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
var sbb20240624 = new sbbClass()


