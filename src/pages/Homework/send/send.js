import wepy from 'wepy'
import moment from 'moment'
import { serviceRequestJson } from '../../../utils/request.js'
import BlankDataPage from '../../../components/blankDataPage/blankDataPage'

export default class AttendanceList extends wepy.page {
  config = {
    navigationBarTitleText: '发送对象'
  }

  components = {
    blankDataPage: BlankDataPage
  }

  data = {
    currentDate: moment().format('YYYY-MM-DD'),
    selectedDate: moment().format('YYYY-MM-DD'),
    optionflag: [],
    list: [],
    stuArr: [],
    stuNum: 0
  }

  onLoad(query) {
    const data = JSON.parse(decodeURI(decodeURIComponent(query.str)))
    if (data.type.length !== 0) {
      this.list = data.type
      this.selectedDate = data.time
      this.stuNum = data.stuNum
    } else {
      this.getList()
    }
  }
  onShow() {
    let pages = getCurrentPages() //eslint-disable-line
    let prevPage = pages[pages.length - 2]
    prevPage.setData({
      pagetype: null
    })
  }
  async getList() {
    const params = {studyDate: this.selectedDate}
    const url = `${this.$parent.service.base_url}/ss-mic-provider/mic/sgb/teacher/checkQueryList`
    const res = await serviceRequestJson(url, params)
    const {errorCode, results} = res
    if (errorCode === 0) {
      this.list = results
      this.$apply()
    }
  }
  methods = {
    // 选择日期
    selectCurrentDate(e) {
      this.selectedDate = e.detail.value
      this.getList()
    },

    // 上一天 下一天
    clickToChangeDay(key) {
      if (this.selectedDate === this.currentDate && key === 'nextDay') {
        return
      }
      let selectedDate          // 当钱选中日期
      if (key === 'lastDay') {
        selectedDate = moment(this.selectedDate).subtract(1, 'd').format('YYYY-MM-DD')
      } else if (key === 'nextDay') {
        selectedDate = moment(this.selectedDate).add(1, 'd').format('YYYY-MM-DD')
      }
      this.selectedDate = selectedDate
      this.getList()
    },

    toggle(index) {
      this.list[index].optionflag = !this.list[index].optionflag
    },
    getCheckboxIdx(index) {
      this.list[index].optionflag = true
      this.list[index].checked = !this.list[index].checked

      if (this.list[index].studentList) {
        this.list[index].studentList.forEach(e => {
          if (e.parentId) {
            e.checked = this.list[index].checked
          }
        })
        const numArr = []
        this.list.forEach((classItem, classIndex) => {
          classItem.studentList && classItem.studentList.forEach((stuItem, stuIndex) => {
            if (stuItem.checked === true) {
              numArr.push(stuItem)
            }
          })
        })
        this.stuNum = numArr.length
      }
    },
    getStuIndex(classIndex, stuIndex) {
      this.list[classIndex].studentList[stuIndex].checked = !this.list[classIndex].studentList[stuIndex].checked
      this.list[classIndex].checked = this.list[classIndex].studentList.some(item => item.checked === true)
      const numArr = []
      this.list.forEach((classItem, classIndex) => {
        classItem.studentList && classItem.studentList.forEach((stuItem, stuIndex) => {
          if (stuItem.checked === true) {
            numArr.push(stuItem)
          }
        })
      })
      this.stuNum = numArr.length
    },
    studentSubmit() {
      let stuArr = []
      this.stuArr = []
      let classArr = []
      let newClassArr = []
      this.list.forEach((classItem, classIndex) => {
        stuArr.push({
          courseId: classItem.courseId,
          params: []
        })
        classArr.push({
          courseName: classItem.courseName,
          params: []
        })
        if (classItem.studentList) {
          classItem.studentList.forEach((stuItem, stuIndex) => {
            if (stuItem.checked === true && stuItem.parentId !== null) {
              stuArr[classIndex].params.push({
                stuId: stuItem.stuId,
                customerId: stuItem.parentId
              })
              classArr[classIndex].params.push({
                stuId: stuItem.stuId,
                customerId: stuItem.parentId
              })
            }
          })
        }
      })
      stuArr.forEach((e, i) => {
        if (e.params.length !== 0) {
          this.stuArr.push(e)
        }
      })
      classArr.forEach((e, i) => {
        if (e.params.length !== 0) {
          newClassArr.push(e.courseName)
        }
      })
      let pages = getCurrentPages() //eslint-disable-line
      let prevPage = pages[pages.length - 2]

      let data = {}
      if (this.stuArr.length === 0) {
        data = {
          status: 0
        }
      } else {
        data = {
          studentList: this.list,
          student: JSON.stringify(this.stuArr),
          stuNum: this.stuNum,
          class: newClassArr,
          status: 1,
          time: this.selectedDate
        }
      }
      prevPage.setData({
        pagetype: JSON.stringify(data)
      })
      wx.navigateBack({ delta: 1 })
    },
    getNum(e) {
      // console.log(e.detail.value)
    }
  }
}
