const botThemesTemplate= `<v-container mt-4 mb-12>
  <v-btn outlined color="blue darken-1" @click="addTheme()"><v-icon>mdi-plus-one</v-icon></v-btn>
  <v-spacer></v-spacer>
  <br/>
  <v-expansion-panels v-model="ui.themeIndex" mandatory focusable>
    <v-expansion-panel v-for="(theme, index) in cfg.themes" :key="index" class="grey darken-1">
      <v-expansion-panel-header>{{theme.name}}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-text-field type="text" :value="theme.name" @change="v => theme.name = v" :label="$t('themes.name_lbl')" :rules="[rules.required]"></v-text-field>
        <v-container ma-0 pl-0 pt-0>
          <v-btn small width="20" min-width="20" style="width:50px;" :color="theme.color.bg" @click="show_bgcolor_picker= !show_bgcolor_picker" />
          <v-label>{{$t('themes.bg_color_lbl')}}</v-label>
          <v-container class="d-flex justify-center" v-if="show_bgcolor_picker">
            <v-color-picker v-model="theme.color.bg" :hide-mode-switch="true" :mode="'hexa'"></v-color-picker>
          </v-container>
        </v-container>
        <v-container ma-0 pl-0 pt-0>
          <v-btn small width="20" min-width="20" style="width:50px;" :color="theme.color.bg2" @click="show_bg2color_picker= !show_bg2color_picker" />
          <v-label>{{$t('themes.bg2_color_lbl')}}</v-label>
          <v-container class="d-flex justify-center" v-if="show_bg2color_picker">
            <v-color-picker v-model="theme.color.bg2" :hide-mode-switch="true" :mode="'hexa'"></v-color-picker>
          </v-container>
        </v-container>
        <v-container ma-0 pl-0 pt-0>
          <v-btn small width="20" min-width="20" style="width:50px;" :color="theme.color.hr" @click="show_hrcolor_picker= !show_hrcolor_picker" />
          <v-label>{{$t('themes.hr_color_lbl')}}</v-label>
          <v-container class="d-flex justify-center" v-if="show_hrcolor_picker">
            <v-color-picker v-model="theme.color.hr" :hide-mode-switch="true" :mode="'hexa'"></v-color-picker>
          </v-container>
        </v-container>
        <v-container ma-0 pl-0 pt-0>
          <v-btn small width="20" min-width="20" style="width:50px;" :color="theme.color.min" @click="show_mincolor_picker= !show_mincolor_picker" />
          <v-label>{{$t('themes.min_color_lbl')}}</v-label>
          <v-container class="d-flex justify-center" v-if="show_mincolor_picker">
            <v-color-picker v-model="theme.color.min" :hide-mode-switch="true" :mode="'hexa'"></v-color-picker>
          </v-container>
        </v-container>
        <v-container ma-0 pl-0 pt-0>
          <v-btn small width="20" min-width="20" style="width:50px;" :color="theme.color.sec" @click="show_seccolor_picker= !show_seccolor_picker" />
          <v-label>{{$t('themes.sec_color_lbl')}}</v-label>
          <v-container class="d-flex justify-center" v-if="show_seccolor_picker">
            <v-color-picker v-model="theme.color.sec" :hide-mode-switch="true" :mode="'hexa'"></v-color-picker>
          </v-container>
        </v-container>
        <v-switch hide-details color="#04BF3D" v-model="theme.gradient.hr" inset :label="$t('themes.hr_gradient_lbl')"></v-switch>
        <v-switch hide-details color="#04BF3D" v-model="theme.gradient.min" inset :label="$t('themes.min_gradient_lbl')"></v-switch>
        <!-- <v-switch hide-details color="#04BF3D" v-model="theme.gradient.sec" inset :label="$t('themes.sec_gradient_lbl')"></v-switch> -->

        <br/>
        <v-btn outlined color="orange darken-1" @click="theme_confirm_idx= index; confirm_dialog= true;"><v-icon>mdi-delete</v-icon></v-btn>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>

  <v-dialog v-model="confirm_dialog" persistent scrollable max-width="350">
    <v-card outlined>
      <v-card-title class="headline">{{$t('themes.remove_confirm_title')}}</v-card-title>
      <v-card-text>{{$t('themes.remove_confirm_msg')}}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey lighten-1" text @click="confirm_dialog= false">{{$t('main.btn_cancel')}}</v-btn>
        <v-btn color="orange darken-1" text @click="removeTheme()">{{$t('main.btn_delete')}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

</v-container>`

var bot_themes = Vue.component("bot_themes", {
  template: botThemesTemplate,
  props: ["cfg", "ui"],
  data: () => ({
    theme_confirm_idx: 0,
    confirm_dialog: false,
    show_bgcolor_picker: false,
    show_bg2color_picker: false,
    show_hrcolor_picker: false,
    show_mincolor_picker: false,
    show_seccolor_picker: false,
    rules: {
      required: value => !!value || 'Required.'
    }
  }),
  watch: {
  },
  computed: {
  },
  methods: {
    addTheme() {
      theme= {
        name: 'new_'+ this.cfg.themes.length,
        color: {
          bg: '#010001',
          bg2: '#000202',
          hr: '#190019',
          min: '#002929',
          sec: '#600060'
        },
        gradient: {
          hr: false,
          min: false,
          sec: false
        }
      };
      this.cfg.themes.push(theme);
      this.ui.themeIndex= this.cfg.themes.length- 1;
    },
    removeTheme() {
      this.confirm_dialog= false;
      this.cfg.themes.splice(this.theme_confirm_idx, 1);
      this.ui.themeIndex= 0;
    }
  }
});
