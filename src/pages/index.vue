<script setup lang="ts">
import type { Ref } from 'vue'
import { ref } from 'vue'
import type { UploadRequestOptions, UploadUserFile } from 'element-plus'
import { ElLoading } from 'element-plus'
import Export from '../utils'
import { fields } from './extra'
import type { ITableItem } from './extra'

const pdfNums = ref(0)
const doneNums = ref(0)

let loading = ElLoading.service({
  lock: true,
  text: 'Loading',
})

watch(doneNums, (_new, _old) => {
  if (_new === pdfNums.value)
    loading.close()
})

import('pdfjs-dist').then((res) => {
  window.PDFJS = res
  window.PDFJS.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.15.349/pdf.worker.js'
  loading.close()
})
const fileList = ref<UploadUserFile[]>([])

const texts: Ref<ITableItem[]> = ref([])

function onUpload(data: UploadRequestOptions) {
  loading = ElLoading.service({
    lock: true,
    text: 'Loading',
  })
  pdfNums.value++
  return new Promise((resolve, reject) => {
    const file = data.file

    // Step 2: Read the file using file reader
    const fileReader = new FileReader()

    fileReader.onload = (e) => {
    // Step 4:turn array buffer into typed array
      const typedarray = new Uint8Array(e.target?.result)

      gettext(typedarray).then((text: string) => {
        texts.value.push(
          getItemData(text),
        )
        doneNums.value++
        resolve('')
      })
    }
    // Step 3:Read the file as ArrayBuffer
    fileReader.readAsArrayBuffer(file)
  })
}

function gettext(data) {
  const pdf = window.PDFJS.getDocument({ data })
  return pdf.promise.then((pdf) => { // get all pages text
    const maxPages = pdf._pdfInfo.numPages
    const countPromises = [] // collecting all page promises
    for (let j = 1; j <= maxPages; j++) {
      const page = pdf.getPage(j)

      countPromises.push(page.then((page) => { // add page promise
        const textContent = page.getTextContent()

        return textContent.then((text) => { // return content promise
          return text.items.map((s) => { return s.str }).join('') // value page text
        })
      }))
    }
    // Wait for all pages and join text
    return Promise.all(countPromises).then((texts) => {
      return texts.join('')
    })
  })
}

function getItemData(text: string): ITableItem {
  const data = {
    origin: '-',
    posts: '-',
    name: '-',
    sex: '-',
    age: '-',
    degree: '-',
    tel: '-',
    years: '-',
  }
  // origin
  if (text.includes('猎聘'))
    data.origin = '猎聘'

  // posts
  if (text.includes('求职意向')) {
    const idx = text.indexOf('求职意向')
    data.posts = text.slice(idx + 4, idx + 20)
  }

  // name
  if (text.includes('**')) {
    const tmp = text.split('**')
    data.name = `${tmp[0][tmp[0].length - 1]}**`
  }
  else if (text.includes('*')) {
    const tmp = text.split('*')
    data.name = `${tmp[0][tmp[0].length - 1]}*`
  }

  // sex
  if (text.includes('男'))
    data.sex = '男'
  if (text.includes('女'))
    data.sex = '女'

  // age
  const ageM = text.match(/(\d+)岁/g)
  if (ageM)
    data.age = ageM[0]

  // degree
  const degrees = ['高中', '职高', '高技', '中专', '大专', '高职', '本科', '硕士', '博士']
  degrees.forEach((v) => {
    if (text.includes(v))
      data.degree = v
  })

  // tel
  const telM = text.match(/^(?:(?:\+|00)86)?1[3-9]\d{9}$/g)
  if (telM)
    data.tel = telM[0]

  // years
  const yearM = text.match(/(\d+)年/g)
  if (yearM)
    data.years = yearM[0]

  return data
}

function down() {
  Export(JSON.parse(JSON.stringify(texts.value)), fields(), '测试')
  reset()
}
const elupload: any = ref(null)
function reset() {
  texts.value = []
  elupload.value.clearFiles()
}
</script>

<template>
  <div flex flex-col items-center>
    <h1 class="title">
      pdf2xls
    </h1>

    <el-alert w-100 mb-4 title="使用方法" type="warning" :closable="false" />

    <el-alert w-100 mb-4 title="1. 点击读取pdf按钮，选择需要提取的pdf，支持多选" type="success" :closable="false" />

    <el-alert w-100 mb-4 title="2. 提示提取完成之后，点击 导出EXCEL 按钮" type="success" :closable="false" />

    <div flex justify-center>
      <el-upload
        ref="elupload"
        v-model:file-list="fileList"
        class="upload-demo"
        :http-request="onUpload"
        multiple
        :show-file-list="false"
        accept=".pdf"
      >
        <el-button type="primary" bg-blue>
          读取PDF
        </el-button>
      </el-upload>

      <el-button type="success" bg-green-500 hover:bg-green-400 ml-4 @click="down">
        导出EXCEL
      </el-button>
    </div>
  </div>
</template>
