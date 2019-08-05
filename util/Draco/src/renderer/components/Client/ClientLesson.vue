<template>
  <mu-container>
    <div class="button-wrapper">
      <mu-button
        v-loading="isUpdateSvnLoading"
        data-mu-loading-size="24"
        color="pink500"
        @click="updateSvn"
      >应用lesson策略版本</mu-button>
    </div>
    <div class="button-wrapper">
      <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
    </div>
  </mu-container>
</template>

<script>
import * as mdCsv from "../js/MdCsv.js";
import { Global } from "../js/Global.js";

export default {
  data() {
    return {
      isApplyPolicyLoading: false
    };
  },
  watch: {},
  methods: {
    async applyPolicy() {
      this.isUpdateSvnLoading = true;
      Global.showRegionLoading();
      try {
        await mdCsv.updateSvn();
        this.isUpdateSvnLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isUpdateSvnLoading = false;
        Global.hideRegionLoading();
      }
    },
    async oneForAll() {
      Global.showLoading();
      try {
        await this.applyPolicy();
        Global.hideLoading();
        Global.toast("One·for·All Success");
      } catch (error) {
        Global.hideLoading();
        Global.snack("One·for·All Error", error);
      }
    }
  },
  mounted() {}
};
</script>