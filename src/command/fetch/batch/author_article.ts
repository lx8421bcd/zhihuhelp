import AuthorApi from '~/src/api/author'
import MAuthor from '~/src/model/author'
import BatchFetchArticle from '~/src/command/fetch/batch/article'
import Base from '~/src/command/fetch/batch/base'
import CommonUtil from '~/src/library/util/common'
import RequestConfig from '~/src/config/request'

class BatchFetchAuthorArticle extends Base {
  async fetch(urlToken: string) {
    this.log(`开始抓取用户${urlToken}的数据`)
    this.log(`获取用户信息`)
    const authorInfo = await AuthorApi.asyncGetAutherInfo(urlToken)
    await MAuthor.asyncReplaceAuthor(authorInfo)
    this.log(`用户信息获取完毕`)
    const name = authorInfo.name
    const authorId = authorInfo.id
    const articleCount = authorInfo.articles_count
    this.log(`用户${name}(${urlToken})共发布了${articleCount}篇文章`)
    this.log(`开始抓取文章列表`)
    let batchFetchArticle = new BatchFetchArticle()
    let articleIdList = []
    let loopCounter = 0
    for (let offset = 0; offset < articleCount; offset = offset + this.max) {
      let authorArticlesList = await AuthorApi.asyncGetAutherArticleList(urlToken, offset, this.max)
      for (let authorArticle of authorArticlesList) {
        let articleId = `${authorArticle.id}`
        articleIdList.push(articleId)
      }
      this.log(`用户发表的第${offset}~${offset + this.max}篇文章简介获取完毕`)
      loopCounter = loopCounter + 1
      if (loopCounter % RequestConfig.perLoop2TriggerProtect === 0) {
        this.log(`第${loopCounter}次抓取, 休眠${RequestConfig.waitSecond2ProtectZhihuServer}s, 保护知乎服务器`)
        await CommonUtil.asyncSleep(RequestConfig.waitSecond2ProtectZhihuServer * 1000)
      }
    }
    this.log(`开始抓取用户${name}(${urlToken})的所有文章详情,共${articleIdList.length}篇`)
    await batchFetchArticle.fetchListAndSaveToDb(articleIdList)
    this.log(`用户${name}(${urlToken})的文章列表抓取完毕`)
  }
}

export default BatchFetchAuthorArticle
