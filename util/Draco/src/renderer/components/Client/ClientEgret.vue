<template>
  <mu-container>
    <div class="button-wrapper">
      <mu-button
        v-loading="isUpdateGitLoading"
        data-mu-loading-size="24"
        color="pink500"
        @click="updateGit"
      >更新git文件</mu-button>
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
      <mu-button
        v-loading="isCommitGitLoading"
        data-mu-loading-size="24"
        color="blue500"
        @click="commitGit"
      >Git提交文件</mu-button>
      <mu-button
        v-loading="isPullGitLoading"
        data-mu-loading-size="24"
        color="purple500"
        @click="pushGit"
      >Git推送文件</mu-button>
    </div>
  </mu-container>
</template>
<script>
import * as mdEgret from "../js/MdEgret.js";
import { Global } from "../js/Global.js";

export default {
  data() {
    return {
      isUpdateGitLoading: false,
      isEgretRunLoading: false,
      isEgretStopLoading: false,
      isCommitGitLoading: false,
      isPullGitLoading: false
    };
  },
  watch: {},
  methods: {
    async updateGit() {
      this.isUpdateGitLoading = true;
      try {
        await mdEgret.updateGit();
        this.isUpdateGitLoading = false;
      } catch (error) {
        this.isUpdateGitLoading = false;
      }
    },
    async egretRun() {
      this.isEgretRunLoading = true;
      try {
        await mdEgret.egretRun();
        this.isEgretRunLoading = false;
      } catch (error) {
        this.isEgretRunLoading = false;
      }
    },
    stopRun() {
      this.isEgretStopLoading = true;
      try {
        mdEgret.stopRun();
        this.isEgretStopLoading = false;
        this.isEgretRunLoading = false;
      } catch (error) {
        this.isEgretStopLoading = false;
      }
    },
    async commitGit() {
      this.isCommitGitLoading = true;
      try {
        await mdEgret.commitGit();
        this.isCommitGitLoading = false;
      } catch (error) {
        this.isCommitGitLoading = false;
      }
    },
    async pushGit() {
      this.isPullGitLoading = true;
      try {
        await mdEgret.pushGit();
        this.isPullGitLoading = false;
      } catch (error) {
        this.isPullGitLoading = false;
      }
    }
  },
  mounted() {}
};
</script>