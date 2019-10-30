const botConfigTemplate= `<v-container mb-12>
    
  <v-expansion-panels v-model="panel" focusable>

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
        <v-btn v-if="version.update_available" color="orange darken-1" @click="runUpdate">{{i18n.cfg_update_btn_install}}</v-btn>
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
        <v-btn color="orange darken-1" @click="alert('restart')">{{i18n.cfg_restart_btn_restart}}</v-btn>
        <v-btn color="red darken-1" @click="alert('reboot')">{{i18n.cfg_restart_btn_reboot}}</v-btn>
      </v-expansion-panel-content>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-header>{{i18n.cfg_wifi_title}}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-form>
          <v-text-field type="text" v-model="wifi_region" counter="2" :label="i18n.cfg_wifi_region" required></v-text-field>
          <v-card class="mx-auto" max-width="344" outlined>
            <v-toolbar>
              <v-toolbar-title>{{wifi_ssid}}</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-icon @click="console.log('delete');">mdi-close</v-icon>
            </v-toolbar>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-subtitle>
                  <v-text-field type="text" counter v-model="wifi_ssid" :label="i18n.cfg_wifi_ssid" :rules="[pwd_rules.required]"></v-text-field>
                  <v-text-field v-model="wifi_pwd" counter
                    :append-icon="showPwd ? 'mdi-eye' : 'mdi-eye-off'"
                    :rules="[pwd_rules.required, pwd_rules.min]"
                    :type="showPwd ? 'text' : 'password'"
                    name="wifi_pwd"
                    :label="i18n.cfg_wifi_password"
                    @click:append="showPwd = !showPwd">
                  </v-text-field>
                  <v-select :items="wifi_type_items" v-model="wifi_type" :label="i18n.cfg_wifi_type"></v-select>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-card>
          <br/>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1">add</v-btn>
          <v-btn color="green darken-1">save</v-btn>
        </v-form>
      </v-expansion-panel-content>
    </v-expansion-panel>

    <v-expansion-panel>
      <v-expansion-panel-header>{{i18n.cfg_led_settings}}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-form ref="form" v-model="form_valid" lazy-validation>
          <v-col cols="12">{{i18n.cfg_led_pin_lbl}}</v-col>
          <v-btn-toggle v-model="cfg.system.ledPin" mandatory>
            <v-btn :value="12" color="green">12</v-btn>
            <v-btn :value="18" color="green">18</v-btn>
          </v-btn-toggle>
          <v-col cols="12">{{i18n.cfg_led_count_lbl}}</v-col>
          <v-btn-toggle v-model="cfg.system.ledCount" mandatory>
            <v-btn :value="60" color="green">60</v-btn>
            <v-btn :value="120" color="green">120</v-btn>
          </v-btn-toggle>
          <v-col cols="12">{{i18n.cfg_led_ring1_dir_lbl}}</v-col>
          <v-btn-toggle v-model="cfg.system.ledDirection" mandatory>
            <v-btn :value="1" color="green">{{i18n.cfg_led_clockwise}}</v-btn>
            <v-btn :value="-1" color="green">{{i18n.cfg_led_anticlockwise}}</v-btn>
          </v-btn-toggle>
          <v-text-field type="number" v-model="cfg.system.ledStart" :rules="ledStartRule" :label="i18n.cfg_led_ring1_start_lbl" required></v-text-field>
          <v-col cols="12">{{i18n.cfg_led_ring2_dir_lbl}}</v-col>
          <v-btn-toggle v-model="cfg.system.ledDirection2" mandatory>
            <v-btn :value="1" color="green">{{i18n.cfg_led_clockwise}}</v-btn>
            <v-btn :value="-1" color="green">{{i18n.cfg_led_anticlockwise}}</v-btn>
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

</v-container>`

var bot_config = Vue.component("bot_config", {
  template: botConfigTemplate,
  props: ["cfg", "version", "i18n"],
  data: () => ({
    panel: 0,
    wifi_region: 'DE',
    wifi_ssid: 'gogoHome',
    wifi_pwd: 'PeterPan92',
    showPwd: false,
    wifi_type: 'WPA-PSK',
    wifi_type_items: ['WPA-PSK'],
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
    runUpdate() {
      this.update_result= this.i18n.cfg_update_please_wait;
      this.update_done_dialog= true;
      $.ajax({
        cache: false,
        url: "/update",
        dataType: 'text'
      }).then((data) => {
        this.update_result= data;
      });
    }
  }
});
