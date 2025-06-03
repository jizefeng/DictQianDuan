import request from '@/utils/request'

// 查询工单类型列表
export function listTaskType(query) {
  return request({
    url: '/manger/taskType/list',
    method: 'get',
    params: query
  })
}

// 查询工单类型详细
export function getTaskType(typeId) {
  return request({
    url: '/manger/taskType/' + typeId,
    method: 'get'
  })
}

// 新增工单类型
export function addTaskType(data) {
  return request({
    url: '/manger/taskType',
    method: 'post',
    data: data
  })
}

// 修改工单类型
export function updateTaskType(data) {
  return request({
    url: '/manger/taskType',
    method: 'put',
    data: data
  })
}

// 删除工单类型
export function delTaskType(typeId) {
  return request({
    url: '/manger/taskType/' + typeId,
    method: 'delete'
  })
}

// 取消工单
export function cancelTaskType(data) {
  return request({
    url: '/manger/task/cancel',
    method: 'put',
    data: data
  })
}
