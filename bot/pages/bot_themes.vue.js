const botThemesTemplate= `<v-container ma-12>
  <v-btn small>{{i18n.themes_title}}</v-btn>
</v-container>`

var bot_themes = Vue.component("bot_themes", {
  template: botThemesTemplate,
  props: ["cfg", "i18n"],
  $_veeValidate: {
    validator: "new"
  },
  methods: {
    GetDelays() {
    }
  }
});