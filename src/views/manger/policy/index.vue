<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="策略名称" prop="policyName">
        <el-input
          v-model="queryParams.policyName"
          placeholder="请输入策略名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['manger:policy:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['manger:policy:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['manger:policy:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['manger:policy:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="policyList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" t ype="index" align="center" prop="policyId" />
      <el-table-column label="策略名称" align="center" prop="policyName" />
      <el-table-column label="策略方案" align="center" prop="discount" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary"  @click="getVmInfo(scope.row)" v-hasPermi="['manger:machine:list']">查看详情</el-button>
          <el-button link type="primary"  @click="handleUpdate(scope.row)" v-hasPermi="['manger:policy:edit']">修改</el-button>
          <el-button link type="primary" @click="handleDelete(scope.row)" v-hasPermi="['manger:policy:remove']">删除</el-button>
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

    <!-- 添加或修改策略对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="policyRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="策略名称" prop="policyName">
          <el-input v-model="form.policyName" placeholder="请输入策略名称" />
        </el-form-item>
        <el-form-item label="策略方案" prop="discount">
          <el-input-number :min="1" :max="100" :precision="0" v-model="form.discount" placeholder="请输入策略方案，如：80代表8折" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
      <!-- 查看详情对话框    -->
     <el-dialog title="查看详情" v-model="openVmInfo" width="500px" append-to-body>
       <el-form-item label="策略名称" prop="policyName">
         <el-input v-model="form.policyName" placeholder="请输入策略名称" disabled />
       </el-form-item>
       <label>包含设备：</label>
       <el-table :data="vmInfo">
         <el-table-column label="序号" type="index" width="80" align="center" prop="id" />
         <el-table-column label="点位地址" align="left" prop="addr" show-overflow-tooltip />
         <el-table-column label="设备编号" align="center" prop="innerCode" />
       </el-table>
     </el-dialog>
  </div>
</template>

<script setup name="Policy">
import { listPolicy, getPolicy, delPolicy, addPolicy, updatePolicy } from "@/api/manger/policy";
import {parseTime} from "../../../utils/ruoyi.js";
import {loadAllParams} from "@/api/page.js";
import {listMachine} from "@/api/manger/machine.js";

const { proxy } = getCurrentInstance();

const policyList = ref([]);
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
    policyName: null,
  },
  rules: {
    policyName: [
      { required: true, message: "策略名称不能为空", trigger: "blur" }
    ],
    discount: [
      { required: true, message: "策略方案，如：80代表8折不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询策略列表 */
function getList() {
  loading.value = true;
  listPolicy(queryParams.value).then(response => {
    policyList.value = response.rows;
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
    policyId: null,
    policyName: null,
    discount: null,
    createTime: null,
    updateTime: null
  };
  proxy.resetForm("policyRef");
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
  ids.value = selection.map(item => item.policyId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加策略";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _policyId = row.policyId || ids.value
  getPolicy(_policyId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改策略";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["policyRef"].validate(valid => {
    if (valid) {
      if (form.value.policyId != null) {
        updatePolicy(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addPolicy(form.value).then(response => {
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
  const _policyIds = row.policyId || ids.value;
  proxy.$modal.confirm('是否确认删除策略编号为"' + _policyIds + '"的数据项？').then(function() {
    return delPolicy(_policyIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manger/policy/export', {
    ...queryParams.value
  }, `policy_${new Date().getTime()}.xlsx`)
}
/** 查看详情按钮操作 */
const openVmInfo = ref(false);
const vmInfo = ref([]);
function getVmInfo(row) {
  form.value = row;
  loadAllParams.policyId = row.policyId;
  listMachine(loadAllParams).then(response => {
    vmInfo.value = response.rows;
     openVmInfo.value = true;
  })
}
getList();
</script>
