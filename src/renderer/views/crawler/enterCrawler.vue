<template>
  <div>
    <div class="flex-col">
      <el-input type="textarea" :rows="3" resize="none" />
      <div class="info">
        <div style="margin-bottom:10px;">采集页数：<el-input v-model="pageCount" style="width:50px;" size="mini" clearable /> 页</div>
        <div>延迟：<el-input v-model="delay" style="width:60px;" size="mini" clearable /> 毫秒</div>
      </div>
    </div>
    <div>
      <el-button type="success" size="small" style="margin-top:20px;" @click="jbGather">查看热门贴吧方法</el-button>
      <span v-html="`<<<（自动获取热门贴吧/天天更新[获取源来自百度]）`"></span>
    </div>
    <div style="margin-top:8px;">
      <el-input size="small" v-model.trim="tbName" style="width:130px;" clearable />
      <span v-html="`<<<输入贴吧名称`"></span>
      <el-button type="primary" size="small" @click="jbGather">开始采集</el-button>
      <el-button type="danger" size="small" @click="stopJbGather" :disabled="!isCrawler">停止采集</el-button>
    </div>
  </div>
</template>
<script>
const browserMsg = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36',
  'Host': 'tieba.baidu.com',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'zh-CN,zh;q=0.9',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin'
}
export default {
  data() {
    return {
      pageCount: 3,
      pageSize: 50,
      tbName: '',
      delay: 300,
      isCrawler: false,
      currentReq: null,
      isStop: false,
      logs: [],
      folderName: ''
    }
  },
  methods: {
    // 进吧采集-停止
    stopJbGather() {
      if (this.currentReq) {
        this.currentReq.abort()
      }
      this.isStop = true
    },
    // 进吧采集
    async jbGather() {
      if (!this.tbName) {
        this.$message.warning('请输入贴吧名称！')
        return
      }
      this.isStop = false
      this.folderName = ''
      this.logs = ['正在读取数据...']
      let pn = 0
      let pageIndex = 1
      while (pageIndex <= this.pageCount) {
        if (this.isStop) {
          console.log('停止了')
          pageIndex = this.pageCount + 1
        } else {
          pn = (pageIndex - 1) * this.pageSize
          await this.requestCrawl(pn, pageIndex)
          pageIndex++
        }
      }
    },
    requestCrawl(pn, pageIndex) {
      return new Promise((resolve, reject) => {
        this.isCrawler = true
        const tbName = encodeURI(this.tbName)
        const url = `https://tieba.baidu.com/f?ie=utf-8&kw=${tbName}&pn=${pn}`
        this.currentReq = superagent.get(url).retry(3).set(browserMsg)
        this.currentReq.end(async(err, res) => {
          this.currentReq = null
          if (err) {
            this.$message.error(err)
            this.logs.unshift(`第${pageIndex}页读取失败：${err}`)
            this.folderName = ''
            reject(new Error(err))
          } else {
            const imagesArr = res.text.match(/bpic=\"http[s]{0,1}:\/\/(tiebapic|imgsa).baidu.com\/forum([^\'\"]*)[\']?/g) || []
            this.tiebaNameArr = res.text.match(/target=\"_blank\" class=\"j_th_tit \">([^\'\"]*)<\/a>/g) || []
            if (imagesArr.length === 0) {
              this.$message.warning('未检索到数据~')
              this.isCrawler = false
              return
            }
            if (!this.folderName) {
              this.folderName = new Date().getTime()
            }
            await this.parseImage(imagesArr, pageIndex)
            this.isCrawler = false
            resolve()
          }
        })
      })
    },
    async parseImage(images, pageIndex) {
      const dir = `./images/${this.folderName}`
      for (let index = 0; index < images.length; index++) {
        const imageUrl = images[index].replace('bpic=\"', '')
        this.download(dir, imageUrl, `${pageIndex}-${index}.jpeg`)
      }
      await this.showImage()
    },
    // 显示
    async showImage() {
      const arr = this.images
      const tiebaNameArr = this.tiebaNameArr
      for (let i = 0; i < arr.length; i++) {
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve()
          }, 300)
          this.image = arr[i]
          if (i < tiebaNameArr.length) {
            this.logs.unshift(`正在解析 <a ${tiebaNameArr[i]} 帖子...`)
          }
        })
      }
      this.image = ''
    },
    // 下载
    download(dir, url, filename) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
      request(url).pipe(fs.createWriteStream(`${dir}/${filename}`))
      this.images.push(`${dir}/${filename}`)
    }
  }
}
</script>