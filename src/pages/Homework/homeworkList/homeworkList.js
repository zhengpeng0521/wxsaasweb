import wepy from 'wepy'
import { serviceRequestJson } from '../../../utils/request'
import BlankDataPage from '../../../components/blankDataPage/blankDataPage'
import Refresh from '../../../components/refresh/refresh'

export default class LeadsList extends wepy.page {
  config = {
    navigationBarTitleText: '作业记录',
    disableScroll: true
  }
  components = {
    blankDataPage: BlankDataPage,
    refresh: Refresh
  }
  data = {
    scrollTop: 0,
    listtrue: false,
    list: [], // 列表数据
    resultCount: 0, // 列表数据总数
    searchLoading: false, // 下拉记载更多
    searchLoadingComplete: false,  // 加载完毕
    listTop: 0,
    offsetTop: 0,
    topDis: 0,
    placeholder: '搜索班级',  // 搜索属性
    stuNameMobile: undefined,  // 手机号或姓名搜索
    heistart: 0,
    heimove: 0,
    getListparams: {
      pageIndex: 0,
      pageSize: 20,
      className: ''
    },
    refmove: {
      isRefreshing: false,
      hei: 0,
      con: '',
      succee: false
    },
    mId: {
      org_id: null,
      tenant_id: null,
      user_id: null
    }
  }
  // 初始化进入页面
  onLoad(query) {
    wx.showLoading({
      title: '加载中'
    })
    let type = decodeURI(decodeURIComponent(query.type))
    let types = (!!query.type && JSON.parse(type)) || {}
    const userInfo = JSON.parse(types.userInfo).avatarUrl
    const imga = {
      avatar: userInfo,
      code: types.code
    }
    this.addTeacherInfo(imga)
  }
  // 页面 出现时调用
  onShow() {
    const updateHomework = wx.getStorageSync('updateHomework')
    if (updateHomework) {
      wx.removeStorageSync('updateHomework')
      this.list = []
      this.getListparams.pageIndex = 0
      this.getClassesList(this.getListparams)
      return
    }
    const pages = getCurrentPages() //eslint-disable-line
    const currPage = pages[pages.length - 1]
    if (currPage.data.pagetype) {
      const data = JSON.parse(currPage.data.pagetype)
      const {index, commitNum, passNum, readNum, sendNum} = data
      this.list[index].commitNum = commitNum
      this.list[index].passNum = passNum
      this.list[index].readNum = readNum
      this.list[index].sendNum = sendNum
    }
  }

  async addTeacherInfo(pareform) {
    const url = `${this.$parent.service.base_url}/ss-mic-provider/mic/sgb/teacher/addTeacherInfo`
    const res = await serviceRequestJson(url, pareform)
    const { errorCode, userId, orgId, tenantId } = res
    if (res && errorCode === 0) {
      setTimeout(() => {
        wx.hideLoading()
      }, 100)
      wx.setStorageSync('tea_uid', userId)
      wx.setStorageSync('tea_orgId', orgId)
      wx.setStorageSync('tea_tenantId', tenantId)
      this.mId.org_id = wx.getStorageSync('tea_orgId')
      this.mId.tenant_id = wx.getStorageSync('tea_tenantId')
      this.mId.user_id = wx.getStorageSync('tea_uid')
      this.$parent.mId.org_id = wx.getStorageSync('tea_orgId')
      this.$parent.mId.tenant_id = wx.getStorageSync('tea_tenantId')
      this.$parent.mId.user_id = wx.getStorageSync('tea_uid')
      this.getClassesList(this.getListparams)
    }
  }

  // 请求列表数据
  async getClassesList(params) {
    this.searchLoadingComplete = false
    let url = `${this.$parent.service.base_url}/ss-mic-provider/mic/sgb/teacher/homeworkQueryList`
    const res = await serviceRequestJson(url, params)
    const { errorCode, data, results } = res
    if (res && errorCode === 0) {
      this.list = results
      this.resultCount = data.resultCount
      if (this.list.length === 0) {
        this.listtrue = true
      } else {
        this.listtrue = false
      }
      this.refmove.con = '刷新成功'
      this.refmove.succee = true
      setTimeout(() => {
        this.refmove.isRefreshing = false
        this.refmove.succee = false
        this.$apply()
      }, 1200)

      this.$apply()
    }
  }

  methods = {
    homework() {
      const items = {
        type: 'homerela'
      }
      let str = JSON.stringify(items)
      str = encodeURIComponent(encodeURI(str))
      wx.navigateTo({
        url: `../sendpic/sendpic?str=${str}`
      })
      wx.reportAnalytics('assign_homework', this.mId)
    },
    scroll(e) {
      this.scrollTop = e.detail.scrollTop
    },
    // 上拉加载更多
    async scrollToLower(e) {
      if (!this.searchLoading) {
        this.searchLoading = true    // 设置为加载状态
        if (this.list.length >= this.resultCount) {
          this.searchLoadingComplete = true
          this.searchLoading = false          // 设置为加载状态
        } else {
          let url = `${this.$parent.service.base_url}/ss-mic-provider/mic/sgb/teacher/homeworkQueryList`
          this.getListparams.pageIndex = ++this.getListparams.pageIndex
          const res = await serviceRequestJson(url, this.getListparams)
          const { errorCode, errorMessage, data, results } = res

          if (res && errorCode === 0) {
            const newList = [...this.list, ...results]
            this.list = newList
            this.searchLoading = false
            this.getListparams.pageIndex = data.pageIndex
            this.$apply()
          } else {
            wx.showModal({ content: errorMessage || '网络异常', showCancel: false, confirmColor: '#5d9cec' })
          }
        }
      }
    },

    // 点击进入名单详情
    goPage(id, index) {
      wx.navigateTo({
        url: `../studentWork/studentWork?id=${id}&index=${index}`
      })

      wx.reportAnalytics('homework_list', this.mId)
    },
    listStart(e) {
      this.heistart = e.touches[0].clientY
    },
    listMove: function (e) {
      this.heimove = e.touches[0].clientY
      let heis = Math.round(this.heimove - this.heistart)

      if (heis > 0 && this.scrollTop === 0) {
        this.refmove.isRefreshing = true
        if (heis > 75) {
          this.refmove.hei = 75 * 2
        } else if (heis < 15) {
          this.refmove.hei = 15 * 2
        } else {
          this.refmove.hei = heis * 2
        }
        this.refmove.con = '松开刷新'
        this.$apply()
      }
    },
    listEnd(e) {
      if (this.refmove.isRefreshing === true) {
        // this.getListparams.pageIndex = 0
        this.getClassesList(this.getListparams)
      }
    }
  }
}
