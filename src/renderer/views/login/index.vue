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
                  <el-input type="textarea" :rows="3" resize="none" />
                  <div class="info">
                    <div style="margin-bottom:10px;">采集页数：<el-input  style="width:50px;" size="mini" clearable /> 页</div>
                    <div>延迟：<el-input  style="width:60px;" size="mini" clearable /> 毫秒</div>
                  </div>
                </div>
                <div>
                  <el-button type="success" size="small" style="margin-top:20px;" @click="jbGather">查看热门贴吧方法</el-button>
                  <span v-html="`<<<（自动获取热门贴吧/天天更新[获取源来自百度]）`"></span>
                </div>
                <div style="margin-top:8px;">
                  <el-input size="small" v-model="tbName" style="width:130px;" clearable />
                  <span v-html="`<<<输入贴吧名称`"></span>
                  <el-button type="primary" size="small" @click="jbGather">开始采集</el-button>
                  <el-button type="danger" size="small" @click="jbGather">停止采集</el-button>
                </div>
              </el-tab-pane>
              <!-- 全贴吧采集 -->
              <el-tab-pane label="全贴吧采集" name="second">
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
              </el-tab-pane>
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
              <el-button type="success">导出二维码</el-button>自定义导出图片文件夹标题 <el-input style="width:120px;" clearable />
            </div>
          </div> 
        </el-col>
        <el-col class="logs-col">
          <div class="panel" style="overflow: auto;">
            <p v-for="item in logs" :key="item">{{ item }}</p>
          </div>
        </el-col>
      </el-row>
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
      activeName: 'first',
      image: '',
      tbName: '',
      content: '',
      logs: [],
      images: []
    }
  },
  methods: {
    // 进吧采集
    jbGather() {
      this.logs = ['正在解析中...']
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

      const req = superagent.get(url).retry(3).set(browserMsg)
      console.log('req', req)
      req.end((err, res) => {
        const arr = res.text.match(/bpic=\"http[s]{0,1}:\/\/(tiebapic|imgsa).baidu.com\/forum([^\'\"]*)[\']?/g) || []
        this.loadImage(arr)
        console.log(err)
      })
    },
    loadImage(images) {
      const folderName = new Date().getTime()
      for (let index = 0; index < images.length; index++) {
        const imageUrl = images[index].replace('bpic=\"', '')
        this.logs.unshift(`正在${index}读取...`)
        const dir = `./images/${folderName}`
        this.download(imageUrl, index, dir)
      }
      this.showImage()
    },
    // 显示
    async showImage() {
      const arr = this.images
      for (let i = 0; i < arr.length; i++) {
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve()
          }, 800)
          this.image = arr[i]
        })
      }
    },
    // 下载
    download(url, filename, dir) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
      request(url).pipe(fs.createWriteStream(`${dir}/${filename}.jpeg`))
      this.images.push(`${dir}/${filename}.jpeg`)
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