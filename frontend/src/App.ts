/*
 * Copyright ©️ 2018 Galt•Space Society Construction and Terraforming Company 
 * (Founded by [Nikolai Popeka](https://github.com/npopeka),
 * [Dima Starodubcev](https://github.com/xhipster), 
 * [Valery Litvin](https://github.com/litvintech) by 
 * [Basic Agreement](http://cyb.ai/QmSAWEG5u5aSsUyMNYuX2A2Eaz4kEuoYWUkVBRdmu9qmct:ipfs)).
 * ​
 * Copyright ©️ 2018 Galt•Core Blockchain Company 
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) and 
 * Galt•Space Society Construction and Terraforming Company by 
 * [Basic Agreement](http://cyb.ai/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS:ipfs)).
 */

import Vue from 'vue';
import VueRouter from 'vue-router';
import * as Vuex from 'vuex';
import VueMaterial from 'vue-material'
import {Modal} from "@galtproject/frontend-core/modals/AsyncModal";
import Notifications from 'vue-notification';
import 'url-search-params-polyfill';

import httpPlugin from '@galtproject/frontend-core/services/http.plugin';
import localePlugin from '@galtproject/frontend-core/services/locale.plugin';
import storePlugin from '@galtproject/frontend-core/services/store.plugin';
import "@galtproject/frontend-core/filters";
import PrettyHex from "@galtproject/frontend-core/directives/PrettyHex/PrettyHex";
import PrettyDoc from "@galtproject/frontend-core/directives/PrettyDoc/PrettyDoc";

import coreApiPlugin from './services/coreApi.plugin';
import identitiesPlugin from './services/identities.plugin';
import MainMenu from "./directives/MainMenu/MainMenu";
import ContentManifestItem from "./directives/ContentManifestItem/ContentManifestItem";
import PostsContainer from "./directives/Posts/PostsContainer/PostsContainer";

import {VueEditor, Quill} from 'vue2-editor'
import UploadContent from "./directives/UploadContent/UploadContent";
import MoveFileCatalogItemContainer
  from "./directives/FileCatalog/MoveFileCatalogItem/MoveFileCatalogItemContainer/MoveFileCatalogItemContainer";
import Helper from "@galtproject/frontend-core/services/helper";
import {EventBus, UPDATE_CURRENT_USER} from "./services/events";

const _ = require('lodash');

Vue.use(Notifications);

Vue.use(coreApiPlugin);
Vue.use(identitiesPlugin);
Vue.use(httpPlugin);
Vue.use(Vuex as any);
Vue.use(storePlugin, {
  user: null,
  locale: null,
  locale_loaded: null,
  serverAddress: null,
  haveAdminReadPermission: false,
  cybActive: false,
  is_mobile: false,
  usersInfo: {},
  usersInfoLoading: {}
});
Vue.use(localePlugin);
Vue.use(identitiesPlugin);

Vue.component('vue-editor', VueEditor);
Vue.component('modal', Modal);
Vue.component('pretty-hex', PrettyHex);
Vue.component('pretty-doc', PrettyDoc);
Vue.component('content-manifest-item', ContentManifestItem);
Vue.component('posts-container', PostsContainer);
Vue.component('upload-content', UploadContent);

// https://github.com/vuematerial/vue-material/issues/1977
Vue.use(VueRouter);

Vue.component('router-link', Vue['options'].components.RouterLink);
Vue.component('router-view', Vue['options'].components.RouterView);

Vue.use(VueMaterial);

Vue.filter('prettySize', function (bytesSize) {
  bytesSize = parseInt(bytesSize);

  function round(number) {
    return Math.round(number * 1000) / 1000;
  }

  if (bytesSize < 1024 * 100) {
    return round(bytesSize / 1024) + ' Kb';
  }
  if (bytesSize < 1024 ** 2 * 100) {
    return round(bytesSize / (1024 ** 2)) + ' Mb';
  }
  if (bytesSize < 1024 ** 3 * 100) {
    return round(bytesSize / (1024 ** 3)) + ' Gb';
  }
  return round(bytesSize / (1024 ** 4)) + ' Tb';
});

Vue.filter('prettyFileName', function (str) {
  if (str.length <= 20) {
    return str;
  }
  return str ? str.slice(0, 7) + "..." + str.slice(-6) : '';
});

export default {
  template: require('./App.html'),
  components: {MainMenu, MoveFileCatalogItemContainer},//,ConsoleLog
  async created() {
    this.$store.commit('is_mobile', Helper.isMobile());
    
    this.$locale.init(this.$store, '/locale/').then(() => {
      this.$store.commit('locale_loaded', true);
      this.language = this.$locale.lang;
    });
    this.$locale.onLoad(() => {
      this.$store.commit('locale_loaded', true);
      this.language = this.$locale.lang;
    });

    this.$identities.init(this.$store);
    await this.$coreApi.init(this.$store);
    
    this.getCurrentUser();
    
    EventBus.$on(UPDATE_CURRENT_USER, this.getCurrentUser.bind(this));

    document.addEventListener("cyb:init", (data) => {
      this.$store.commit('cybActive', true);
    });
  },

  async mounted() {
    this.$root.$asyncModal = this.$refs.modal;
    this.$root.$asyncSubModal = this.$refs.sub_modal;
  },

  methods: {
    async logout() {
      await this.$coreApi.logout();
      location.reload();
    },
    getCurrentUser() {
      this.$coreApi.getCurrentUser().then(async (user) => {
        this.$store.commit('user', user);

        this.$store.commit('haveAdminReadPermission', await this.$coreApi.adminIsHaveCorePermission('admin:read'));

        this.loading = false;
      }).catch(() => {
        this.$store.commit('user', null);
        // this.$router.push({name: 'login'});
        this.loading = false;
      });
    },
    getLocale(key, options?) {
      return this.$locale.get(this.localeKey + "." + key, options);
    }
  },

  watch: {
    '$route.name'() {
      this.menuVisible = false;
    }
  },

  computed: {
    serverAddress() {
      return this.$store.state.serverAddress;
    },
    user() {
      return this.$store.state.user;
    },
    is_mobile() {
      return this.$store.state.is_mobile;
    }
  },

  data() {
    return {
      localeKey: 'app_container',
      version: '0.2.0',
      menuVisible: false,
      menuMinimized: true,
      loading: true
    }
  },
}
