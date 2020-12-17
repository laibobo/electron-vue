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
      logs: []
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
  }
}
</script>