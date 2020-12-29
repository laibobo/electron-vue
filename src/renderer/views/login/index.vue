<template>
    <div>
      <el-row class="col">
        <el-col :span="10" class="h-30">
          <div class="panel"></div>
        </el-col>
        <!-- 操作 -->
        <el-col :span="14" class="h-30">
          <div class="panel" style="padding:0;">
            <el-tabs type="border-card" v-model="activeName">
              <!-- 进吧采集 -->
              <el-tab-pane label="进吧采集" name="first">
                <div class="flex-col">
                  <div class="info">
                    <div style="margin-bottom:10px;">采集页数：<el-input v-model="pageCount" style="width:50px;" size="mini" clearable /> 页</div>
                    <div>延迟：<el-input v-model="delayTime" style="width:60px;" size="mini" clearable /> 毫秒</div>
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
              </el-tab-pane>
              <!-- 全贴吧采集 -->
              <!-- <el-tab-pane label="全贴吧采集" name="second">
                <el-input size="small" clearable />
                <div class="mt-10">  
                  <el-button type="primary" size="small">全吧采集</el-button>
                  <el-input style="width:50px;" size="mini" clearable /> 页
                  <el-button type="danger" size="small">停止</el-button>
                </div>
                <div style="margin-top:52px;">
                  吧内搜索关键字采集：<el-input size="small" style="width:200px;" clearable />
                  <el-button type="primary" size="small">吧内搜索</el-button>
                  <el-button type="danger" size="small">停止采集</el-button>
                </div>
              </el-tab-pane> -->
            </el-tabs>            
          </div>          
        </el-col>
        <!-- 二维码显示 -->
        <el-col :span="10" class="h-50">
          <div class="panel">
            <el-tag type="info">二维码显示</el-tag>
            <div class="image">
              <img :src="image" width="100%" height="100%" border="1" />
            </div>
          </div>          
        </el-col>
        <!-- 采集列表区 -->
        <el-col :span="14" class="h-50">
          <div class="panel">
            <el-tag type="info">采集列表区</el-tag>
            <div class="mt-10">
              <el-button type="success" @click.prevent="exportQRCode" size="small">导出二维码</el-button>
              <div>
                <h4 style="color:red;">自定义导出配置：</h4>
                磁盘：
                <el-select v-model="diskName" style="width:80px;" size="small" placeholder="">
                  <el-option label="D:" value="D:"></el-option>
                  <el-option label="C:" value="C:"></el-option>
                  <el-option label="E:" value="E:"></el-option>
                  <el-option label="F:" value="F:"></el-option>
                </el-select>
                文件夹名称：<el-input style="width:180px;" clearable v-model.trim="compressFileName" size="small" clearable />
              </div>
            </div>
          </div> 
        </el-col>
        <el-col class="logs-col">
          <div class="panel" style="overflow: auto;">
            <p v-for="(item, index) in logs" :key="index" v-html="item"></p>
          </div>
        </el-col>
      </el-row>
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
const superagent = require('superagent')
const request = require('request')
const fs = require('fs')
import { startZIP } from '@/utils/compress-file.js'
import { imagePath } from '~/index.js'
export default {
  name: 'login',
  data() {
    return {
      diskName: 'D:',
      activeName: 'first',
      image: '',
      tbName: '',
      content: '',
      logs: [],
      images: [],
      compressFileName: '',
      folderName: '',
      isCrawler: false,
      delayTime: 300,
      pageCount: 1,
      pageSize: 50,
      currentReq: null,
      isStop: false,
      tiebaNameArr: []
    }
  },
  methods: {
    // 导出二维码
    exportQRCode() {
      if (this.isCrawler) {
        this.$message.warning('数据正在采集中，请采集完之后再导出！')
        return
      }
      if (!this.folderName) {
        this.$message.warning('暂无可导出的数据！')
        return
      }
      const targetDir = imagePath + '/' + this.folderName
      startZIP(targetDir, `${this.diskName}\\`, this.compressFileName)
      this.$message.success('导出成功！')
    },
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
          await new Promise((resolve) => {
            setTimeout(() => {
              resolve()
            }, this.delayTime)
          })
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
        this.saveFile(dir, imageUrl, `${pageIndex}-${index}.jpeg`)
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
    saveFile(dir, url, filename) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
      const filePath = `${dir}/${filename}`
      request(url).pipe(fs.createWriteStream(filePath))
      this.images.push(filePath)
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss">
  .image{
    width: 300px;
    height: 300px;
    background: #eee;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .col{
    position: absolute;
    height: 100%;
    width: 100%;
    /deep/.el-col{
      position: relative;
      padding: 5px;  
    }
    .mt-10{
      margin-top: 10px;
    }
    .panel{
      width: 100%;
      height: 100%;
      box-shadow: 0 0 8px #ccc;
      box-sizing: border-box;
      padding: 5px;
      overflow: hidden;
      .flex-col{
        display: flex;
        align-items: flex-start;
        &*{
          flex: 1;
        }
        .info{
          width: 300px;
          padding-left: 10px;
        }
      }
    }
  }
  .w-50{
    width: 50%;
    float: left;
  }
  .h-30{
    height: 30%;
  }
  .h-50{
    height: 50%;
  }
  .logs-col{
    height: 20%;
    overflow: auto;
  }
</style>