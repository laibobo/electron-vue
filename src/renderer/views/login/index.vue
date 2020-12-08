<template>
    <div style="padding:20px;">
      <el-card class="box-card">
        <div slot="header" class="clearfix">
          <span>卡片名称</span>
          <el-button style="float: right; padding: 3px 0" type="text">操作按钮</el-button>
        </div>
        <div class="text item">
          <el-input placeholder="输入贴吧名称" v-model="tbName"></el-input>
          <el-button style="margin-top:20px;" @click="reqdd">确认</el-button>
        </div>
      </el-card>
      
      <div class="image">
        <img :src="image" />
      </div>
      <div v-html="content"></div>
    </div>
  </div>
</template>

<script>
const superagent = require('superagent')
const request = require('request')
const fs = require('fs')

export default {
  name: 'login',
  data() {
    return {
      image: '',
      tbName: '',
      content: ''
    }
  },
  methods: {
    reqdd() {
      const tbName = encodeURI(this.tbName)
      const url = `https://tieba.baidu.com/f?ie=utf-8&kw=${tbName}&fr=search`
      const browserMsg = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36',
        'Host': 'tieba.baidu.com',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': url,
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin'
      }

      superagent
        .get(url)
        .set(browserMsg)
        // eslint-disable-next-line handle-callback-err
        .end((err, res) => {
          const arr = res.text.match(/bpic=\"http[s]{0,1}:\/\/(tiebapic|imgsa).baidu.com\/forum([^\'\"]*)[\']?/g) || []
          this.loadImage(arr)
        })
    },
    async loadImage(images) {
      const arr2 = []
      const folderName = new Date().getTime()
      for (let index = 0; index < images.length; index++) {
        const imageUrl = images[index].replace('bpic=\"', '')
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve()
          }, 500)
        })
        this.download(imageUrl, index, folderName)
        arr2.push(imageUrl)
      }
    },
    download(url, filename, folderName) {
      if (!fs.existsSync(`./images/${folderName}`)) {
        fs.mkdirSync(`./images/${folderName}`)
      }
      console.log(`下载${filename}中...`)
      request(url).pipe(fs.createWriteStream(`./images/${folderName}/${filename}.jpg`))
      this.image = `http://localhost:9080/images/${folderName}/${filename}.jpg`
      console.log('image:', this.image)
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss">
  .image{
    width: 200px;
    height: 200px;

  }
  iframe{
    width: 100%;
    height: 100%;
  }
</style>