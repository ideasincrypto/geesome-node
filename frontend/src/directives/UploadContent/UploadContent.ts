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

import ChooseContentsIdsModal from "../../modals/ChooseContentsIdsModal/ChooseContentsIdsModal";

const _ = require('lodash');
const pIteration = require('p-iteration');
const detecterLib = require('@galtproject/geesome-libs/src/detecter');

export default {
    name: 'upload-content',
    template: require('./UploadContent.html'),
    props: ['contentId', 'groupId', 'folderId', 'hideMethods'],
    async created() {

    },

    async mounted() {

    },

    methods: {
        setMode(modeName) {
            this.mode = modeName;
        },
        saveText() {
            this.saving = true;
            const fileName = this.localValue.replace(/(<([^>]+)>)/ig,"").slice(0, 50) + '.html';
            this.$coreApi.saveContentData(this.localValue, {groupId: this.groupId, fileName, folderId: this.folderId}).then(this.contentUploaded.bind(this))
        },
        async uploadFiles(files) {
            const mode = this.mode;
            await pIteration.forEachSeries(files, (file) => {
                this.saving = true;
                return this.$coreApi.saveFile(file, {groupId: this.groupId, folderId: this.folderId}).then((contentObj) => {
                    return this.contentUploaded(contentObj, mode);
                });
            });
        },
        saveLink() {
            this.saving = true;
            this.$coreApi.saveDataByUrl(this.localValue, {groupId: this.groupId, driver: this.driver, folderId: this.folderId}).then(this.contentUploaded.bind(this))
        },
        contentUploaded(contentObj, mode?) {
            this.$emit('update:content-id', contentObj.id);
            this.$emit('uploaded', {
                method: mode || this.mode,
                id: contentObj.id
            });
            this.setMode(null);
            this.localValue = '';
            this.saving = false;
        },
        chooseUploaded() {
            this.$root.$asyncModal.open({
                id: 'choose-contents-ids-modal',
                component: ChooseContentsIdsModal,
                onClose: (selected) => {
                    if(!selected) {
                        return;
                    }
                    selected.forEach((id) => {
                        this.$emit('uploaded', {
                            method: 'choose-uploaded',
                            id
                        });
                    });
                }
            });
        }
    },

    watch: {
        localValue() {
            if(this.mode === 'upload_link') {
                if(detecterLib.isYoutubeUrl(this.localValue)) {
                    this.driver = 'youtube-video';
                }
            }
        }
    },

    computed: {
        contentsList() {
            // return _.orderBy(this.value.contents, ['position'], ['asc']);
        },
        isHideEnterText() {
            return this.hideMethods && _.includes(this.hideMethods, 'enter_text');
        },
        isHideUploadNew() {
            return this.hideMethods && _.includes(this.hideMethods, 'upload_new');
        },
        isHideUploadLink() {
            return this.hideMethods && _.includes(this.hideMethods, 'upload_link');
        },
        isHideChooseUploaded() {
            return this.hideMethods && _.includes(this.hideMethods, 'choose_uploaded');
        }
    },
    data() {
        return {
            mode: '',
            localValue: '',
            saving: false,
            driver: 'none'
        }
    },
}
