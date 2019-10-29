const botConfigTemplate= `<v-container mb-12>
  <v-form ref="form" v-model="form_valid" lazy-validation>
  <v-dialog v-model="info_dialog" persistent max-width="350">
      <v-card outlined>
        <v-card-title class="headline">{{i18n.dlg_info_title}}</v-card-title>
        <v-card-text>{{i18n.dlg_info_msg_into}}</v-card-text>
        <v-card-text>{{i18n.dlg_info_msg_details}}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="info_dialog = false">{{i18n.dlg_info_btn_ok}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="update_dialog" persistent max-width="350">
      <template v-slot:activator="{ on }">
        <v-badge>
          <template v-if="version.update_available" v-slot:badge><v-icon>mdi-check</v-icon></template>
          <v-btn color="green darken-1" v-on="on">{{i18n.dlg_update_btn}}</v-btn>
        </v-badge>
      </template>
      <v-card outlined>
        <v-card-title class="headline">{{i18n.dlg_update_title}}</v-card-title>
        <v-card-text v-if="!version.update_available">{{i18n.dlg_update_msg_old}}</v-card-text>
        <v-card-text v-if="version.update_available">
          <div>{{i18n.dlg_update_msg_new}}<br/></div>
          <div><br/><b>{{i18n.dlg_update_clock_title}} ({{'v'+ version.current.clock.version}} => {{'v'+ version.new.clock.version}}):</b><br/></div>
          <div v-if="note.version > version.current.clock.version" v-for="note in version.new.clock.release_notes"><i>v{{note.version}} ({{note.date}})</i><br/>{{note.info}}<br/></div>
          <div><br/><b>{{i18n.dlg_update_web_title}} ({{'v'+ version.current.web.version}} => {{'v'+ version.new.web.version}}):</b><br/></div>
          <div v-if="note.version > version.current.web.version" v-for="note in version.new.web.release_notes"><i>v{{note.version}} ({{note.date}})</i><br/>{{note.info}}<br/></div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn v-if="version.update_available" color="orange darken-1" text @click="update_dialog = false">{{i18n.dlg_update_btn_install}}</v-btn>
          <v-btn v-if="version.update_available" color="green darken-1" text @click="update_dialog = false">{{i18n.dlg_update_btn_cancel}}</v-btn>
          <v-btn v-if="!version.update_available" color="green darken-1" text @click="update_dialog = false">{{i18n.dlg_update_btn_ok}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-container>{{i18n.config_restart_msg}}</v-container>

    <v-dialog v-model="restart_dialog" persistent max-width="350">
      <template v-slot:activator="{ on }">
        <v-btn color="orange darken-1" v-on="on">{{i18n.dlg_restart_btn}}</v-btn>
      </template>
      <v-card outlined>
        <v-card-title class="headline">{{i18n.dlg_restart_title}}</v-card-title>
        <v-card-text>{{i18n.dlg_restart_msg_intro}}</v-card-text>
        <v-card-text>{{i18n.dlg_restart_msg_restart}}</v-card-text>
        <v-card-text>{{i18n.dlg_restart_msg_reboot}}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="orange darken-1" text @click="restart_dialog = false">{{i18n.dlg_restart_btn_restart}}</v-btn>
          <v-btn color="red darken-1" text @click="restart_dialog = false">{{i18n.dlg_restart_btn_reboot}}</v-btn>
          <v-btn color="green darken-1" text @click="restart_dialog = false">{{i18n.dlg_restart_btn_cancel}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-col cols="12">{{i18n.config_led_pin_lbl}}</v-col>
    <v-btn-toggle v-model="cfg.system.ledPin" mandatory>
      <v-btn :value="12" color="green">12</v-btn>
      <v-btn :value="18" color="green">18</v-btn>
    </v-btn-toggle>
    <v-col cols="12">{{i18n.config_led_count_lbl}}</v-col>
    <v-btn-toggle v-model="cfg.system.ledCount" mandatory>
      <v-btn :value="60" color="green">60</v-btn>
      <v-btn :value="120" color="green">120</v-btn>
    </v-btn-toggle>
    <v-col cols="12">{{i18n.config_led_ring1_dir_lbl}}</v-col>
    <v-btn-toggle v-model="cfg.system.ledDirection" mandatory>
      <v-btn :value="1" color="green">{{i18n.config_led_clockwise}}</v-btn>
      <v-btn :value="-1" color="green">{{i18n.config_led_anticlockwise}}</v-btn>
    </v-btn-toggle>
    <v-text-field type="number" v-model="cfg.system.ledStart" :rules="ledStartRule" :label="i18n.config_led_ring1_start_lbl" required></v-text-field>
    <v-col cols="12">{{i18n.config_led_ring2_dir_lbl}}</v-col>
    <v-btn-toggle v-model="cfg.system.ledDirection2" mandatory>
      <v-btn :value="1" color="green">{{i18n.config_led_clockwise}}</v-btn>
      <v-btn :value="-1" color="green">{{i18n.config_led_anticlockwise}}</v-btn>
    </v-btn-toggle>
    <v-text-field type="number" v-model="cfg.system.ledStart2" :rules="ledStartRule" :label="i18n.config_led_ring2_start_lbl" required></v-text-field>

  </v-form>
  </v-container>`

var bot_config = Vue.component("bot_config", {
  template: botConfigTemplate,
  props: ["cfg", "version", "i18n"],
  data: () => ({
    form_valid: true,
    info_dialog: true,
    restart_dialog: false,
    update_dialog: false,
    ledStartRule: [
      v => (parseInt(v) <= 120) || 'start must be <= 120',
      v => (parseInt(v) >= 0) || 'start must be >= 0',
    ],
  })
});
