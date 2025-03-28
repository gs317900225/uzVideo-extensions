// ignore
//@name:奥秘�?
//@version:2
//@webSite:https://vip.omii.top/
//@remark:
//@deprecated:1
// ignore
// 类名要特�?
class Aomipan extends WebApiBase {
  constructor() {
    super();
    this.webSite = 'https://vip.omii.top/';
  }
  /**
   * 异步获取分类列表的方法�?
   * @param {UZArgs} args
   * @returns {Promise<RepVideoClassList>}
   */
  async getClassList(args) {
    var backData = new RepVideoClassList();
    backData.data = [
      {
        type_id: '30',
        type_name: '奥秘电影',
        hasSubclass: false,
      },
      {
        type_id: '31',
        type_name: '奥秘剧集',
        hasSubclass: false,
      },
      {
        type_id: '32',
        type_name: '奥秘动漫',
        hasSubclass: false,
      },
      {
        type_id: '33',
        type_name: '奥秘综艺',
        hasSubclass: false,
      },
      {
        type_id: '34',
        type_name: '奥秘短剧',
        hasSubclass: false,
      },
      {
        type_id: '35',
        type_name: '奥秘音乐',
        hasSubclass: false,
      },
    ];
    return JSON.stringify(backData);
  }

  /**
   * 获取分类视频列表
   * @param {UZArgs} args
   * @returns {Promise<RepVideoList>}
   */
  async getVideoList(args) {
    var backData = new RepVideoList();
    let url =
      UZUtils.removeTrailingSlash(this.webSite) +
      `/index.php/vod/show/id/${args.url}/page/${args.page}.html`;
    try {
      const pro = await req(url);
      backData.error = pro.error;
      let videos = [];
      if (pro.data) {
        const $ = cheerio.load(pro.data);
        let vodItems = $('#main .module-item');
        vodItems.each((_, e) => {
          let videoDet = new VideoDetail();
          videoDet.vod_id = $(e).find('.module-item-pic a').attr('href');
          videoDet.vod_name = $(e).find('.module-item-pic img').attr('alt');
          videoDet.vod_pic = $(e).find('.module-item-pic img').attr('data-src');
          videoDet.vod_remarks = $(e).find('.module-item-text').text();
          videoDet.vod_year = $(e)
            .find('.module-item-caption span')
            .first()
            .text();
          videos.push(videoDet);
        });
      }
      backData.data = videos;
    } catch (error) {}
    return JSON.stringify(backData);
  }

  /**
   * 获取视频详情
   * @param {UZArgs} args
   * @returns {Promise<RepVideoDetail>}
   */
  async getVideoDetail(args) {
    var backData = new RepVideoDetail();
    try {
      let webUrl = UZUtils.removeTrailingSlash(this.webSite) + args.url;
      let pro = await req(webUrl);

      backData.error = pro.error;
      let proData = pro.data;
      if (proData) {
        const $ = cheerio.load(proData);
        let vodDetail = new VideoDetail();
        vodDetail.vod_id = args.url;
        vodDetail.vod_name = $('.page-title')[0].children[0].data;
        vodDetail.vod_pic = $($('.mobile-play')).find('.lazyload')[0].attribs[
          'data-src'
        ];

        let video_items = $('.video-info-itemtitle');

        for (const item of video_items) {
          let key = $(item).text();

          let vItems = $(item).next().find('a');
          let value = vItems
            .map((i, el) => {
              let text = $(el).text().trim(); // 获取并去除空白字�?
              return text ? text : null; // 只有非空的文本才返回
            })
            .get() // �?jQuery 对象转换为普通数�?
            .filter(Boolean) // 过滤�?null 和空字符�?
            .join(', '); // 用逗号和空格分�?

          if (key.includes('剧情')) {
            vodDetail.vod_content = $(item).next().find('p').text().trim();
          } else if (key.includes('导演')) {
            vodDetail.vod_director = value.trim();
          } else if (key.includes('主演')) {
            vodDetail.vod_actor = value.trim();
          }
        }

        const panUrls = [];
        let items = $('.module-row-info');
        for (const item of items) {
          let shareUrl = $(item).find('p')[0].children[0].data;
          panUrls.push(shareUrl);
        }
        vodDetail.panUrls = panUrls;
        console.log(panUrls);

        backData.data = vodDetail;
      }
    } catch (error) {
      backData.error = '获取视频详情失败' + error;
    }

    return JSON.stringify(backData);
  }

  /**
   * 获取视频的播放地址
   * @param {UZArgs} args
   * @returns {Promise<RepVideoPlayUrl>}
   */
  async getVideoPlayUrl(args) {
    var backData = new RepVideoPlayUrl();
    return JSON.stringify(backData);
  }

  /**
   * 搜索视频
   * @param {UZArgs} args
   * @returns {Promise<RepVideoList>}
   */
  async searchVideo(args) {
    var backData = new RepVideoList();
    try {
      let searchUrl = `${UZUtils.removeTrailingSlash(
        this.webSite
      )}/index.php/vod/search/page/${args.page}/wd/${args.searchWord}.html`;
      let repData = await req(searchUrl);
      this.checkVerify(searchUrl, repData.data);
      const $ = cheerio.load(repData.data);
      let items = $('.module-search-item');

      for (const item of items) {
        let video = new VideoDetail();
        video.vod_id = $(item).find('.video-serial')[0].attribs.href;
        video.vod_name = $(item).find('.video-serial')[0].attribs.title;
        video.vod_pic = $(item).find('.module-item-pic > img')[0].attribs[
          'data-src'
        ];
        video.vod_remarks = $($(item).find('.video-serial')[0]).text();
        backData.data.push(video);
      }
    } catch (error) {
      backData.error = error;
    }
    return JSON.stringify(backData);
  }

  combineUrl(url) {
    if (url === undefined) {
      return '';
    }
    if (url.indexOf(this.webSite) !== -1) {
      return url;
    }
    if (url.startsWith('/')) {
      return this.webSite + url;
    }
    return this.webSite + '/' + url;
  }

  /**
   * 检查是否需要验证码
   * @param {string} webUrl
   * @param {any} data
   **/
  async checkVerify(webUrl, data) {
    // if (typeof data === 'string' && data.includes('频繁操作')) {
    //   await goToVerify(webUrl);
    // }
  }
}

// json �?instance 的值，这个名称一定要特殊
var aomipan20241030 = new Aomipan();


