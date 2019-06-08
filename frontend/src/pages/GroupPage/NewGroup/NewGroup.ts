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

import {EventBus, UPDATE_ADMIN_GROUPS} from "../../../services/events";
import ContentManifestInfoItem from "../../../directives/ContentManifestInfoItem/ContentManifestInfoItem";
import ChooseFileContentsIdsModal from "../../../modals/ChooseFileContentsIdsModal/ChooseFileContentsIdsModal";
import ContentManifestItem from "../../../directives/ContentManifestItem/ContentManifestItem";

export default {
    template: require('./NewGroup.html'),
    components: {ContentManifestItem},
    methods: {
        create() {
            this.$coreApi.createGroup(this.group).then((createdGroup) => {
                EventBus.$emit(UPDATE_ADMIN_GROUPS);
                this.$router.push({name: 'group-page', params: {groupId: createdGroup.manifestStaticStorageId}})
            }).catch(() => {
                this.error = 'failed';
            })
        },
        chooseImage(fieldName) {
            this.$root.$asyncModal.open({
                id: 'choose-file-contents-ids-modal',
                component: ChooseFileContentsIdsModal,
                onClose: (selected) => {
                    if(!selected || !selected.length) {
                        return;
                    }
                    this.group[fieldName] = selected[0];
                }
            });
        }
    },
    computed: {
        creationDisabled() {
            return !this.group.name || !this.group.title;
        }
    },
    data() {
        return {
            localeKey: 'login_page',
            group: {
                name: '',
                title: '',
                type: 'channel',
                view: 'tumblr-like',
                isPublic: true,
                avatarImageId: null,
                coverImageId: null
            },
            error: null
        };
    }
}
