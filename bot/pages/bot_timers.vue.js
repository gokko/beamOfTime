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
        <v-text-field v-if="timer.action=='speak'" :value="timer.params" @change="v => timer.params = v" :label="$t('timers.param_speak')" hint="current-date | current-time" persistent-hint></v-text-field>
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
        <v-btn color="grey lighten-1" text @click="confirm_dialog= false">{{$t('main.btn_cancel')}}</v-btn>
        <v-btn color="orange darken-1" text @click="removeTimer()">{{$t('main.btn_delete')}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="time_edit_dialog" persistent scrollable max-width="350">
    <v-card flat outlined>
      <v-card-title class="headline">{{$t('timers.time_edit_title')}}</v-card-title>
      <v-card-text>
        <v-select width="300px" :items="timer_modes" v-model="timer_mode" :label="$t('timers.mode_lbl')"></v-select>

        <v-subheader v-if="show_years">{{$t('timers.time.years')+ ' '+ this.selected_years}}</v-subheader>
        <v-range-slider v-if="show_years" v-model="timer_time.years" :min="min_year" :max="max_year" step="1"></v-range-slider>

        <v-subheader v-if="show_months">{{$t('timers.time.months')+ ' '+ this.selected_months}}</v-subheader>
        <v-range-slider v-if="show_months" v-model="timer_time.months" :min="1" :max="12" step="1"></v-range-slider>

        <v-subheader v-if="show_days">{{$t('timers.time.days')+ ' '+ this.selected_days}}</v-subheader>
        <v-range-slider v-if="show_days" v-model="timer_time.days" :min="1" :max="31" step="1"></v-range-slider>

        <v-subheader v-if="show_weekdays">{{$t('timers.time.weekdays')+ ' '+ this.selected_weekdays}}</v-subheader>
        <v-range-slider v-if="show_weekdays" v-model="timer_time.weekdays" :min="0" :max="6" step="1"></v-range-slider>

        <v-subheader>{{$t('timers.time.hours')+ ' '+ this.selected_hours}}</v-subheader>
        <v-range-slider v-model="timer_time.hours" :min="0" :max="23" step="1"></v-range-slider>
        
        <v-subheader>{{$t('timers.time.minutes')+ ' '+ this.selected_minutes}}</v-subheader>
        <v-range-slider v-model="timer_time.minutes" :min="0" :max="59" step="1"></v-range-slider>

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey lighten-1" text @click="time_edit_dialog= false">{{$t('main.btn_cancel')}}</v-btn>
        <v-btn color="orange darken-1" text @click="editTimeConfirm()">{{$t('main.btn_ok')}}</v-btn>
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
    min_year: new Date().getFullYear(),
    max_year: new Date().getFullYear()+ 10,
    timer_mode: 'daily',
    timer_modes: [
      {value: 'daily', text: app.$i18n.t('timers.function.daily')}, 
      {value: 'weekly', text: app.$i18n.t('timers.function.weekly')}, 
      {value: 'monthly', text: app.$i18n.t('timers.function.monthly')},
      {value: 'yearly', text: app.$i18n.t('timers.function.yearly')},
      {value: 'extended', text: app.$i18n.t('timers.function.extended')}],
    timer_time: {
      minutes: '',
      hours: '',
      days: '',
      months: '',
      weekdays: '',
      years: ''
    },
    weekdays: [
      app.$i18n.t('timers.weekdays.sun'),
      app.$i18n.t('timers.weekdays.mon'),
      app.$i18n.t('timers.weekdays.tue'),
      app.$i18n.t('timers.weekdays.wed'),
      app.$i18n.t('timers.weekdays.thu'),
      app.$i18n.t('timers.weekdays.fri'),
      app.$i18n.t('timers.weekdays.sat')],
    months: ['', // month 0 doesn't exist
      app.$i18n.t('timers.months.jan'),
      app.$i18n.t('timers.months.feb'),
      app.$i18n.t('timers.months.mar'),
      app.$i18n.t('timers.months.apr'),
      app.$i18n.t('timers.months.may'),
      app.$i18n.t('timers.months.jun'),
      app.$i18n.t('timers.months.jul'),
      app.$i18n.t('timers.months.aug'),
      app.$i18n.t('timers.months.sep'),
      app.$i18n.t('timers.months.oct'),
      app.$i18n.t('timers.months.nov'),
      app.$i18n.t('timers.months.dec')],
    actions: ['animation', 'theme', 'sound', 'speak'],
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
    selected_years: function() {
      return this.selected_range(this.timer_time.years, 11);
    },
    selected_months: function() {
      return this.selected_range(this.timer_time.months, 12, this.months);
    },
    selected_days: function() {
      return this.selected_range(this.timer_time.days, 31);
    },
    selected_weekdays: function() {
      return this.selected_range(this.timer_time.weekdays, 7, this.weekdays);
    },
    selected_hours: function() {
      return this.selected_range(this.timer_time.hours, 24);
    },
    selected_minutes: function() {
      return this.selected_range(this.timer_time.minutes, 60);
    },
    show_days: function() {
      return this.timer_mode== 'monthly' || this.timer_mode== 'yearly' || this.timer_mode== 'extended';
    },
    show_months: function() {
      return this.timer_mode== 'yearly' || this.timer_mode== 'extended';
    },
    show_weekdays: function() {
      return this.timer_mode== 'weekly';
    },
    show_years: function() {
      return this.timer_mode== 'extended';
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
        time: '* * * * * *'
      };
      this.cfg.timers.push(timer);
      this.timer_panel= this.cfg.timers.length- 1;
    },
    removeTimer() {
      this.confirm_dialog= false;
      this.cfg.timers.splice(this.timer_idx, 1);
      this.timer_panel= null;
    },
    selected_range: function(a, size, valArr) {
      if (a[0]== a[1])
        return valArr? valArr[a[0]]: a[0];
      else if (a[0]+ size- 1 == a[1])
        return this.$i18n.t('timers.time.all');
      return valArr? valArr[a[0]]+ '-'+ valArr[a[1]]: a.join('-');
    },
    splitTimeValue(v, range) {
      res= [];
      if (!v || v=='*') 
        res= range;
      else if (v.indexOf('-')>= 0)
        res= v.split('-');
      else
        res= [v, v];

      return res;
    },
    joinTimeValue(v, range) {
      res= '';
      if (v[0]== range[0] && v[1]== range[1])
        res= '*';
      else if (v[0]== v[1])
        res= v[0];
      else
        res= v.join('-');
      return res;
    },
    editTimeDialog(index) {
      this.timer_idx= index;

      // get values from cron string
      [min, hr, day, m, wd, y]= this.cfg.timers[index].time.split(' ');
      // cleanup extended definitions, only * single number or number range is allowed
      if (!min || /[^0-9\-\*]/.test(min)) min= '*';
      if (!hr || /[^0-9\-\*]/.test(hr)) hr= '*';
      if (!day || /[^0-9\-\*]/.test(day)) day= '*';
      if (!m || /[^0-9\-\*]/.test(m)) m= '*';
      if (!wd || /[^0-9\-\*]/.test(wd)) wd= '*';
      if (!y || /[^0-9\-\*]/.test(y)) y= '*';

      // determine repetition
      if (y== '*' && wd== '*' && m== '*' && day== '*') this.timer_mode= 'daily';
      else if (y== '*' && wd== '*' && m== '*') this.timer_mode= 'monthly';
      else if (y== '*' && m== '*') this.timer_mode= 'weekly';
      else if (y== '*') this.timer_mode= 'yearly';
      else this.timer_mode= 'extended';

      // create value arrays for sliders
      t= this.timer_time;
      t.minutes= this.splitTimeValue(min, [0, 59]);
      t.hours= this.splitTimeValue(hr, [0, 23]);
      t.days= this.splitTimeValue(day, [1, 31]);
      t.months= this.splitTimeValue(m, [1, 12]);
      t.weekdays= this.splitTimeValue(wd, [0, 6]);
      t.years= this.splitTimeValue(y, [this.min_year, this.max_year]);

      // show dialog
      this.time_edit_dialog= true;
    },
    editTimeConfirm() {
      // hide dialog
      this.time_edit_dialog= false;

      t= this.timer_time;
      // fix values based on selected repetition
      if (this.timer_mode== 'daily') {
        t.days= [1, 31];
        t.months= [1, 12];
        t.weekdays= [0, 6];
        t.years= [this.min_year, this.max_year];
      }
      else if (this.timer_mode== 'weekly') {
        t.days= [1, 31];
        t.months= [1, 12];
        t.years= [this.min_year, this.max_year];
      }
      else if (this.timer_mode== 'monthly') {
        t.weekdays= [0, 6];
        t.months= [1, 12];
        t.years= [this.min_year, this.max_year];
      }
      else if (this.timer_mode== 'yearly') {
        t.weekdays= [0, 6];
        t.years= [this.min_year, this.max_year];
      }

      // get single values from value arrays
      min= this.joinTimeValue(t.minutes, [0, 59]);
      hr= this.joinTimeValue(t.hours, [0, 23]);
      day= this.joinTimeValue(t.days, [1, 31]);
      m= this.joinTimeValue(t.months, [1, 12]);
      wd= this.joinTimeValue(t.weekdays, [0, 6]);
      y= this.joinTimeValue(t.years, [this.min_year, this.max_year]);

      // create cron string
      this.cfg.timers[this.timer_idx].time= [min, hr, day, m, wd, y].join(' ');
    }
  }
});


