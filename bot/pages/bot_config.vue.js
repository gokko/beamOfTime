const botConfigTemplate= `<v-container mb-12>
    
  <v-expansion-panels v-model="cfg_panel" focusable>

    <v-expansion-panel>
      <v-expansion-panel-header>{{i18n.cfg_info_title}}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <br/>
        {{i18n.cfg_info_msg_into}}<br/>
        {{i18n.cfg_info_msg_details}}<br/><br/>
        {{i18n.cfg_restart_msg}}
      </v-expansion-panel-content>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-header>
        <v-badge>
          <template v-if="version.update_available" v-slot:badge><v-icon>mdi-check</v-icon></template>
            <span>{{i18n.cfg_update_title}}</span>
          </v-badge>
        </v-expansion-panel-header>
      <v-expansion-panel-content>
        <br/>
        <div v-if="!version.update_available">{{i18n.cfg_update_msg_old}}</div>
        <div v-if="version.update_available">
          <div>{{i18n.cfg_update_msg_new}}<br/></div>
          <div><br/><b>{{i18n.cfg_update_clock_title}} ({{'v'+ version.current.clock.version}} => {{'v'+ version.new.clock.version}}):</b><br/></div>
          <div v-if="note.version > version.current.clock.version" v-for="note in version.new.clock.release_notes"><i>v{{note.version}} ({{note.date}})</i><br/>{{note.info}}<br/></div>
          <div><br/><b>{{i18n.cfg_update_web_title}} ({{'v'+ version.current.web.version}} => {{'v'+ version.new.web.version}}):</b><br/></div>
          <div v-if="note.version > version.current.web.version" v-for="note in version.new.web.release_notes"><i>v{{note.version}} ({{note.date}})</i><br/>{{note.info}}<br/></div>
          <br/>
        </div>
        <v-spacer></v-spacer>
        <v-btn outlined v-if="version.update_available" color="orange darken-1" @click="runUpdate">{{i18n.cfg_update_btn_install}}</v-btn>
      </v-expansion-panel-content>
    </v-expansion-panel>
    
    <v-expansion-panel>
      <v-expansion-panel-header>
        {{i18n.cfg_restart_title}}
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <br/>
        {{i18n.cfg_restart_msg_restart}}<br/><br/>
        {{i18n.cfg_restart_msg_reboot}}<br/><br/>
        <v-spacer></v-spacer>
        <v-btn outlined color="orange darken-1" @click="sendRestartRequest('restart')">{{i18n.cfg_restart_btn_restart}}</v-btn>
        <v-btn outlined color="orange darken-1" @click="sendRestartRequest('reboot')">{{i18n.cfg_restart_btn_reboot}}</v-btn>
      </v-expansion-panel-content>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-header>{{i18n.cfg_ip_title}}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-list one-line>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title v-text="i18n.cfg_ip_hostname"></v-list-item-title>
              <v-list-item-subtitle v-text="wifi.ipconf.hostname"></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-for="(ip, idx) in wifi.ipconf.ips" :key="idx">
            <v-list-item-content>
              <v-list-item-title v-text="ip.name"></v-list-item-title>
              <v-list-item-subtitle v-text="ip.ip"></v-list-item-subtitle>
            </v-list-item-content>
            </v-list-item>
        </v-list>
      </v-expansion-panel-content>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-header>{{i18n.cfg_wifi_title}}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-form>
          <v-text-field type="text" v-model="wifi.country" counter="2" :label="i18n.cfg_wifi_country" required></v-text-field>

          <v-col cols="12">{{i18n.cfg_wifi_connections}}</v-col>
          <v-expansion-panels v-model="wifi_panel" focusable>
            <v-expansion-panel v-for="(network, index) in wifi.networks" :key="index" class="grey darken-1">
              <v-expansion-panel-header>{{network.ssid}}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-text-field type="text" counter v-model="network.ssid" :label="i18n.cfg_wifi_ssid" :rules="[pwd_rules.required]"></v-text-field>
                    <v-text-field v-model="network.psk" counter
                      :append-icon="showPwd ? 'mdi-eye' : 'mdi-eye-off'"
                      :rules="[pwd_rules.required, pwd_rules.min]"
                      :type="showPwd ? 'text' : 'password'"
                      name="wifi_pwd"
                      :label="i18n.cfg_wifi_password"
                      @click:append="showPwd = !showPwd">
                    </v-text-field>
                  <v-select :items="wifi_type_items" v-model="network.key_mgmt" :label="i18n.cfg_wifi_type"></v-select>
                  <v-btn outlined color="orange darken-1" @click="removeWifi(index)"><v-icon>mdi-delete</v-icon></v-btn>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>

          <br/>
          <v-spacer></v-spacer>
          <v-btn outlined color="blue darken-1" @click="addWifi()"><v-icon>mdi-plus-one</v-icon></v-btn>
          <v-btn outlined color="green darken-1"><v-icon>mdi-content-save</v-icon></v-btn>
        </v-form>
      </v-expansion-panel-content>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-header>{{i18n.cfg_led_settings}}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-form ref="form" v-model="form_valid" lazy-validation>
          <v-col cols="12">{{i18n.cfg_led_pin_lbl}}</v-col>
          <v-btn-toggle v-model="cfg.system.ledPin" mandatory>
            <v-btn outlined :value="12" color="green">12</v-btn>
            <v-btn outlined :value="18" color="green">18</v-btn>
          </v-btn-toggle>
          <v-col cols="12">{{i18n.cfg_led_count_lbl}}</v-col>
          <v-btn-toggle v-model="cfg.system.ledCount" mandatory>
            <v-btn outlined :value="60" color="green">60</v-btn>
            <v-btn outlined :value="120" color="green">120</v-btn>
          </v-btn-toggle>
          <v-col cols="12">{{i18n.cfg_led_ring1_dir_lbl}}</v-col>
          <v-btn-toggle v-model="cfg.system.ledDirection" mandatory>
            <v-btn outlined :value="1" color="green"><v-icon>mdi-rotate-right</v-icon></v-btn>
            <v-btn outlined :value="-1" color="green"><v-icon>mdi-rotate-left</v-icon></v-btn>
          </v-btn-toggle>
          <v-text-field type="number" v-model="cfg.system.ledStart" :rules="ledStartRule" :label="i18n.cfg_led_ring1_start_lbl" required></v-text-field>
          <v-col cols="12">{{i18n.cfg_led_ring2_dir_lbl}}</v-col>
          <v-btn-toggle v-model="cfg.system.ledDirection2" mandatory>
            <v-btn outlined :value="1" color="green"><v-icon>mdi-rotate-right</v-icon></v-btn>
            <v-btn outlined :value="-1" color="green"><v-icon>mdi-rotate-left</v-icon></v-btn>
          </v-btn-toggle>
          <v-text-field type="number" v-model="cfg.system.ledStart2" :rules="ledStartRule" :label="i18n.cfg_led_ring2_start_lbl" required></v-text-field>
        </v-form>
      </v-expansion-panel-content>
    </v-expansion-panel>

  </v-expansion-panels>
    
  <v-dialog v-model="update_done_dialog" persistent scrollable max-width="350">
    <v-card outlined>
      <v-card-title class="headline">{{i18n.cfg_update_title}}</v-card-title>
      <v-card-text>{{update_result}}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text @click="update_done_dialog = false">{{i18n.cfg_info_btn_ok}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="wifi_confirm_dialog" max-width="350">
      <v-card>
        <v-card-title class="headline">{{i18n.cfg_wifi_confirm_title}}</v-card-title>
        <v-card-text>{{i18n.cfg_wifi_confirm_question}}</v-card-text>
        <v-card-text v-if="wifi.networks.length== 1">{{i18n.cfg_wifi_confirm_question2}}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="wifi_confirm_dialog = false">{{i18n.cfg_wifi_btn_no}}</v-btn>
          <v-btn color="orange darken-1" text @click="removeWifiConfirm()">{{i18n.cfg_wifi_btn_yes}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

</v-container>`

