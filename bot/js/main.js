
var oldConfig;

function changeLanguage(lang) {
  if (app) {
    app.$i18n.i18next.changeLanguage(lang);
    dir= model.cfg.languages.find((e) => { if (e.value== lang) return e }).dir
    app.$vuetify.rtl= (dir == 'rtl');
  }
 }

async function readInfo() {
  model.info= await $.getJSON("/info");
}

async function readDatetime() {
  model.dt= await $.getJSON("/datetime");
  d= new Date(model.dt.TimeUSec.slice(0, 19).replace(' ', 'T'));
  model.dt['curTime']= d.getTime();
}

// get current version and check for version updates
async function readVersion() {
  model.version= await $.getJSON("/version");
 }

 // get wifi configuration
 async function readWifi() {
  model.wifi= await $.getJSON("/wifi");
 }

// read configuration json from webserver and initialize UI
async function readConfig() {
  model.cfg= await $.ajax({url: "/config", dataType: "json"});

  // save original config for later compare
  oldConfig= JSON.stringify(model.cfg);

  // set theme index (to be able to track name changes)
  model.cfg.themes.forEach((theme, idx) => {
    if (model.cfg.settings.currentTheme== theme.name) {
      model.ui.themeIndex= idx
    }
  });
  
  // get langauge from saved settings or from browser
  newLanguage= model.cfg.settings.language;
  if (!newLanguage || newLanguage== '')
    newLanguage= navigator.language.substr(0, 2);

  // switch language
  changeLanguage(newLanguage);
}

 // send configuration back to webserver on each change
function sendUpdatedConfig(newConfig) {
  // check if language changed and switch
  changeLanguage(model.cfg.settings.language);

  oldConfig= newConfig;
  $.ajax({
    url: '/config',
    type: 'POST',
    data: newConfig,
    contentType: 'application/json; charset=utf-8',
    dataType: 'json'
  }).then(
    (data) => {
        // success
        model.ui.snackbar_text= app.$t('main.msg_config_saved');
        model.ui.snackbar_color= 'green';
        model.ui.snackbar= true;
    },
    (data) => {
      // error
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
    version: {},
    wifi: {},
    dt: {},
    ui: {
      bottomNav: 'bot_intro',
      themeIndex: 0,
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
    loadPath: '/i18n/{{lng}}?_=[version]'
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
        // set the selected theme
        if (this.model.ui.themeIndex === undefined) {
          this.model.ui.themeIndex= 0;
        }
        if (!(this.model.cfg.themes === undefined) && this.model.cfg.themes.length > this.model.ui.themeIndex && this.model.cfg.settings.currentTheme!= this.model.cfg.themes[this.model.ui.themeIndex].name) {
          this.model.cfg.settings.currentTheme= this.model.cfg.themes[this.model.ui.themeIndex].name;
        }
        // check if config has changed
        var newConfig = JSON.stringify(this.model.cfg);
        if (oldConfig && oldConfig != newConfig) {
          sendUpdatedConfig(newConfig);
        }
      }
    }
  },
  computed: {
  },
});

readConfig();
readInfo();
readVersion();
readWifi();
readDatetime();

// disable splash screen after 1 sec
setTimeout(() => {
  if (model.ui.bottomNav== 'bot_intro') {
    model.ui.bottomNav= 'bot_home';
  }
}, 2000);

// keep time shown in config/datetime up to date if set to auto-uptate (NTP)
setInterval(() => {
  // update internal value current time every second
  if (model.dt.curTime) {
    model.dt.curTime+= 1000;
  }
  // set time string based on updated current time if NTP is on
  if (model.dt.NTP) {
    d= new Date(model.dt.curTime);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    model.dt.TimeUSec= d.toISOString().slice(0, 19).replace('T', ' ');
  }
}, 1000);

