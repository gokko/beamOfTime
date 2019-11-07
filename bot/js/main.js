
var oldConfig;

function changeLanguage(lang) {
  if (app) {
    app.$i18n.i18next.changeLanguage(lang);
    app.$vuetify.rtl= (app.$t('main.isRtl') == 'true');
  }
 }

// read configuration json from webserver and initialize UI
function readConfig() {
  $.ajax({
    cache: false,
    url: "/config",
    dataType: "json"}).then(function(data) {
      // set config
      model.cfg = data;
      // save original config for later compare
      oldConfig= JSON.stringify(data);

      // get saved langauge
      newLanguage= model.cfg.settings.language;
      if (!newLanguage || newLanguage== '')
        newLanguage= navigator.language.substr(0, 2);
  
      // load another language if specified in settings
      changeLanguage(newLanguage);
    });
}

function readInfo() {
    // read system information (hostname, IP-addresses and backup date)
  $.getJSON("/info").then(function (data) {
    model.info = data;
  });
}

// get current version and check for version updates
function readVersion() {
  $.getJSON("/version/local").then(function(curVersion) {
     model.version.current= curVersion;
     $.getJSON("/version/remote").then(function(newVersion) {
       model.version.new = newVersion;
       if (newVersion.version > curVersion.version) {
         model.version.update_available= true;
       }
       else {
         model.version.update_available= false;
       }
     });
   });
 }
   
 // get wifi configuration
 function readWifi() {
   $.getJSON("/wifi").then(function(data) {
     model.wifi= data
   });
 }

 // send configuration back to webserver on each change
function sendUpdatedConfig(newConfig) {
  // check if language changed and switch
  changeLanguage(model.cfg.settings.language)

  oldConfig= newConfig;
  $.ajax({
    cache: false,
    url: '/config',
    type: 'POST',
    data: newConfig,
    contentType: 'application/json; charset=utf-8',
    dataType: 'json'
  }).then(function(data) {
    // success
    model.ui.snackbar_text= app.$t('main.msg_config_saved');
    model.ui.snackbar_color= 'green';
    model.ui.snackbar= true;
  },
  function(data) {
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
    lang: 'en',
    cfg: {
      settings: {},
    },
    info: {},
    version: {
      current: null,
      new: null,
      update_available: false,
      update_changelog_clock: '',
      update_changelog_web: '',
    },
    wifi: {},
    ui: {
      bottomNav: 'bot_intro',
      snackbar: false,
      snackbar_color: 'orange',
      snackbar_text: '',
    }
};

var app= null;
var i18n= null;
function readI18n(lang) {
  if (model) {
    lang= model.lang;
  }

  // read translation for browser language  (english will be used as fallback)
  $.getJSON("/i18n", function (data) {

    Vue.use(VueI18next);
    i18next.init({
      lng: lang,
      fallbackLng: "en",
      resources: data
    });
    i18n = new VueI18next(i18next);

    app= new Vue({
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
    
    changeLanguage(lang);
});
}

$.ajaxSetup({ cache: false });
readI18n(navigator.language.substr(0, 2));
readConfig();
readInfo();
readVersion();
readWifi();

// disable splash screen after 1 sec
setTimeout(() => {
  model.ui.bottomNav= 'bot_home';
}, 2000);

