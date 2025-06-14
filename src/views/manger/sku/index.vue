<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="商品名称" prop="skuName">
        <el-input
            v-model="queryParams.skuName"
            placeholder="请输入商品名称"
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
            v-hasPermi="['manger:sku:add']"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
            v-hasPermi="['manger:sku:export']"
        >导出
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="warning"
            plain
            icon="upload"
            @click="handleExcelImport"
            v-hasPermi="['manger:sku:add']"
        >导入
        </el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="skuList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="序号" type="index" width="50" align="center" prop="skuId"/>
      <el-table-column label="商品名称" align="center" prop="skuName"/>
      <el-table-column label="商品图片" align="center" prop="skuImage" width="100">
        <template #default="scope">
          <image-preview :src="scope.row.skuImage" :width="50" :height="50"/>
        </template>
      </el-table-column>
      <el-table-column label="品牌" align="center" prop="brandName"/>
      <el-table-column label="规格" align="center" prop="unit"/>
      <el-table-column label="商品价格" align="center" prop="price">
        <template #default="scope">
          <el-tag>{{ scope.row.price / 100 }}元</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="商品类型" align="center" prop="classId">
        <template #default="scope">
          <div v-for="item in skuClassList" :key="item.classId">
            <span v-if="item.classId == scope.row.classId">{{ item.className }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" @click="handleUpdate(scope.row)" v-hasPermi="['manger:sku:edit']">修改
          </el-button>
          <el-button link type="primary" @click="handleDelete(scope.row)" v-hasPermi="['manger:sku:remove']">删除
          </el-button>
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

    <!-- 添加或修改商品管理对话框 -->
    <el-dialog :title="title" v-model="open" width="550px" append-to-body>
      <el-form ref="skuRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="商品名称" prop="skuName">
          <el-input v-model="form.skuName" placeholder="请输入商品名称"/>
        </el-form-item>
        <el-form-item label="品牌" prop="brandName">
          <el-input v-model="form.brandName" placeholder="请输入品牌"/>
        </el-form-item>
        <el-form-item label="商品价格" prop="price">
          <el-input-number :min="0.01" :max="999.99" :step="0.5" :precision="2" size="large" v-model="form.price"
                           placeholder="请输入商品价格"/>
          元
        </el-form-item>
        <el-form-item label="商品类型" prop="classId">
          <!--          <el-input v-model="form.classId" placeholder="请输入商品类型Id" />-->
          <el-select v-model="form.classId" placeholder="请选择商品类型">
            <el-option
                v-for="item in skuClassList"
                :key="item.classId"
                :label="item.className"
                :value="item.classId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="规格" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入规格"/>
        </el-form-item>
        <el-form-item label="商品图片" prop="skuImage">
          <image-upload v-model="form.skuImage"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
    <!-- 数据导入对话框 -->
    <el-dialog  title="数据导入" v-model="excelOpen" width="400px" append-to-body>
      <el-upload
          ref="uploadRef"
          class="upload-demo"
          :action="uploadExcelUrl"
          :headers="headers"
          :limit="1"
          :auto-upload="false"
          :before-upload="handleBeforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
      >
        <template #trigger>
          <el-button type="primary" size="large" icon="Document">选择文件</el-button>
        </template>
        <el-button class="ml-3" type="success" icon="Upload" @click="submitUpload">上传</el-button>
        <template #tip>
          <div class="el-upload__tip">
            上传文件仅支持 xls/xlsx 格式，文件大小不得超过1M
          </div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script setup name="Sku">
import {listSku, getSku, delSku, addSku, updateSku} from "@/api/manger/sku";
import {parseTime} from "../../../utils/ruoyi.js";
import {listSkuClass} from "@/api/manger/SkuClass.js";
import {loadAllParams} from "@/api/page.js";
import {getToken} from "@/utils/auth.js";

const {proxy} = getCurrentInstance();

const skuList = ref([]);
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
    skuName: null,
    classId: null,
  },
  rules: {
    skuName: [
      {required: true, message: "商品名称不能为空", trigger: "blur"}
    ],
    skuImage: [
      {required: true, message: "商品图片不能为空", trigger: "blur"}
    ],
    brandName: [
      {required: true, message: "品牌不能为空", trigger: "blur"}
    ],
    unit: [
      {required: true, message: "规格(净含量)不能为空", trigger: "blur"}
    ],
    price: [
      {required: true, message: "商品价格，单位分不能为空", trigger: "blur"}
    ],
    classId: [
      {required: true, message: "商品类型Id不能为空", trigger: "blur"}
    ],
  }
});

