<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="设备编号" prop="innerCode">
        <el-input
          v-model="queryParams.innerCode"
          placeholder="请输入设备编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="machineList" @selection-change="handleSelectionChange">
      <el-table-column label="序号" type="index" width="55" align="center" />
      <el-table-column label="设备编号" align="center" prop="innerCode" />
      <el-table-column label="设备型号" align="center" prop="vmTypeId" >
        <template #default="scope">
          <div v-for="item in vmTypeList" :key="item.id">
            <span v-if="item.id === scope.row.vmTypeId">{{ item.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="详细地址" align="center" prop="addr" show-overflow-tooltip/>
      <el-table-column label="运营状态" align="center" prop="vmStatus">
        <template #default="scope">
          <dict-tag :options="vm_status" :value="scope.row.vmStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="设备状态" align="center" prop="vmStatus">
        <template #default="scope">
          {{ scope.row.runningStatus !== null ? JSON.parse(scope.row.runningStatus).status === true ? '正常' : '异常' : '异常' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary"  @click="getInfo(scope.row)" v-hasPermi="['manger:machine:query']">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改设备管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>

    </el-dialog>
  </div>
</template>

<script setup name="Machine">
import { listMachine, getMachine, delMachine, addMachine, updateMachine } from "@/api/manger/machine";
import {listVmType} from "@/api/manger/vmType.js";
import {loadAllParams} from "@/api/page.js";
import {listPartner} from "@/api/manger/partner.js";
import {listNode} from "@/api/manger/node.js";
import {listRegion} from "@/api/manger/region.js";
import {parseTime} from "../../../utils/ruoyi.js";

const { proxy } = getCurrentInstance();
const { vm_status, business_type } = proxy.useDict('vm_status', 'business_type');

const machineList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    innerCode: null,
    nodeId: null,
    businessType: null,
    regionId: null,
    partnerId: null,
    vmTypeId: null,
    clientId: null,
    policyId: null,
  },
  rules: {
    nodeId: [
      { required: true, message: "点位Id不能为空", trigger: "blur" }
    ],
    vmTypeId: [
      { required: true, message: "设备型号不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询设备管理列表 */
function getList() {
  loading.value = true;
  listMachine(queryParams.value).then(response => {
    machineList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    innerCode: null,
    channelMaxCapacity: null,
    nodeId: null,
    addr: null,
    lastSupplyTime: null,
    businessType: null,
    regionId: null,
    partnerId: null,
    vmTypeId: null,
    vmStatus: null,
    runningStatus: null,
    longitudes: null,
    latitude: null,
    clientId: null,
    policyId: null,
    createTime: null,
    updateTime: null
  };
  proxy.resetForm("machineRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加设备管理";
}

/** 修改按钮操作 */
function getInfo(row) {
  reset();
  const _id = row.id || ids.value
  getMachine(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "查看详情";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["machineRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateMachine(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addMachine(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除设备管理编号为"' + _ids + '"的数据项？').then(function() {
    return delMachine(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manger/machine/export', {
    ...queryParams.value
  }, `machine_${new Date().getTime()}.xlsx`)
}
/** 查询设备类型列表 */
const vmTypeList = ref([]);
function getVmTypeList() {
  listVmType(loadAllParams).then(response=>{
    vmTypeList.value = response.rows;
  })
}
/** 获取合作商列表 */
const partnerList = ref([]);
function getPartnerList() {
  listPartner(loadAllParams).then(response=>{
    partnerList.value = response.rows;
  })
}
/** 获取点位列表 */
const nodeList = ref([]);
function getNodeList() {
  listNode(loadAllParams).then(response=>{
    nodeList.value = response.rows;
  })
}
/** 获取区域列表 */
const regionList = ref([]);
function getRegionList() {
  listRegion(loadAllParams).then(response => {
    regionList.value = response.rows;
  })
}

getRegionList();
getNodeList();
getPartnerList();
getVmTypeList();
getList();
</script>
