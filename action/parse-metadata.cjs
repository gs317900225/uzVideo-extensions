﻿const fs = require('fs')
const path = require('path')
const child_process = require('child_process')
const archiver = require('archiver')

const TYPE_MAPPING = {
  'danMu/js': 400,
  'panTools/js': 300,
  'recommend/js': 200,
  'vod/js': 101,
}

const kLocalPathTAG = '_localPathTAG_'

const getRepoInfo = () => {
  if (process.env.GITHUB_REPOSITORY) {
    return process.env.GITHUB_REPOSITORY.split('/')
  }
  try {
    const gitUrl = require('child_process')
      .execSync('git config --get remote.origin.url')
      .toString()
      .trim()
  
    // 支持 https://github.com/user/repo.git 和 git@github.com:user/repo.git 形式
    // 同时匹配 SSH(git@host:owner/repo) 和 HTTPS(https://host/owner/repo) 格式
    const matches = gitUrl.match(/(?:git@([^:]+):|https?:\/\/([^\/]+)\/)([^\/]+)\/([^\/.]+)(?:\.git)?$/)

    if (!matches || matches.length < 5) throw new Error('无法解析Git远程URL')

    const host = matches[1] || matches[2]  // 匹配 SSH 或 HTTPS 的主机名
    const owner = matches[3]
    const repo = matches[4]
  
    return [owner, repo]  // 只需要返回拥有者和仓库名
  } catch (error) {
    throw new Error('获取仓库信息失败: ' + error.message)
  }
}

