/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

export default {
  template: require('./LoginPage.html'),
  created() {
    this.server = this.stateServerAddress;
  },
  methods: {
    login() {
      this.$coreApi.login(this.server, this.username, this.password).then((data) => {
        this.$store.commit('user', data.user);
        this.$router.push({name: 'main-page'});
        this.error = null;
      }).catch(() => {
        this.error = 'failed';
      })
    }
  },
  watch: {
    stateServerAddress() {
      this.server = this.stateServerAddress;
    }
  },
  computed: {
    stateServerAddress(){
      return this.$store.state.serverAddress;
    }
  },
  data() {
    return {
      localeKey: 'login_page',
      server: null,
      username: null,
      password: null,
      error: null
    };
  }
}
