const botThemesTemplate= `<v-container mt-4 mb-12>
  <v-btn small>{{$t('themes.title')}}</v-btn>
</v-container>`

var bot_themes = Vue.component("bot_themes", {
  template: botThemesTemplate,
  props: ["cfg"],
  $_veeValidate: {
    validator: "new"
  },
  methods: {
  }
});