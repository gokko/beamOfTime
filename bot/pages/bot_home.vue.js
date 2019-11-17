const botHomeTemplate= `<v-container mt-4 mb-12>
  <v-select width="300px" :items="cfg.languages" v-model="cfg.settings.language" :label="$t('home.current_language_lbl') + ' (language)'"></v-select>
  <v-switch color="#04BF3D" v-model="cfg.settings.startAnimation" inset :label="$t('home.start_animation_chk')"></v-switch>
  <v-subheader>{{$t('home.function.title')+ ' ('+ $t('home.function.'+ cfg.settings.mode) +')'}}</v-subheader>
  <v-btn-toggle v-model="cfg.settings.mode" mandatory>
    <!--
    <v-btn outlined :value="'off'" text color="green"><v-icon>mdi-alarm-off</v-icon></v-btn>
    <v-btn outlined :value="'clock'" text color="green"><v-icon>mdi-alarm</v-icon></v-btn>
    <v-btn outlined :value="'lamp'" text color="green"><v-icon>mdi-white-balance-incandescent</v-icon></v-btn>
    <v-btn outlined :value="'animation'" text color="green"><v-icon>mdi-alpha</v-icon></v-btn>
    -->
    <v-btn outlined :value="'off'" text color="green">{{$t('home.function.off')}}</v-btn>
    <v-btn outlined :value="'clock'" text color="green">{{$t('home.function.clock')}}</v-btn>
    <v-btn outlined :value="'lamp'" text color="green">{{$t('home.function.lamp')}}</v-btn>
    <v-btn outlined :value="'animation'" text color="green">{{$t('home.function.animation')}}</v-btn>
  </v-btn-toggle>
  <v-container mb-8 pl-0 v-if="cfg.settings.mode== 'clock'" >
    <v-select width="300px" :items="theme_names" v-model="ui.themeIndex" :label="$t('home.current_theme_lbl')"></v-select>
  </v-container>
  <v-container mb-8 pl-0 v-if="cfg.settings.mode== 'lamp'" >
    <v-btn small width="20" min-width="20" style="width:50px;" :color="cfg.settings.lightColor" @click="light_color_picker= !light_color_picker" />
    <v-label>{{$t('home.lamp_color_lbl')}}</v-label>
    <v-container class="d-flex justify-center" v-if="light_color_picker">
      <v-color-picker v-model="cfg.settings.lightColor" :hide-mode-switch="true" :mode="'hexa'"></v-color-picker>
    </v-container>
  </v-container>
  <v-container mb-8 pl-0 v-if="cfg.settings.mode== 'animation'" >
    <v-select width="300px" :items="cfg.animations" v-model="cfg.settings.currentAnimation" :label="$t('home.current_animation_lbl')"></v-select>
    <!--
    <v-btn small width="20" min-width="20" style="width:50px;" :color="cfg.settings.animationColor" @click="animation_color_picker= !animation_color_picker" />
    <v-label>{{$t('home.animation_color_lbl')}}</v-label>
    <v-container class="d-flex justify-center" v-if="animation_color_picker">
      <v-color-picker v-model="cfg.settings.animationColor" :hide-mode-switch="true" :mode="'hexa'"></v-color-picker>
    </v-container>
    -->
  </v-container>
</v-container>`

var bot_home = Vue.component("bot_home", {
  template: botHomeTemplate,
  props: ["cfg", "ui"],
  data: () => ({
    light_color_picker: false,
    animation_color_picker: false
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