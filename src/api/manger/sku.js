import request from '@/utils/request'

// 查询商品管理列表
export function listSku(query) {
  return request({
    url: '/manger/sku/list',
    method: 'get',
    params: query
  })
}

// 查询商品管理详细
export function getSku(skuId) {
  return request({
    url: '/manger/sku/' + skuId,
    method: 'get'
  })
}

// 新增商品管理
export function addSku(data) {
  return request({
    url: '/manger/sku',
    method: 'post',
    data: data
  })
}

// 修改商品管理
export function updateSku(data) {
  return request({
    url: '/manger/sku',
    method: 'put',
    data: data
  })
}

// 删除商品管理
export function delSku(skuId) {
  return request({
    url: '/manger/sku/' + skuId,
    method: 'delete'
  })
}
