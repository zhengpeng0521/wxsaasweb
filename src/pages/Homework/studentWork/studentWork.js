import wepy from 'wepy'
import { serviceRequestJson } from '../../../utils/request'
import BlankDataPage from '../../../components/blankDataPage/blankDataPage'

export default class studentWork extends wepy.page {
  config = {
    navigationBarTitleText: '作业详情'
  }
  components = {
    blankDataPage: BlankDataPage
  }
  data = {
    list: {}, // 列表数据
    detailsFlag: false,
    modelFlag: false,
    homeworkId: null,
    btnflag: false,
    delFlag: false,
    homeWorkList: null,
    mId: {
      org_id: null,
      tenant_id: null,
      user_id: null
    }
  }

  // 初始化进入页面
  onLoad(query) {
    let id = query.id
    let index = query.index
    this.homeworkId = id
    this.homeWorkList = +index
    this.getStuHomeWorkQueryList()
  }
  // 页面 出现时调用
  onShow() {
    this.mId.org_id = wx.getStorageSync('tea_orgId')
    this.mId.tenant_id = wx.getStorageSync('tea_tenantId')
    this.mId.user_id = wx.getStorageSync('tea_uid')
    let contractListItem = wx.getStorageSync('contractListItem')
    if (contractListItem) {
      for (let i = 0; i < this.list.length; i++) {
        let item = this.list[i]
        if (item.orderNumber === contractListItem.orderId) {
          this.list.splice(i, 1)
        }
      }
      this.$apply()
      wx.removeStorageSync('contractListItem')
    }

    const pages = getCurrentPages() //eslint-disable-line
    const currPage = pages[pages.length - 1]  // 当前页
    if (currPage.data.pagetype !== undefined) {
      const id = {
        id: currPage.data.pagetype.id
      }
      this.getHomeworkInfo(id)
    }
  }
  onUnload() {
    let pages = getCurrentPages() //eslint-disable-line
    let prevPage = pages[pages.length - 2]

    const data = {
      index: this.homeWorkList,
      commitNum: this.list.commitNum,
      passNum: this.list.passNum,
      readNum: this.list.readNum,
      sendNum: this.list.sendNum
    }
    prevPage.setData({
      pagetype: JSON.stringify(data)
    })
  }

  // 请求列表数据
  async getStuHomeWorkQueryList() {
    const data = { homeworkId: this.homeworkId }
    const url = `${this.$parent.service.base_url}/ss-mic-provider/mic/sgb/teacher/stuHomeWorkQueryList`
    const res = await serviceRequestJson(url, data)
    const { errorCode, status } = res
    if (res && errorCode === 0) {
      if (status === 0) {
        this.delFlag = true
        this.$apply()
        return
      }
      this.list = res

      // const url = `${this.$parent.service.base_url}/ss-mic-provider/mic/sgb/general/getHomeworkInfo`
      // const res1 = await serviceRequestJson(url, { id: this.homeworkId })
      // this.list.content = res1.content
      // this.list.imgs = JSON.parse(res1.imgs)
      this.getHomeworkInfo()
      this.$apply()
    }
  }
  async getHomeworkInfo(parm) {
    const url = `${this.$parent.service.base_url}/ss-mic-provider/mic/sgb/general/getHomeworkInfo`
    const res = await serviceRequestJson(url, parm = {id: this.homeworkId})
    const usword = res.content || ''
    if (res.imgs === null || res.imgs === '') {
      this.list.imgs = []
    } else {
      this.list.imgs = JSON.parse(res.imgs)
    }
    this.list.content = usword
    this.$apply()
  }
  methods = {
    previewImage(item) {
      wx.previewImage({
        urls: this.list.imgs,
        current: item
      })
    },
    del() {
      this.modelFlag = false
      const _this = this
      wx.showModal({
        title: '提示',
        content: '删除后，学员已提交的作业内容也将被清空',
        success: async function (res) {
          if (res.confirm) {
            const url = `${_this.$parent.service.base_url}/ss-mic-provider/mic/sgb/teacher/deleteHomework`
            const res = await serviceRequestJson(url, { homeworkId: _this.homeworkId })
            if (res.errorCode === 0) {
              _this.delFlag = true
              wx.setStorageSync('updateHomework', true)
              wx.showToast({ title: '删除成功', icon: 'success', duration: 1000 })
              wx.reportAnalytics('homework_del', _this.mId)  // 埋点
              _this.$apply()
            }
          } else if (res.cancel) {
            console.log('取消')
          }
        }
      })
    },
    edit() {
      this.modelFlag = false
      const items = {
        type: 'homerela',
        content: this.list,
        homeworkId: this.homeworkId
      }
      let str = JSON.stringify(items)
      str = encodeURIComponent(encodeURI(str))
      wx.navigateTo({
        url: `../sendpic/sendpic?str=${str}`
      })
      wx.reportAnalytics('homework_compile', this.mId) // 埋点
    },
    cancel() {
      this.modelFlag = false
    },
    modeShow() {
      this.modelFlag = true
    },
    getMoreDetails() {
      this.detailsFlag = !this.detailsFlag
    },
    // 点击进入名单详情
    goPage(item) {
      if (item.status === 0 || item.status === 1 || item.status === 5) {
        wx.showToast({
          icon: 'none',
          title: '学员未提交作业',
          duration: 1000
        })
        return
      }
      wx.navigateTo({
        url: `../details/details?id=${item.stuWorkId}`
      })
    },

    readOver() {
      const _this = this
      wx.showModal({
        title: '提示',
        content: '将已提交作业内容全部批阅通过?',
        success: async function (res) {
          if (res.confirm) {
            _this.btnflag = true
            wx.showLoading({
              title: '正在批阅'
            })
            let stuWorkId = _this.list.stuHomeworkList.map(item => item.stuWorkId)
            stuWorkId = stuWorkId.join(',')
            const data = {
              stuHomeworkId: stuWorkId,
              status: '4'
            }
            const url = `${_this.$parent.service.base_url}/ss-mic-provider/mic/sgb/teacher/stuHomeworkAudit`
            const res = await serviceRequestJson(url, data)
            _this.btnflag = false
            if (res && res.errorCode === 0) {
              wx.showToast({ title: '成功', icon: 'success', duration: 1000 })
              _this.getStuHomeWorkQueryList()
              wx.reportAnalytics('homework_correct_all', _this.mId) // 埋点
              _this.$apply()
            }
            _this.$apply()
          } else if (res.cancel) {
            console.log('取消')
          }
        }
      })
    }
  }
}
