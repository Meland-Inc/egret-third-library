<template>
  <mu-container>
    <div class="button-wrapper">
      <mu-button
        v-loading="isUpdateSVNLoading"
        data-mu-loading-size="24"
        color="pink500"
        @click="updateSVN"
      >更新客户端</mu-button>
      <mu-button
        v-loading="isEgretRunLoading"
        data-mu-loading-size="24"
        color="orange500"
        @click="egretRun"
      >运行游戏</mu-button>
      <mu-button
        v-loading="isEgretStopLoading"
        data-mu-loading-size="24"
        color="cyan500"
        @click="stopRun"
      >停止游戏</mu-button>
    </div>
  </mu-container>
</template>
<script>
import * as mdEgret from "../js/MdEgret.js";
import { Global } from "../js/Global.js";
const electron = require('electron')

export default {
  data() {
    return {
      isUpdateSVNLoading: false,
      isEgretRunLoading: false,
      isEgretStopLoading: false,
      isCommitGitLoading: false,
      isPullGitLoading: false
    };
  },
  watch: {},
  methods: {
    async updateSVN() {
      this.isUpdateSVNLoading = true;
      try {
        await mdEgret.updateFoolSVN();
        this.isUpdateSVNLoading = false;
      } catch (error) {
        this.isUpdateSVNLoading = false;
      }
    },
    egretRun() {
      if (this.isEgretRunLoading) {
        return;
      }
      this.isEgretRunLoading = true;
      try {
        electron.shell.openExternal(Global.foolClientUrl);
        mdEgret.egretFoolRun();
      } catch (error) {
        this.isEgretRunLoading = false;
      }
    },
    stopRun() {
      if (!this.isEgretRunLoading) {
        return;
      }
      this.isEgretStopLoading = true;
      try {
        mdEgret.egretFoolStop();
        this.isEgretStopLoading = false;
        this.isEgretRunLoading = false;
      } catch (error) {
        this.isEgretStopLoading = false;
      }
    },
  },
  mounted() {}
};
</script>