import request from '@/utils/request'

// 查询策略列表
export function listPolicy(query) {
  return request({
    url: '/manger/policy/list',
    method: 'get',
    params: query
  })
}

// 查询策略详细
export function getPolicy(policyId) {
  return request({
    url: '/manger/policy/' + policyId,
    method: 'get'
  })
}

// 新增策略
export function addPolicy(data) {
  return request({
    url: '/manger/policy',
    method: 'post',
    data: data
  })
}

// 修改策略
export function updatePolicy(data) {
  return request({
    url: '/manger/policy',
    method: 'put',
    data: data
  })
}

// 删除策略
export function delPolicy(policyId) {
  return request({
    url: '/manger/policy/' + policyId,
    method: 'delete'
  })
}
