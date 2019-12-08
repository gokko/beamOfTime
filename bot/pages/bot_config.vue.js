const botConfigTemplate= `<v-container mt-4 mb-12>
    
  <v-expansion-panels v-model="config_panel" focusable>

    <v-expansion-panel>
      <v-expansion-panel-header>{{$t('config.info.title')}}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <br/>
        {{$t('config.info.msg_into')}}<br/>
        {{$t('config.info.msg_details')}}<br/><br/>
        {{$t('config.restart.msg')}}
      </v-expansion-panel-content>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-header>{{$t('config.info.hostname')}} & {{$t('config.info.adresses')}}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-list one-line>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title v-text="$t('config.info.hostname')"></v-list-item-title>
              <v-list-item-subtitle v-text="info.hostname"></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-for="(ip, idx) in info.ips" :key="idx">
            <v-list-item-content>
              <v-list-item-title v-text="ip.name"></v-list-item-title>
              <v-list-item-subtitle v-text="ip.ip"></v-list-item-subtitle>
            </v-list-item-content>
            </v-list-item>
        </v-list>
      </v-expansion-panel-content>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-header>{{$t('config.datetime.title')}}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-form>
          <v-autocomplete :label="$t('config.datetime.timezone')" v-model="dt.Timezone" :items="dt.timezones"></v-autocomplete>
          <v-switch color="#04BF3D" v-model="dt.NTP" inset :label="$t('config.datetime.useNTP')"></v-switch>
          <div v-if="dt.NTP">
            <v-text-field disabled v-model="date" :label="$t('config.datetime.date')" prepend-icon="mdi-calendar"></v-text-field>
            <v-text-field disabled v-model="time" :label="$t('config.datetime.time')" prepend-icon="mdi-clock"></v-text-field>
          </div>
          <div v-else>
            <v-menu ref="dateMenu" v-model="datePopup" :nudge-right="40" :close-on-content-click="false" :return-value.sync="date" transition="scale-transition" offset-y min-width="290px">
              <template v-slot:activator="{ on }">
                <v-text-field v-model="date" :label="$t('config.datetime.date')" prepend-icon="mdi-calendar" readonly v-on="on"></v-text-field>
              </template>
              <v-date-picker v-model="date" no-title scrollable>
                <v-spacer></v-spacer>
                <v-btn text color="grey lighten-1" @click="datePopup= false">{{$t('main.btn_cancel')}}</v-btn>
                <v-btn text color="green darken-1" @click="$refs.dateMenu.save(date)">{{$t('main.btn_ok')}}</v-btn>
              </v-date-picker>
            </v-menu>
            <v-menu ref="timeMenu" v-model="timePopup" :return-value.sync="time" :nudge-right="40" transition="scale-transition" offset-y min-width="290px">
              <template v-slot:activator="{ on }">
                <v-text-field v-model="time" :label="$t('config.datetime.time')" prepend-icon="mdi-clock" readonly v-on="on"></v-text-field>
              </template>
              <v-time-picker v-if="timePopup" v-model="time" full-width format="24hr" use-seconds>
                <v-spacer></v-spacer>
                <v-btn text color="grey lighten-1" @click="timePopup= false">{{$t('main.btn_cancel')}}</v-btn>
                <v-btn text color="green darken-1" @click="$refs.timeMenu.save(time)">{{$t('main.btn_ok')}}</v-btn>
              </v-time-picker>
            </v-menu>
          </div>
          <v-btn outlined color="green darken-1" @click="sendDateTimeUpdate()"><v-icon>mdi-content-save</v-icon></v-btn>
        </v-form>
      </v-expansion-panel-content>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-header>
        {{$t('config.backup.title')}}
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <br/>
        {{$t('config.backup.info')}}<br/>
        {{$t('config.backup.info2')}}<br/>
        {{$t('config.backup.info3')}}<br/><br/>
        <div v-if="info.backup_time == ''">{{$t('config.backup.not_evailable')}}<br/><br/></div>
        <div v-if="info.backup_time != ''">{{$t('config.backup.evailable')}}<br/>{{this.info.backup_time}}<br/><br/></div>
        <v-spacer></v-spacer>
        <v-btn outlined color="orange darken-1" @click="showConfirmDialog($t('config.backup.title'), $t('config.backup.confirm'), '', sendBackupRequest, $t('config.backup.btn_backup'))">{{$t('config.backup.btn_backup')}}</v-btn>
        <v-btn outlined color="orange darken-1" @click="showConfirmDialog($t('config.restore.title'), $t('config.restore.confirm'), '', sendRestoreRequest, $t('config.backup.btn_restore'))">{{$t('config.backup.btn_restore')}}</v-btn>
      </v-expansion-panel-content>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-header>
        <v-badge>
          <template v-if="version.update_available" v-slot:badge><v-icon>mdi-check</v-icon></template>
            <span>{{$t('config.update.title')}}</span>
          </v-badge>
        </v-expansion-panel-header>
      <v-expansion-panel-content>
        <br/>
        <div v-if="!version.update_available">{{$t('config.update.msg_old')+ ' v'+ version.current.version}}</div>
        <div v-if="version.update_available">
          <div>{{$t('config.update.msg_new')}}<br/></div>
          <div><br/><b>{{$t('config.update.change_history')}} ({{'v'+ version.current.version}} ⮚ {{'v'+ version.new.version}}):</b><br/></div>
          <div v-if="note.version > version.current.version" v-for="note in version.new.release_notes"><i>v{{note.version}} ({{note.date}})</i><br/>{{note.info}}<br/></div>
          <br/>
        </div>
        <v-spacer></v-spacer>
        <v-btn outlined v-if="version.update_available" color="orange darken-1" @click="sendUpdateRequest">{{$t('config.update.btn_install')}}</v-btn>
      </v-expansion-panel-content>
    </v-expansion-panel>  
    
    <v-expansion-panel>
      <v-expansion-panel-header>
        {{$t('config.restart.title')}}
      </v-expansion-panel-header>  
      <v-expansion-panel-content>
        <br/>
        <v-icon color="blue darken-1">mdi-undo</v-icon> {{$t('config.restart.msg_restart')}}<br/><br/>
        <v-icon color="orange darken-1">mdi-replay</v-icon> {{$t('config.restart.msg_reboot')}}<br/><br/>
        <v-icon color="red darken-1">mdi-power</v-icon> {{$t('config.restart.msg_shutdown')}}<br/><br/>
        <v-spacer></v-spacer>
        <v-btn outlined color="blue darken-1" @click="sendRestartRequest('restart')"><v-icon>mdi-undo</v-icon></v-btn>
        <v-btn outlined color="orange darken-1" @click="sendRestartRequest('reboot')"><v-icon>mdi-replay</v-icon></v-btn>
        <v-btn outlined color="red darken-1" @click="sendRestartRequest('shutdown')"><v-icon>mdi-power</v-icon></v-btn>
      </v-expansion-panel-content>  
    </v-expansion-panel>  

    <v-expansion-panel>
      <v-expansion-panel-header>{{$t('config.wifi.title')}}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-form>
          <v-text-field type="text" v-model="wifi.country" counter="2" :label="$t('config.wifi.country')" required></v-text-field>

          <v-subheader>{{$t('config.wifi.connections')}}</v-subheader>
          <v-btn outlined color="blue darken-1" @click="addWifi()"><v-icon>mdi-plus-one</v-icon></v-btn>
          <v-btn outlined color="green darken-1" @click="sendWifiSaveRequest()"><v-icon>mdi-content-save</v-icon></v-btn>
          <v-spacer></v-spacer>
          <br/>
          <v-expansion-panels v-model="wifi_panel" focusable>
            <v-expansion-panel v-for="(network, index) in wifi.networks" :key="index" class="grey darken-1">
              <v-expansion-panel-header>{{network.ssid}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-text-field type="text" counter v-model="network.ssid" :label="$t('config.wifi.ssid')" :rules="[pwd_rules.required]"></v-text-field>
                    <v-text-field v-model="network.psk" counter
                      :append-icon="showPwd ? 'mdi-eye' : 'mdi-eye-off'"
                      :rules="[pwd_rules.required, pwd_rules.min]"
                      :type="showPwd ? 'text' : 'password'"
                      name="wifi_pwd"
                      :label="$t('config.wifi.password')"
                      @click:append="showPwd = !showPwd">
                    </v-text-field>
                  <v-select :items="wifi_type_items" v-model="network.key_mgmt" :label="$t('config.wifi.type')"></v-select>
                  <v-btn outlined color="orange darken-1" @click="removeWifi(index)"><v-icon>mdi-delete</v-icon></v-btn>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-form>
      </v-expansion-panel-content>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-header>{{$t('config.sound.title')}}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-form ref="form" v-model="form_valid" lazy-validation>
          <v-switch color="#04BF3D" v-model="cfg.system.soundAvailable" inset :label="$t('config.sound.available')"></v-switch>
          <div v-if="cfg.system.soundAvailable">
            <v-subheader>{{$t('config.sound.volume')}}</v-subheader>
            <br/>
            <v-slider :value="cfg.system.soundVolume" @change="v => cfg.system.soundVolume = v" step="5" color="green" min="0" max="100" thumb-label="always">
              <template v-slot:prepend>
                <v-icon color="green" @click="cfg.system.soundVolume--">mdi-minus</v-icon>
              </template>
              <template v-slot:append>
                <v-icon color="green" @click="cfg.system.soundVolume++">mdi-plus</v-icon>
              </template>
            </v-slider>
          </div>
        </v-form>
      </v-expansion-panel-content>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-header>{{$t('config.led.title')}}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-form ref="form" v-model="form_valid" lazy-validation>
        <v-subheader>{{$t('config.led.pin_lbl')}}</v-subheader>
          <v-btn-toggle v-model="cfg.system.ledPin" mandatory>
            <v-btn outlined :value="12" color="green">12</v-btn>
            <v-btn outlined :value="18" color="green">18</v-btn>
          </v-btn-toggle>
          <v-subheader>{{$t('config.led.count_lbl')}}</v-subheader>
          <v-btn-toggle v-model="cfg.system.ledCount" mandatory>
            <v-btn outlined :value="60" color="green">60</v-btn>
            <v-btn outlined :value="120" color="green">120</v-btn>
          </v-btn-toggle>
          <v-subheader>{{$t('config.led.ring1_dir_lbl')}}</v-subheader>
          <v-btn-toggle v-model="cfg.system.ledDirection" mandatory>
            <v-btn outlined :value="1" color="green"><v-icon>mdi-rotate-right</v-icon></v-btn>
            <v-btn outlined :value="-1" color="green"><v-icon>mdi-rotate-left</v-icon></v-btn>
          </v-btn-toggle>
          <v-subheader>{{$t('config.led.ring1_start_lbl')}}</v-subheader>
          <br/>
          <v-slider v-model="cfg.system.ledStart" color="green" min="0" :max="cfg.system.ledCount" thumb-label="always"></v-slider>
          <v-subheader>{{$t('config.led.ring2_dir_lbl')}}</v-subheader>
          <v-btn-toggle v-model="cfg.system.ledDirection2" mandatory>
            <v-btn outlined :value="1" color="green"><v-icon>mdi-rotate-right</v-icon></v-btn>
            <v-btn outlined :value="-1" color="green"><v-icon>mdi-rotate-left</v-icon></v-btn>
          </v-btn-toggle>
          <v-subheader>{{$t('config.led.ring2_start_lbl')}}</v-subheader>
          <br/>
          <v-slider v-model="cfg.system.ledStart2" color="green" min="0" :max="cfg.system.ledCount" thumb-label="always"></v-slider>
        </v-form>
      </v-expansion-panel-content>
    </v-expansion-panel>

  </v-expansion-panels>

  <v-dialog v-model="info_dlg" persistent scrollable max-width="350">
    <v-card outlined>
      <v-card-title class="headline">{{info_dlg_title}}</v-card-title>
      <v-card-text>{{info_dlg_text}}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text :loading="info_dlg_bg_activity" @click="info_dlg = false">{{$t('main.btn_ok')}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="confirm_dialog" persistent scrollable max-width="350">
    <v-card outlined>
      <v-card-title class="headline">{{confirm_dialog_title}}</v-card-title>
      <v-card-text>{{confirm_dialog_text}}</v-card-text>
      <v-card-text>{{confirm_dialog_text2}}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey lighten-1" text @click="confirm_dialog= false">{{$t('main.btn_cancel')}}</v-btn>
        <v-btn color="orange darken-1" text @click="confirm_dialog_action()">{{confirm_dialog_action_button}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

</v-container>`

