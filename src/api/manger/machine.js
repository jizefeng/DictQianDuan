import request from '@/utils/request'

// 查询设备管理列表
export function listMachine(query) {
  return request({
    url: '/manger/machine/list',
    method: 'get',
    params: query
  })
}

// 查询设备管理详细
export function getMachine(id) {
  return request({
    url: '/manger/machine/' + id,
    method: 'get'
  })
}

// 新增设备管理
export function addMachine(data) {
  return request({
    url: '/manger/machine',
    method: 'post',
    data: data
  })
}

// 修改设备管理
export function updateMachine(data) {
  return request({
    url: '/manger/machine',
    method: 'put',
    data: data
  })
}

// 删除设备管理
export function delMachine(id) {
  return request({
    url: '/manger/machine/' + id,
    method: 'delete'
  })
}