const {queryParams, form, rules} = toRefs(data);

/** 查询商品管理列表 */
function getList() {
  loading.value = true;
  listSku(queryParams.value).then(response => {
    skuList.value = response.rows;
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
    skuId: null,
    skuName: null,
    skuImage: null,
    brandName: null,
    unit: null,
    price: null,
    classId: null,
    isDiscount: null,
    createTime: null,
    updateTime: null
  };
  proxy.resetForm("skuRef");
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
  ids.value = selection.map(item => item.skuId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加商品管理";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _skuId = row.skuId || ids.value
  getSku(_skuId).then(response => {
    form.value = response.data;
    // 将价格单位从分转换回元
    form.value.price /= 100;
    open.value = true;
    title.value = "修改商品管理";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["skuRef"].validate(valid => {
    if (valid) {
      // 将价格单位从元转换回分
      form.value.price *= 100;
      if (form.value.skuId != null) {
        updateSku(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addSku(form.value).then(response => {
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
  const _skuIds = row.skuId || ids.value;
  proxy.$modal.confirm('是否确认删除商品管理编号为"' + _skuIds + '"的数据项？').then(function () {
    return delSku(_skuIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {
  });
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manger/sku/export', {
    ...queryParams.value
  }, `sku_${new Date().getTime()}.xlsx`)
}

/** 查询商品类型列表 */
const skuClassList = ref([]);

function getSkuClassList() {
  listSkuClass(loadAllParams).then(response => {
    skuClassList.value = response.rows;
  })
}

/** 按钮对话框 */
const excelOpen = ref(false);
function handleExcelImport() {
  excelOpen.value = true;
}

/** 上传地址 */
const uploadExcelUrl = ref(import.meta.env.VITE_APP_BASE_API + "/manger/sku/import");
/** 上传请求头 */
const headers = ref({Authorization: "Bearer " + getToken()});
/** 上传excel */
const uploadRef = ref({});

function submitUpload() {
  uploadRef.value.submit()
}

/** 上传参数 */
const props = defineProps({
  modelValue: [String, Object, Array],
  // 大小限制(MB)
  fileSize: {
    type: Number,
    default: 1,
  },
  // 文件类型, 例如["xls", "xlsx"]
  fileType: {
    type: Array,
    default: () => ["xls", "xlsx"],
  },
});

/** 上传文件之前参数校验 */
function handleBeforeUpload(file) {
  let isExcel = false;
  if (props.fileType.length) {
    let fileExtension = "";
    if (file.name.lastIndexOf(".") > -1) {
      fileExtension = file.name.slice(file.name.lastIndexOf(".") + 1);
    }
    isExcel = props.fileType.some(type => {
      if (file.type.indexOf(type) > -1) return true;
      if (fileExtension && fileExtension.indexOf(type) > -1) return true;
      return false;
    });
  }
  if (!isExcel) {
    proxy.$modal.msgError(
        `文件格式不正确, 请上传${props.fileType.join("/")}格式文件!`
    );
    return false;
  }
  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize;
    if (!isLt) {
      proxy.$modal.msgError(`上传excel大小不能超过 ${props.fileSize} MB!`);
      return false;
    }
  }
  proxy.$modal.loading("正在上传excel，请稍候...");
}

/**上传成功回调  */
function handleUploadSuccess(res, file) {
  if (res.code === 200) {
    proxy.$modal.msgSuccess("上传excel成功");
    excelOpen.value = false;
    getList();
  } else {
    proxy.$modal.msgError(res.msg);
  }
  uploadRef.value.clearFiles();
  proxy.$modal.closeLoading();
}

/**上传失败*/
function handleUploadError() {
  proxy.$modal.msgError("上传excel失败");
  uploadRef.value.clearFiles();
  proxy.$modal.closeLoading();
}

getSkuClassList();
getList();
</script>

<style scoped>
/* 使用 Flex 布局对齐按钮 */
.upload-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* 按钮容器 */
.upload-demo .el-button--primary,
.upload-demo .el-button--success {
  margin-bottom: 10px;
}

/* 提示文字样式 */
.el-upload__tip {
  font-size: 13px;
  color: #666;
  text-align: left;
  margin-top: 5px;
}

</style>
