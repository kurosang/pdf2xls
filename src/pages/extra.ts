export interface ITableItem {
  origin: string
  posts: string
  name: string
  sex: string
  age: string
  degree: string
  tel: string
  years: string
}

export const fields = () => ({
  origin: '简历来源',
  posts: '职位',
  name: '姓名',
  sex: '性别',
  age: '年龄',
  degree: '学历',
  tel: '联系方式',
  years: '工作年限',
})
