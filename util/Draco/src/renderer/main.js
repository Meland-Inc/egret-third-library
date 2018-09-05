import 'muse-ui/dist/muse-ui.css'
import 'muse-ui-loading/dist/muse-ui-loading.css'; // load css

import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'

import MuseUILoading from './loading';
import MuseUI from 'muse-ui'

// const MuseUI = require("muse-ui");

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))

Vue.use(MuseUI);
Vue.use(MuseUILoading);

Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
