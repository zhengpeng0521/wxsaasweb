/*
* 小程序项目 全局请求方法
* 2017-11-22
* @author yhwu
*/
// ************************x-rule 本页共有四个**********
// 接口请求JSON
/* eslint-disable */
function serviceRequestJson( url, params = {}) {
	for( let key in params ){ //去除 值为undefined的key
		if( params[key] === undefined || params[key] === '' || params[key] === null ) {
			delete params[key];
		}
	}
	const parms = wx.getStorageSync('session')
	let userId = parms.uid
	let orgId = parms.orgId
  let token = wx.getStorageSync('token')
	// let userId = wx.getStorageSync('userId')
	// let orgId = wx.getStorageSync('orgId')
  // let token = wx.getStorageSync('token')

  // params.tenantId =  wx.getStorageSync('tea_tenantId')

  // if (url.indexOf('/mic/sgb') !== -1 ) {
  //   params.userId =  userId
  //   params.orgId =  orgId
  // }

  if (url.indexOf('/teacher/addTeacherInfo') !== -1 ) {
    params.userId =  userId
    params.orgId =  orgId
  } else {
    if (url.indexOf('/mic/sgb') !== -1) {
      params.userId =  wx.getStorageSync('tea_uid')
      params.orgId =  wx.getStorageSync('tea_orgId')
      params.tenantId =  wx.getStorageSync('tea_tenantId')
    }
  }

	return new Promise(function ( resolve, reject ) {
		wx.request({
			url : url,
			method : 'POST',
			data : params,
			header : {
				'content-type'   : 'application/json',
				'token'          : token,
				'checkToken'     :'0',
				'userId'         : userId,
				'x-rule':'1#offline'
				// 'x-rule':'2#wtf'
			},
			success : function ( res ) {
				if( res.data.errorCode == 2000 ){
					wx.hideLoading();
					let pages = getCurrentPages();
					let currentPage = pages[pages.length - 1].route;
					let arrs = currentPage.split('/');
					let num = arrs.length - 2;
					let dotArrs = [];
					for( let i = 0; i < num; i++ ){
						dotArrs.push('..');
					}
					if(res.data.errorMessage.includes('你的账号在另一台设备登录了小程序')){
						wx.showModal({ content : res.data.errorMessage || '登录失效, 请重新登录', showCancel : false, confirmColor : '#5d9cec', complete : function(){
							wx.reLaunch({
								url : dotArrs.join('/') + '/mime/login/login'
							})
						}});
					}else{
						wx.showToast({
							title:res.data.errorMessage || '登录失效, 请重新登录',
							icon:'none',
							duration:3000,
							mask:true
						})
						setTimeout(()=>{
							wx.reLaunch({
								url : dotArrs.join('/') + '/mime/login/login'
							})
						},2000)
					}

					return;
				}
				resolve( res.data );
			},
			fail : function( res ){
				wx.showModal({ content : '网络不稳定, 请稍后重试', showCancel : false, confirmColor : '#5d9cec' });
			}
		})
	});
}

// 登录请求
function loginRequest(url, params) {
	return new Promise(function (resolve, reject) {
		wx.request({
			url: url,
			method: 'POST',
			data: params,
			header: {
				'content-type': 'application/json',
        'x-rule':'1#offline'
			},
			success: function (res) {
				resolve(res.data);
			},
			fail: function (res) {
				wx.showModal({ content: '网络不稳定, 请稍后重试', showCancel: false, confirmColor: '#5d9cec' });
			}
		})
	});
}

// 申请试用请求
function registerRequest(url, params) {
  return new Promise(function (resolve, reject) {
    wx.request({
      url: url,
      method: 'POST',
      data: params,
      header: {
        'content-type': 'application/json',
        'x-rule':'1#offline',
        'checkToken': '0'
      },
      success: function (res) {
        resolve(res.data);
      },
      fail: function (res) {
        wx.showModal({ content: '网络不稳定, 请稍后重试', showCancel: false, confirmColor: '#5d9cec' });
      }
    })
  });
}

//接口请求JSON
function serviceRequest( url, params) {
	for( let key in params ){ //去除 值为undefined的key
		if( params[key] === undefined || params[key] === '' || params[key] === null ) {
			delete params[key];
		}
	}
	let userId = wx.getStorageSync('userId');
	let token = wx.getStorageSync('token');
	return new Promise(function ( resolve, reject ) {
		wx.request({
			url : url,
			method : 'POST',
			data : params,
			header : {
				'content-type'   : 'application/json',
				'Authorization'  : token,
				'userId'         : userId,
				'x-rule'         :'1#offline'
			},
			success : function ( res ) {
				if(res.data.errorCode === 990000) {
					wx.showModal({
            content:  '网络异常,请重新登录',
            showCancel: false,
            confirmColor: '#5d9cec'
          });
				} else {
					resolve( res.data );
				}
			},
			fail : function( res ){
				wx.showModal({ content : '网络不稳定, 请稍后重试', showCancel : false, confirmColor : '#5d9cec' });
			}
		})
	});
}

module.exports = {
	serviceRequest : serviceRequest,
	serviceRequestJson : serviceRequestJson,
	loginRequest   : loginRequest,
	registerRequest: registerRequest
}
