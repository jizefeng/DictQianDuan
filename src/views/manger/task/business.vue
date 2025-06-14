<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      v-show="showSearch"
      label-width="68px"
    >
      <el-form-item label="工单编号" prop="taskCode">
        <el-input
          v-model="queryParams.taskCode"
          placeholder="请输入工单编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="工单状态" prop="taskStatus">
        <el-select
          v-model="queryParams.taskStatus"
          placeholder="请选择工单状态"
          clearable
        >
          <el-option
            v-for="dict in task_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery"
          >搜索</el-button
        >
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
          v-hasPermi="['manger:task:add']"
          >新增</el-button
        >
        <el-button type="primary" plain @click="openTaskConfig"
          >工单配置</el-button
        >
      </el-col>
      <right-toolbar
        v-model:showSearch="showSearch"
        @queryTable="getList"
      ></right-toolbar>
    </el-row>

    <el-table
      v-loading="loading"
      :data="taskList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column
        label="序号"
        type="index"
        width="50"
        align="center"
        prop="taskId"
      />
      <el-table-column label="工单编号" align="center" prop="taskCode" />
      <el-table-column label="设备编号" align="center" prop="innerCode" />
      <el-table-column
        label="工单类型"
        align="center"
        prop="taskType.typeName"
      />
      <el-table-column label="工单方式" align="center" prop="createType">
        <template #default="scope">
          <dict-tag :options="task_create_type" :value="scope.row.createType" />
        </template>
      </el-table-column>
      <el-table-column label="工单状态" align="center" prop="taskStatus">
        <template #default="scope">
          <dict-tag :options="task_status" :value="scope.row.taskStatus" />
        </template>
      </el-table-column>
      <el-table-column label="运营人员" align="center" prop="userName" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
      >
        <template #default="scope">
          <span>{{
            parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}')
          }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openTaskDetailDialog(scope.row)"
            v-hasPermi="['manger:task:edit']"
            >查看详情</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加工单对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="taskRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="设备编号" prop="innerCode">
          <el-input
            v-model="form.innerCode"
            placeholder="请输入设备编号"
            @blur="handleCode"
          />
        </el-form-item>
        <el-form-item label="工单类型" prop="productTypeId">
          <el-select
            v-model="form.productTypeId"
            placeholder="请选择工单类型"
            clearable
          >
            <el-option
              v-for="dict in taskTypeList"
              :key="dict.typeId"
              :label="dict.typeName"
              :value="dict.typeId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="补货数量：" prop="details">
          <el-button type="text" @click="channelDetails">
            <el-icon> <List /> </el-icon>补货清单
          </el-button>
        </el-form-item>
        <el-form-item label="运营人员：" prop="userId">
          <el-select
            v-model="form.userId"
            placeholder="请选择"
            :filterable="true"
          >
            <el-option
              v-for="(item, index) in userList"
              :key="index"
              :label="item.userName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="desc">
          <el-input
            type="textarea"
            v-model="form.desc"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
    <!-- 查看详情组件 -->
    <DetailDialog
      :detailVisible="detailVisible"
      :taskId="taskId"
      :taskDada="form"
      :detailData="detailData"
      @getList="getList"
      @handleClose="handleClose"
      @handleAdd="handleAdd"
    ></DetailDialog>
    <!-- end -->
    <!-- 补货详情 -->
    <ReplenishmentDialog
      :channelVisible="channelVisible"
      :innerCode="form.innerCode"
      @getDetailList="getDetailList"
      @handleClose="channelDetailsClose"
    ></ReplenishmentDialog>
    <!-- end -->
    <!-- 工单配置 -->
    <TaskConfig
      :taskConfigVisible="taskConfigVisible"
      @handleClose="handleConfigClose"
    ></TaskConfig>
    <!-- end -->
  </div>
</template>

<script setup name="Task">
import {
  listTask,
  getTask,
  delTask,
  addTask,
  updateTask,
  getBusinessList,
  getTaskDetails,
} from '@/api/manger/task';
import { listTaskType } from '@/api/manger/taskType';
import { loadAllParams } from '@/api/page';
// 组件
import DetailDialog from './components/business-detail-dialog.vue'; //详情组件
import ReplenishmentDialog from './components/business-replenishment-dialog.vue'; //补货组件
import TaskConfig from './components/task-config.vue';
const { proxy } = getCurrentInstance();
const { task_status, task_create_type } = proxy.useDict(
  'task_status',
  'task_create_type'
);

