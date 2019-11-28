<template>
  <mu-container>
    <div class="button-wrapper">
      <mu-flex class="flex-wrapper" align-items="center">
        <mu-col span="12" lg="2" sm="2">
          <mu-checkbox v-model="isTest" label="是否测试" @change="refreshPolicyNum"></mu-checkbox>
        </mu-col>
        <mu-col span="12" lg="2" sm="2">
          <mu-text-field class="text-game" v-model="policyNum" label="策略版本号" label-float />
        </mu-col>
      </mu-flex>
      <mu-button
        v-loading="isApplyPolicyNumLoading"
        data-mu-loading-size="24"
        color="pink500"
        @click="onApplyPolicyNum"
      >应用策略版本</mu-button>
    </div>
  </mu-container>
</template>

<script>
import * as mdFtp from "../js/MdFtp.js";
import { Global } from "../js/Global.js";
import { ModelMgr } from "../js/model/ModelMgr";
import * as ExternalUtil from "../js/ExternalUtil";
import { version } from "punycode";

export default {
  data() {
    return {
      isApplyPolicyNumLoading: false,
      policyNum: null,
      isTest: true
    };
  },
  watch: {
    policyNum: value => {
      ModelMgr.versionModel.setLessonPolicyNum(value);
    }
  },
  methods: {
    async onApplyPolicyNum() {
      this.isApplyPolicyNumLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.applyLessonPolicyNum(this.isTest);
        this.isApplyPolicyNumLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isApplyPolicyNumLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onCheckPolicyNum() {
      let data = JSON.parse(value);
      if (data.Code == 0) {
        Global.toast(`策略版本:${data.Data.Version}`);
      } else {
        Global.snack(data.Message, null, false);
      }
    },
    async refreshPolicyNum() {
      let versionName = this.isTest
        ? ModelMgr.versionModel.eEnviron.ready
        : ModelMgr.versionModel.eEnviron.release;
      let value = await ExternalUtil.getPolicyInfo(versionName);
      let data = JSON.parse(value);
      if (data.Code == 0) {
        this.policyNum = data.Data.Version;
      }
    }
  },
  async mounted() {
    this.refreshPolicyNum();
  }
};
</script>