const parseComments = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8')
  const deprecated = extractValue(content, '@deprecated:')
  if (deprecated && parseInt(deprecated) == 1) return null

  const metadata = {
    name: extractValue(content, '@name:'),
    webSite: extractValue(content, '@webSite:'),
    version: extractValue(content, '@version:'),
    remark: extractValue(content, '@remark:'),
    env: extractValue(content, '@env:'),
    codeID: extractValue(content, '@codeID:'),
    type: extractValue(content, '@type:'),
    instance: extractValue(content, '@instance:'),
    isAV: extractValue(content, '@isAV:'),
    order: extractValue(content, '@order:'),
  }

  if (!metadata.name) return null

  const relativePath = path.relative(process.cwd(), filePath)
  const dirPath = path.dirname(relativePath)
  if (!metadata.type?.trim()) {
    metadata.type = TYPE_MAPPING[dirPath]
  }
  // 获取当前分支名称，默认为 main
  const branch = process.env.GITHUB_REF ? process.env.GITHUB_REF.replace('refs/heads/', '') : 'main'
  const [owner, repo] = getRepoInfo()
  metadata.api = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${kLocalPathTAG}${relativePath.replace(/\\/g, '/')}`
  return metadata
}

const extractValue = (content, tag) => {
  const regex = new RegExp(`^.*${tag}(.*)$`, 'm')
  const match = content.match(regex)
  return match ? match[1].trim() : ''
}
const main = async () => {
  const directories = ['danMu/js', 'panTools/js', 'recommend/js', 'vod/js']
  const allInOneResult = {}
  const avResultList = []

  directories.forEach((dir) => {
    const fullPath = path.join(__dirname, '..', dir)
    if (!fs.existsSync(fullPath)) return

    const files = fs
      .readdirSync(fullPath)
      .filter((f) => f.endsWith('.js') || f.endsWith('.txt'))
      .map((f) => ({
        file: f,
        stat: fs.statSync(path.join(fullPath, f)),
      }))
      // .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
      .map((f) => f.file)

    files.forEach((file) => {
      const filePath = path.join(fullPath, file)
      const metadata = parseComments(filePath)
      if (metadata) {
        const item = {
          name: metadata.name,
          ...(metadata.version && {
            version: parseInt(metadata.version),
          }),
          ...(metadata.remark && { remark: metadata.remark }),
          ...(metadata.env && { env: metadata.env }),
          ...(metadata.webSite && { webSite: metadata.webSite }),
          ...(metadata.codeID && { codeID: metadata.codeID }),
          ...(metadata.instance && { instance: metadata.instance }),
          ...(metadata.order && { order: metadata.order }),

          api: metadata.api,
          type: parseInt(metadata.type) || TYPE_MAPPING[dir] || 101,
        }
        if (parseInt(metadata.isAV) === 1) {
          avResultList.push(item)
        } else {
          const category = dir.split('/')[0]
          allInOneResult[category] = allInOneResult[category] || []
          allInOneResult[category].push(item)
        }
      }
    })
  })

  // 定义排序函数
  const sortByOrder = (a, b) => {
    // 如果都有order，按order排序
    if (a.order && b.order) {
      // 获取order的第一个字符(分类字母)
      const aOrderChar = a.order.charAt(0);
      const bOrderChar = b.order.charAt(0);

      // 如果分类字母不同，按字母排序
      if (aOrderChar !== bOrderChar) {
        return aOrderChar.localeCompare(bOrderChar);
      }

      // 如果分类字母相同，按完整order值排序
      const orderCompare = a.order.localeCompare(b.order);
      if (orderCompare !== 0) {
        return orderCompare;
      }

      // 如果order值也相同，按名称长度从短到长排序
      if (a.name.length !== b.name.length) {
        return a.name.length - b.name.length;
      }

      // 最后按名称排序
      return a.name.localeCompare(b.name);
    }
    // 如果只有一个有order，有order的排前面
    if (a.order) return -1;
    if (b.order) return 1;
    // 否则按name排序
    return a.name.localeCompare(b.name);
  };

  // 为各个类别应用排序
  for (const category of Object.keys(allInOneResult)) {
    if (Array.isArray(allInOneResult[category])) {
      allInOneResult[category].sort(sortByOrder);
    }
  }
  
  // avResultList 也按照order排序
  avResultList.sort(sortByOrder);

  const liveData = JSON.parse(fs.readFileSync('live/live.json', 'utf8'))
  allInOneResult.live = liveData

  const cmsData = JSON.parse(fs.readFileSync('cms/cms.json', 'utf8'))
  allInOneResult.vod.push(...cmsData)
  
  // 添加cms数据后再次排序vod
  allInOneResult.vod.sort(sortByOrder);

  // 按指定顺序重新组织 allInOneResult
  const orderedResult = {
    panTools: allInOneResult.panTools || [],
    danMu: allInOneResult.danMu || [],
    recommend: allInOneResult.recommend || [],
    live: allInOneResult.live || [],
    vod: allInOneResult.vod || []
  }

  // 生成各个目录的单独JSON文件
  const categoryDirs = ['panTools', 'danMu', 'recommend', 'vod']
  categoryDirs.forEach(category => {
    if (orderedResult[category] && orderedResult[category].length > 0) {
      // recommend目录使用douban.json作为文件名
      const fileName = category === 'recommend' ? 'douban.json' : `${category}.json`
      const categoryPath = path.join(category, fileName)
      fs.writeFileSync(categoryPath, JSON.stringify(orderedResult[category], null, 2).replaceAll(kLocalPathTAG, ''))
    }
  })

  // 写入整合后的uzAio.json
  fs.writeFileSync('uzAio_raw.json', JSON.stringify(orderedResult, null, 2).replaceAll(kLocalPathTAG, ''))

  // 写入整合后的uzAV.json
  fs.writeFileSync('av_raw_auto.json', JSON.stringify(avResultList, null, 2).replaceAll(kLocalPathTAG, ''))

  let sources = [...orderedResult.panTools, ...orderedResult.danMu, ...orderedResult.recommend, ...orderedResult.live, ...orderedResult.vod, ...avResultList]

  // 使用 JSDelivr CDN 加速
  const [owner, repo] = getRepoInfo()
  const branch = process.env.GITHUB_REF ? process.env.GITHUB_REF.replace('refs/heads/', '') : 'main'
  const githubRawHost = 'https://raw.githubusercontent.com'
  const jsdelivrCDN = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/`

  sources.forEach((item) => {
    // 将 https://raw.githubusercontent.com/user/repo/branch/path 转换为 https://cdn.jsdelivr.net/gh/user/repo@branch/path
    item.api = item.api.replace(`${githubRawHost}/${owner}/${repo}/${branch}/`, jsdelivrCDN)
  })

  fs.writeFileSync('uzAio.json', JSON.stringify(orderedResult, null, 2).replaceAll(kLocalPathTAG, ''))
  fs.writeFileSync('av_auto.json', JSON.stringify(avResultList, null, 2).replaceAll(kLocalPathTAG, ''))

  let sourcesCopy = JSON.parse(JSON.stringify(sources))
  let envList = []
  const envSet = new Set() // 用于去重

  sourcesCopy.forEach((item) => {
    if (item.api.includes(kLocalPathTAG)) {
      item.api = item.api.split(kLocalPathTAG)[1]
    }
    if (item.env?.length > 0) {
      const longList = item.env.split('&&')
      longList.forEach((env) => {
        const oneEnv = env.split('##')
        const envKey = oneEnv[0] // 使用环境变量名作为唯一标识

        // 只有当环境变量名不存在时才添加
        if (!envSet.has(envKey)) {
          envSet.add(envKey)
          envList.push({
            name: oneEnv[0],
            desc: oneEnv[1],
            value: '',
          })
        }
      })
    }
  })

  fs.writeFileSync('local.json', JSON.stringify(sourcesCopy, null, 2))
  fs.writeFileSync('env.json', JSON.stringify(envList, null, 2))
  const includePaths = {
    directories: ['danMu', 'panTools', 'recommend', 'vod', 'live', 'cms'],
    files: ['local.json', 'env.json'],
    excludeFiles: ['douban.json', 'panTools.json', 'danMu.json', 'vod.json', 'README.md']
  }

  const shouldInclude = (filePath) => {
    const relativePath = path.relative(process.cwd(), filePath)
    const fileName = path.basename(relativePath)

    // 检查是否是要排除的文件
    if (includePaths.excludeFiles.includes(fileName)) {
      return false
    }

    // 检查文件是否包含 @deprecated 标记
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        if (content.includes('@deprecated:')) {
          const deprecated = extractValue(content, '@deprecated:')
          if (deprecated && parseInt(deprecated) == 1) {
            return false
          }
        }
      } catch (error) {
        // 如果读取文件失败，继续处理
      }
    }

    // 检查是否是指定的文件
    if (includePaths.files.includes(relativePath)) {
      return true
    }

    // 检查是否在指定的目录下
    return includePaths.directories.some((dir) => relativePath.startsWith(dir))
  }

  // Create a zip archive
  const output = fs.createWriteStream('uzAio.zip')
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Set the compression level
  })

  output.on('close', () => {
    console.log(archive.pointer() + ' total bytes')
    console.log('uzAio.zip has been created')
  })

  archive.on('error', (err) => {
    throw err
  })

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn('Warning:', err)
    } else {
      throw err
    }
  })

  archive.pipe(output)

  try {
    const walk = (directoryPath) => {
      const files = fs.readdirSync(directoryPath)

      files.forEach((file) => {
        try {
          const filePath = path.join(directoryPath, file)
          const stats = fs.statSync(filePath)

          // 只处理包含的文件和目录
          if (!shouldInclude(filePath)) {
            return
          }

          if (stats.isDirectory()) {
            walk(filePath)
          } else {
            archive.file(filePath, {
              name: path.relative(process.cwd(), filePath),
            })
          }
        } catch (err) {
          console.error(`Error processing ${file}:`, err)
        }
      })
    }

    walk(process.cwd())

    // Finalize the archive
    await archive.finalize()
  } catch (err) {
    console.error('Error creating archive:', err)
    throw err
  }

  await updateMarkdownFiles()
}

const updateMarkdownFiles = async () => {
  // 读取 readme/README.main.md 文件
  const readmeContent = fs.readFileSync('readme/README.main.md', 'utf8')
  const [owner, repo] = getRepoInfo()
  const branch = process.env.GITHUB_REF ? process.env.GITHUB_REF.replace('refs/heads/', '') : 'main'
  console.log(process.env.GITHUB_REF)
  const cur = `${owner}/${repo}/refs/heads/${branch}`
  const updatedContent = readmeContent.replaceAll('gs317900225/uzVideo-extensions/refs/heads/main', cur)
  // 写入 README.md 文件
  fs.writeFileSync('README.md', updatedContent)
}

main()