const taskList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref('');
const detailVisible = ref(false); //查看详情弹层显示/隐藏
const taskId = ref(null); //工单id
const taskDada = ref({}); //工单详情
const userList = ref([]); //运维人员
const channelVisible = ref(false); //补货弹层
const detailData = ref([]); //货道列表
const taskConfigVisible = ref(false); //工单配置弹层
const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    taskCode: null,
    taskStatus: null,
    createType: null,
    innerCode: null,
    userName: null,
    regionId: null,
    desc: null,
    productTypeId: null,
    userId: null,
    addr: null,
    params: { isRepair: false },
  },
  rules: {
    innerCode: [
      { required: true, message: '设备编号不能为空', trigger: 'blur' },
    ],
    productTypeId: [
      { required: true, message: '设备类型不能为空', trigger: 'blur' },
    ],
    // details: [{ required: true, message: '补货数量不能为空', trigger: 'blur' }],

    userId: [{ required: true, message: '人员不能为空', trigger: 'blur' }],
    desc: [{ required: true, message: '备注不能为空', trigger: 'blur' }],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询运营工单列表 */
function getList() {
  loading.value = true;
  listTask(queryParams.value).then((response) => {
    taskList.value = response.rows;
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
    taskId: null,
    taskCode: null,
    taskStatus: null,
    createType: null,
    innerCode: null,
    userId: null,
    userName: null,
    regionId: null,
    desc: null,
    productTypeId: null,
    addr: null,
    createTime: null,
    updateTime: null,
    details: [],
  };
  proxy.resetForm('taskRef');
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm('queryRef');
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map((item) => item.taskId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd(val) {
  if (val === 'anew') {
    taskInfo();
    getUserList();
  } else {
    taskId.val = '';
  }
  reset();
  open.value = true;
  title.value = '添加运营工单';
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs['taskRef'].validate((valid) => {
    if (valid) {
      const data = form.value;
      form.value = {
        innerCode: data.innerCode,
        userId: data.userId,
        productTypeId: data.productTypeId,
        desc: data.desc,
        createType: 1,
        details: data.details,
      };
      addTask(form.value).then((response) => {
        proxy.$modal.msgSuccess('新增成功');
        open.value = false;
        getList();
      });
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _taskIds = row.taskId || ids.value;
  proxy.$modal
    .confirm('是否确认删除运营工单编号为"' + _taskIds + '"的数据项？')
    .then(function () {
      return delTask(_taskIds);
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess('删除成功');
    })
    .catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download(
    'manger/task/export',
    {
      ...queryParams.value,
    },
    `task_${new Date().getTime()}.xlsx`
  );
}

// 查询工单类型列表
const taskTypeList = ref([]);
function getTaskTypeList() {
  // 默认时获取所有得工单类型，需要用type区别开，1:运维工单类型，2:运营工单类型
  const page = {
    ...loadAllParams,
    type: 2,
  };
  listTaskType(page).then((response) => {
    taskTypeList.value = response.rows;
  });
}
// 填写设备编号后
const handleCode = () => {
  if (form.value.innerCode) {
    getUserList();
  }
};
// 获取运营人员列表
const getUserList = () => {
  getBusinessList(form.value.innerCode).then((response) => {
    userList.value = response.data;
  });
};
// 获取工单详情
const taskInfo = () => {
  let dataArr = [];
  let obj = {};
  getTask(taskId.value).then((response) => {
    form.value = response.data;
  });
  // 获取货道列表
  getTaskDetails(taskId.value).then((res) => {
    detailData.value = res.data;
    detailData.value.map((taskDetail) => {
      obj = {
        channelCode: taskDetail.channelCode,
        expectCapacity: taskDetail.expectCapacity,
        skuId: taskDetail.skuId,
        skuName: taskDetail.skuName,
        skuImage: taskDetail.skuImage,
      };
      dataArr.push(obj);
    });
    form.value.details = dataArr;
  });
};
// 查看详情
const openTaskDetailDialog = (row) => {
  taskId.value = row.taskId;
  taskInfo();
  detailVisible.value = true;
};
// 关闭详情弹层
const handleClose = () => {
  detailVisible.value = false;
};
// 补货清单
const channelDetails = () => {
  proxy.$refs['taskRef'].validateField('innerCode', (error) => {
    if (!error) {
      return;
    }
    channelVisible.value = true;
  });
};
// 关闭补货清单
const channelDetailsClose = () => {
  channelVisible.value = false;
};
// 获取货道清单数据
const getDetailList = (val) => {
  form.value.details = val;
};
// 打开工单配置弹层
const openTaskConfig = () => {
  taskConfigVisible.value = true;
};
// 关闭工单配置弹层
const handleConfigClose = () => {
  taskConfigVisible.value = false;
};
getTaskTypeList();

getList();
</script>
<style lang="scss" scoped src="./index.scss"></style>
