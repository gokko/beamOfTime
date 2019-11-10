const botHomeTemplate= `<v-container mt-4 mb-12>
  <v-select width="300px" :items="cfg.languages" v-model="cfg.settings.language" :label="$t('home.current_language_lbl') + ' (language)'"></v-select>
  <v-col cols="12">{{$t('home.function.title')}}</v-col>
  <v-btn-toggle v-model="cfg.settings.mode" mandatory>
    <v-btn outlined :value="'off'" text color="green">{{$t('home.function.off')}}</v-btn>
    <v-btn outlined :value="'clock'" text color="green">{{$t('home.function.clock')}}</v-btn>
    <v-btn outlined :value="'lamp'" text color="green">{{$t('home.function.lamp')}}</v-btn>
    <v-btn outlined disabled :value="'animation'" text color="green">{{$t('home.function.animation')}}</v-btn>
  </v-btn-toggle>
  <v-container mb-8 pl-0 v-if="cfg.settings.mode== 'clock'" >
    <v-select width="300px" :items="theme_names" v-model="ui.themeIndex" :label="$t('home.current_theme_lbl')"></v-select>
  </v-container>
  <v-container mb-8 pl-0 v-if="cfg.settings.mode== 'lamp'" >
    <v-btn small width="20" min-width="20" style="width:50px;" :color="cfg.settings.lightColor" @click="show_color_picker= !show_color_picker" />
    <v-label>{{$t('home.lamp_color_lbl')}}</v-label>
    <v-container class="d-flex justify-center" v-if="show_color_picker">
      <v-color-picker v-model="cfg.settings.lightColor" :hide-mode-switch="true" :mode="'hexa'"></v-color-picker>
    </v-container>
  </v-container>
  <v-switch color="#04BF3D" v-model="cfg.settings.startAnimation" inset :label="$t('home.start_animation_chk')"></v-switch>
</v-container>`

var bot_home = Vue.component("bot_home", {
  template: botHomeTemplate,
  props: ["cfg", "ui"],
  data: () => ({
    show_color_picker: false,
  }),
  $_veeValidate: {
    validator: "new"
  },
  computed: {
    theme_names: function () {
      let themes = []
      if (this.cfg.themes!= null) {
        this.cfg.themes.forEach((theme, idx) => {
          themes.push({'value': idx, 'text': theme.name});
        });
      }
      return themes.sort();
    },
  }
});