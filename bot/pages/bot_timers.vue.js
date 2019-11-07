const botTimersTemplate= `<v-container ma-12>
  <v-btn small>{{$t('timers.title')}}</v-btn>
</v-container>`

var bot_timers = Vue.component("bot_timers", {
  template: botTimersTemplate,
  props: ["cfg"],
  methods: {
  }
});
