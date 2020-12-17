const fs = require('fs')
const JSZip = require('jszip')
const zip = new JSZip()

/**
 * 删除文件
 * @param  {string} filePath 文件地址
 */
export function delFile(filePath) {
  fs.unlink(filePath, function(err) {
    if (err) {
      console.log('删除文件失败：', err)
    }
  })
}

export function readDir(nowPath) {
  const files = fs.readdirSync(nowPath)// 读取目录中的所有文件及文件夹（同步操作）
  files.forEach(function(fileName) { // 遍历检测目录中的文件
    const fillPath = nowPath + '/' + fileName
    const file = fs.statSync(fillPath)// 获取一个文件的属性
    if (file.isDirectory()) { // 如果是目录的话，继续查询
      const dirlist = zip.folder(fileName)// 压缩对象中生成该目录
      readDir(dirlist, fillPath)// 重新检索目录文件
    } else {
      zip.file(fileName, fs.readFileSync(fillPath))// 压缩目录添加文件
    }
  })
}
/**
 * 压缩文件
 *@param {string} targetDir 目标文件地址
 *@param {string} saveDir 保存文件地址
 *@param {string} fileName 保存文件名称
*/
export function startZIP(targetDir, saveDir, fileName) {
  // 文件的绝对路径 当前当前js所在的绝对路径
  readDir(targetDir)
  zip.generateAsync({// 设置压缩格式，开始打包
    type: 'nodebuffer', // nodejs用
    compression: 'DEFLATE', // 压缩算法
    compressionOptions: {// 压缩级别
      level: 9
    }
  }).then(function(content) {
    fileName = fileName || new Date().getTime() + '_qiuqiu_QRCode'
    const sd = saveDir + fileName
    if (!fs.existsSync(sd)) {
      fs.mkdirSync(sd)
    }
    fs.writeFileSync(sd + '/' + fileName + '.zip', content, 'utf-8')
    delFile(targetDir)
  })
}
