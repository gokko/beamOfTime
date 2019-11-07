
var oldConfig;

function changeLanguage(lang) {
  if (app) {
    app.$i18n.i18next.changeLanguage(lang);
    dir= model.cfg.languages.find((e) => { if (e.value== lang) return e }).dir
    app.$vuetify.rtl= (dir == 'rtl');
  }
 }

// read configuration json from webserver and initialize UI
async function readConfig() {
  model.cfg= await $.ajax({cache: false, url: "/config", dataType: "json"});

  // save original config for later compare
  oldConfig= JSON.stringify(model.cfg);

  // get langauge from saved settings or from browser
  newLanguage= model.cfg.settings.language;
  if (!newLanguage || newLanguage== '')
    newLanguage= navigator.language.substr(0, 2);

  // switch language
  changeLanguage(newLanguage);
}

async function readInfo() {
  model.info= await $.getJSON("/info");
}

// get current version and check for version updates
async function readVersion() {
  model.version.current= await $.getJSON("/version/local");
  model.version.new= await $.getJSON("/version/remote");

  model.version.update_available= (model.version.new > model.version.current);
 }
   
 // get wifi configuration
 async function readWifi() {
  model.wifi= await $.getJSON("/wifi");
 }

 // send configuration back to webserver on each change
function sendUpdatedConfig(newConfig) {
  // check if language changed and switch
  changeLanguage(model.cfg.settings.language);

  oldConfig= newConfig;
  $.ajax({
    cache: false,
    url: '/config',
    type: 'POST',
    data: newConfig,
    contentType: 'application/json; charset=utf-8',
    dataType: 'json'
  }).then((data) => {
    // success
    model.ui.snackbar_text= app.$t('main.msg_config_saved');
    model.ui.snackbar_color= 'green';
    model.ui.snackbar= true;
  },
  (data) => {
    if (data.status== 200) {
      model.ui.snackbar_text= app.$t('main.msg_config_saved');
      model.ui.snackbar_color= 'green';
      model.ui.snackbar= true;  
    }
    else {
      model.ui.snackbar_text= app.$t('main.msg_config_save_error') + data.status;
      model.ui.snackbar_color= 'orange';
      model.ui.snackbar= true;
    }
  });
}


var model = {
    lang: navigator.language.substr(0, 2),
    cfg: {
      settings: {},
    },
    info: {},
    version: {
      current: null,
      new: null,
      update_available: false
    },
    wifi: {},
    ui: {
      bottomNav: 'bot_intro',
      snackbar: false,
      snackbar_color: 'orange',
      snackbar_text: '',
    }
};


Vue.use(VueI18next);
i18next.use(i18nextXHRBackend).init({
  lng: model.lang,
  fallbackLng: "en",
  backend: {
    // load from i18next-gitbook repo
    loadPath: '/i18n/{{lng}}'
  }
});
const i18n= new VueI18next(i18next);

const app= new Vue({
  el: '#app',
  i18n: i18n,
  vuetify: new Vuetify({
    theme: {
      dark: true,
    },
  }),
  data() {
    return {
      model: model
    }
  },
  watch: {
    model: {
      deep: true,
      handler() {
        // check if config has changed
        var newConfig = JSON.stringify(this.model.cfg)
        if (oldConfig && oldConfig != newConfig) {
          sendUpdatedConfig(newConfig);
        }
      }
    }
  },
  computed: {
    page_name: function () {
      // find page name in i18n: e.g. for page 'bot_home' i18n key is 'home_title'
      var t= model.ui.bottomNav.replace('bot_', '')+ '.title'
      return this.$i18n.t(t);
    },
  },
});

$.ajaxSetup({ cache: false });

readConfig();
readInfo();
readVersion();
readWifi();

// disable splash screen after 1 sec
setTimeout(() => {
  model.ui.bottomNav= 'bot_home';
}, 2000);