var bot_config = Vue.component("bot_config", {
  template: botConfigTemplate,
  props: ["cfg", "i18n", "wifi", "version", "info", "dt"],
  data() {
    return {
      config_panel: 0,
      wifi_panel: null,
      showPwd: false,
      wifi_type_items: ['WPA-PSK'],
      wifi_confirm_idx: null,
      restart_req: '',
      form_valid: true,
      info_dlg: false,
      info_dlg_bg_activity: false,
      info_dlg_title: '',
      info_dlg_text: '',
      confirm_dialog: false,
      confirm_dialog_title: '',
      confirm_dialog_text: '',
      confirm_dialog_text2: '',
      confirm_dialog_action: null,
      confirm_dialog_action_button: '',
      datePopup: false,
      timePopup: false,
      pwd_rules: {
        required: value => !!value || 'Required.',
        min: v => v.length >= 8 || 'Min 8 characters',
      },
      ledStartRule: [
        v => (parseInt(v) <= 120) || 'start must be <= 120',
        v => (parseInt(v) >= 0) || 'start must be >= 0',
      ]
    }
  },
  computed: {
    date: {
      get: function () {
        return this.dt.TimeUSec.substr(0, 10);
      },
      set: function(val) {
        this.dt.TimeUSec= val+ ' '+ this.dt.TimeUSec.substr(11, 8);
      }
    },
    time: {
      get: function () {
        return this.dt.TimeUSec.substr(11, 8);
      },
      set: function(val) {
        if (val.length== 5)
          val+= ':00';
        this.dt.TimeUSec= this.dt.TimeUSec.substr(0, 10)+ ' '+ val;
      }
    },
  },
  methods: {
    showConfirmDialog(title, text, text2, action, action_button) {
      this.confirm_dialog_title= title;
      this.confirm_dialog_text= text;
      this.confirm_dialog_text2= text2;
      this.confirm_dialog_action= action;
      this.confirm_dialog_action_button= action_button;
      this.confirm_dialog= true;
    },
    sendDateTimeUpdate() {
      dt2= Object.assign({}, this.dt);
      delete dt2['timezones']; // no need to send back the long list of timezones
      $.ajax({
        url: '/datetime',
        type: 'POST',
        data: JSON.stringify(dt2),
        contentType: 'application/json; charset=utf-8'
      }).then((data) => {
        // success
        model.ui.snackbar_text= 'update date & time request sent, please restart'; // this.$i18n.t('config.wifi.saved');
        model.ui.snackbar_color= 'green';
        model.ui.snackbar= true;
      },
      (data) => {
        model.ui.snackbar_text= data.statusText;
        model.ui.snackbar_color= 'orange';
        model.ui.snackbar= true;
      });
    },
    addWifi() {
      con= {
        scan_ssid: 1,
        ssid: 'bot',
        psk: 'beamoftime',
        key_mgmt: 'WPA-PSK'
      };
      this.wifi.networks.push(con);
      this.wifi_panel= this.wifi.networks.length- 1;
    },
    removeWifi(idx) {
      this.wifi_confirm_idx= idx;
      title= this.$i18n.t('config.wifi.confirm_title');
      text= this.$i18n.t('config.wifi.confirm_question');
      text2= '';
      if (this.wifi.networks.length== 1)
        text2= this.$i18n.t('config.wifi.confirm_question2');
      this.showConfirmDialog(title, text, text2, this.removeWifiConfirm, this.$i18n.t('main.btn_delete'))
    },
    removeWifiConfirm() {
      this.confirm_dialog= false;
      this.wifi.networks.splice(this.wifi_confirm_idx, 1);
      this.wifi_panel= null;
      if (this.wifi.networks.length== 0) {
        this.addWifi();
      }
    },
    sendUpdateRequest() {
      this.info_dlg_title= this.$i18n.t('config.update.title');
      this.info_dlg_text= this.$i18n.t('main.please_wait');
      this.info_dlg= true;
      this.info_dlg_bg_activity= true;
      $.ajax({
        url: "/update"
      }).then((data) => {
        this.info_dlg_text= data+ ' '+ this.$i18n.t('config.update.msg_done');
        // send restart request to activate the new version
        $.ajax({url: "/restart/restart"});
        setTimeout(function(){ window.location.reload(true); }, 5000);
      },
      (data) => {
        txt= data;
        if (!data.responseText === undefined)
          txt= data.responseText.toLowerCase();
        if (!txt === undefined && txt.index('<h1>')>= 0)
          txt= txt.match(/<h1>(.*)</)[1]+ ', '+ txt.match(/<p>(.*)</)[1];
        this.info_dlg_text= txt
        this.info_dlg_bg_activity= false;
      });
    },
    sendBackupRequest() {
      this.confirm_dialog= false;
      this.info_dlg_title= this.$i18n.t('config.backup.title');
      this.info_dlg_text= this.$i18n.t('main.please_wait');
      this.info_dlg= true;
      this.info_dlg_bg_activity= true;
      $.ajax({
        url: '/backup'
      }).then((data) => {
        // success
        // refresh backup date + time
        readInfo();
        this.info_dlg_text= this.$i18n.t('config.backup.done');
        this.info_dlg_bg_activity= false;
      },
      (data) => {
        this.info_dlg_text= data.statusText;
        this.info_dlg_bg_activity= false;
      });
    },
    sendRestoreRequest() {
      this.confirm_dialog= false;
      this.info_dlg_title= this.$i18n.t('config.restore.title');
      this.info_dlg_text= this.$i18n.t('main.please_wait');
      this.info_dlg= true;
      this.info_dlg_bg_activity= true;
      $.ajax({
        url: '/restore'
      }).then((data) => {
        // success
        this.info_dlg_text= this.$i18n.t('config.restore.done');
        setTimeout(function(){ window.location.reload(true); }, 3000);
      },
      (data) => {
        this.info_dlg_text= data.statusText;
        this.info_dlg_bg_activity= false;
      });
    },
    sendRestartRequest(req) {
      this.restart_req= req;
      title= this.$i18n.t('config.restart.btn_'+ req);
      text= this.$i18n.t('config.restart.req_'+ req);
      text2= this.$i18n.t('config.restart.req2_'+ req);;
      this.showConfirmDialog(title, text, text2, this.sendRestartConfirmed, title)
    },
    sendRestartConfirmed() {
      $.ajax({
        url: '/restart/'+ this.restart_req,
        contentType: 'text/plain; charset=utf-8'
      });
      this.confirm_dialog= false;
      // ignore any response as service can't anwser due to restart
      this.info_dlg= true;
      this.info_dlg_bg_activity= true;
      this.info_dlg_title= this.$i18n.t('config.restart.btn_'+ this.restart_req);
      this.info_dlg_text= this.$i18n.t('config.restart.req_sent_'+ this.restart_req);
      if (this.restart_req== 'shutdown')
        this.info_dlg_bg_activity= false;
      else if (this.restart_req== 'reboot')
        setTimeout(function(){ window.location.reload(true); }, 60000);
      else
        setTimeout(function(){ window.location.reload(true); }, 5000);
    },
    sendWifiSaveRequest() {
      $.ajax({
        url: '/wifi',
        type: 'POST',
        data: JSON.stringify(this.wifi),
        contentType: 'application/json; charset=utf-8'
      }).then((data) => {
        // success
        model.ui.snackbar_text= this.$i18n.t('config.wifi.saved');
        model.ui.snackbar_color= 'green';
        model.ui.snackbar= true;
      },
      (data) => {
        model.ui.snackbar_text= data.statusText;
        model.ui.snackbar_color= 'orange';
        model.ui.snackbar= true;
      });
    }
  }
});
