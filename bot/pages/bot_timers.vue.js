const botTimersTemplate= `<v-container mt-4 mb-12>
  <v-btn outlined color="blue darken-1" @click="addTimer()"><v-icon>mdi-plus-one</v-icon></v-btn>
  <v-spacer></v-spacer>
  <br/>
  <v-expansion-panels v-model="timer_panel" focusable>
    <v-expansion-panel v-for="(timer, index) in cfg.timers" :key="index" class="grey darken-1">
      <v-expansion-panel-header>{{timer.name}}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-switch color="#04BF3D" v-model="timer.enabled" inset :label="$t('timers.active')"></v-switch>
        <v-text-field type="text" :value="timer.name" @change="v => timer.name = v" :label="$t('timers.name')" :rules="[rules.required]"></v-text-field>
        <v-text-field type="text" :value="timer.desc" @change="v => timer.desc = v" :label="$t('timers.desc')" :rules="[rules.required]"></v-text-field>
        <v-text-field type="text" :value="timer.time" append-icon="mdi-pencil" @click:append="editTimeDialog(index);" @change="v => timer.time = v" :label="$t('timers.time')" :rules="[rules.required]"></v-text-field>
        <v-select :items="actions" v-model="timer.action" :label="$t('timers.action')"></v-select>
        <v-select v-if="timer.action=='animation'" :items="cfg.animations" v-model="timer.params" :label="$t('timers.param_animation')"></v-select>
        <v-select v-if="timer.action=='theme'" :items="theme_names" v-model="timer.params" :label="$t('timers.param_theme')"></v-select>
        <v-select v-if="timer.action=='sound'" :items="cfg.sounds" v-model="timer.params" :label="$t('timers.param_sound')"></v-select>
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
      <v-card-text>{{$t('timers.time_edit_info')}}</v-card-text>
      <v-card-text>
        <v-text-field type="text" v-model="timer_time.minutes" :label="$t('timers.time.minutes')" :rules="[rules.required]"></v-text-field>
        <v-text-field type="text" v-model="timer_time.hours" :label="$t('timers.time.hours')" :rules="[rules.required]"></v-text-field>
        <v-text-field type="text" v-model="timer_time.days" :label="$t('timers.time.days')" :rules="[rules.required]"></v-text-field>
        <v-text-field type="text" v-model="timer_time.months" :label="$t('timers.time.months')" :rules="[rules.required]"></v-text-field>
        <v-text-field type="text" v-model="timer_time.weekdays" :label="$t('timers.time.weekdays')" :rules="[rules.required]"></v-text-field>
        <v-text-field type="text" v-model="timer_time.years" :label="$t('timers.time.years')" :rules="[rules.required]"></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="orange darken-1" text @click="editTimeConfirm()">{{$t('config.main.btn_ok')}}</v-btn>
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
    timer_time: {
      minutes: '',
      hours: '',
      days: '',
      months: '',
      weekdays: '',
      years: ''
    },
    actions: ['animation', 'theme', 'sound'],
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
    },
    editTimeDialog(index) {
      this.timer_idx= index;
      t= this.timer_time;
      [t.minutes, t.hours, t.days, t.months, t.weekdays, t.years]= this.cfg.timers[index].time.split(' ');
      if (!t.minutes) t.minutes= '*';
      if (!t.hours) t.hours= '*';
      if (!t.days) t.days= '*';
      if (!t.months) t.months= '*';
      if (!t.weekdays) t.weekdays= '*';
      if (!t.years) t.years= '*';
      this.time_edit_dialog= true;
    },
    editTimeConfirm() {
      this.time_edit_dialog= false;
      t= this.timer_time;
      t.minutes= t.minutes.replace(/ /g, '');
      t.hours= t.hours.replace(/ /g, '');
      t.days= t.days.replace(/ /g, '');
      t.months= t.months.replace(/ /g, '');
      t.weekdays= t.weekdays.replace(/ /g, '');
      t.years= t.years.replace(/ /g, '');
      this.cfg.timers[this.timer_idx].time= [t.minutes, t.hours, t.days, t.months, t.weekdays, t.years].join(' ');
      console.log(this.cfg.timers[this.timer_idx].time);
    }
  }
});
