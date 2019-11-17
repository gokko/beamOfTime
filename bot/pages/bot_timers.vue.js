const botTimersTemplate= `<v-container mt-4 mb-12>
  <v-btn outlined color="blue darken-1" @click="addTimer()"><v-icon>mdi-plus-one</v-icon></v-btn>
  <v-spacer></v-spacer>
  <br/>
  <v-expansion-panels v-model="timer_panel" focusable>
    <v-expansion-panel v-for="(timer, index) in cfg.timers" :key="index" class="grey darken-1">
      <v-expansion-panel-header>{{timer.name}}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-switch color="#04BF3D" v-model="timer.enabled" inset :label="$t('timers.active')"></v-switch>
        <v-text-field type="text" :value="timer.name" @change="v => timer.name = v" :label="$t('timers.name_lbl')" :rules="[rules.required]"></v-text-field>
        <v-text-field type="text" :value="timer.desc" @change="v => timer.desc = v" :label="$t('timers.desc_lbl')" :rules="[rules.required]"></v-text-field>
        <v-text-field type="text" :value="timer.time" append-icon="mdi-pencil" @click:append="timer_idx= index; time_edit_dialog= true;" @change="v => timer.time = v" :label="$t('timers.time_lbl')" :rules="[rules.required]"></v-text-field>
        <v-select :items="actions" v-model="timer.action" :label="$t('timers.action_lbl')"></v-select>
        <v-select v-if="timer.action=='animation'" :items="cfg.animations" v-model="timer.params" :label="$t('timers.param_animation_lbl')"></v-select>
        <v-select v-if="timer.action=='theme'" :items="theme_names" v-model="timer.params" :label="$t('timers.param_theme_lbl')"></v-select>
        <v-select v-if="timer.action=='sound'" :items="sounds" v-model="timer.params" :label="$t('timers.param_sound_lbl')"></v-select>
        <v-btn outlined color="orange darken-1" @click="timer_idx= index; confirm_dialog= true;"><v-icon>mdi-delete</v-icon></v-btn>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>

  <v-dialog v-model="confirm_dialog" persistent scrollable max-width="350">
    <v-card outlined>
      <v-card-title class="headline">{{$t('timers.remove_confirm_title')}}</v-card-title>
      <v-card-text>{{$t('timers.remove_confirm_msg')}}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="orange darken-1" text @click="removeTimer()">{{$t('config.main.btn_ok')}}</v-btn>
        <v-btn color="green darken-1" text @click="confirm_dialog= false">{{$t('config.main.btn_cancel')}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="time_edit_dialog" persistent scrollable max-width="350">
    <v-card outlined>
      <v-card-title class="headline">{{$t('timers.time_edit_title')}}</v-card-title>
      <v-card-text>{{$t('timers.remove_confirm_msg')}}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="orange darken-1" text @click="time_edit_dialog= false">{{$t('config.main.btn_ok')}}</v-btn>
        <v-btn color="green darken-1" text @click="time_edit_dialog= false">{{$t('config.main.btn_cancel')}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

</v-container>`

var bot_timers = Vue.component("bot_timers", {
  template: botTimersTemplate,
  props: ["cfg"],
  data: () => ({
    timer_panel: 0,
    timer_idx: 0,
    confirm_dialog: false,
    time_edit_dialog: false,
    actions: ['animation', 'theme', 'sound'],
    sounds: ['cuckoo.mp3', 'cuckoo-hours'],
    rules: {
      required: value => !!value || 'Required.'
    }
  }),
  computed: {
    theme_names: function () {
      let themes = []
      if (this.cfg.themes!= null) {
        this.cfg.themes.forEach(theme => {
          themes.push(theme.name);
        });
      }
      return themes.sort();
    },
  },
  methods: {
    addTimer() {
      timer= {
        action: '',
        desc: '',
        enabled: false,
        name: '',
        params: '',
        time: ''
      };
      this.cfg.timers.push(timer);
      this.timer_panel= this.cfg.timers.length- 1;
    },
    removeTimer() {
      this.confirm_dialog= false;
      this.cfg.timers.splice(this.timer_idx, 1);
      this.timer_panel= null;
    }
  }
});
