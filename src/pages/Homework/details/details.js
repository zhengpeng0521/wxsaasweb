import wepy from 'wepy'
import { serviceRequestJson } from '../../../utils/request'
export default class details extends wepy.page {
  config = {
    navigationBarTitleText: '作业详情'
  }
  data = {
    userId: null,
    itemt: {
      type: 'comment' // 评论
    },
    itemh: {
      type: 'reply'
    }, // 回复
    stuHomeworkId: null,
    list: {},
    btnflag: false,
    homeworkFeedbackList: [],
    mId: {
      org_id: null,
      tenant_id: null,
      user_id: null
    }
  }
  onLoad(query) {
    let id = decodeURI(decodeURIComponent(query.id))
    this.stuHomeworkId = id
    this.stuHomeworkInfo()
  }
  async stuHomeworkInfo() {
    const data = { stuHomeworkId: this.stuHomeworkId }
    const url = `${this.$parent.service.base_url}/ss-mic-provider/mic/sgb/general/stuHomeworkInfo`
    const res = await serviceRequestJson(url, data)
    const { errorCode, imgs } = res
    if (res && errorCode === 0) {
      this.list = res
      if (imgs === null || imgs === '') {
        this.list.imgs = []
      } else {
        this.list.imgs = JSON.parse(imgs)
      }
    }
    this.getHomeworkFeedbackList()
    this.$apply()
  }
  onShow() {
    this.userId = wx.getStorageSync('tea_uid')
    this.mId.org_id = wx.getStorageSync('tea_orgId')
    this.mId.tenant_id = wx.getStorageSync('tea_tenantId')
    this.mId.user_id = wx.getStorageSync('tea_uid')
    const pages = getCurrentPages() //eslint-disable-line
    const currPage = pages[pages.length - 1]  // 当前页
    if (currPage.data.pagetype !== undefined) {
      const id = {
        stuHomeworkId: currPage.data.pagetype.stuHomeworkId
      }
      this.getHomeworkFeedbackList(id)
    }
  }
  async getHomeworkFeedbackList(parms = {stuHomeworkId: this.stuHomeworkId}) {
    let url = `${this.$parent.service.base_url}/ss-mic-provider/mic/sgb/general/getHomeworkFeedbackList`
    const res = await serviceRequestJson(url, parms)
    if (res.errorCode === 0) {
      let homeworkFeedbackList = res.homeworkFeedbackList || []
      this.homeworkFeedbackList = homeworkFeedbackList
      this.$apply()
      if (wx.getStorageSync('detailsToBottm')) {
        wx.removeStorageSync('detailsToBottm')
        wx.createSelectorQuery().select('.details').boundingClientRect(rect => {
          wx.pageScrollTo({
            scrollTop: rect.height,
            selector: '.details',
            duration: 0
          })
        }).exec()
      }
    }
  }
  methods = {
    previewImage(item) {
      wx.previewImage({
        urls: this.list.imgs,
        current: item
      })
    },
    async pass() {
      this.btnflag = true
      wx.showLoading({
        title: '正在批阅'
      })
      const data = {
        stuHomeworkId: this.stuHomeworkId,
        status: '4'
      }
      const url = `${this.$parent.service.base_url}/ss-mic-provider/mic/sgb/teacher/stuHomeworkAudit`
      const res = await serviceRequestJson(url, data)
      if (res && res.errorCode === 0) {
        wx.reportAnalytics('homework_details_pass', this.$parent.mId)
        this.btnflag = false
        this.list.status = '4'
        wx.showToast({ title: '已通过批阅', icon: 'success', duration: 1000 })
      }
      this.$apply()
    },
    optimize() {
      const _this = this
      wx.showModal({
        title: '提示',
        content: '家长端的作业状态会变为再优化，是否重新优化?',
        success: async function (res) {
          if (res.confirm) {
            const data = {
              stuHomeworkId: _this.stuHomeworkId,
              status: '3'
            }
            const url = `${_this.$parent.service.base_url}/ss-mic-provider/mic/sgb/teacher/stuHomeworkAudit`
            const res = await serviceRequestJson(url, data)
            if (res && res.errorCode === 0) {
              _this.btnflag = false
              _this.list.status = '3'

              wx.reportAnalytics('homework_details_optimize', _this.$parent.mId)
              wx.showToast({ title: '已提醒学员再优化', icon: 'success', duration: 1000 })
            }
            _this.$apply()
          } else if (res.cancel) {
            console.log('取消')
          }
        }
      })
    },
    toPage(item, type, itmet) {
      // 评论
      if (type.type === 'comment') {
        type.id = item.id
        let str = JSON.stringify(type)
        str = encodeURIComponent(encodeURI(str))
        wx.navigateTo({
          url: `../sendpic/sendpic?str=${str}`
        })
        wx.reportAnalytics('homework_details_comment', this.mId) // 埋点
        // const dynamicId = {
        //   dynamicId: items
        // }
        // var promise = new Promise((resolve, reject) => {
        //   this.dynamicInfo(dynamicId, '', resolve)
        // })
        // promise.then(() => {
        //   if (this.status === 0) {
        //     const that = this
        //     wx.showModal({ content: '该动态已经删除',
        //       showCancel: false,
        //       confirmColor: '#5d9cec',
        //       complete: function () {
        //         that.getListparams.pageIndex = 0
        //         that.getList(that.getListparams)
        //       }})
        //   } else if (this.status === 1) {
        //     item.tid = items
        //     item.index = id
        //     let str = JSON.stringify(item)
        //     str = encodeURIComponent(encodeURI(str))
        //     wx.navigateTo({
        //       url: `../../../component/pages/Replytocomments/replaycomment?str=${str}`
        //     })
        //   }
        // })
        // return
      }
      // 回复
      if (type.type === 'reply') {
        if (itmet.customerId === this.userId) {
          wx.showToast({
            icon: 'none',
            title: '自己不能回复自己',
            duration: 1000
          })
          return
        }
        itmet.type = type.type
        itmet.stuHomeworkId = item.id
        let str = JSON.stringify(itmet)
        str = encodeURIComponent(encodeURI(str))
        wx.navigateTo({
          url: `../sendpic/sendpic?str=${str}`
        })
        // if (items.customerId === this.userId) {
        //   wx.showToast({
        //     icon: 'none',
        //     title: '自己不能回复自己',
        //     duration: 1000
        //   })
        // } else {
        //   items.type = item.type
        //   items.tid = id
        //   items.index = index
        //   let str = JSON.stringify(items)
        //   str = encodeURIComponent(encodeURI(str))
        //   wx.navigateTo({
        //     url: `../../../component/pages/Replytocomments/replaycomment?str=${str}`
        //   })
        // }
      }
    },
    delComment(item) {
      if (item.customerId !== this.userId) {
        return
      }
      const _this = this
      wx.showModal({
        title: '提示',
        content: '确定要删除此条评论吗?',
        success: async function (res) {
          if (res.confirm) {
            const url = `${_this.$parent.service.base_url}/ss-mic-provider/mic/sgb/general/deleteHomeworkFeedback`
            const res = await serviceRequestJson(url, { homeworkFeedbackId: item.id })
            if (res.errorCode === 0) {
              wx.showToast({ title: '成功', icon: 'success', duration: 1000 })
              _this.getHomeworkFeedbackList()
            }
          } else if (res.cancel) {
            // console.log('取消')
          }
        }
      })
    }
  }
}
