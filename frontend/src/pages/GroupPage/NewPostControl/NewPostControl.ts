/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

import ContentManifestInfoItem from "../../../directives/ContentManifestInfoItem/ContentManifestInfoItem";
import {EventBus, UPDATE_GROUP} from "../../../services/events";

export default {
  template: require('./NewPostControl.html'),
  props: ['group'],
  components: {ContentManifestInfoItem},
  async created() {
    this.fetchData();
  },

  async mounted() {

  },

  methods: {
    async fetchData() {
      if (!this.group) {
        this.canCreatePosts = false;
        return;
      }
      this.canCreatePosts = await this.$coreApi.getCanCreatePost(this.group.id);
    },
    handleUpload(data) {
      this.postContentsDbIds.push(data.id);
    },
    deleteContent(index) {
      this.postContentsDbIds.splice(index, 1);
    },
    publishPost() {
      const postContentsDbIds = this.postContentsDbIds;
      this.postContentsDbIds = [];
      this.saving = true;
      this.$coreApi.createPost(postContentsDbIds, {groupId: this.group.id, status: 'published'}).then(() => {
        this.saving = false;
        this.$emit('new-post');
        EventBus.$emit(UPDATE_GROUP, this.group.id);
      })
    },
  },

  watch: {
    group() {
      this.fetchData();
    }
  },

  computed: {},
  data() {
    return {
      localeKey: 'group_page',
      canCreatePosts: false,
      saving: false,
      postContentsDbIds: []
    }
  },
}
