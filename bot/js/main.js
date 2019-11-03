
var oldConfig;
var curLanguage;

// read configuration json from webserver and initialize UI
function readConfig() {
  $.ajax({
    cache: false,
    url: "/config",
    dataType: "json",
    success: function(data) {
      // set config
      model.cfg = data;
      // save original config for later compare
      oldConfig= JSON.stringify(data);

      // get saved langauge
      newLanguage= model.cfg.settings.language;
      if (!newLanguage || newLanguage== '')
        newLanguage= navigator.language.substr(0, 2);
  
      // load another language if specified in settings
      if (curLanguage!= newLanguage) {
        readI18n(newLanguage);
      }
    }
  });
}

function readI18n(lang) {
  curLanguage= lang;

 // read translation for browser language  (english will be used as fallback)
  $.getJSON("/i18n/" + lang + ".json", function (data) {
    model.i18n = data;
    var isRtlLanguage= false;
    if (model.i18n.isRtl) {
      isRtlLanguage= true;
    }
    vueApp.$vuetify.rtl = isRtlLanguage;
  });
}

 // get current version and check for version updates
function readVersion() {
  $.getJSON("/version/local", function (curVersion) {
     model.version.current= curVersion;
     $.getJSON("/version/remote", function (newVersion) {
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
   $.getJSON("/wifi", function (data) {
     model.wifi= data
   });
 }
   
 // send configuration back to webserver on each change
function sendUpdatedConfig(newConfig) {
  // check if language changed and reload
  if (model.cfg.settings.language!= curLanguage)
    readI18n(model.cfg.settings.language);

  oldConfig= newConfig;
  $.ajax({
    url: '/config',
    type: 'POST',
    data: newConfig,
    contentType: 'application/json; charset=utf-8',
    dataType: 'json'
  }).done(function (data) {
    // "success", "none", "error"
    model.ui.snackbar_text= model.i18n.msg_config_saved;
    model.ui.snackbar_color= 'green';
    model.ui.snackbar= true;
  })
  .fail(function (data) {
    if (data.status == 200) {
      model.ui.snackbar_text= model.i18n.msg_config_saved;
      model.ui.snackbar_color= 'green';
      model.ui.snackbar= true;
    }
    else {
      model.ui.snackbar_text= model.i18n.msg_config_save_error + data.status;
      model.ui.snackbar_color= 'orange';
      model.ui.snackbar= true;
    }
  });
}


var model = {
    cfg: {
      settings: {},
    },
    i18n: {},
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

var vueApp= new Vue({
  el: '#app',
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
      var t= model.ui.bottomNav.replace('bot_', '')+ '_title'
      return this.model.i18n[t];
    },
  },
});

readConfig();
readI18n(navigator.language.substr(0, 2));
readVersion();
readWifi();

// disable splash screen after 1 sec
setTimeout(() => {
  model.ui.bottomNav= 'bot_home';
}, 1000);