/*
weekdays= ['Son', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
months= ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

s= '* 9-21 25 12 * 1968'
#s= '* 9-21 * * * *'

(min, hr, day, month, wd, year)= s.split(' ')
yText= ''
if year == '*':
  yText= 'every year'
else:
  yText= 'in year(s) {0}'.format(year)

wdText= ''
if wd.find('-')>= 0:
  (wdFrom, wdTo)= wd.split('-')
  wdText= weekdays[int(wdFrom)]+ '-'+ weekdays[int(wdTo)]
elif wd!= '*':
  wdText= 'on {0}'.format(weekdays[int(wd)])

monthText= ''
if month == '*':
  monthText= 'every month'
elif month.find('-')>= 0:
  (mFrom, mTo)= month.split('-')
  monthText= months[int(mFrom)- 1]+ '-'+ months[int(mTo)- 1]
else:
  monthText= 'in {0}'.format(months[int(month)- 1])

dayText= ''
if day == '*':
  monthText= 'every day'
else:
  dayText= '{0}th'.format(day)

hrText= ''
if hr == '*':
  hrText= 'every hour'
else:
  hrText= 'at {0}h'.format(hr)

minText= ''
if min == '*':
  minText= 'every minute'
else:
  minText= '{0}minutes'.format(min)

res= ''

print(yText, monthText, wdText, dayText, hrText, minText)
*/