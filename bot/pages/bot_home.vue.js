const botHomeTemplate= `<v-container mb-12>
  <v-switch color="#04BF3D" v-model="cfg.settings.enabled" inset :label="i18n.home_enabled_chk"></v-switch>
  <v-switch color="#04BF3D" v-model="cfg.settings.startAnimation" inset :label="i18n.home_start_animation_chk"></v-switch>
  <v-switch color="#04BF3D" v-model="cfg.settings.justLight" inset :label="i18n.home_use_as_lamp_chk"></v-switch>
  <v-container mb-8 pl-0 v-if="cfg.settings.justLight" >
    <v-btn width="20" min-width="20" style="width:50px;" :color="cfg.settings.lightColor" @click="show_color_picker= !show_color_picker" />
    <v-label>{{i18n.home_lamp_color_lbl}}</v-label>
    <v-container class="d-flex justify-center" v-if="show_color_picker">
      <v-color-picker v-model="cfg.settings.lightColor" :hide-mode-switch="true" :mode="'hexa'"></v-color-picker>
    </v-container>
  </v-container>
  <v-select width="300px" :items="theme_names" v-model="cfg.settings.currentTheme" :label="i18n.home_current_theme_lbl"></v-select>
</v-container>`

var bot_home = Vue.component("bot_home", {
  template: botHomeTemplate,
  props: ["cfg", "i18n"],
  data: function () {
    return {
      show_color_picker: false,
    }
  },
  $_veeValidate: {
    validator: "new"
  },
  computed: {
    theme_names: function () {
      let themes = []
      this.cfg.themes.forEach(theme => {
        themes.push(theme.name);
      });
      return themes.sort();
    },
  }
});