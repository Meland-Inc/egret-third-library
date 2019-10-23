<template>
  <div>
    <mu-container>
      <div class="button-wrapper">
        <!-- <mu-button v-loading="isCheckTextureLoading" data-mu-loading-size="24" color="primary" @click="checkTexture">检查纹理</mu-button> -->
        <mu-button
          v-loading="isUpdateSvnLoading"
          data-mu-loading-size="24"
          color="pink500"
          @click="updateSvn"
        >更新svn文件</mu-button>
        <mu-button
          v-loading="isClearTextureLoading"
          data-mu-loading-size="24"
          color="orange500"
          @click="clearTexture"
        >清空纹理</mu-button>
        <mu-button
          v-loading="isCopyTextureInLoading"
          data-mu-loading-size="24"
          color="cyan500"
          @click="copyTextureIn"
        >拷入纹理</mu-button>
        <mu-button
          v-loading="isClipTextureLoading"
          data-mu-loading-size="24"
          color="blue500"
          @click="clipTexture"
        >裁剪纹理</mu-button>
        <mu-button
          v-loading="isPackerTextureLoading"
          data-mu-loading-size="24"
          color="purple500"
          @click="packerTexture"
        >打包纹理</mu-button>
        <mu-button
          v-loading="isCopyTextureOutLoading"
          data-mu-loading-size="24"
          color="green500"
          @click="copyTextureOut"
        >拷出纹理</mu-button>
        <mu-button
          v-loading="isImportDefaultLoading"
          data-mu-loading-size="24"
          color="red500"
          @click="importDefault"
        >导入default配置</mu-button>
      </div>
      <div class="button-wrapper">
        <mu-button full-width color="red500" @click="oneForAll">One·for·All</mu-button>
      </div>
    </mu-container>
    <mu-container>
      <div class="select-control-group">
        <!-- <mu-flex class="select-control-row">
          <mu-checkbox :value="sheetMode" v-model="sheetMode" label="图集模式"></mu-checkbox>
        </mu-flex>-->
        <mu-flex class="flex-wrapper" align-items="center">
          <mu-col span="12" lg="2" sm="2">
            <mu-radio :value="false" v-model="sheetMode" label="非图集模式"></mu-radio>
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-radio :value="true" v-model="sheetMode" label="图集模式"></mu-radio>
          </mu-col>
          <mu-col span="12">
            <mu-text-field
              placeholder="(itemIcon,avatarIcon,ground,floor此选项无效,永远都是图集模式)"
              :disabled="true"
              :solo="true"
              full-width
            ></mu-text-field>
          </mu-col>
        </mu-flex>
      </div>
    </mu-container>
    <mu-divider />
    <mu-container>
      <div class="select-control-group">
        <mu-flex class="select-control-row">
          <mu-checkbox
            label="全选"
            :input-value="checkAll"
            @change="handleCheckAll"
            :checked-icon="checkBoxData.length < checkBoxValues.length ? 'indeterminate_check_box' : undefined"
          ></mu-checkbox>
        </mu-flex>
        <mu-flex
          class="select-control-row"
          :key="checkBoxValue"
          v-for="checkBoxValue in checkBoxValues"
        >
          <mu-checkbox :value="checkBoxValue" v-model="checkBoxData" :label="checkBoxValue"></mu-checkbox>
        </mu-flex>
      </div>
    </mu-container>
  </div>
</template>

<script>
import * as mdTexture from "../js/MdTexture.js";
import * as mdAsset from "../js/MdAsset.js";
import { Global } from "../js/Global.js";

export default {
  data() {
    return {
      isUpdateSvnLoading: false,
      isCheckTextureLoading: false,
      isCopyTextureInLoading: false,
      isClearTextureLoading: false,
      isClipTextureLoading: false,
      isPackerTextureLoading: false,
      isCopyTextureOutLoading: false,
      isImportDefaultLoading: false,

      sheetMode: mdTexture.getSheetMode(),
      checkBoxValues: mdTexture.getCheckBoxValues(),
      checkBoxData: mdTexture.getCheckBoxData(),
      checkAll: true
    };
  },
  watch: {
    sheetMode: val => {
      mdTexture.setSheetMode(val);
    },
    checkBoxData: val => {
      mdTexture.setCheckBoxData(val);
    }
  },
  methods: {
    handleCheckAll() {
      this.checkAll = !this.checkAll;
      if (this.checkAll) {
        this.checkBoxData = mdTexture.getCheckBoxValues().concat();
      } else {
        this.checkBoxData.length = 0;
      }
    },
    async updateSvn() {
      this.isUpdateSvnLoading = true;
      Global.showRegionLoading();
      try {
        await mdTexture.updateSvn();
        this.isUpdateSvnLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isUpdateSvnLoading = false;
        Global.hideRegionLoading();
      }
    },
    async clearTexture() {
      this.isClearTextureLoading = true;
      Global.showRegionLoading();
      try {
        await mdTexture.clearTexture();
        this.isClearTextureLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isClearTextureLoading = false;
        Global.hideRegionLoading();
      }
    },
    async copyTextureIn() {
      this.isCopyTextureInLoading = true;
      Global.showRegionLoading();
      try {
        await mdTexture.copyTextureIn();
        this.isCopyTextureInLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isCopyTextureInLoading = false;
        Global.hideRegionLoading();
      }
    },
    async clipTexture() {
      this.isClipTextureLoading = true;
      Global.showRegionLoading();
      try {
        await mdTexture.clipTexture();
        this.isClipTextureLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isClipTextureLoading = false;
        Global.hideRegionLoading();
      }
    },
    async packerTexture() {
      this.isPackerTextureLoading = true;
      Global.showRegionLoading();
      try {
        await mdTexture.packerTexture();
        this.isPackerTextureLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isPackerTextureLoading = false;
        Global.hideRegionLoading();
      }
    },
    async copyTextureOut() {
      this.isCopyTextureOutLoading = true;
      Global.showRegionLoading();
      try {
        await mdTexture.copyTextureOut();
        this.isCopyTextureOutLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isCopyTextureOutLoading = false;
        Global.hideRegionLoading();
      }
    },
    async importDefault() {
      this.isImportDefaultLoading = true;
      Global.showRegionLoading();
      try {
        await mdAsset.importDefault();
        this.isImportDefaultLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isImportDefaultLoading = false;
        Global.hideRegionLoading();
      }
    },
    async oneForAll() {
      Global.showLoading();
      try {
        await this.updateSvn();
        await this.clearTexture();
        await this.copyTextureIn();
        await this.clipTexture();
        await this.packerTexture();
        await this.copyTextureOut();
        await this.importDefault();

        Global.hideLoading();
        Global.dialog("One·for·All Success");
      } catch (error) {
        Global.hideLoading();
        Global.snack("One·for·All Error", error);
      }
    }
  },
  mounted() {}
};
</script>

<style lang="css">
.select-control-row {
  padding: 8px 0;
}
.select-control-group {
  margin: 16px 0;
}
</style>