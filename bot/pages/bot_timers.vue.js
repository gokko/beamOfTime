const botTimersTemplate= `<v-container ma-12>
  <v-btn small>{{i18n.timers_title}}</v-btn>
</v-container>`

var bot_timers = Vue.component("bot_timers", {
  template: botTimersTemplate,
  props: ["cfg", "i18n"],
  methods: {
    GetDelays() {
    }
  }
});
