<template>
	<div id="settings" class="container">
		<div class="row">
	        <div class="col s12 m12 l9">
	        	<div class="card">
	        		<div class="card-content">
	        			<span class="card-title">{{ langTranslation["Settings"] }}</span>
		        		<!-- Using form so I can get html5 form validation -->
		        		<form v-on:submit.prevent="updateSettings()">
                            <div class="input-field col s12">
                                <select id="languageselect"  ref="languageselect" v-model="languages" multiple required>
                                    <option value="" disabled selected>{{ langTranslation["Choose Your Option"] }}</option>
                                    <option v-for="language in ziteLanguages" :value="language">{{ language }}</option>
                                </select>
                                <label for="categoryselect">{{ langTranslation["Language(s)"] }} *</label>
                            </div>
							<p>
								<label>
									<input type="checkbox" v-model="ko_interface" :value="ko_interface" />
									<span>Korean Interface</span>
								</label>
							</p>
							<p>
								<label>
									<input type="checkbox" v-model="cs_interface" :value="cs_interface" />
									<span>Czech Interface</span>
								</label>
							</p>
							<br>
			        		<button type="submit" class="btn waves-effect waves-light" :class="{ 'disabled': submitBtnDisabled }">{{ langTranslation["Submit"] }}</button>
			        	</form>
			        </div>
	        	</div>
	        </div>
	        <div class="col s12 m12 l3 hide-on-med-and-down">
	        </div>
	    </div>
	</div>
</template>

<script>
    var Router = require("../libs/router.js");
    var M = require("materialize-css/dist/js/materialize.min.js");

	module.exports = {
		props: ["userInfo", "langTranslation"],
		name: "settings",
		data: () => {
			return {
                ziteLanguages: ziteLanguages,
                languageSelect_instance: null,
				languages: [],
				ko_interface: false,
				cs_interface: false
			}
		},
		mounted: function() {
			var self = this;

            if (this.userInfo)
                this.updateUserSettingsData(this.userInfo);
			
			this.$parent.$on("update", function(userInfo) {
                console.log(self.userInfo);
                //self.getQuestions();
                self.updateUserSettingsData(userInfo);
			});
		},
		methods: {
			goto: function(to) {
				Router.navigate(to);
            },
            updateUserSettingsData: function(userInfo) {
                var languageSelect = this.$refs.languageselect;
                this.languageSelect_instance = M.FormSelect.init(languageSelect, {});
                if (userInfo.keyvalue.languages) {
					this.languages = userInfo.keyvalue.languages.trim().split(",");
					this.ko_interface = userInfo.keyvalue.ko_interface;
					this.cs_interface = userInfo.keyvalue.cs_interface;
                    this.languageSelect_instance.input.value = userInfo.keyvalue.languages.trim().split(",");
                }
            },
            updateSettings: function() {
                page.setSettings(this.languages.join(","), this.ko_interface, this.cs_interface, () => {
                    Router.refresh();
                });
            }
		}
	}
</script>