var bot_config = Vue.component("bot_config", {
  template: botConfigTemplate,
  props: ["cfg", "wifi", "version", "i18n"],
  data: () => ({
    cfg_panel: 0,
    wifi_panel: null,
    showPwd: false,
    wifi_type_items: ['WPA-PSK'],
    wifi_confirm_dialog: false,
    wifi_confirm_idx: null,
    form_valid: true,
    update_done_dialog: false,
    update_result: '',
    pwd_rules: {
      required: value => !!value || 'Required.',
      min: v => v.length >= 8 || 'Min 8 characters',
    },
    ledStartRule: [
      v => (parseInt(v) <= 120) || 'start must be <= 120',
      v => (parseInt(v) >= 0) || 'start must be >= 0',
    ]
  }),
  methods: {
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
      this.wifi_confirm_dialog= true;
    },
    removeWifiConfirm() {
      this.wifi.networks.splice(this.wifi_confirm_idx, 1);
      this.wifi_panel= null;
      this.wifi_confirm_dialog= false;
      if (this.wifi.networks.length== 0) {
        this.addWifi();
      }
    },
    runUpdate() {
      this.update_result= this.i18n.cfg_update_please_wait;
      this.update_done_dialog= true;
      $.ajax({
        cache: false,
        url: "/update",
        dataType: 'text'
      }).then((data) => {
        this.update_result= data;
      },
      (data) => {
        this.update_result= data.responseText.match(/<h1>(.*)</)[1]+ ', '+ data.responseText.match(/<p>(.*)</)[1];
      });
    },
    sendRestartRequest(req) {
      $.ajax({
        url: '/restart',
        type: 'POST',
        data: req,
        contentType: 'text/plain; charset=utf-8'
      }).then((data) => {
        // success
        model.ui.snackbar_text= req+ ' OK';
        model.ui.snackbar_color= 'green';
        model.ui.snackbar= true;
      },
      (data) => {
        // error
        if (data.status == 200) {
          model.ui.snackbar_text= req+ ' OK';
          model.ui.snackbar_color= 'green';
          model.ui.snackbar= true;
          }
        else {
          model.ui.snackbar_text= req+ ' error: '+ data.responseText.match(/<h1>(.*)</)[1]+ ', '+ data.responseText.match(/<p>(.*)</)[1];
          model.ui.snackbar_color= 'orange';
          model.ui.snackbar= true;
          }
      });
    }
  }
});
